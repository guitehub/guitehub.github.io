// État local de l'app (§8) : une seule clé localStorage, écriture différée, synchronisation entre onglets.
// Les fonctions d'état (migrate, purgeState) sont pures ; createStore reçoit le stockage en paramètre.

import { aggregate, purgeChecks, purgeSelection } from "./domain/aggregate.js";

export const STORAGE_KEY = "gueathub:v1";
export const STATE_VERSION = 1;
export const MAX_PORTIONS = 99;

export function defaultState() {
  return {
    version: STATE_VERSION,
    selection: [],
    coches: {},
    ajouts: [],
    placardPerso: {},
    ordreRayons: [],
    etapesFaites: {},
    masquerCoches: false,
  };
}

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isNonNegativeInteger = (value) => Number.isInteger(value) && value >= 0;

export function clampPortions(value) {
  return Math.min(MAX_PORTIONS, Math.max(1, Math.round(value)));
}

/**
 * Transforme un état lu (n'importe quelle valeur) en état valide : migration selon `version`,
 * valeurs par défaut pour les champs absents, entrées mal formées écartées.
 */
export function migrate(raw) {
  const state = defaultState();
  if (!isObject(raw) || raw.version !== STATE_VERSION) return state;

  if (Array.isArray(raw.selection)) {
    const seen = new Set();
    for (const item of raw.selection) {
      if (!isObject(item) || typeof item.id !== "string" || !Number.isFinite(item.portions) || seen.has(item.id)) continue;
      seen.add(item.id);
      state.selection.push({ id: item.id, portions: clampPortions(item.portions) });
    }
  }
  if (isObject(raw.coches)) {
    state.coches = Object.fromEntries(Object.entries(raw.coches).filter(([, signature]) => typeof signature === "string"));
  }
  if (Array.isArray(raw.ajouts)) {
    state.ajouts = raw.ajouts
      .filter((item) => isObject(item) && typeof item.id === "string" && typeof item.nom === "string" && item.nom.trim())
      .map((item) => ({
        id: item.id,
        nom: item.nom,
        quantite: typeof item.quantite === "string" ? item.quantite : "",
        categorie: typeof item.categorie === "string" ? item.categorie : "autre",
        coche: item.coche === true,
      }));
  }
  if (isObject(raw.placardPerso)) {
    state.placardPerso = Object.fromEntries(Object.entries(raw.placardPerso).filter(([, value]) => typeof value === "boolean"));
  }
  if (Array.isArray(raw.ordreRayons)) {
    state.ordreRayons = [...new Set(raw.ordreRayons.filter((id) => typeof id === "string"))];
  }
  if (isObject(raw.etapesFaites)) {
    for (const [id, steps] of Object.entries(raw.etapesFaites)) {
      if (!Array.isArray(steps)) continue;
      const clean = [...new Set(steps.filter(isNonNegativeInteger))].sort((a, b) => a - b);
      if (clean.length > 0) state.etapesFaites[id] = clean;
    }
  }
  state.masquerCoches = raw.masquerCoches === true;
  return state;
}

/**
 * Retire les références mortes une fois les recettes chargées : recettes disparues de la sélection
 * et des étapes faites, rayons inconnus, coches sans ligne. Retourne { state, removed } où `removed`
 * liste les id de recettes retirées de la sélection.
 */
export function purgeState(state, { recipesById, categories }) {
  const categoryIds = new Set(categories.map((category) => category.id));
  const { selection, removed } = purgeSelection(state.selection, recipesById);
  const ajouts = state.ajouts.map((item) =>
    categoryIds.has(item.categorie) ? item : { ...item, categorie: "autre" },
  );
  const etapesFaites = Object.fromEntries(
    Object.entries(state.etapesFaites)
      .filter(([id]) => recipesById.has(id))
      .map(([id, steps]) => [id, steps.filter((index) => index < recipesById.get(id).etapes.length)])
      .filter(([, steps]) => steps.length > 0),
  );
  const lines = aggregate(selection, recipesById, { ajouts });
  return {
    state: {
      ...state,
      selection,
      ajouts,
      etapesFaites,
      ordreRayons: state.ordreRayons.filter((id) => categoryIds.has(id)),
      coches: purgeChecks(state.coches, lines),
    },
    removed,
  };
}

/** Vrai si le stockage accepte une écriture (faux en navigation privée iOS ancienne, quota, blocage…). */
export function probeStorage(storage, key = STORAGE_KEY) {
  if (!storage) return false;
  try {
    const probe = `${key}:sonde`;
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function parse(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

/**
 * Crée le store.
 *   storage : un objet compatible localStorage, ou null (mode mémoire)
 * Les abonnés reçoivent (state, previous, meta) ; `meta` décrit le changement (voir actions.js).
 */
export function createStore({ storage = null, key = STORAGE_KEY, delay = 200 } = {}) {
  const available = probeStorage(storage, key);
  let raw = null;
  if (available) {
    try {
      raw = parse(storage.getItem(key));
    } catch {
      raw = null;
    }
  }
  let state = migrate(raw);
  // Données écrites par une version plus récente de l'app : on ne les écrase pas.
  const readOnly = isObject(raw) && Number(raw.version) > STATE_VERSION;
  let writeFailed = false;
  let timer = null;
  const listeners = new Set();

  function flush() {
    clearTimeout(timer);
    timer = null;
    if (!available || readOnly) return;
    try {
      storage.setItem(key, JSON.stringify(state));
      writeFailed = false;
    } catch {
      writeFailed = true;
    }
  }

  function set(next, meta = {}) {
    const previous = state;
    state = next;
    if (!meta.fromStorage && available && !readOnly) {
      clearTimeout(timer);
      timer = setTimeout(flush, delay);
    }
    for (const listener of listeners) listener(state, previous, meta);
  }

  return {
    get state() {
      return state;
    },
    /** Vrai si les choix sont bien conservés sur l'appareil. */
    get persistent() {
      return available && !readOnly && !writeFailed;
    },
    /** `change(state)` retourne le nouvel état (sans modifier l'ancien). */
    update(change, meta = {}) {
      set(change(state), meta);
    },
    replace(next, meta = {}) {
      set(next, meta);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    flush,
    /** À appeler sur l'événement `storage` d'un autre onglet. */
    syncFromStorage(text) {
      if (readOnly) return;
      clearTimeout(timer);
      timer = null;
      set(migrate(parse(text)), { type: "sync", fromStorage: true });
    },
  };
}
