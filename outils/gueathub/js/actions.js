// Actions : toutes les modifications d'état passent par ici. Les vues ne touchent jamais au store
// directement. Chaque changement porte un `meta.type` qui permet aux vues de se mettre à jour finement.

import {
  aggregate,
  buildSections,
  progress,
  purgeChecks,
  resolveCategoryOrder,
  setChecked,
  shoppingListText,
} from "./domain/aggregate.js";
import { clampPortions, defaultState } from "./store.js";

const UNDO_DURATION = 5000;

export function createActions(app) {
  const { store, data } = app;
  let memo = null;

  // --- Sélecteurs (mémorisés sur l'identité des morceaux d'état) ------------

  function lines(state = store.state) {
    if (!memo || memo.selection !== state.selection || memo.ajouts !== state.ajouts || memo.placardPerso !== state.placardPerso) {
      memo = {
        selection: state.selection,
        ajouts: state.ajouts,
        placardPerso: state.placardPerso,
        lines: aggregate(state.selection, data.recipesById, { placardPerso: state.placardPerso, ajouts: state.ajouts }),
      };
    }
    return memo.lines;
  }

  const categoryOrder = (state = store.state) => resolveCategoryOrder(state.ordreRayons, data.categories);

  const sections = (state = store.state) =>
    buildSections(lines(state), { categoryOrder: categoryOrder(state), coches: state.coches });

  /** Articles restants à cocher (badge), hors section placard. */
  function remaining(state = store.state) {
    const { done, total } = progress(sections(state));
    return total - done;
  }

  const selectionEntry = (id, state = store.state) => state.selection.find((item) => item.id === id);

  // --- Outils ---------------------------------------------------------------

  const withPurgedChecks = (state) => ({ ...state, coches: purgeChecks(state.coches, lines(state)) });

  /** Applique un changement et propose « Annuler » : on restaure seulement les champs concernés. */
  function undoable(message, change, fields, meta) {
    const before = store.state;
    store.update(change, meta);
    app.toast.show(message, {
      duration: UNDO_DURATION,
      action: {
        label: "Annuler",
        run: () =>
          store.update(
            (state) => ({ ...state, ...Object.fromEntries(fields.map((field) => [field, before[field]])) }),
            { type: "undo" },
          ),
      },
    });
  }

  const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

  // --- Sélection ------------------------------------------------------------

  function setPortions(id, portions) {
    if (portions < 1) {
      removeRecipe(id);
      return;
    }
    const value = clampPortions(portions);
    store.update(
      (state) =>
        withPurgedChecks({
          ...state,
          selection: selectionEntry(id, state)
            ? state.selection.map((item) => (item.id === id ? { ...item, portions: value } : item))
            : [...state.selection, { id, portions: value }],
        }),
      { type: "selection", id },
    );
  }

  /** Ajoute plusieurs recettes à leurs portions par défaut (tirage aléatoire), avec « Annuler ». */
  function addRecipes(ids, message) {
    const added = ids.filter((id) => data.recipesById.has(id) && !selectionEntry(id));
    if (added.length === 0) return;
    undoable(
      message,
      (state) =>
        withPurgedChecks({
          ...state,
          selection: [...state.selection, ...added.map((id) => ({ id, portions: clampPortions(data.recipesById.get(id).portions) }))],
        }),
      ["selection", "coches"],
      { type: "selection" },
    );
  }

  function removeRecipe(id) {
    const recipe = data.recipesById.get(id);
    undoable(
      `Retirée de la liste : ${recipe ? recipe.titre : id}`,
      (state) => withPurgedChecks({ ...state, selection: state.selection.filter((item) => item.id !== id) }),
      ["selection", "coches"],
      { type: "selection", id },
    );
  }

  // --- Liste ----------------------------------------------------------------

  function toggleCheck(key, checked) {
    const line = lines().find((candidate) => candidate.key === key);
    if (!line) return;
    if (line.ajout) {
      store.update(
        (state) => ({ ...state, ajouts: state.ajouts.map((item) => (item.id === line.id ? { ...item, coche: checked } : item)) }),
        { type: "check", key },
      );
    } else {
      store.update((state) => ({ ...state, coches: setChecked(state.coches, line, checked) }), { type: "check", key });
    }
  }

  function uncheckAll() {
    undoable(
      "Tous les articles sont décochés",
      (state) => ({ ...state, coches: {}, ajouts: state.ajouts.map((item) => ({ ...item, coche: false })) }),
      ["coches", "ajouts"],
      { type: "list" },
    );
  }

  function clearList() {
    undoable(
      "Liste vidée",
      (state) => ({ ...state, selection: [], ajouts: [], coches: {} }),
      ["selection", "ajouts", "coches"],
      { type: "list" },
    );
  }

  function addManual({ nom, quantite, categorie }) {
    const item = {
      id: newId(),
      nom: nom.trim().replace(/\s+/g, " "),
      quantite: quantite.trim(),
      categorie: data.categoriesById.has(categorie) ? categorie : "autre",
      coche: false,
    };
    store.update((state) => ({ ...state, ajouts: [...state.ajouts, item] }), { type: "list" });
    app.toast.show(`Ajouté à la liste : ${item.nom}`);
  }

  function removeManual(id) {
    const item = store.state.ajouts.find((candidate) => candidate.id === id);
    undoable(
      `Supprimé de la liste : ${item ? item.nom : ""}`,
      (state) => ({ ...state, ajouts: state.ajouts.filter((candidate) => candidate.id !== id) }),
      ["ajouts"],
      { type: "list" },
    );
  }

  function setHideChecked(hide) {
    store.update((state) => ({ ...state, masquerCoches: hide }), { type: "list" });
  }

  /** « Toujours au placard » (true) ou « Pas au placard » (false). Revenir à la donnée efface la préférence. */
  function setPlacard(key, value) {
    const line = lines().find((candidate) => candidate.key === key);
    if (!line) return;
    store.update((state) => {
      const placardPerso = { ...state.placardPerso };
      if (value === line.placardDonnee) delete placardPerso[key];
      else placardPerso[key] = value;
      return { ...state, placardPerso };
    }, { type: "list" });
    app.toast.show(value ? `${line.nom} : rangé dans « À vérifier au placard »` : `${line.nom} : remis dans la liste de courses`);
  }

  function removePlacardPref(key) {
    store.update((state) => {
      const placardPerso = { ...state.placardPerso };
      delete placardPerso[key];
      return { ...state, placardPerso };
    }, { type: "settings" });
  }

  async function copyList() {
    const text = shoppingListText(sections(), data.categories);
    if (!text) {
      app.toast.show("Rien à copier : tous les articles sont cochés");
      return;
    }
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Liste de courses", text });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
        // Partage refusé ou indisponible : on passe au presse-papiers.
      }
    }
    if (await writeClipboard(text)) app.toast.show("Liste copiée");
    else app.toast.show("Impossible de copier la liste sur cet appareil");
  }

  // --- Recette --------------------------------------------------------------

  // Sans barre d'adresse (PWA installée), seul moyen de récupérer l'adresse de la page.
  async function copyPageLink() {
    if (await writeClipboard(location.href)) app.toast.show("Lien copié");
    else app.toast.show("Impossible de copier le lien sur cet appareil");
  }

  function toggleStep(recipeId, index, done) {
    store.update((state) => {
      const current = new Set(state.etapesFaites[recipeId] ?? []);
      if (done) current.add(index);
      else current.delete(index);
      const etapesFaites = { ...state.etapesFaites };
      if (current.size > 0) etapesFaites[recipeId] = [...current].sort((a, b) => a - b);
      else delete etapesFaites[recipeId];
      return { ...state, etapesFaites };
    }, { type: "steps", id: recipeId });
  }

  function resetSteps(recipeId) {
    store.update((state) => {
      const etapesFaites = { ...state.etapesFaites };
      delete etapesFaites[recipeId];
      return { ...state, etapesFaites };
    }, { type: "steps", id: recipeId });
  }

  // --- Réglages -------------------------------------------------------------

  function moveCategory(id, delta) {
    const order = categoryOrder();
    const from = order.indexOf(id);
    const to = from + delta;
    if (from === -1 || to < 0 || to >= order.length) return;
    [order[from], order[to]] = [order[to], order[from]];
    store.update((state) => ({ ...state, ordreRayons: order }), { type: "settings" });
  }

  function resetCategoryOrder() {
    store.update((state) => ({ ...state, ordreRayons: [] }), { type: "settings" });
    app.toast.show("Ordre des rayons rétabli");
  }

  function eraseAll() {
    const fields = Object.keys(defaultState());
    undoable("Données de l'app effacées sur cet appareil", () => defaultState(), fields, { type: "reset" });
  }

  return {
    lines,
    sections,
    categoryOrder,
    remaining,
    selectionEntry,
    setPortions,
    addRecipes,
    removeRecipe,
    toggleCheck,
    uncheckAll,
    clearList,
    addManual,
    removeManual,
    setHideChecked,
    setPlacard,
    removePlacardPref,
    copyList,
    copyPageLink,
    toggleStep,
    resetSteps,
    moveCategory,
    resetCategoryOrder,
    eraseAll,
  };
}

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Contexte non sécurisé ou permission refusée : ancienne méthode.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}
