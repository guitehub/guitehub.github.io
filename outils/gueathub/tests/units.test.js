import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  UNITS,
  cleanFloat,
  formatDuration,
  formatNumber,
  formatQuantity,
  roundAmount,
  roundTo,
  toBase,
  unitFamily,
} from "../js/domain/units.js";

const schema = JSON.parse(readFileSync(new URL("../schema/recette.schema.json", import.meta.url), "utf8"));

const shown = (family, amount, mode) => formatQuantity(roundAmount(family, amount, mode));

test("les unités du domaine sont exactement celles du schéma", () => {
  const schemaUnits = schema.$defs.ingredient.properties.unite.enum.filter((unit) => unit !== null);
  assert.deepEqual(Object.keys(UNITS).sort(), [...schemaUnits].sort());
});

test("familles et unités de base", () => {
  assert.equal(unitFamily("kg"), "masse");
  assert.equal(unitFamily("cl"), "volume");
  assert.equal(unitFamily("cas"), "cuillere");
  assert.equal(unitFamily("pincee"), "pincee");
  assert.equal(unitFamily("gousse"), "gousse");
  assert.equal(unitFamily("piece"), "piece");
  assert.equal(toBase(1.5, "kg"), 1500);
  assert.equal(toBase(25, "cl"), 250);
  assert.equal(toBase(0.7, "l"), 700);
  assert.equal(toBase(2, "cas"), 6);
  assert.equal(toBase(3, "tranche"), 3);
});

test("cleanFloat neutralise les erreurs de virgule flottante", () => {
  assert.notEqual(0.1 + 0.2, 0.3);
  assert.equal(cleanFloat(0.1 + 0.2), 0.3);
  assert.notEqual(100 * 1.1, 110);
  assert.equal(cleanFloat(100 * 1.1), 110);
  assert.equal(cleanFloat(1.2345678), 1.234568);
});

test("roundTo : vers le haut ou au plus proche, sans piège flottant", () => {
  assert.equal(roundTo(575, 10, "up"), 580);
  assert.equal(roundTo(570, 10, "up"), 570);
  assert.equal(roundTo(100 * 1.1, 10, "up"), 110); // 110.00000000000001 ne doit pas donner 120
  assert.equal(roundTo(0.1 + 0.2, 0.1, "up"), 0.3);
  assert.equal(roundTo(572, 5, "nearest"), 570);
  assert.equal(roundTo(572.5, 5, "nearest"), 575);
  assert.equal(roundTo(1.25, 0.5, "nearest"), 1.5);
});

test("masse : pas de 5, 10 puis 50 g, en kg à partir de 1 kg", () => {
  assert.equal(shown("masse", 12, "up"), "15 g");
  assert.equal(shown("masse", 97, "up"), "100 g");
  assert.equal(shown("masse", 101, "up"), "110 g");
  assert.equal(shown("masse", 995, "up"), "1 kg");
  assert.equal(shown("masse", 1500, "up"), "1,5 kg");
  assert.equal(shown("masse", 1020, "up"), "1,05 kg");
  assert.equal(shown("masse", 12, "nearest"), "10 g");
  assert.equal(shown("masse", 13, "nearest"), "15 g");
  assert.equal(shown("masse", 999, "nearest"), "1 kg");
  assert.equal(shown("masse", 1070, "nearest"), "1,05 kg");
});

test("masse et volume : au plus proche, une petite quantité n'est jamais arrondie à zéro", () => {
  assert.equal(shown("masse", 2, "nearest"), "2 g");
  assert.equal(shown("volume", 1.5, "nearest"), "1,5 ml");
  assert.equal(shown("masse", 2, "up"), "5 g");
});

test("volume : ml sous 100 ml, cl sous 1 l, l au-delà", () => {
  assert.equal(shown("volume", 42, "up"), "45 ml");
  assert.equal(shown("volume", 97, "up"), "10 cl");
  assert.equal(shown("volume", 850, "up"), "85 cl");
  assert.equal(shown("volume", 575, "up"), "58 cl");
  assert.equal(shown("volume", 996, "up"), "1 l");
  assert.equal(shown("volume", 1210, "up"), "1,25 l");
  assert.equal(shown("volume", 1210, "nearest"), "1,2 l");
  assert.equal(shown("volume", 333, "nearest"), "33 cl");
});

test("cuillères : au 0,5 c. à c., en c. à s. (au 0,5) à partir de 3 c. à c.", () => {
  assert.equal(shown("cuillere", 1.2, "up"), "1,5 c. à c.");
  assert.equal(shown("cuillere", 1.2, "nearest"), "1 c. à c.");
  assert.equal(shown("cuillere", 2.6, "up"), "1 c. à s.");
  assert.equal(shown("cuillere", 3, "up"), "1 c. à s.");
  assert.equal(shown("cuillere", 4, "up"), "1,5 c. à s.");
  assert.equal(shown("cuillere", 4, "nearest"), "1,5 c. à s.");
  assert.equal(shown("cuillere", 7, "nearest"), "2,5 c. à s.");
  assert.equal(shown("cuillere", 0.2, "nearest"), "0,2 c. à c.");
});

test("pincées : au 0,5, pluriel à partir de 2", () => {
  assert.equal(shown("pincee", 2.5, "up"), "2,5 pincées");
  assert.equal(shown("pincee", 1.2, "up"), "1,5 pincée");
  assert.equal(shown("pincee", 1.2, "nearest"), "1 pincée");
  assert.equal(shown("pincee", 0.2, "nearest"), "0,2 pincée");
});

test("dénombrables : entier supérieur en liste, demi le plus proche (min 0,5) en recette", () => {
  assert.equal(shown("gousse", 1.5, "up"), "2 gousses");
  assert.equal(shown("gousse", 1.0000001, "up"), "1 gousse");
  assert.equal(shown("piece", 2.2, "up"), "3");
  assert.equal(shown("gousse", 1.3, "nearest"), "1,5 gousse");
  assert.equal(shown("piece", 2.2, "nearest"), "2");
  assert.equal(shown("piece", 0.1, "nearest"), "0,5");
  assert.equal(shown("rouleau", 0.2, "up"), "1 rouleau");
});

test("formatNumber : virgule, deux décimales au plus, sans zéros finaux", () => {
  assert.equal(formatNumber(2), "2");
  assert.equal(formatNumber(1.5), "1,5");
  assert.equal(formatNumber(1.1), "1,1");
  assert.equal(formatNumber(2.333333), "2,33");
  assert.equal(formatNumber(0.1 + 0.2), "0,3");
  assert.equal(formatNumber(1250), "1250");
});

test("formatQuantity : libellés, pluriel à partir de 2, pièces sans libellé", () => {
  assert.equal(formatQuantity({ value: 1.5, unit: "gousse" }), "1,5 gousse");
  assert.equal(formatQuantity({ value: 2, unit: "gousse" }), "2 gousses");
  assert.equal(formatQuantity({ value: 3, unit: "piece" }), "3");
  assert.equal(formatQuantity({ value: 2, unit: "rouleau" }), "2 rouleaux");
  assert.equal(formatQuantity({ value: 2, unit: "boite" }), "2 boîtes");
  assert.equal(formatQuantity({ value: 3, unit: "cas" }), "3 c. à s.");
  assert.equal(formatQuantity({ value: 1, unit: "cac" }), "1 c. à c.");
  assert.equal(formatQuantity({ value: 2, unit: "kg" }), "2 kg");
  for (const unit of Object.keys(UNITS)) {
    assert.match(formatQuantity({ value: 2, unit }), /^2( \S.*)?$/, unit);
  }
});

test("formatDuration", () => {
  assert.equal(formatDuration(0), "0 min");
  assert.equal(formatDuration(45), "45 min");
  assert.equal(formatDuration(60), "1 h");
  assert.equal(formatDuration(65), "1 h 05");
  assert.equal(formatDuration(105), "1 h 45");
});
