import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { checkData } from "../../../scripts/gueathub-check.mjs";

const SCRIPT = fileURLToPath(new URL("../../../scripts/gueathub-check.mjs", import.meta.url));
const INVALID = fileURLToPath(new URL("./fixtures/recettes-invalides", import.meta.url));
const REFERENCE = fileURLToPath(new URL("./fixtures/reference", import.meta.url));

const codes = (issues) => new Set(issues.map((issue) => issue.code));

test("les vraies données ne contiennent aucune erreur", () => {
  const { errors, files } = checkData();
  assert.ok(files > 0);
  assert.deepEqual(errors, []);
});

test("la fixture invalide déclenche chaque type d'erreur", () => {
  const { errors } = checkData({ recipesDir: INVALID });
  assert.deepEqual(
    [...codes(errors)].sort(),
    [
      "categorie-conflit",
      "categorie-inconnue",
      "id-doublon",
      "id-fichier",
      "json",
      "nom-non-canonique",
      "quantite-unite",
      "schema",
    ],
  );
});

test("la fixture invalide déclenche les avertissements attendus", () => {
  const { warnings } = checkData({ recipesDir: INVALID });
  for (const code of ["photo-manquante", "nom-proche", "placard-conflit", "tag-hors-vocabulaire"]) {
    assert.ok(codes(warnings).has(code), `avertissement « ${code} » attendu`);
  }
});

test("photos : présente et légère sans avertissement, trop lourde signalée", () => {
  // Recettes figées (fixtures/reference) : le test ne dépend pas des vraies recettes.
  const photosDir = mkdtempSync(join(tmpdir(), "gueathub-photos-"));
  try {
    const webp = (bytes) => Buffer.concat([Buffer.from("RIFF\0\0\0\0WEBP", "latin1"), Buffer.alloc(bytes)]);
    writeFileSync(join(photosDir, "gratin-dauphinois.webp"), webp(1024));
    writeFileSync(join(photosDir, "quiche-lorraine.webp"), webp(301 * 1024));
    const { warnings } = checkData({ recipesDir: REFERENCE, photosDir });
    const about = (file) => warnings.filter((w) => w.file === file).map((w) => w.code);
    assert.deepEqual(about("gratin-dauphinois.json"), []);
    assert.deepEqual(about("quiche-lorraine.json"), ["photo-lourde"]);

    // Un JPEG simplement renommé en .webp est signalé.
    writeFileSync(join(photosDir, "gratin-dauphinois.webp"), Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(1024)]));
    const renamed = checkData({ recipesDir: REFERENCE, photosDir }).warnings;
    assert.deepEqual(renamed.filter((w) => w.file === "gratin-dauphinois.json").map((w) => w.code), ["photo-format"]);
  } finally {
    rmSync(photosDir, { recursive: true, force: true });
  }
});

test("le script sort en 0 sur les vraies données et en 1 sur la fixture", () => {
  assert.equal(spawnSync(process.execPath, [SCRIPT], { encoding: "utf8" }).status, 0);
  assert.equal(spawnSync(process.execPath, [SCRIPT, INVALID], { encoding: "utf8" }).status, 1);
});

test("rayons : icône inconnue et rayon « autre » manquant signalés", () => {
  const dir = mkdtempSync(join(tmpdir(), "gueathub-categories-"));
  try {
    const categoriesFile = join(dir, "categories.json");
    writeFileSync(categoriesFile, JSON.stringify([{ id: "fruits-legumes", libelle: "Fruits", icone: "icone-inexistante" }]));
    const messages = checkData({ categoriesFile }).errors.filter((e) => e.code === "categories").map((e) => e.message);
    assert.ok(messages.some((m) => m.includes("icone-inexistante")));
    assert.ok(messages.some((m) => m.includes("« autre »")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
