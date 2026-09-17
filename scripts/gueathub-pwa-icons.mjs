#!/usr/bin/env node
// Génère les icônes de la PWA dans outils/gueathub/icons/ :
//   icon.svg                favicon (carré arrondi)
//   icon-192.png, icon-512.png   « any » (carré arrondi, fond transparent autour)
//   icon-maskable-512.png   « maskable » (fond plein, pictogramme dans la zone sûre)
//   apple-touch-icon.png    180 px, fond plein (iOS arrondit lui-même)
//
//   npm run pwa-icons
//
// Pictogramme : basket3-fill de Bootstrap Icons, en blanc sur la couleur d'accent du blog.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const require = createRequire(import.meta.url);
const OUT = join(ROOT, "outils/gueathub/icons");

const ACCENT = "#b4531f"; // --accent (thème clair) de assets/css/tokens.css
const GLYPH_FILE = join(dirname(require.resolve("bootstrap-icons/package.json")), "icons/basket3-fill.svg");
const glyph = readFileSync(GLYPH_FILE, "utf8").replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").trim();

/** SVG 512×512 : fond (arrondi ou plein) et pictogramme centré de `glyphSize` px. */
function iconSvg({ rounded, glyphSize }) {
  const scale = glyphSize / 16;
  const offset = (512 - glyphSize) / 2;
  const background = rounded
    ? `<rect width="512" height="512" rx="112" fill="${ACCENT}"/>`
    : `<rect width="512" height="512" fill="${ACCENT}"/>`;
  // Le panier est un peu plus bas que haut dans son carré de 16 : on le remonte légèrement.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${background}<g fill="#ffffff" transform="translate(${offset} ${offset - glyphSize * 0.03}) scale(${scale})">${glyph}</g></svg>\n`;
}

const roundedSvg = iconSvg({ rounded: true, glyphSize: 288 });
const fullSvg = iconSvg({ rounded: false, glyphSize: 240 }); // zone sûre maskable : cercle de 80 %

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "icon.svg"), roundedSvg);

const png = (svg, size, file) =>
  sharp(Buffer.from(svg), { density: 72 * (size / 512) * 4 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, file));

await Promise.all([
  png(roundedSvg, 192, "icon-192.png"),
  png(roundedSvg, 512, "icon-512.png"),
  png(fullSvg, 512, "icon-maskable-512.png"),
  png(iconSvg({ rounded: false, glyphSize: 300 }), 180, "apple-touch-icon.png"),
]);
console.log("Icônes PWA générées dans outils/gueathub/icons/");
