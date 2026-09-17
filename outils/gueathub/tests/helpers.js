// Outils partagés par les tests (ce n'est pas un fichier de test : pas de suffixe .test.js).

import { readFileSync } from "node:fs";

const readFixture = (name) =>
  JSON.parse(readFileSync(new URL(`./fixtures/reference/${name}.json`, import.meta.url), "utf8"));

/** Recettes figées de l'exemple de référence (§6.5), indépendantes des vraies données. */
export function loadReference() {
  return { gratin: readFixture("gratin-dauphinois"), quiche: readFixture("quiche-lorraine") };
}

/** Rayons réels de l'app. */
export function loadCategories() {
  return JSON.parse(readFileSync(new URL("../../../_data/gueathub/categories.json", import.meta.url), "utf8"));
}

/** Recette minimale valide, surchargée par `fields`. */
export function recipe(fields = {}) {
  return {
    schema: 1,
    id: "test",
    titre: "Test",
    type: "plat",
    portions: 4,
    temps: { preparation: 0, cuisson: 0, repos: 0 },
    difficulte: "facile",
    tags: [],
    ingredients: [],
    etapes: [{ texte: "Servir." }],
    ...fields,
  };
}

/** Ingrédient : ing("ail", 2, "gousse", { categorie: "fruits-legumes" }). */
export function ing(nom, quantite, unite, fields = {}) {
  return { nom, quantite, unite, categorie: "autre", ...fields };
}
