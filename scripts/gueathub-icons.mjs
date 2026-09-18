#!/usr/bin/env node
// Génère outils/gueathub/js/ui/icons.js : les SVG Bootstrap Icons utilisés par l'app, en ligne
// (pas de police ni de CDN, pour le hors-ligne).
//
//   npm run icons
//
// Icônes incluses : celles de la liste UI_ICONS ci-dessous, plus toutes les `icone` de
// _data/gueathub/categories.json. À relancer après avoir ajouté un rayon ou une icône.

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const require = createRequire(import.meta.url);
const ICONS_DIR = join(dirname(require.resolve("bootstrap-icons/package.json")), "icons");
const { version } = require("bootstrap-icons/package.json");
const OUTPUT = join(ROOT, "outils/gueathub/js/ui/icons.js");

const UI_ICONS = [
  // Navigation et actions
  "journal-bookmark", "card-checklist", "gear", "house-door", "arrow-left", "search", "x-lg",
  "plus-lg", "dash-lg", "check-lg", "trash3", "three-dots-vertical", "arrow-up", "arrow-down",
  "arrow-counterclockwise", "clipboard", "share", "link-45deg", "box-arrow-up-right", "chevron-down",
  // Recettes, minuteurs, écran
  "clock", "stopwatch", "dice-5", "play-fill", "lightbulb", "bar-chart", "tag",
  // Thème et états
  "sun", "moon-stars", "circle-half", "wifi-off", "exclamation-triangle", "basket3",
  // Types de recettes (voir js/labels.js)
  "egg-fried", "fork-knife", "basket", "cake2", "cup-hot", "cookie", "balloon", "droplet-half", "cup-straw",
];

const categories = JSON.parse(readFileSync(join(ROOT, "_data/gueathub/categories.json"), "utf8"));
const names = [...new Set([...UI_ICONS, ...categories.map((category) => category.icone)])].sort();

const entries = names.map((name) => {
  const svg = readFileSync(join(ICONS_DIR, `${name}.svg`), "utf8");
  if (!svg.includes('viewBox="0 0 16 16"')) throw new Error(`${name} : viewBox inattendu`);
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/\s*\n\s*/g, "");
  return `  ${JSON.stringify(name)}: ${JSON.stringify(inner)},`;
});

writeFileSync(
  OUTPUT,
  `// GÉNÉRÉ par scripts/gueathub-icons.mjs (npm run icons) depuis bootstrap-icons ${version} (licence MIT).
// Ne pas modifier à la main. Contenu intérieur des SVG, viewBox 0 0 16 16.

export const ICONS = {
${entries.join("\n")}
};
`,
);
console.log(`icons.js : ${names.length} icônes (bootstrap-icons ${version})`);
