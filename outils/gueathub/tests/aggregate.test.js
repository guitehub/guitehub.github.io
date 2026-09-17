import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PLACARD_LABEL,
  aggregate,
  buildSections,
  lineSignature,
  lineState,
  progress,
  purgeChecks,
  purgeSelection,
  resolveCategoryOrder,
  setChecked,
  shoppingListText,
} from "../js/domain/aggregate.js";
import { ing, loadCategories, loadReference, recipe } from "./helpers.js";

const { gratin, quiche } = loadReference();
const categories = loadCategories();
const defaultOrder = resolveCategoryOrder([], categories);
const line = (lines, key) => lines.find((candidate) => candidate.key === key);
const view = (lines) => lines.map((l) => `${l.nom} — ${l.quantite}`.replace(/ — $/, ""));

// --- Exemple de référence (§6.5) --------------------------------------------

const referenceSelection = [
  { id: "gratin-dauphinois", portions: 6 },
  { id: "quiche-lorraine", portions: 6 },
];

test("§6.5 : gratin à 6 et quiche à 6 donnent la liste attendue", () => {
  const { sections, placard } = buildSections(aggregate(referenceSelection, [gratin, quiche]), {
    categoryOrder: defaultOrder,
  });
  assert.deepEqual(
    sections.map((section) => [section.categorie, view(section.lines)]),
    [
      ["fruits-legumes", ["ail — 2 gousses", "pomme de terre — 1,5 kg"]],
      ["cremerie", ["beurre — 15 g", "crème liquide entière — 58 cl", "lait entier — 85 cl", "œuf — 3"]],
      ["frais", ["lardons — 200 g", "pâte brisée — 1 rouleau"]],
    ],
  );
  assert.deepEqual(view(placard), ["noix de muscade — 2,5 pincées", "poivre", "sel"]);
});

test("§6.5 : détail des calculs dans l'unité de base", () => {
  const lines = aggregate(referenceSelection, [gratin, quiche]);
  assert.deepEqual(line(lines, "pomme de terre").quantities, [{ family: "masse", amount: 1500 }]);
  assert.deepEqual(line(lines, "ail").quantities, [{ family: "gousse", amount: 1.5 }]);
  assert.deepEqual(line(lines, "lait entier").quantities, [{ family: "volume", amount: 850 }]);
  assert.deepEqual(line(lines, "crème liquide entière").quantities, [{ family: "volume", amount: 575 }]);
  assert.deepEqual(line(lines, "noix de muscade").quantities, [{ family: "pincee", amount: 2.5 }]);
});

test("§6.5 : chaque ligne garde ses sources", () => {
  const lines = aggregate(referenceSelection, [gratin, quiche]);
  assert.deepEqual(line(lines, "lait entier").sources, [
    { recetteId: "gratin-dauphinois", titre: "Gratin dauphinois", portions: 6, groupe: null, quantiteAffichee: "75 cl" },
    { recetteId: "quiche-lorraine", titre: "Quiche lorraine", portions: 6, groupe: null, quantiteAffichee: "100 ml" },
  ]);
  assert.deepEqual(
    line(lines, "sel").sources.map((source) => source.quantiteAffichee),
    [""],
  );
});

test("§6.5 : texte copié, groupé par rayon, placard en dernier", () => {
  const result = buildSections(aggregate(referenceSelection, [gratin, quiche]), { categoryOrder: defaultOrder });
  assert.equal(
    shoppingListText(result, categories),
    [
      "Fruits & légumes",
      "- ail : 2 gousses",
      "- pomme de terre : 1,5 kg",
      "",
      "Crèmerie & œufs",
      "- beurre : 15 g",
      "- crème liquide entière : 58 cl",
      "- lait entier : 85 cl",
      "- œuf : 3",
      "",
      "Frais & traiteur",
      "- lardons : 200 g",
      "- pâte brisée : 1 rouleau",
      "",
      PLACARD_LABEL,
      "- noix de muscade : 2,5 pincées",
      "- poivre",
      "- sel",
    ].join("\n"),
  );
});

// --- Agrégation : cas limites ----------------------------------------------

test("sélection vide : aucune ligne", () => {
  assert.deepEqual(aggregate([], [gratin]), []);
});

test("les recettes peuvent être passées en tableau ou en Map", () => {
  const asMap = new Map([[gratin.id, gratin], [quiche.id, quiche]]);
  assert.deepEqual(aggregate(referenceSelection, asMap), aggregate(referenceSelection, [gratin, quiche]));
});

test("une recette inconnue de la sélection est ignorée ; purgeSelection la signale", () => {
  const selection = [{ id: "disparue", portions: 2 }, { id: "quiche-lorraine", portions: 3 }];
  assert.deepEqual(aggregate(selection, [quiche]), aggregate([selection[1]], [quiche]));
  assert.deepEqual(purgeSelection(selection, [quiche]), {
    selection: [{ id: "quiche-lorraine", portions: 3 }],
    removed: ["disparue"],
  });
  assert.deepEqual(purgeSelection(selection, new Map([[quiche.id, quiche]])).removed, ["disparue"]);
});

test("quantités nulles : n'ajoutent rien ; seules, la ligne n'a que le nom", () => {
  const a = recipe({ id: "a", ingredients: [ing("sel", null, null), ing("poivre", null, null)] });
  const b = recipe({ id: "b", ingredients: [ing("sel", 1, "pincee")] });
  const lines = aggregate([{ id: "a", portions: 4 }, { id: "b", portions: 8 }], [a, b]);
  assert.equal(line(lines, "sel").quantite, "2 pincées");
  assert.deepEqual(line(lines, "poivre").quantities, []);
  assert.equal(line(lines, "poivre").quantite, "");
});

test("familles mixtes : une seule ligne, quantités côte à côte, sans conversion", () => {
  const a = recipe({ id: "a", ingredients: [ing("ail", 2, "gousse")] });
  const b = recipe({ id: "b", ingredients: [ing("ail", 100, "g"), ing("ail", 1, "gousse", { groupe: "Sauce" })] });
  const lines = aggregate([{ id: "a", portions: 4 }, { id: "b", portions: 4 }], [a, b]);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].quantite, "3 gousses + 100 g");
  assert.deepEqual(lines[0].sources.map((s) => [s.recetteId, s.groupe, s.quantiteAffichee]), [
    ["a", null, "2 gousses"],
    ["b", null, "100 g"],
    ["b", "Sauce", "1 gousse"],
  ]);
});

test("unités d'une même famille additionnées dans l'unité de base", () => {
  const a = recipe({ id: "a", ingredients: [ing("lait", 1, "l"), ing("sucre", 2, "cas")] });
  const b = recipe({ id: "b", ingredients: [ing("lait", 25, "cl"), ing("sucre", 1, "cac")] });
  const lines = aggregate([{ id: "a", portions: 4 }, { id: "b", portions: 4 }], [a, b]);
  assert.equal(line(lines, "lait").quantite, "1,25 l");
  assert.equal(line(lines, "sucre").quantite, "2,5 c. à s.");
});

test("flottants : 100 g pour 10, servis à 11, donnent 110 g et non 120 g", () => {
  assert.notEqual(100 * (11 / 10), 110);
  const a = recipe({ id: "a", portions: 10, ingredients: [ing("farine", 100, "g")] });
  const lines = aggregate([{ id: "a", portions: 11 }], [a]);
  assert.deepEqual(lines[0].quantities, [{ family: "masse", amount: 110 }]);
  assert.equal(lines[0].quantite, "110 g");
});

test("clé de ligne : noms normalisés regroupés, nom de la première occurrence affiché", () => {
  const a = recipe({ id: "a", ingredients: [ing("Crème  Liquide", 10, "cl")] });
  const b = recipe({ id: "b", ingredients: [ing("crème liquide".normalize("NFD"), 5, "cl")] });
  const lines = aggregate([{ id: "a", portions: 4 }, { id: "b", portions: 4 }], [a, b]);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].key, "crème liquide");
  assert.equal(lines[0].nom, "Crème  Liquide");
  assert.equal(lines[0].quantite, "15 cl");
});

test("rayon de la ligne : celui de l'ingrédient", () => {
  const lines = aggregate(referenceSelection, [gratin, quiche]);
  assert.equal(line(lines, "lardons").categorie, "frais");
  assert.equal(line(lines, "ail").categorie, "fruits-legumes");
});

test("optionnel : vrai seulement si toutes les occurrences le sont", () => {
  const a = recipe({ id: "a", ingredients: [ing("rhum", 2, "cas", { optionnel: true }), ing("vanille", 1, "piece", { optionnel: true })] });
  const b = recipe({ id: "b", ingredients: [ing("rhum", 1, "cas"), ing("vanille", 1, "piece", { optionnel: true })] });
  const lines = aggregate([{ id: "a", portions: 4 }, { id: "b", portions: 4 }], [a, b]);
  assert.equal(line(lines, "rhum").optionnel, false);
  assert.equal(line(lines, "vanille").optionnel, true);
});

test("placard : donnée (vrai si toutes les occurrences le sont), écrasée par la préférence perso", () => {
  const a = recipe({ id: "a", ingredients: [ing("sel", null, null, { placard: true }), ing("farine", 100, "g", { placard: true }), ing("constructor", 1, "piece")] });
  const b = recipe({ id: "b", ingredients: [ing("farine", 50, "g")] });
  const selection = [{ id: "a", portions: 4 }, { id: "b", portions: 4 }];

  const plain = aggregate(selection, [a, b]);
  assert.equal(line(plain, "sel").placard, true);
  assert.equal(line(plain, "farine").placardDonnee, false);
  assert.equal(line(plain, "farine").placard, false);
  assert.equal(line(plain, "constructor").placard, false);

  const withPrefs = aggregate(selection, [a, b], { placardPerso: { sel: false, farine: true } });
  assert.equal(line(withPrefs, "sel").placard, false);
  assert.equal(line(withPrefs, "sel").placardDonnee, true);
  assert.equal(line(withPrefs, "farine").placard, true);
});

test("ajouts manuels : lignes séparées, jamais fusionnées", () => {
  const ajouts = [
    { id: "x1", nom: "lait entier", quantite: "1 brique", categorie: "cremerie", coche: true },
    { id: "x2", nom: "éponges", categorie: "maison" },
  ];
  const lines = aggregate(referenceSelection, [gratin, quiche], { ajouts });
  const manual = lines.filter((l) => l.ajout);
  assert.equal(lines.filter((l) => l.nom === "lait entier").length, 2);
  assert.deepEqual(manual.map((l) => [l.key, l.nom, l.quantite, l.coche, l.placard]), [
    ["ajout:x1", "lait entier", "1 brique", true, false],
    ["ajout:x2", "éponges", "", false, false],
  ]);
  assert.equal(line(lines, "lait entier").ajout, false);
});

// --- Coches (§6.4) -----------------------------------------------------------

test("coches : cocher, quantité modifiée, recocher, décocher", () => {
  const before = aggregate([{ id: "gratin-dauphinois", portions: 4 }], [gratin]);
  const milk = line(before, "lait entier");
  assert.equal(lineState(milk, {}), "unchecked");

  let coches = setChecked({}, milk, true);
  assert.deepEqual(coches, { "lait entier": "50 cl" });
  assert.equal(lineSignature(milk), "50 cl");
  assert.equal(lineState(milk, coches), "checked");

  const after = aggregate([{ id: "gratin-dauphinois", portions: 6 }], [gratin]);
  const milkAfter = line(after, "lait entier");
  assert.equal(lineState(milkAfter, coches), "stale");
  assert.equal(lineState(line(after, "sel"), setChecked({}, line(before, "sel"), true)), "checked");

  coches = setChecked(coches, milkAfter, true);
  assert.equal(lineState(milkAfter, coches), "checked");

  const unchecked = setChecked(coches, milkAfter, false);
  assert.deepEqual(unchecked, {});
  assert.equal(lineState(milkAfter, unchecked), "unchecked");
  assert.deepEqual(coches, { "lait entier": "75 cl" }, "setChecked ne modifie pas l'objet reçu");
});

test("coches : une ligne « au goût » devient « modifiée » si une quantité apparaît", () => {
  const a = recipe({ id: "a", ingredients: [ing("sel", null, null)] });
  const b = recipe({ id: "b", ingredients: [ing("sel", 1, "pincee")] });
  const coches = setChecked({}, aggregate([{ id: "a", portions: 4 }], [a, b])[0], true);
  const lines = aggregate([{ id: "a", portions: 4 }, { id: "b", portions: 4 }], [a, b]);
  assert.equal(lineState(lines[0], coches), "stale");
});

test("coches : l'état d'un ajout vient de l'ajout lui-même", () => {
  const lines = aggregate([], [], { ajouts: [{ id: "x", nom: "pain", categorie: "boulangerie", coche: true }] });
  assert.equal(lineState(lines[0], {}), "checked");
  assert.equal(lineState({ ...lines[0], coche: false }, { "ajout:x": "" }), "unchecked");
});

test("purgeChecks : retire les coches des lignes disparues", () => {
  const lines = aggregate([{ id: "quiche-lorraine", portions: 6 }], [quiche], {
    ajouts: [{ id: "x", nom: "pain", categorie: "boulangerie" }],
  });
  const coches = { lardons: "200 g", "pomme de terre": "1,5 kg", "ajout:x": "" };
  assert.deepEqual(purgeChecks(coches, lines), { lardons: "200 g" });
});

// --- Rayons, sections, progression, texte ----------------------------------

test("resolveCategoryOrder : ordre perso nettoyé et complété", () => {
  const cats = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "autre" }];
  assert.deepEqual(resolveCategoryOrder([], cats), ["a", "b", "c", "autre"]);
  assert.deepEqual(resolveCategoryOrder(["c", "inconnu", "a", "c"], cats), ["c", "a", "b", "autre"]);
  assert.equal(defaultOrder[0], "fruits-legumes");
  assert.equal(defaultOrder.at(-1), "autre");
});

test("buildSections : ordre des rayons perso, rayons vides masqués, rayon inconnu -> autre", () => {
  const ajouts = [
    { id: "x", nom: "pain", categorie: "boulangerie" },
    { id: "y", nom: "truc", categorie: "rayon-supprime" },
  ];
  const lines = aggregate(referenceSelection, [gratin, quiche], { ajouts });
  const order = resolveCategoryOrder(["frais", "boulangerie"], categories);
  const { sections } = buildSections(lines, { categoryOrder: order });
  assert.deepEqual(sections.map((s) => s.categorie), ["frais", "boulangerie", "fruits-legumes", "cremerie", "autre"]);
  assert.deepEqual(view(sections.at(-1).lines), ["truc"]);
});

test("buildSections : lignes cochées en fin de rayon, placard trié, état attaché", () => {
  const lines = aggregate(referenceSelection, [gratin, quiche]);
  let coches = setChecked({}, line(lines, "beurre"), true);
  coches = setChecked(coches, line(lines, "sel"), true);
  coches["lait entier"] = "ancienne quantité";
  const { sections, placard } = buildSections(lines, { categoryOrder: defaultOrder, coches });
  const cremerie = sections.find((s) => s.categorie === "cremerie").lines;
  assert.deepEqual(
    cremerie.map((l) => [l.nom, l.state]),
    [
      ["crème liquide entière", "unchecked"],
      ["lait entier", "stale"],
      ["œuf", "unchecked"],
      ["beurre", "checked"],
    ],
  );
  assert.deepEqual(placard.map((l) => [l.nom, l.state]), [
    ["noix de muscade", "unchecked"],
    ["poivre", "unchecked"],
    ["sel", "checked"],
  ]);
});

test("buildSections : coches absentes par défaut", () => {
  const { sections } = buildSections(aggregate(referenceSelection, [gratin, quiche]), { categoryOrder: defaultOrder });
  assert.ok(sections.every((s) => s.lines.every((l) => l.state === "unchecked")));
});

test("progress : cochés / total, hors section placard", () => {
  const lines = aggregate(referenceSelection, [gratin, quiche], {
    ajouts: [{ id: "x", nom: "pain", categorie: "boulangerie", coche: true }],
  });
  const coches = setChecked(setChecked({}, line(lines, "ail"), true), line(lines, "sel"), true);
  assert.deepEqual(progress(buildSections(lines, { categoryOrder: defaultOrder, coches })), { done: 2, total: 9 });
  assert.deepEqual(progress(buildSections([], { categoryOrder: defaultOrder })), { done: 0, total: 0 });
});

test("shoppingListText : sans les cochés, avec « facultatif » et les ajouts ; vide si tout est coché", () => {
  const a = recipe({
    id: "a",
    ingredients: [
      ing("rhum ambré", 2, "cas", { categorie: "boissons", optionnel: true }),
      ing("farine", 250, "g", { categorie: "epicerie-sucree" }),
      ing("sel", null, null, { categorie: "condiments-epices", placard: true }),
    ],
  });
  const lines = aggregate([{ id: "a", portions: 4 }], [a], {
    ajouts: [
      { id: "x", nom: "éponges", quantite: "2 paquets", categorie: "maison" },
      { id: "y", nom: "pain", categorie: "boulangerie", coche: true },
    ],
  });
  const coches = setChecked({}, line(lines, "farine"), true);
  const text = shoppingListText(buildSections(lines, { categoryOrder: defaultOrder, coches }), categories);
  assert.equal(
    text,
    ["Boissons", "- rhum ambré : 2 c. à s. (facultatif)", "", "Maison & hygiène", "- éponges : 2 paquets", "", PLACARD_LABEL, "- sel"].join("\n"),
  );

  const allChecked = lines.reduce((acc, l) => (l.ajout ? acc : setChecked(acc, l, true)), {});
  const nothingLeft = buildSections(lines.filter((l) => !l.ajout), { categoryOrder: defaultOrder, coches: allChecked });
  assert.equal(shoppingListText(nothingLeft, categories), "");
});
