#!/usr/bin/env node
// Validation des données gueathub (voir _specs, §5.6).
//
//   npm run check                          -> vérifie _data/gueathub/recettes/
//   npm run check -- chemin/vers/recettes  -> vérifie un autre dossier (fixtures)
//
// Code de sortie 1 s'il y a au moins une erreur. Les avertissements ne bloquent pas.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

import { nearDuplicateKey, normalize } from "../outils/gueathub/js/domain/text.js";
import { ICONS } from "../outils/gueathub/js/ui/icons.js";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

export const DEFAULT_PATHS = {
  recipesDir: join(ROOT, "_data/gueathub/recettes"),
  categoriesFile: join(ROOT, "_data/gueathub/categories.json"),
  photosDir: join(ROOT, "assets/gueathub/recettes"),
  schemaFile: join(ROOT, "outils/gueathub/schema/recette.schema.json"),
};

const PHOTO_MAX_BYTES = 300 * 1024;

const SUGGESTED_TAGS = new Set([
  "vegetarien", "vegan", "sans-gluten", "rapide", "four", "sans-cuisson", "batch-cooking",
  "printemps", "ete", "automne", "hiver", "fete",
]);

const CATEGORIES_SCHEMA = {
  type: "array",
  minItems: 1,
  items: {
    type: "object",
    additionalProperties: false,
    required: ["id", "libelle", "icone"],
    properties: {
      id: { type: "string", pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" },
      libelle: { type: "string", minLength: 1 },
      icone: { type: "string", pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" },
    },
  },
};

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function plural(count, singular, pluralForm = singular + "s") {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}

function describeAjvError(error, data) {
  const { keyword, params, instancePath } = error;
  let where = instancePath || "/";
  const ingredient = instancePath.match(/^\/ingredients\/(\d+)/);
  if (ingredient) {
    const name = data?.ingredients?.[Number(ingredient[1])]?.nom;
    if (typeof name === "string") where += ` (« ${name} »)`;
  }
  const messages = {
    required: () => `champ obligatoire manquant « ${params.missingProperty} »`,
    additionalProperties: () => `champ inconnu « ${params.additionalProperty} »`,
    enum: () => `valeur non autorisée (attendu : ${params.allowedValues.map((v) => JSON.stringify(v)).join(", ")})`,
    const: () => `doit valoir ${JSON.stringify(params.allowedValue)}`,
    type: () => `type attendu : ${[].concat(params.type).join(" ou ")}`,
    pattern: () => "format invalide (minuscules, sans espace en trop, kebab-case pour les identifiants)",
    maxLength: () => `${params.limit} caractères maximum`,
    minLength: () => `ne doit pas être vide`,
    minimum: () => `doit être supérieur ou égal à ${params.limit}`,
    maximum: () => `doit être inférieur ou égal à ${params.limit}`,
    exclusiveMinimum: () => `doit être strictement supérieur à ${params.limit}`,
    minItems: () => `au moins ${plural(params.limit, "élément")}`,
    uniqueItems: () => `doublon (éléments ${params.j} et ${params.i})`,
  };
  return `${where} : ${(messages[keyword] ?? (() => error.message))()}`;
}

/**
 * Vérifie les catégories et un dossier de recettes.
 * Retourne { files, categories, errors, warnings } ; chaque problème est
 * { code, file, message }.
 */
export function checkData(options = {}) {
  const paths = { ...DEFAULT_PATHS, ...options };
  const errors = [];
  const warnings = [];
  const error = (code, file, message) => errors.push({ code, file, message });
  const warn = (code, file, message) => warnings.push({ code, file, message });

  const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });

  // --- Catégories -----------------------------------------------------------
  const categoriesName = basename(paths.categoriesFile);
  let categoryIds = new Set();
  let categories = [];
  try {
    categories = readJson(paths.categoriesFile);
    const validateCategories = ajv.compile(CATEGORIES_SCHEMA);
    if (!validateCategories(categories)) {
      for (const e of validateCategories.errors) error("categories", categoriesName, describeAjvError(e));
      categories = Array.isArray(categories) ? categories : [];
    }
    for (const category of categories) {
      if (typeof category?.id !== "string") continue;
      if (categoryIds.has(category.id)) error("categories", categoriesName, `rayon « ${category.id} » en double`);
      categoryIds.add(category.id);
    }
    for (const category of categories) {
      if (typeof category?.icone === "string" && !Object.hasOwn(ICONS, category.icone)) {
        error("categories", categoriesName, `icône « ${category.icone} » (rayon « ${category.id} ») absente de js/ui/icons.js : lancer npm run icons`);
      }
    }
    if (!categoryIds.has("autre")) {
      error("categories", categoriesName, "le rayon « autre » est obligatoire (rayon par défaut des ajouts manuels)");
    }
  } catch (e) {
    error("json", categoriesName, `lecture impossible : ${e.message}`);
  }

  // --- Recettes : fichier par fichier ---------------------------------------
  const validateRecipe = ajv.compile(readJson(paths.schemaFile));
  const files = readdirSync(paths.recipesDir).sort();
  const recipes = [];
  const idToFile = new Map();

  for (const file of files) {
    if (!file.endsWith(".json")) {
      if (!file.startsWith(".")) warn("fichier-ignore", file, "ignoré (seuls les fichiers .json sont lus)");
      continue;
    }
    const fileId = file.slice(0, -".json".length);
    let recipe;
    try {
      recipe = readJson(join(paths.recipesDir, file));
    } catch (e) {
      error("json", file, `JSON invalide : ${e.message}`);
      continue;
    }

    if (!validateRecipe(recipe)) {
      for (const e of validateRecipe.errors) error("schema", file, describeAjvError(e, recipe));
    }

    if (typeof recipe?.id === "string") {
      if (recipe.id !== fileId) {
        error("id-fichier", file, `l'id « ${recipe.id} » doit être identique au nom du fichier (« ${fileId} »)`);
      }
      if (idToFile.has(recipe.id)) {
        error("id-doublon", file, `id « ${recipe.id} » déjà utilisé par ${idToFile.get(recipe.id)}`);
      } else {
        idToFile.set(recipe.id, file);
      }
    }

    const ingredients = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
    ingredients.forEach((ingredient, index) => {
      if (ingredient === null || typeof ingredient !== "object") return;
      const label = `/ingredients/${index}${typeof ingredient.nom === "string" ? ` (« ${ingredient.nom} »)` : ""}`;
      if (typeof ingredient.categorie === "string" && categoryIds.size > 0 && !categoryIds.has(ingredient.categorie)) {
        error("categorie-inconnue", file, `${label} : rayon « ${ingredient.categorie} » absent de ${categoriesName}`);
      }
      if ("quantite" in ingredient && "unite" in ingredient) {
        if (ingredient.quantite === null && ingredient.unite !== null) {
          error("quantite-unite", file, `${label} : unité « ${ingredient.unite} » sans quantité (unite doit valoir null)`);
        } else if (ingredient.quantite !== null && ingredient.unite === null) {
          error("quantite-unite", file, `${label} : quantité ${ingredient.quantite} sans unité`);
        }
      }
      // Minuscules et espaces sont vérifiés par le schéma ; reste la forme Unicode.
      if (typeof ingredient.nom === "string" && ingredient.nom !== ingredient.nom.normalize("NFC")) {
        error("nom-non-canonique", file, `${label} : le nom doit être en Unicode NFC (accents composés)`);
      }
    });

    if (typeof recipe?.id === "string") {
      const photo = join(paths.photosDir, `${recipe.id}.webp`);
      const photoLabel = relative(ROOT, photo);
      if (!existsSync(photo)) {
        warn("photo-manquante", file, `photo manquante (${photoLabel})`);
      } else if (statSync(photo).size > PHOTO_MAX_BYTES) {
        warn("photo-lourde", file, `photo de ${Math.round(statSync(photo).size / 1024)} Ko, plus de 300 Ko (${photoLabel})`);
      }
    }

    for (const tag of Array.isArray(recipe?.tags) ? recipe.tags : []) {
      if (typeof tag === "string" && !SUGGESTED_TAGS.has(tag)) {
        warn("tag-hors-vocabulaire", file, `tag « ${tag} » hors du vocabulaire conseillé`);
      }
    }

    recipes.push({ file, recipe: recipe ?? {} });
  }

  // --- Cohérence entre recettes ---------------------------------------------
  const byKey = new Map(); // clé normalisée -> [{ file, nom, categorie, placard }]
  for (const { file, recipe } of recipes) {
    for (const ingredient of Array.isArray(recipe.ingredients) ? recipe.ingredients : []) {
      if (typeof ingredient?.nom !== "string") continue;
      const key = normalize(ingredient.nom);
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push({
        file,
        nom: ingredient.nom,
        categorie: ingredient.categorie,
        placard: ingredient.placard === true,
      });
    }
  }

  const describeUses = (uses, field) =>
    uses.map((use) => `${use.file} → ${JSON.stringify(use[field])}`).join(", ");

  for (const [key, uses] of byKey) {
    if (new Set(uses.map((use) => use.categorie)).size > 1) {
      error("categorie-conflit", uses[0].file, `« ${key} » est rangé dans plusieurs rayons : ${describeUses(uses, "categorie")}`);
    }
    if (new Set(uses.map((use) => use.placard)).size > 1) {
      warn("placard-conflit", uses[0].file, `« ${key} » n'a pas le même « placard » partout : ${describeUses(uses, "placard")}`);
    }
  }

  const byFold = new Map();
  for (const key of byKey.keys()) {
    const folded = nearDuplicateKey(key);
    if (!byFold.has(folded)) byFold.set(folded, []);
    byFold.get(folded).push(key);
  }
  for (const keys of byFold.values()) {
    if (keys.length < 2) continue;
    const files = [...new Set(keys.flatMap((key) => byKey.get(key).map((use) => use.file)))];
    warn("nom-proche", files[0], `noms quasi identiques : ${keys.map((k) => `« ${k} »`).join(", ")} (${files.join(", ")})`);
  }

  return { files: files.filter((file) => file.endsWith(".json")).length, categories: categoryIds.size, errors, warnings };
}

function main(argv) {
  const recipesDir = argv[0] ? resolve(argv[0]) : DEFAULT_PATHS.recipesDir;
  const result = checkData({ recipesDir });

  console.log(`gueathub-check : ${plural(result.files, "fichier")} de recette dans ${relative(process.cwd(), recipesDir) || "."}, ${plural(result.categories, "rayon")}`);
  for (const { file, message } of result.errors) console.log(`  ✘ ${file} : ${message}`);
  for (const { file, message } of result.warnings) console.log(`  ⚠ ${file} : ${message}`);

  const summary = `${plural(result.errors.length, "erreur")}, ${plural(result.warnings.length, "avertissement")}`;
  if (result.errors.length > 0) {
    console.log(`✘ ${summary}.`);
    return 1;
  }
  console.log(`✔ ${summary}.`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = main(process.argv.slice(2));
}
