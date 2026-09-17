// Unités : familles, conversion vers l'unité de base, arrondis métier, formatage français.
// Module pur : ni DOM ni stockage, importable dans Node.

/**
 * Unités autorisées (§5.2). `factor` = valeur dans l'unité de base de la famille.
 * Chaque dénombrable forme sa propre famille (on n'additionne pas des gousses et des tranches).
 */
export const UNITS = {
  g: { family: "masse", factor: 1 },
  kg: { family: "masse", factor: 1000 },
  ml: { family: "volume", factor: 1 },
  cl: { family: "volume", factor: 10 },
  l: { family: "volume", factor: 1000 },
  cac: { family: "cuillere", factor: 1 },
  cas: { family: "cuillere", factor: 3 },
  pincee: { family: "pincee", factor: 1 },
  piece: { family: "piece", factor: 1, countable: true },
  gousse: { family: "gousse", factor: 1, countable: true },
  tranche: { family: "tranche", factor: 1, countable: true },
  botte: { family: "botte", factor: 1, countable: true },
  brin: { family: "brin", factor: 1, countable: true },
  feuille: { family: "feuille", factor: 1, countable: true },
  sachet: { family: "sachet", factor: 1, countable: true },
  boite: { family: "boite", factor: 1, countable: true },
  pot: { family: "pot", factor: 1, countable: true },
  rouleau: { family: "rouleau", factor: 1, countable: true },
};

/** Libellés affichés : [singulier, pluriel]. `piece` n'a pas de libellé (« 3 »). */
const LABELS = {
  g: ["g", "g"],
  kg: ["kg", "kg"],
  ml: ["ml", "ml"],
  cl: ["cl", "cl"],
  l: ["l", "l"],
  cac: ["c. à c.", "c. à c."],
  cas: ["c. à s.", "c. à s."],
  pincee: ["pincée", "pincées"],
  piece: ["", ""],
  gousse: ["gousse", "gousses"],
  tranche: ["tranche", "tranches"],
  botte: ["botte", "bottes"],
  brin: ["brin", "brins"],
  feuille: ["feuille", "feuilles"],
  sachet: ["sachet", "sachets"],
  boite: ["boîte", "boîtes"],
  pot: ["pot", "pots"],
  rouleau: ["rouleau", "rouleaux"],
};

/** Neutralise les erreurs de virgule flottante (arrondi à 1e-6). */
export function cleanFloat(value) {
  return Math.round(value * 1e6) / 1e6;
}

/** Famille d'une unité (« masse », « volume », « cuillere », « pincee » ou le nom du dénombrable). */
export function unitFamily(unit) {
  return UNITS[unit].family;
}

/** Quantité exprimée dans l'unité de base de sa famille. */
export function toBase(quantity, unit) {
  return cleanFloat(quantity * UNITS[unit].factor);
}

/** Arrondit au multiple de `step` : vers le haut (« up ») ou au plus proche (« nearest »). */
export function roundTo(value, step, mode) {
  const steps = cleanFloat(value / step);
  return cleanFloat((mode === "up" ? Math.ceil(steps) : Math.round(steps)) * step);
}

// Pas de 5, 10 ou 50 selon l'ordre de grandeur (masse en g, volume en ml).
function metricStep(amount) {
  return amount < 100 ? 5 : amount < 1000 ? 10 : 50;
}

/**
 * Arrondit une quantité (dans l'unité de base de sa famille) et choisit l'unité d'affichage (§6.3).
 * mode « up » : liste de courses ; « nearest » : fiche recette.
 * L'unité d'affichage est choisie d'après la valeur arrondie (995 g -> 1 kg).
 * Au plus proche, une petite quantité n'est jamais arrondie à zéro : elle reste exacte.
 * Retourne { value, unit }.
 */
export function roundAmount(family, amount, mode) {
  const keepPositive = (rounded) => (rounded === 0 ? cleanFloat(amount) : rounded);

  if (family === "masse") {
    const grams = keepPositive(roundTo(amount, metricStep(amount), mode));
    return grams >= 1000 ? { value: cleanFloat(grams / 1000), unit: "kg" } : { value: grams, unit: "g" };
  }
  if (family === "volume") {
    const ml = keepPositive(roundTo(amount, metricStep(amount), mode));
    if (ml >= 1000) return { value: cleanFloat(ml / 1000), unit: "l" };
    if (ml >= 100) return { value: cleanFloat(ml / 10), unit: "cl" };
    return { value: ml, unit: "ml" };
  }
  if (family === "cuillere") {
    const teaspoons = keepPositive(roundTo(amount, 0.5, mode));
    // À partir de 3 c. à c., on compte en c. à s., elles aussi arrondies au 0,5.
    if (teaspoons >= 3) return { value: roundTo(amount / 3, 0.5, mode), unit: "cas" };
    return { value: teaspoons, unit: "cac" };
  }
  if (family === "pincee") {
    return { value: keepPositive(roundTo(amount, 0.5, mode)), unit: "pincee" };
  }
  // Dénombrables : entier supérieur pour les courses, demi le plus proche (minimum 0,5) en recette.
  const value = mode === "up" ? Math.ceil(cleanFloat(amount)) : Math.max(0.5, roundTo(amount, 0.5, mode));
  return { value, unit: family };
}

/** Nombre au format français : virgule, deux décimales au plus, sans zéros finaux. */
export function formatNumber(value) {
  return String(Math.round(value * 100) / 100).replace(".", ",");
}

/** « 1,5 kg », « 2 gousses », « 1,5 gousse », « 3 » (pièces). Le pluriel commence à 2. */
export function formatQuantity({ value, unit }) {
  const [singular, plural] = LABELS[unit];
  const label = value >= 2 ? plural : singular;
  return label ? `${formatNumber(value)} ${label}` : formatNumber(value);
}

/** Durée en minutes : « 45 min », « 1 h », « 1 h 05 ». */
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, "0")}`;
}
