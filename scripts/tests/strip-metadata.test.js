import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

import { detectFormat, exifOrientation, stripBuffer, stripFile } from "../strip-metadata.mjs";

const EXIF = { IFD0: { Artist: "Quelqu'un", Make: "Téléphone", Model: "Modèle X" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "48/1 51/1 24/1" } };
const XMP = '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" dc:creator="Quelqu\'un"/></rdf:RDF></x:xmpmeta>';

// Image non uniforme, pour que la comparaison des pixels ait du sens.
async function base(width = 64, height = 48) {
  const raw = Buffer.alloc(width * height * 3);
  for (let i = 0; i < raw.length; i += 1) raw[i] = (i * 37) % 251;
  return sharp(raw, { raw: { width, height, channels: 3 } });
}
const pixels = async (buffer) => (await sharp(buffer).raw().toBuffer({ resolveWithObject: true }));

for (const format of ["jpeg", "png", "webp"]) {
  test(`${format} : EXIF (GPS compris) et XMP retirés, pixels et profil ICC identiques`, async () => {
    const encoder = format === "webp" ? { lossless: true } : {};
    const input = await (await base()).withIccProfile("p3").withExif(EXIF).withXmp(XMP)[format](encoder).toBuffer();
    const before = await sharp(input).metadata();
    assert.ok(before.exif && before.xmp, "l'image de test porte bien des métadonnées");

    const result = await stripBuffer(input);
    assert.equal(result.format, format);
    assert.equal(result.reencoded, false);
    assert.ok(result.removed.includes("EXIF"), result.removed.join());

    const after = await sharp(result.data).metadata();
    assert.equal(after.exif, undefined);
    assert.equal(after.xmp, undefined);
    assert.ok(after.icc, "profil de couleur conservé");
    assert.ok(!result.data.includes(Buffer.from("Quelqu'un")), "aucune trace du nom");

    const [a, b] = [await pixels(input), await pixels(result.data)];
    assert.deepEqual(b.info, a.info);
    assert.ok(a.data.equals(b.data), "pixels identiques");

    const again = await stripBuffer(result.data);
    assert.deepEqual(again.removed, []);
    assert.equal(again.data, result.data, "idempotent");
  });
}

test("jpeg : commentaire et données ajoutées après la fin de l'image retirés", async () => {
  const jpeg = await (await base()).jpeg().toBuffer();
  // Commentaire (COM) inséré après SOI, et une « seconde image » collée à la fin (photo animée, etc.).
  const comment = Buffer.concat([Buffer.from([0xff, 0xfe, 0x00, 0x0c]), Buffer.from("secret :)!")]);
  const input = Buffer.concat([jpeg.subarray(0, 2), comment, jpeg.subarray(2), Buffer.from("TRAILER-DATA")]);
  const result = await stripBuffer(input);
  assert.deepEqual(result.removed.sort(), ["commentaire", "données après l'image"]);
  assert.ok(result.data.equals(jpeg));
});

test("orientation EXIF : rotation appliquée puis métadonnées retirées", async () => {
  const input = await (await base(80, 40)).withMetadata({ orientation: 6 }).jpeg().toBuffer();
  assert.equal((await sharp(input).metadata()).orientation, 6);
  const result = await stripBuffer(input);
  assert.equal(result.reencoded, true);
  const after = await sharp(result.data).metadata();
  assert.deepEqual([after.width, after.height, after.exif], [40, 80, undefined]);
});

test("image sans métadonnées ou format inconnu : inchangée", async () => {
  const clean = await (await base()).png().toBuffer();
  const result = await stripBuffer(clean);
  assert.deepEqual(result.removed, []);
  assert.equal(result.data, clean);
  const text = Buffer.from("pas une image");
  assert.deepEqual(await stripBuffer(text), { format: null, data: text, removed: [], reencoded: false });
});

test("format reconnu par le contenu, pas par l'extension ; orientation lue dans un TIFF", async () => {
  const jpeg = await (await base()).jpeg().toBuffer();
  assert.equal(detectFormat(jpeg), "jpeg");
  assert.equal(detectFormat(Buffer.from("RIFF\0\0\0\0WEBPVP8 ", "latin1")), "webp");
  assert.equal(exifOrientation(Buffer.from("II*\0", "latin1")), 1);
});

test("stripFile : --check ne modifie rien, sinon réécrit le fichier", async () => {
  const dir = mkdtempSync(join(tmpdir(), "strip-metadata-"));
  try {
    const file = join(dir, "photo.webp"); // JPEG renommé : reconnu comme JPEG
    const input = await (await base()).withExif(EXIF).jpeg().toBuffer();
    writeFileSync(file, input);
    const checked = await stripFile(file, { check: true });
    assert.equal(checked.changed, true);
    assert.equal(checked.format, "jpeg");
    assert.ok(readFileSync(file).equals(input));
    await stripFile(file);
    assert.equal((await sharp(readFileSync(file)).metadata()).exif, undefined);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
