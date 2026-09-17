// Libellés français et icônes des valeurs du contrat de données.

export const TYPES = {
  entree: { label: "Entrée", plural: "Entrées", icon: "egg-fried" },
  plat: { label: "Plat", plural: "Plats", icon: "fork-knife" },
  accompagnement: { label: "Accompagnement", plural: "Accompagnements", icon: "basket" },
  dessert: { label: "Dessert", plural: "Desserts", icon: "cake2" },
  "petit-dejeuner": { label: "Petit-déjeuner", plural: "Petits-déjeuners", icon: "cup-hot" },
  gouter: { label: "Goûter", plural: "Goûters", icon: "cookie" },
  apero: { label: "Apéro", plural: "Apéros", icon: "balloon" },
  sauce: { label: "Sauce", plural: "Sauces", icon: "droplet-half" },
  boisson: { label: "Boisson", plural: "Boissons", icon: "cup-straw" },
};

const TAGS = {
  vegetarien: "Végétarien",
  vegan: "Vegan",
  "sans-gluten": "Sans gluten",
  rapide: "Rapide",
  four: "Au four",
  "sans-cuisson": "Sans cuisson",
  "batch-cooking": "Batch cooking",
  printemps: "Printemps",
  ete: "Été",
  automne: "Automne",
  hiver: "Hiver",
  fete: "Fête",
};

export const DIFFICULTIES = { facile: "Facile", moyen: "Moyen", difficile: "Difficile" };

/** Libellé d'un tag : vocabulaire conseillé, sinon le tag lui-même, lisible. */
export function tagLabel(tag) {
  if (TAGS[tag]) return TAGS[tag];
  const text = tag.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** « 6 personnes », « 1 personne », « 15 crêpes », « 1 crêpe ». */
export function portionsText(count, unit) {
  return `${count} ${count < 2 ? unit.replace(/s$/, "") : unit}`;
}

/** « 2 recettes », « 1 recette ». */
export function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count < 2 ? singular : pluralForm}`;
}
