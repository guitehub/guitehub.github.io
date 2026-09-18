// Texte : normalisation des noms, recherche insensible aux accents, tri.
// Module pur : ni DOM ni stockage, importable dans Node.

const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });

const LIGATURES = { "œ": "oe", "æ": "ae", "ß": "ss" };

/** Clé d'agrégation d'un ingrédient : trim, minuscules, espaces réduits, NFC (accents conservés). */
export function normalize(name) {
  return String(name).trim().replace(/\s+/g, " ").toLowerCase().normalize("NFC");
}

/** Forme de recherche : normalisée, sans accents ni ligatures. */
export function fold(text) {
  return normalize(text)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[œæß]/g, (letter) => LIGATURES[letter]);
}

/**
 * Clé de quasi-doublon (validation) : sans accents, et sans « s » ou « x » final à chaque mot.
 * « Pommes de terre » et « pomme de terre » donnent la même clé.
 */
export function nearDuplicateKey(name) {
  return fold(name)
    .split(" ")
    .map((word) => word.replace(/[sx]$/, ""))
    .join(" ");
}

/** Comparaison alphabétique française (casse et accents ignorés, nombres dans l'ordre). */
export function compareText(a, b) {
  return collator.compare(a, b);
}

/** Vrai si la chaîne est une URL http(s) utilisable comme lien. */
export function isHttpUrl(value) {
  return /^https?:\/\/\S+$/i.test(String(value).trim());
}

/** Texte dans lequel on cherche : titre et noms d'ingrédients, déjà « pliés ». */
export function recipeSearchText(recipe) {
  return fold([recipe.titre, ...recipe.ingredients.map((ingredient) => ingredient.nom)].join("\n"));
}

/** Chaque mot de la requête doit apparaître quelque part dans le texte de recherche. */
export function matchesQuery(searchText, query) {
  const terms = fold(query).split(" ").filter(Boolean);
  return terms.every((term) => searchText.includes(term));
}

/** Temps total d'une recette, en minutes. */
export function totalTime(recipe) {
  const { preparation, cuisson, repos } = recipe.temps;
  return preparation + cuisson + repos;
}

/**
 * Filtre les recettes de l'écran d'accueil.
 * criteria : { query, type, tags: [], selectedOnly, selectedIds: Set }
 */
export function filterRecipes(recipes, criteria = {}) {
  const { query = "", type = null, tags = [], selectedOnly = false, selectedIds = new Set() } = criteria;
  return recipes.filter(
    (recipe) =>
      (!type || recipe.type === type) &&
      tags.every((tag) => recipe.tags.includes(tag)) &&
      (!selectedOnly || selectedIds.has(recipe.id)) &&
      matchesQuery(recipeSearchText(recipe), query),
  );
}

/** Trie une copie des recettes : « alpha » (titre) ou « temps » (temps total, puis titre). */
export function sortRecipes(recipes, mode = "alpha") {
  const byTitle = (a, b) => compareText(a.titre, b.titre);
  const compare = mode === "temps" ? (a, b) => totalTime(a) - totalTime(b) || byTitle(a, b) : byTitle;
  return [...recipes].sort(compare);
}

/** Tire au hasard jusqu'à `count` éléments distincts (copie, entrée intacte). `random` renvoie [0, 1[. */
export function pickRandom(items, count, random = Math.random) {
  const pool = [...items];
  const size = Math.min(Math.max(0, count), pool.length);
  for (let i = 0; i < size; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, size);
}
