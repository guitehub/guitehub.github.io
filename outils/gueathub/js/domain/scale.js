// Mise à l'échelle des portions (§6.1) et quantités de la fiche recette.
// Module pur : ni DOM ni stockage, importable dans Node.

import { cleanFloat, formatQuantity, roundAmount, toBase, unitFamily } from "./units.js";

export const DEFAULT_PORTIONS_UNIT = "personnes";

/** Unité des portions d'une recette (« personnes » par défaut). */
export function portionsUnit(recipe) {
  return recipe.portionsUnite ?? DEFAULT_PORTIONS_UNIT;
}

/** facteur = portions choisies / portions de la recette. */
export function scaleFactor(portions, recipe) {
  return portions / recipe.portions;
}

/** Quantité mise à l'échelle, dans l'unité de base : { family, amount }, ou null si « au goût ». */
export function scaleIngredient(ingredient, factor) {
  if (ingredient.quantite === null) return null;
  return {
    family: unitFamily(ingredient.unite),
    amount: cleanFloat(toBase(ingredient.quantite, ingredient.unite) * factor),
  };
}

/**
 * Quantité affichée sur la fiche recette. Aux portions d'origine, elle est affichée telle qu'écrite
 * dans les données ; sinon elle est arrondie au plus proche (§6.3). Chaîne vide si « au goût ».
 */
export function recipeQuantityText(ingredient, factor) {
  if (ingredient.quantite === null) return "";
  if (factor === 1) return formatQuantity({ value: ingredient.quantite, unit: ingredient.unite });
  const { family, amount } = scaleIngredient(ingredient, factor);
  return formatQuantity(roundAmount(family, amount, "nearest"));
}

/**
 * Ingrédients de la fiche pour un nombre de portions, regroupés par `groupe`
 * dans l'ordre d'apparition. Retourne [{ groupe: string | null, ingredients: [...] }],
 * chaque ingrédient recevant `quantiteAffichee`.
 */
export function recipeIngredientGroups(recipe, portions) {
  const factor = scaleFactor(portions, recipe);
  const groups = [];
  for (const ingredient of recipe.ingredients) {
    const name = ingredient.groupe ?? null;
    let group = groups.find((candidate) => candidate.groupe === name);
    if (!group) {
      group = { groupe: name, ingredients: [] };
      groups.push(group);
    }
    group.ingredients.push({ ...ingredient, quantiteAffichee: recipeQuantityText(ingredient, factor) });
  }
  return groups;
}
