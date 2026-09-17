#!/usr/bin/env node
// Retire les métadonnées des images (EXIF dont position GPS, XMP, IPTC, commentaires, données ajoutées
// après l'image) sans réencoder : les pixels restent identiques. Profils de couleur (ICC) conservés.
// JPEG, PNG et WebP, reconnus par leur contenu (pas par l'extension).
//
//   npm run strip-metadata                   images de assets/ et outils/ (suivies ou nouvelles)
//   npm run strip-metadata -- a.jpg b.png    fichiers donnés (hook pre-commit)
//   npm run strip-metadata -- --check        ne modifie rien ; code 1 s'il reste des métadonnées
//
// Exception : une photo avec une orientation EXIF (ex. prise en portrait) est réencodée avec la rotation
// appliquée, sinon elle s'afficherait couchée une fois l'EXIF retiré.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

export function detectFormat(buffer) {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (buffer.length > 8 && buffer.toString("latin1", 1, 4) === "PNG") return "png";
  if (buffer.length > 12 && buffer.toString("latin1", 0, 4) === "RIFF" && buffer.toString("latin1", 8, 12) === "WEBP") return "webp";
  return null;
}

/** Orientation EXIF (1 à 8) lue dans un bloc TIFF (« II* » ou « MM* »), 1 si absente ou illisible. */
export function exifOrientation(tiff) {
  try {
    const start = tiff.indexOf("Exif\0\0") === 0 ? 6 : 0;
    const le = tiff[start] === 0x49;
    const u16 = (offset) => (le ? tiff.readUInt16LE(start + offset) : tiff.readUInt16BE(start + offset));
    const u32 = (offset) => (le ? tiff.readUInt32LE(start + offset) : tiff.readUInt32BE(start + offset));
    const ifd = u32(4);
    for (let i = 0; i < u16(ifd); i += 1) {
      if (u16(ifd + 2 + i * 12) === 0x0112) return u16(ifd + 2 + i * 12 + 8);
    }
  } catch {
    // Bloc tronqué : on considère l'orientation normale.
  }
  return 1;
}

function stripJpeg(buffer) {
  const parts = [buffer.subarray(0, 2)];
  const removed = new Set();
  let orientation = 1;
  let p = 2;
  while (p < buffer.length - 1) {
    if (buffer[p] !== 0xff) throw new Error("JPEG illisible");
    const marker = buffer[p + 1];
    if (marker === 0xff) {
      p += 1; // octet de remplissage
      continue;
    }
    if (marker === 0xd9) {
      parts.push(buffer.subarray(p, p + 2));
      p += 2;
      break;
    }
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      parts.push(buffer.subarray(p, p + 2));
      p += 2;
      continue;
    }
    const end = p + 2 + buffer.readUInt16BE(p + 2);
    const body = buffer.subarray(p + 4, end);
    if (marker === 0xda) {
      // Données compressées jusqu'au prochain marqueur (hors FF00 et RSTn).
      let q = end;
      while (q < buffer.length - 1 && !(buffer[q] === 0xff && buffer[q + 1] !== 0x00 && !(buffer[q + 1] >= 0xd0 && buffer[q + 1] <= 0xd7))) q += 1;
      parts.push(buffer.subarray(p, q));
      p = q;
      continue;
    }
    let drop = null;
    if (marker === 0xe1) {
      if (body.toString("latin1", 0, 6) === "Exif\0\0") {
        orientation = exifOrientation(body);
        drop = "EXIF";
      } else {
        drop = "XMP";
      }
    } else if (marker === 0xe2 && body.toString("latin1", 0, 12) !== "ICC_PROFILE\0") {
      drop = "APP2";
    } else if ((marker >= 0xe3 && marker <= 0xed) || marker === 0xef) {
      drop = marker === 0xed ? "IPTC" : `APP${marker - 0xe0}`;
    } else if (marker === 0xfe) {
      drop = "commentaire";
    }
    if (drop) removed.add(drop);
    else parts.push(buffer.subarray(p, end));
    p = end;
  }
  if (p < buffer.length) removed.add("données après l'image");
  return { data: Buffer.concat(parts), removed: [...removed], orientation };
}

const PNG_METADATA = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"]);

function stripPng(buffer) {
  const parts = [buffer.subarray(0, 8)];
  const removed = new Set();
  let orientation = 1;
  let p = 8;
  while (p + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(p);
    const type = buffer.toString("latin1", p + 4, p + 8);
    const end = p + 12 + length;
    if (PNG_METADATA.has(type)) {
      if (type === "eXIf") orientation = exifOrientation(buffer.subarray(p + 8, p + 8 + length));
      removed.add(type === "eXIf" ? "EXIF" : type);
    } else {
      parts.push(buffer.subarray(p, end));
    }
    p = end;
    if (type === "IEND") break;
  }
  if (p < buffer.length) removed.add("données après l'image");
  return { data: Buffer.concat(parts), removed: [...removed], orientation };
}

function stripWebp(buffer) {
  const chunks = [];
  const removed = new Set();
  let orientation = 1;
  let p = 12;
  const riffEnd = Math.min(buffer.length, 8 + buffer.readUInt32LE(4));
  while (p + 8 <= riffEnd) {
    const type = buffer.toString("latin1", p, p + 4);
    const size = buffer.readUInt32LE(p + 4);
    const end = p + 8 + size + (size % 2);
    if (type === "EXIF" || type === "XMP ") {
      if (type === "EXIF") orientation = exifOrientation(buffer.subarray(p + 8, p + 8 + size));
      removed.add(type.trim());
    } else {
      chunks.push(Buffer.from(buffer.subarray(p, end)));
    }
    p = end;
  }
  if (riffEnd < buffer.length) removed.add("données après l'image");
  for (const chunk of chunks) {
    // VP8X : retirer les indicateurs EXIF (0x08) et XMP (0x04).
    if (chunk.toString("latin1", 0, 4) === "VP8X") chunk[8] &= ~0x0c;
  }
  const body = Buffer.concat([Buffer.from("WEBP", "latin1"), ...chunks]);
  const header = Buffer.alloc(8);
  header.write("RIFF", 0, "latin1");
  header.writeUInt32LE(body.length, 4);
  return { data: Buffer.concat([header, body]), removed: [...removed], orientation };
}

const STRIPPERS = { jpeg: stripJpeg, png: stripPng, webp: stripWebp };

/**
 * Nettoie une image en mémoire. Retourne { format, data, removed, reencoded } ;
 * `data` est l'entrée elle-même si rien n'est à retirer. Format inconnu : format null.
 */
export async function stripBuffer(buffer) {
  const format = detectFormat(buffer);
  if (!format) return { format: null, data: buffer, removed: [], reencoded: false };
  const { data, removed, orientation } = STRIPPERS[format](buffer);
  if (removed.length === 0) return { format, data: buffer, removed, reencoded: false };
  if (orientation === 1) return { format, data, removed, reencoded: false };

  const image = sharp(buffer).rotate().keepIccProfile();
  const encoded =
    format === "jpeg"
      ? await image.jpeg({ quality: 92, mozjpeg: true }).toBuffer()
      : format === "png"
        ? await image.png().toBuffer()
        : await image.webp({ quality: 90 }).toBuffer();
  return { format, data: encoded, removed, reencoded: true };
}

/** Nettoie un fichier sur place (sauf en mode `check`). Retourne { file, format, removed, reencoded, changed }. */
export async function stripFile(file, { check = false } = {}) {
  const buffer = readFileSync(file);
  const result = await stripBuffer(buffer);
  const changed = result.removed.length > 0;
  if (changed && !check) writeFileSync(file, result.data);
  return { file, format: result.format, removed: result.removed, reencoded: result.reencoded, changed };
}

function defaultFiles() {
  return execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z", "--", "assets", "outils"], { cwd: ROOT })
    .toString()
    .split("\0")
    .filter((file) => IMAGE_EXTENSIONS.test(file))
    .map((file) => resolve(ROOT, file));
}

async function main(argv) {
  const check = argv.includes("--check");
  const args = argv.filter((arg) => arg !== "--check");
  const files = args.length > 0 ? args.filter((file) => IMAGE_EXTENSIONS.test(file)) : defaultFiles();
  let dirty = 0;
  for (const file of files) {
    const result = await stripFile(file, { check });
    if (!result.changed) continue;
    dirty += 1;
    const what = result.removed.join(", ");
    const name = relative(process.cwd(), file) || file;
    if (check) console.log(`  ✘ ${name} : ${what}`);
    else console.log(`  ✔ ${name} : ${what} retiré(s)${result.reencoded ? " (réencodée : orientation appliquée)" : ""}`);
  }
  if (check && dirty > 0) {
    console.log(`${dirty} image(s) avec métadonnées : lancer npm run strip-metadata`);
    return 1;
  }
  if (!check && dirty === 0 && args.length === 0) console.log("Aucune métadonnée à retirer.");
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await main(process.argv.slice(2));
}
