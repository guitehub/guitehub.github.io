import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_PORTIONS_UNIT,
  portionsUnit,
  recipeIngredientGroups,
  recipeQuantityText,
  scaleFactor,
  scaleIngredient,
} from "../js/domain/scale.js";
import { ing, loadReference, recipe } from "./helpers.js";

const { gratin, quiche } = loadReference();
const byName = (r, nom) => r.ingredients.find((ingredient) => ingredient.nom === nom);

test("portionsUnit : « personnes » par défaut", () => {
  assert.equal(DEFAULT_PORTIONS_UNIT, "personnes");
  assert.equal(portionsUnit(gratin), "personnes");
  assert.equal(portionsUnit(recipe({ portionsUnite: "crêpes" })), "crêpes");
});

test("scaleFactor : portions choisies / portions de la recette", () => {
  assert.equal(scaleFactor(6, gratin), 1.5);
  assert.equal(scaleFactor(6, quiche), 1);
  assert.equal(scaleFactor(2, gratin), 0.5);
});

test("scaleIngredient : unité de base, null pour « au goût »", () => {
  assert.deepEqual(scaleIngredient(byName(gratin, "pomme de terre"), 1.5), { family: "masse", amount: 1500 });
  assert.deepEqual(scaleIngredient(byName(gratin, "lait entier"), 1.5), { family: "volume", amount: 750 });
  assert.deepEqual(scaleIngredient(byName(gratin, "ail"), 1.5), { family: "gousse", amount: 1.5 });
  assert.equal(scaleIngredient(byName(gratin, "sel"), 1.5), null);
});

test("scaleIngredient : arrondi à 1e-6 contre les erreurs flottantes", () => {
  assert.notEqual(3 * 1.1, 3.3);
  assert.deepEqual(scaleIngredient(ing("œuf", 3, "piece"), 1.1), { family: "piece", amount: 3.3 });
  assert.deepEqual(scaleIngredient(ing("farine", 100, "g"), 11 / 10), { family: "masse", amount: 110 });
});

test("recipeQuantityText : aux portions d'origine, quantité telle qu'écrite", () => {
  assert.equal(recipeQuantityText(byName(quiche, "lait entier"), 1), "100 ml");
  assert.equal(recipeQuantityText(byName(gratin, "pomme de terre"), 1), "1 kg");
  assert.equal(recipeQuantityText(ing("beurre", 12, "g"), 1), "12 g");
  assert.equal(recipeQuantityText(ing("sucre", 4, "cac"), 1), "4 c. à c.");
  assert.equal(recipeQuantityText(byName(gratin, "noix de muscade"), 1), "1 pincée");
  assert.equal(recipeQuantityText(byName(gratin, "sel"), 1), "");
});

test("recipeQuantityText : sinon, arrondi au plus proche", () => {
  assert.equal(recipeQuantityText(byName(gratin, "pomme de terre"), 1.5), "1,5 kg");
  assert.equal(recipeQuantityText(byName(gratin, "lait entier"), 1.5), "75 cl");
  assert.equal(recipeQuantityText(byName(gratin, "crème liquide entière"), 1.5), "38 cl");
  assert.equal(recipeQuantityText(byName(gratin, "ail"), 1.5), "1,5 gousse");
  assert.equal(recipeQuantityText(byName(gratin, "beurre"), 1.5), "15 g");
  assert.equal(recipeQuantityText(byName(gratin, "noix de muscade"), 1.5), "1,5 pincée");
  assert.equal(recipeQuantityText(byName(gratin, "beurre"), 0.2), "2 g");
  assert.equal(recipeQuantityText(byName(gratin, "sel"), 1.5), "");
});

test("recipeIngredientGroups : groupes dans l'ordre d'apparition, quantités recalculées", () => {
  const crepes = recipe({
    portions: 15,
    ingredients: [
      ing("farine de blé", 250, "g", { groupe: "Pâte" }),
      ing("huile de tournesol", null, null, { groupe: "Cuisson" }),
      ing("œuf", 4, "piece", { groupe: "Pâte", precision: "entiers" }),
    ],
  });
  const groups = recipeIngredientGroups(crepes, 30);
  assert.deepEqual(groups.map((group) => group.groupe), ["Pâte", "Cuisson"]);
  assert.deepEqual(
    groups.map((group) => group.ingredients.map((i) => [i.nom, i.quantiteAffichee])),
    [
      [["farine de blé", "500 g"], ["œuf", "8"]],
      [["huile de tournesol", ""]],
    ],
  );
  assert.equal(groups[0].ingredients[1].precision, "entiers");
});

test("recipeIngredientGroups : sans groupe, un seul groupe null", () => {
  const groups = recipeIngredientGroups(gratin, 4);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].groupe, null);
  assert.equal(groups[0].ingredients.length, gratin.ingredients.length);
  assert.equal(groups[0].ingredients[1].quantiteAffichee, "50 cl");
});
