import { test } from "node:test";
import assert from "node:assert/strict";

import {
  compareText,
  filterRecipes,
  fold,
  isHttpUrl,
  matchesQuery,
  nearDuplicateKey,
  normalize,
  recipeSearchText,
  sortRecipes,
  totalTime,
} from "../js/domain/text.js";
import { loadReference, recipe } from "./helpers.js";

const { gratin, quiche } = loadReference();

test("normalize : trim, minuscules, espaces réduits, accents conservés", () => {
  assert.equal(normalize("  Crème   Liquide\tEntière "), "crème liquide entière");
  assert.equal(normalize("Œuf"), "œuf");
});

test("normalize : forme NFC, quelle que soit la forme reçue", () => {
  const decomposed = "crème".normalize("NFD");
  assert.notEqual(decomposed, "crème");
  assert.equal(normalize(decomposed), "crème");
});

test("fold : sans accents ni ligatures", () => {
  assert.equal(fold("Œuf Brouillé"), "oeuf brouille");
  assert.equal(fold("Ex æquo"), "ex aequo");
  assert.equal(fold("Straße"), "strasse");
  assert.equal(fold("crème".normalize("NFD")), "creme");
});

test("nearDuplicateKey : accents et s/x final de chaque mot retirés", () => {
  assert.equal(nearDuplicateKey("Pommes de terre"), nearDuplicateKey("pomme de terre"));
  assert.equal(nearDuplicateKey("tomates"), nearDuplicateKey("tomate"));
  assert.equal(nearDuplicateKey("choux"), nearDuplicateKey("chou"));
  assert.equal(nearDuplicateKey("pâtes"), nearDuplicateKey("pate"));
  assert.notEqual(nearDuplicateKey("riz"), nearDuplicateKey("ri"));
});

test("compareText : ordre alphabétique français", () => {
  assert.ok(compareText("lait", "œuf") < 0);
  assert.equal(compareText("Été", "ete"), 0);
  assert.ok(compareText("étape 2", "étape 10") < 0);
  assert.deepEqual(["poivre", "ail", "Écrevisse", "beurre"].sort(compareText), ["ail", "beurre", "Écrevisse", "poivre"]);
});

test("isHttpUrl", () => {
  assert.equal(isHttpUrl("https://example.org/recette"), true);
  assert.equal(isHttpUrl(" http://example.org "), true);
  assert.equal(isHttpUrl("Recette familiale"), false);
  assert.equal(isHttpUrl("ftp://example.org"), false);
  assert.equal(isHttpUrl("https://exemple.org/une recette"), false);
});

test("recherche : titre et ingrédients, sans tenir compte des accents ni de la casse", () => {
  const text = recipeSearchText(gratin);
  assert.equal(matchesQuery(text, "GRATIN"), true);
  assert.equal(matchesQuery(text, "creme"), true);
  assert.equal(matchesQuery(text, "  pomme   muscade "), true);
  assert.equal(matchesQuery(text, "pomme lardons"), false);
  assert.equal(matchesQuery(recipeSearchText(quiche), "oeuf"), true);
  assert.equal(matchesQuery(text, ""), true);
});

test("totalTime : préparation + cuisson + repos", () => {
  assert.equal(totalTime(gratin), 105);
  assert.equal(totalTime(quiche), 60);
});

test("filterRecipes : sans critère, tout passe", () => {
  assert.deepEqual(filterRecipes([gratin, quiche]), [gratin, quiche]);
});

test("filterRecipes : type, tags (tous requis), sélection et recherche", () => {
  const all = [gratin, quiche];
  assert.deepEqual(filterRecipes(all, { type: "plat" }), [quiche]);
  assert.deepEqual(filterRecipes(all, { tags: ["four"] }), [gratin, quiche]);
  assert.deepEqual(filterRecipes(all, { tags: ["four", "vegetarien"] }), [gratin]);
  assert.deepEqual(filterRecipes(all, { selectedOnly: true, selectedIds: new Set(["quiche-lorraine"]) }), [quiche]);
  assert.deepEqual(filterRecipes(all, { selectedOnly: true }), []);
  assert.deepEqual(filterRecipes(all, { query: "lardon" }), [quiche]);
  assert.deepEqual(filterRecipes(all, { query: "lait", type: "accompagnement" }), [gratin]);
});

test("sortRecipes : alphabétique par défaut, ou par temps total puis titre, sans modifier l'entrée", () => {
  const quick = recipe({ id: "b", titre: "Béchamel", temps: { preparation: 5, cuisson: 10, repos: 0 } });
  const alsoQuick = recipe({ id: "a", titre: "Aïoli", temps: { preparation: 15, cuisson: 0, repos: 0 } });
  const input = [quiche, gratin, quick, alsoQuick];
  assert.deepEqual(sortRecipes(input).map((r) => r.titre), ["Aïoli", "Béchamel", "Gratin dauphinois", "Quiche lorraine"]);
  assert.deepEqual(sortRecipes(input, "temps").map((r) => r.titre), ["Aïoli", "Béchamel", "Quiche lorraine", "Gratin dauphinois"]);
  assert.deepEqual(input, [quiche, gratin, quick, alsoQuick]);
});
