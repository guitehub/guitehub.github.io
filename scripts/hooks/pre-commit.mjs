#!/usr/bin/env node
// Hook pre-commit (husky), sur les fichiers indexés :
//   1. photos des recettes (assets/gueathub/recettes/) : converties en vrai WebP 1200 px / 300 Ko au plus ;
//   2. toutes les images : métadonnées retirées (EXIF, position GPS…) ;
//   3. app.css et icons.js régénérés si leurs sources changent ;
//   4. npm run check si des recettes ou photos changent (une erreur bloque le commit).
// Les fichiers modifiés par le hook sont ajoutés au commit.

import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { optimizeRecipePhoto } from "../gueathub-photos.mjs";
import { stripFile } from "../strip-metadata.mjs";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const git = (...args) => execFileSync("git", args, { cwd: ROOT }).toString();
const run = (script) => execFileSync("npm", ["run", "--silent", script], { cwd: ROOT, stdio: "inherit" });

const staged = git("diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z").split("\0").filter(Boolean);
const toAdd = new Set();

for (const file of staged.filter((name) => /\.(jpe?g|png|webp)$/i.test(name))) {
  const path = resolve(ROOT, file);
  if (/^assets\/gueathub\/recettes\/[^/]+\.webp$/.test(file)) {
    const { converted, bytes } = await optimizeRecipePhoto(path);
    if (converted) {
      console.log(`pre-commit : ${file} convertie en WebP (${Math.round(bytes / 1024)} Ko)`);
      toAdd.add(file);
    }
  }
  const { changed, removed } = await stripFile(path);
  if (changed) {
    console.log(`pre-commit : ${file} : ${removed.join(", ")} retiré(s)`);
    toAdd.add(file);
  }
}

const touches = (pattern) => staged.some((file) => pattern.test(file));

if (touches(/^outils\/gueathub\/(js\/|index\.html$|src\/app\.css$)/)) {
  run("css:build");
  if (git("status", "--porcelain", "--", "outils/gueathub/app.css").trim()) toAdd.add("outils/gueathub/app.css");
}
if (touches(/^_data\/gueathub\/categories\.json$/)) {
  run("icons");
  if (git("status", "--porcelain", "--", "outils/gueathub/js/ui/icons.js").trim()) toAdd.add("outils/gueathub/js/ui/icons.js");
}
if (toAdd.size > 0) git("add", "--", ...toAdd);

if (touches(/^(_data|assets)\/gueathub\//)) {
  try {
    run("check");
  } catch {
    console.error("pre-commit : npm run check a trouvé des erreurs, commit annulé.");
    process.exit(1);
  }
}
