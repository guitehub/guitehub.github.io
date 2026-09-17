// Liste de courses : agrégation (§6.2), coches (§6.4), rayons et export texte.
// Module pur : ni DOM ni stockage, importable dans Node.

import { compareText, normalize } from "./text.js";
import { cleanFloat, formatQuantity, roundAmount } from "./units.js";
import { recipeQuantityText, scaleFactor, scaleIngredient } from "./scale.js";

export const PLACARD_LABEL = "À vérifier au placard";

const MANUAL_KEY_PREFIX = "ajout:";

function indexRecipes(recipes) {
  return recipes instanceof Map ? recipes : new Map(recipes.map((recipe) => [recipe.id, recipe]));
}

/** Sépare la sélection entre recettes connues et recettes disparues du site. */
export function purgeSelection(selection, recipes) {
  const byId = indexRecipes(recipes);
  return {
    selection: selection.filter((item) => byId.has(item.id)),
    removed: selection.filter((item) => !byId.has(item.id)).map((item) => item.id),
  };
}

/**
 * Compose les lignes de courses.
 *   selection : [{ id, portions }]
 *   recipes   : tableau ou Map id -> recette
 *   prefs     : { placardPerso: { [cle]: booléen }, ajouts: [{ id, nom, quantite, categorie, coche }] }
 *
 * Ligne de recette : { key, nom, categorie, quantities: [{ family, amount }], quantite,
 *   optionnel, placardDonnee, placard, sources: [{ recetteId, titre, portions, groupe, quantiteAffichee }],
 *   ajout: false }
 * Ligne d'ajout manuel : même forme, avec ajout: true, id et coche ; jamais fusionnée.
 */
export function aggregate(selection, recipes, prefs = {}) {
  const { placardPerso = {}, ajouts = [] } = prefs;
  const byId = indexRecipes(recipes);
  const lines = new Map();

  for (const { id, portions } of selection) {
    const recipe = byId.get(id);
    if (!recipe) continue;
    const factor = scaleFactor(portions, recipe);

    for (const ingredient of recipe.ingredients) {
      const key = normalize(ingredient.nom);
      let line = lines.get(key);
      if (!line) {
        line = {
          key,
          nom: ingredient.nom,
          categorie: ingredient.categorie,
          amounts: new Map(), // famille -> quantité dans l'unité de base, dans l'ordre d'apparition
          optionnel: true,
          placardDonnee: true,
          sources: [],
        };
        lines.set(key, line);
      }
      const scaled = scaleIngredient(ingredient, factor);
      if (scaled) {
        line.amounts.set(scaled.family, cleanFloat((line.amounts.get(scaled.family) ?? 0) + scaled.amount));
      }
      // Facultatif (ou basique du placard) seulement si toutes les occurrences le sont.
      line.optionnel &&= ingredient.optionnel === true;
      line.placardDonnee &&= ingredient.placard === true;
      line.sources.push({
        recetteId: recipe.id,
        titre: recipe.titre,
        portions,
        groupe: ingredient.groupe ?? null,
        quantiteAffichee: recipeQuantityText(ingredient, factor),
      });
    }
  }

  const recipeLines = [...lines.values()].map(({ amounts, ...line }) => ({
    ...line,
    quantities: [...amounts].map(([family, amount]) => ({ family, amount })),
    quantite: [...amounts].map(([family, amount]) => formatQuantity(roundAmount(family, amount, "up"))).join(" + "),
    placard: Object.hasOwn(placardPerso, line.key) ? placardPerso[line.key] === true : line.placardDonnee,
    ajout: false,
  }));

  const manualLines = ajouts.map((item) => ({
    key: MANUAL_KEY_PREFIX + item.id,
    id: item.id,
    nom: item.nom,
    categorie: item.categorie,
    quantities: [],
    quantite: item.quantite ?? "",
    optionnel: false,
    placardDonnee: false,
    placard: false,
    sources: [],
    ajout: true,
    coche: item.coche === true,
  }));

  return [...recipeLines, ...manualLines];
}

/** Signature d'une ligne : la quantité affichée au moment du cochage. */
export function lineSignature(line) {
  return line.quantite;
}

/**
 * État d'une ligne : « checked », « unchecked », ou « stale » quand elle a été cochée
 * puis que sa quantité a changé (affichée non cochée, avec « quantité modifiée »).
 */
export function lineState(line, coches) {
  if (line.ajout) return line.coche ? "checked" : "unchecked";
  if (!Object.hasOwn(coches, line.key)) return "unchecked";
  return coches[line.key] === lineSignature(line) ? "checked" : "stale";
}

/** Nouvel objet de coches après avoir coché ou décoché une ligne de recette. */
export function setChecked(coches, line, checked) {
  const next = { ...coches };
  if (checked) next[line.key] = lineSignature(line);
  else delete next[line.key];
  return next;
}

/** Retire les coches dont la ligne n'existe plus. */
export function purgeChecks(coches, lines) {
  const keys = new Set(lines.filter((line) => !line.ajout).map((line) => line.key));
  return Object.fromEntries(Object.entries(coches).filter(([key]) => keys.has(key)));
}

/**
 * Ordre effectif des rayons : l'ordre de l'utilisateur, sans rayon inconnu ni doublon,
 * complété par les rayons manquants dans l'ordre par défaut.
 */
export function resolveCategoryOrder(order, categories) {
  const known = categories.map((category) => category.id);
  return [...new Set([...order, ...known])].filter((id) => known.includes(id));
}

/**
 * Range les lignes par rayon.
 * Retourne { sections: [{ categorie, lines }], placard: lines } ; chaque ligne reçoit `state`.
 * Rayons vides retirés ; dans un rayon, lignes cochées en fin, puis ordre alphabétique.
 * Une ligne dont le rayon est inconnu va dans « autre ».
 */
export function buildSections(lines, { categoryOrder, coches = {} }) {
  const sections = categoryOrder.map((categorie) => ({ categorie, lines: [] }));
  const byCategory = new Map(sections.map((section) => [section.categorie, section]));
  const placard = [];

  for (const line of lines) {
    const item = { ...line, state: lineState(line, coches) };
    if (item.placard) placard.push(item);
    else (byCategory.get(item.categorie) ?? byCategory.get("autre")).lines.push(item);
  }

  const compare = (a, b) =>
    Number(a.state === "checked") - Number(b.state === "checked") || compareText(a.nom, b.nom);

  return {
    sections: sections
      .filter((section) => section.lines.length > 0)
      .map((section) => ({ ...section, lines: section.lines.sort(compare) })),
    placard: placard.sort(compare),
  };
}

/** Progression hors section placard : { done, total }. */
export function progress({ sections }) {
  const lines = sections.flatMap((section) => section.lines);
  return { done: lines.filter((line) => line.state === "checked").length, total: lines.length };
}

/** Texte brut de la liste : articles non cochés, groupés par rayon, placard en dernier. */
export function shoppingListText({ sections, placard }, categories) {
  const labels = new Map(categories.map((category) => [category.id, category.libelle]));
  const item = (line) =>
    `- ${line.nom}${line.quantite ? ` : ${line.quantite}` : ""}${line.optionnel ? " (facultatif)" : ""}`;
  const blocks = [];
  const addBlock = (title, lines) => {
    const remaining = lines.filter((line) => line.state !== "checked");
    if (remaining.length > 0) blocks.push([title, ...remaining.map(item)].join("\n"));
  };
  for (const section of sections) addBlock(labels.get(section.categorie), section.lines);
  addBlock(PLACARD_LABEL, placard);
  return blocks.join("\n\n");
}
