import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

import { MAX_WIDTH, convertPhotos, optimizeRecipePhoto } from "../../../scripts/gueathub-photos.mjs";

test("npm run photos : WebP de 1200 px au plus, sans métadonnées, noms vérifiés", async () => {
  const root = mkdtempSync(join(tmpdir(), "gueathub-photos-"));
  try {
    const inputDir = join(root, "_photos");
    const outputDir = join(root, "sortie");
    const recipesDir = join(root, "recettes");
    mkdirSync(inputDir);
    mkdirSync(recipesDir);
    writeFileSync(join(recipesDir, "grande-photo.json"), "{}");

    // Grande photo JPEG avec EXIF (comme une photo de téléphone), petite PNG, nom invalide, fichier ignoré.
    const image = (width, height) => sharp({ create: { width, height, channels: 3, background: "#c96" } });
    await image(2400, 1800).withExif({ IFD0: { Artist: "Quelqu'un", Copyright: "privé" } }).jpeg().toFile(join(inputDir, "grande-photo.jpg"));
    await image(800, 600).png().toFile(join(inputDir, "petite.png"));
    await image(10, 10).jpeg().toFile(join(inputDir, "Mauvais Nom.JPG"));
    writeFileSync(join(inputDir, "notes.txt"), "à ignorer");

    const results = await convertPhotos({ inputDir, outputDir, recipesDir });
    const byFile = Object.fromEntries(results.map((result) => [result.file, result]));
    assert.deepEqual(Object.keys(byFile).sort(), ["Mauvais Nom.JPG", "grande-photo.jpg", "petite.png"]);

    const big = await sharp(join(outputDir, "grande-photo.webp")).metadata();
    assert.equal(big.format, "webp");
    assert.equal(big.width, MAX_WIDTH);
    assert.equal(big.height, 900);
    assert.equal(big.exif, undefined, "EXIF retiré");
    assert.deepEqual(byFile["grande-photo.jpg"].warnings, []);

    const small = await sharp(join(outputDir, "petite.webp")).metadata();
    assert.equal(small.width, 800, "pas d'agrandissement");
    assert.match(byFile["petite.png"].warnings.join(), /aucune recette « petite »/);

    assert.match(byFile["Mauvais Nom.JPG"].error, /nom invalide/);
    assert.equal(existsSync(join(outputDir, "Mauvais Nom.webp")), false);

    assert.equal(await convertPhotos({ inputDir: join(root, "absent"), outputDir, recipesDir }), null);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("pre-commit : photo déposée directement convertie si besoin, laissée telle quelle sinon", async () => {
  const dir = mkdtempSync(join(tmpdir(), "gueathub-optimize-"));
  try {
    const renamed = join(dir, "renommee.webp");
    await sharp({ create: { width: 2000, height: 1500, channels: 3, background: "#963" } }).jpeg().toFile(renamed);
    const first = await optimizeRecipePhoto(renamed);
    assert.equal(first.converted, true);
    const meta = await sharp(renamed).metadata();
    assert.deepEqual([meta.format, meta.width], ["webp", MAX_WIDTH]);

    const before = readFileSync(renamed);
    assert.equal((await optimizeRecipePhoto(renamed)).converted, false);
    assert.ok(readFileSync(renamed).equals(before), "photo conforme non retouchée");

    // WebP lourd mais à la bonne taille : jamais réencodé (pas de perte à chaque commit).
    const heavy = join(dir, "lourde.webp");
    const noise = Buffer.alloc(1200 * 900 * 3);
    for (let i = 0; i < noise.length; i += 1) noise[i] = (i * 2654435761) >>> 24;
    await sharp(noise, { raw: { width: 1200, height: 900, channels: 3 } }).webp({ quality: 100 }).toFile(heavy);
    const heavyBefore = readFileSync(heavy);
    assert.ok(heavyBefore.length > 300 * 1024);
    assert.equal((await optimizeRecipePhoto(heavy)).converted, false);
    assert.ok(readFileSync(heavy).equals(heavyBefore));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
