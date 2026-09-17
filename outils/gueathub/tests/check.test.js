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
  const photosDir = mkdtempSync(join(tmpdir(), "gueathub-photos-"));
  try {
    writeFileSync(join(photosDir, "crepes.webp"), Buffer.alloc(1024));
    writeFileSync(join(photosDir, "gratin-dauphinois.webp"), Buffer.alloc(301 * 1024));
    const { warnings } = checkData({ photosDir });
    const about = (file) => warnings.filter((w) => w.file === file).map((w) => w.code);
    assert.ok(!about("crepes.json").includes("photo-manquante"));
    assert.ok(!about("crepes.json").includes("photo-lourde"));
    assert.ok(about("gratin-dauphinois.json").includes("photo-lourde"));
    assert.ok(about("quiche-lorraine.json").includes("photo-manquante"));
  } finally {
    rmSync(photosDir, { recursive: true, force: true });
  }
});

test("le script sort en 0 sur les vraies données et en 1 sur la fixture", () => {
  assert.equal(spawnSync(process.execPath, [SCRIPT], { encoding: "utf8" }).status, 0);
  assert.equal(spawnSync(process.execPath, [SCRIPT, INVALID], { encoding: "utf8" }).status, 1);
});
