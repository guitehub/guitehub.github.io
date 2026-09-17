// Parties de l'interface testables sans navigateur : routeur, état local, gabarits.

import { test } from "node:test";
import assert from "node:assert/strict";

import { href, parseRoute } from "../js/router.js";
import { STORAGE_KEY, clampPortions, createStore, defaultState, migrate, probeStorage, purgeState } from "../js/store.js";
import { escapeHtml, html, icon, raw } from "../js/ui/dom.js";
import { loadCategories, loadReference } from "./helpers.js";

const { gratin, quiche } = loadReference();
const categories = loadCategories();
const recipesById = new Map([[gratin.id, gratin], [quiche.id, quiche]]);

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    data,
  };
}

// --- Routeur -----------------------------------------------------------------

test("parseRoute : les quatre routes, et repli sur les recettes", () => {
  assert.deepEqual(parseRoute(""), { name: "recipes", params: {} });
  assert.deepEqual(parseRoute("#/"), { name: "recipes", params: {} });
  assert.deepEqual(parseRoute("#/recette/gratin-dauphinois"), { name: "recipe", params: { id: "gratin-dauphinois" } });
  assert.deepEqual(parseRoute("#/recette/cr%C3%AApes/"), { name: "recipe", params: { id: "crêpes" } });
  assert.deepEqual(parseRoute("#/recette/%E0%A4%A"), { name: "recipe", params: { id: "%E0%A4%A" } });
  assert.deepEqual(parseRoute("#/liste"), { name: "list", params: {} });
  assert.deepEqual(parseRoute("#reglages"), { name: "settings", params: {} });
  assert.deepEqual(parseRoute("#/nimporte-quoi"), { name: "recipes", params: {}, redirect: true });
  assert.equal(href.recipe("a b"), "#/recette/a%20b");
  assert.deepEqual(parseRoute(href.recipe("a b")).params, { id: "a b" });
});

// --- État local ----------------------------------------------------------------

test("migrate : valeurs par défaut, version inconnue, données corrompues", () => {
  assert.deepEqual(migrate(null), defaultState());
  assert.deepEqual(migrate("texte"), defaultState());
  assert.deepEqual(migrate({ version: 2, selection: [{ id: "x", portions: 2 }] }), defaultState());
  const state = migrate({
    version: 1,
    selection: [{ id: "a", portions: 2.4 }, { id: "a", portions: 3 }, { id: "b", portions: 500 }, { id: 3 }, "x", { id: "c", portions: -2 }],
    coches: { ail: "2 gousses", sel: 3 },
    ajouts: [{ id: "1", nom: "pain" }, { id: "2", nom: "  " }, { nom: "sans id" }],
    placardPerso: { sel: true, poivre: "oui" },
    ordreRayons: ["frais", 4, "frais"],
    etapesFaites: { gratin: [2, 0, 2, -1, 1.5], vide: [], mauvais: "0" },
    masquerCoches: "true",
  });
  assert.deepEqual(state.selection, [{ id: "a", portions: 2 }, { id: "b", portions: 99 }, { id: "c", portions: 1 }]);
  assert.deepEqual(state.coches, { ail: "2 gousses" });
  assert.deepEqual(state.ajouts, [{ id: "1", nom: "pain", quantite: "", categorie: "autre", coche: false }]);
  assert.deepEqual(state.placardPerso, { sel: true });
  assert.deepEqual(state.ordreRayons, ["frais"]);
  assert.deepEqual(state.etapesFaites, { gratin: [0, 2] });
  assert.equal(state.masquerCoches, false);
  assert.equal(clampPortions(0), 1);
});

test("purgeState : recettes disparues, étapes hors limites, rayons et coches morts", () => {
  const { state, removed } = purgeState(
    {
      ...defaultState(),
      selection: [{ id: "disparue", portions: 2 }, { id: "gratin-dauphinois", portions: 6 }],
      coches: { ail: "2 gousses", lardons: "200 g" },
      ajouts: [{ id: "1", nom: "pain", quantite: "", categorie: "rayon-supprime", coche: false }],
      ordreRayons: ["frais", "rayon-supprime"],
      etapesFaites: { "gratin-dauphinois": [0, 99], disparue: [1], "quiche-lorraine": [42] },
    },
    { recipesById, categories },
  );
  assert.deepEqual(removed, ["disparue"]);
  assert.deepEqual(state.selection, [{ id: "gratin-dauphinois", portions: 6 }]);
  assert.deepEqual(state.coches, { ail: "2 gousses" });
  assert.equal(state.ajouts[0].categorie, "autre");
  assert.deepEqual(state.ordreRayons, ["frais"]);
  assert.deepEqual(state.etapesFaites, { "gratin-dauphinois": [0] });
});

test("createStore : lecture, écriture différée, flush, abonnements", async () => {
  const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1, masquerCoches: true }) });
  const store = createStore({ storage, delay: 10 });
  assert.equal(store.state.masquerCoches, true);
  assert.equal(store.persistent, true);

  const seen = [];
  const unsubscribe = store.subscribe((state, previous, meta) => seen.push([state.masquerCoches, previous.masquerCoches, meta.type]));
  store.update((state) => ({ ...state, masquerCoches: false }), { type: "list" });
  assert.deepEqual(seen, [[false, true, "list"]]);
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).masquerCoches, true, "écriture différée");
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).masquerCoches, false);

  store.replace({ ...store.state, ordreRayons: ["frais"] });
  store.flush();
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)).ordreRayons, ["frais"]);

  store.syncFromStorage(JSON.stringify({ version: 1, ordreRayons: ["autre"] }));
  assert.deepEqual(store.state.ordreRayons, ["autre"]);
  assert.equal(seen.at(-1)[2], "sync");
  unsubscribe();
  store.update((state) => state);
  assert.equal(seen.length, 3);
});

test("createStore : stockage indisponible ou plein -> mode mémoire", () => {
  const broken = { getItem: () => null, setItem: () => { throw new Error("quota"); }, removeItem: () => {} };
  assert.equal(probeStorage(broken), false);
  assert.equal(probeStorage(null), false);
  const store = createStore({ storage: broken });
  assert.equal(store.persistent, false);
  store.update((state) => ({ ...state, masquerCoches: true }));
  assert.equal(store.state.masquerCoches, true);
  assert.equal(createStore().persistent, false);
});

test("createStore : données d'une version plus récente jamais écrasées", () => {
  const future = JSON.stringify({ version: 2, autre: "chose" });
  const storage = memoryStorage({ [STORAGE_KEY]: future });
  const store = createStore({ storage, delay: 0 });
  assert.equal(store.persistent, false);
  store.update((state) => ({ ...state, masquerCoches: true }));
  store.flush();
  assert.equal(storage.getItem(STORAGE_KEY), future);
});

// --- Gabarits ------------------------------------------------------------------

test("html : toute valeur est échappée, sauf les fragments sûrs", () => {
  const evil = `<img src=x onerror="alert('x')">&`;
  assert.equal(escapeHtml(evil), "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;");
  assert.equal(String(html`<p title="${evil}">${evil}</p>`), `<p title="${escapeHtml(evil)}">${escapeHtml(evil)}</p>`);
  assert.equal(String(html`<ul>${["<a>", html`<li>ok</li>`]}</ul>`), "<ul>&lt;a&gt;<li>ok</li></ul>");
  assert.equal(String(html`${null}${undefined}${false}${0}`), "0");
  assert.equal(String(html`${raw("<b>")}`), "<b>");
});

test("icon : SVG décoratif, repli si l'icône n'existe pas", () => {
  const svg = String(icon("apple", "size-4"));
  assert.match(svg, /^<svg class="size-4 shrink-0" viewBox="0 0 16 16"[^>]*aria-hidden="true"/);
  assert.match(String(icon("inexistante")), /<svg class="size-5 shrink-0"/);
});
