#!/usr/bin/env node
// Prépare les photos des recettes : _photos/<id>.jpg|jpeg|png|webp -> assets/gueathub/recettes/<id>.webp
// (1200 px de large au plus, WebP qualité 80, orientation corrigée).
//
//   npm run photos
//
// Les métadonnées (EXIF, dont la position GPS des photos de téléphone) ne sont pas recopiées.
// Le dossier _photos/ n'est ni versionné (.gitignore) ni publié (dossier « _ »).

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const INPUT_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
export const MAX_WIDTH = 1200;
const QUALITY = 80;
const MAX_BYTES = 300 * 1024;

/**
 * Convertit les photos. Retourne [{ file, id, output, bytes, width, error?, warnings }].
 * Une photo dont le nom n'est pas un id valide est ignorée avec une erreur.
 */
export async function convertPhotos({
  inputDir = join(ROOT, "_photos"),
  outputDir = join(ROOT, "assets/gueathub/recettes"),
  recipesDir = join(ROOT, "_data/gueathub/recettes"),
} = {}) {
  if (!existsSync(inputDir)) return null;
  mkdirSync(outputDir, { recursive: true });
  const files = readdirSync(inputDir)
    .filter((file) => INPUT_EXTENSIONS.has(extname(file).toLowerCase()))
    .sort();

  const results = [];
  for (const file of files) {
    const id = basename(file, extname(file));
    const result = { file, id, warnings: [] };
    results.push(result);
    if (!ID_PATTERN.test(id)) {
      result.error = "nom invalide : il doit être l'id de la recette (minuscules, chiffres et tirets)";
      continue;
    }
    if (!existsSync(join(recipesDir, `${id}.json`))) {
      result.warnings.push(`aucune recette « ${id} » dans ${relative(ROOT, recipesDir) || recipesDir}`);
    }
    result.output = join(outputDir, `${id}.webp`);
    const info = await sharp(join(inputDir, file))
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(result.output);
    result.bytes = statSync(result.output).size;
    result.width = info.width;
    if (result.bytes > MAX_BYTES) {
      result.warnings.push(`${Math.round(result.bytes / 1024)} Ko : plus de 300 Ko, recadrer ou réduire la photo`);
    }
  }
  return results;
}

/**
 * Photo déjà déposée dans assets/gueathub/recettes/ (hook pre-commit) : si ce n'est pas un vrai WebP,
 * ou si elle dépasse 1200 px ou 300 Ko, elle est convertie sur place comme par `npm run photos`.
 * Retourne { converted, bytes } ; une photo déjà conforme n'est pas touchée.
 */
export async function optimizeRecipePhoto(file) {
  const input = readFileSync(file);
  const isWebp = input.toString("latin1", 0, 4) === "RIFF" && input.toString("latin1", 8, 12) === "WEBP";
  const { width } = await sharp(input).metadata();
  if (isWebp && width <= MAX_WIDTH && input.length <= MAX_BYTES) return { converted: false, bytes: input.length };
  const output = await sharp(input)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();
  writeFileSync(file, output);
  return { converted: true, bytes: output.length };
}

async function main() {
  const results = await convertPhotos();
  if (results === null) {
    console.log("Dossier _photos/ absent : le créer et y déposer <id-de-la-recette>.jpg (ou .png).");
    return 0;
  }
  if (results.length === 0) {
    console.log("_photos/ ne contient aucune photo (.jpg, .jpeg, .png ou .webp).");
    return 0;
  }
  for (const result of results) {
    if (result.error) {
      console.log(`  ✘ ${result.file} : ${result.error}`);
      continue;
    }
    console.log(`  ✔ ${result.file} → ${relative(ROOT, result.output)} (${result.width} px, ${Math.round(result.bytes / 1024)} Ko)`);
    for (const warning of result.warnings) console.log(`    ⚠ ${warning}`);
  }
  return results.some((result) => result.error) ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await main();
}
