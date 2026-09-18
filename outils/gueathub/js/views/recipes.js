// Écran « Recettes » (#/) : recherche, filtres, tri, grille de cartes.

import { filterRecipes, pickRandom, sortRecipes, totalTime } from "../domain/text.js";
import { formatDuration } from "../domain/units.js";
import { TYPES, plural, portionsText, tagLabel } from "../labels.js";
import { href } from "../router.js";
import { portionsUnit } from "../domain/scale.js";
import { html, icon, renderInto } from "../ui/dom.js";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, SECTION_TITLE, chip, container, recipePhoto, stepper } from "./parts.js";

// Critères conservés pendant la visite (retour depuis une fiche recette).
const criteria = { query: "", type: null, tags: new Set(), selectedOnly: false, sort: "alpha" };
// Nombre de recettes du tirage aléatoire, conservé pendant la visite.
const RANDOM_MAX = 14;
let randomCount = 5;

export function recipesView(app) {
  const { data, actions, store } = app;

  const presentTypes = Object.keys(TYPES).filter((type) => data.recipes.some((recipe) => recipe.type === type));
  const presentTags = [...new Set(data.recipes.flatMap((recipe) => recipe.tags))].sort((a, b) =>
    tagLabel(a).localeCompare(tagLabel(b), "fr"),
  );

  function visibleRecipes() {
    const selectedIds = new Set(store.state.selection.map((item) => item.id));
    return sortRecipes(
      filterRecipes(data.recipes, { ...criteria, tags: [...criteria.tags], selectedIds }),
      criteria.sort,
    );
  }

  function filtersBlock() {
    const selectedCount = store.state.selection.length;
    return html`
      ${presentTypes.length > 1
        ? html`<div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label="Type de recette">
            ${chip({ label: "Toutes", pressed: criteria.type === null, action: "type", value: "", focus: "type:" })}
            ${presentTypes.map((type) =>
              chip({ label: TYPES[type].plural, pressed: criteria.type === type, action: "type", value: type, focus: `type:${type}` }),
            )}
          </div>`
        : ""}
      <div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label="Filtres">
        ${chip({ label: "Sélectionnées", pressed: criteria.selectedOnly, action: "selected", focus: "selected", count: selectedCount })}
        ${presentTags.map((tag) =>
          chip({ label: tagLabel(tag), pressed: criteria.tags.has(tag), action: "tag", value: tag, focus: `tag:${tag}` }),
        )}
      </div>`;
  }

  function card(recipe) {
    const entry = actions.selectionEntry(recipe.id);
    const type = TYPES[recipe.type];
    return html`<li class="relative flex flex-col overflow-hidden rounded-xl border border-line bg-page">
      ${recipePhoto(app, recipe)}
      <div class="flex flex-1 flex-col gap-3 p-4">
        <div class="flex-1">
          <h2 class="text-base leading-snug font-semibold">
            <a href="${href.recipe(recipe.id)}" data-focus="open:${recipe.id}"
              class="after:absolute after:inset-0 after:rounded-xl hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent">${recipe.titre}</a>
          </h2>
          <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
            <span class="inline-flex items-center gap-1.5">${icon("clock", "size-4")}<span class="tabular-nums">${formatDuration(totalTime(recipe))}</span></span>
            ${type ? html`<span>${type.label}</span>` : ""}
          </p>
        </div>
        <div class="relative z-10">
          ${entry
            ? stepper({
                id: recipe.id,
                value: entry.portions,
                unitText: portionsText(entry.portions, portionsUnit(recipe)).replace(/^\d+ /, ""),
                label: `Portions de « ${recipe.titre} » dans la liste`,
                decAction: "dec",
                incAction: "inc",
                decLabel: entry.portions <= 1 ? "Retirer de la liste" : "Retirer une portion",
              })
            : html`<button type="button" class="${BUTTON_PRIMARY} w-full" data-action="add" data-id="${recipe.id}" data-focus="add:${recipe.id}" aria-label="Ajouter « ${recipe.titre} » à la liste">
                ${icon("plus-lg", "size-4")} Ajouter
              </button>`}
        </div>
      </div>
    </li>`;
  }

  function resultsBlock() {
    const recipes = visibleRecipes();
    if (data.recipes.length === 0) {
      return html`<p class="mt-6 text-ink-soft">Aucune recette pour l'instant.</p>`;
    }
    if (recipes.length === 0) {
      return html`<div class="mt-6 flex flex-col items-start gap-3 rounded-xl border border-dashed border-line p-6">
        <p>Aucune recette ne correspond à ta recherche.</p>
        <button type="button" class="${BUTTON_SECONDARY}" data-action="clear-filters" data-focus="clear-filters">Effacer la recherche et les filtres</button>
      </div>`;
    }
    return html`<ul class="mt-4 grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 lg:grid-cols-3">${recipes.map(card)}</ul>`;
  }

  /** Recettes affichées (filtres compris) qui ne sont pas encore dans la liste. */
  const randomCandidates = () => visibleRecipes().filter((recipe) => !actions.selectionEntry(recipe.id));

  function randomBlock() {
    if (data.recipes.length === 0) return "";
    const available = randomCandidates().length;
    return html`<section class="mt-8 flex flex-col gap-3 rounded-xl border border-line p-4" aria-labelledby="random-title">
      <div>
        <h2 id="random-title" class="${SECTION_TITLE}">Sélection aléatoire pour la semaine</h2>
        <p class="mt-1 text-sm text-ink-soft">
          ${available > 0
            ? `Tirage parmi les recettes affichées qui ne sont pas encore dans ta liste (${available}).`
            : "Aucune recette affichée hors de la liste : change les filtres pour tirer au sort."}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="w-full min-[400px]:w-56">
          ${stepper({
            id: "random",
            value: randomCount,
            unitText: randomCount > 1 ? "recettes" : "recette",
            label: "Nombre de recettes à tirer",
            decAction: "random-dec",
            incAction: "random-inc",
            decLabel: "Une recette de moins",
            incLabel: "Une recette de plus",
          })}
        </div>
        <button type="button" class="${BUTTON_PRIMARY} w-full min-[400px]:w-auto" data-action="random" data-focus="random" ${available > 0 ? "" : "disabled"}>
          ${icon("dice-5", "size-4")} Aléatoire
        </button>
      </div>
    </section>`;
  }

  const countText = () => plural(visibleRecipes().length, "recette");

  function render() {
    return container(
      html`<h1 class="sr-only" tabindex="-1" data-view-title>Recettes</h1>
      <div class="flex flex-col gap-3">
        <label class="relative block">
          <span class="sr-only">Rechercher une recette ou un ingrédient</span>
          <span class="pointer-events-none absolute inset-y-0 left-4 grid place-items-center text-ink-soft">${icon("search", "size-4")}</span>
          <input type="search" value="${criteria.query}" data-input="search" data-focus="search" autocomplete="off" enterkeyhint="search"
            placeholder="Recette ou ingrédient"
            class="min-h-12 w-full rounded-full border border-line bg-soft pr-4 pl-11 text-base text-ink placeholder:text-ink-faint">
        </label>
        <div data-region="filters" class="flex flex-col gap-2">${filtersBlock()}</div>
        <div class="flex items-center justify-between gap-3">
          <p data-region="count" class="text-sm text-ink-soft" aria-live="polite">${countText()}</p>
          <label class="flex items-center gap-2 text-sm text-ink-soft">
            Trier
            <select data-change="sort" data-focus="sort" class="min-h-11 rounded-full border border-line bg-page px-3 text-sm text-ink">
              <option value="alpha" ${criteria.sort === "alpha" ? "selected" : ""}>De A à Z</option>
              <option value="temps" ${criteria.sort === "temps" ? "selected" : ""}>Temps total</option>
            </select>
          </label>
        </div>
      </div>
      <div data-region="results">${resultsBlock()}</div>
      <div data-region="random">${randomBlock()}</div>`,
      "wide",
    );
  }

  /** Met à jour filtres, compteur et grille sans toucher au champ de recherche. */
  function refresh(root, focusKey) {
    renderInto(root.querySelector('[data-region="filters"]'), filtersBlock(), { focusKey });
    root.querySelector('[data-region="count"]').textContent = countText();
    renderInto(root.querySelector('[data-region="results"]'), resultsBlock(), { focusKey });
    renderInto(root.querySelector('[data-region="random"]'), randomBlock(), { focusKey });
  }

  function handle(event, root) {
    if (event.type === "input" && event.target.matches('[data-input="search"]')) {
      criteria.query = event.target.value;
      refresh(root);
      return;
    }
    if (event.type === "change" && event.target.matches('[data-change="sort"]')) {
      criteria.sort = event.target.value;
      refresh(root);
      return;
    }
    if (event.type !== "click") return;
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, value, id } = button.dataset;

    if (action === "type") criteria.type = value || null;
    else if (action === "tag") criteria.tags.has(value) ? criteria.tags.delete(value) : criteria.tags.add(value);
    else if (action === "selected") criteria.selectedOnly = !criteria.selectedOnly;
    else if (action === "clear-filters") {
      Object.assign(criteria, { query: "", type: null, selectedOnly: false });
      criteria.tags.clear();
      root.querySelector('[data-input="search"]').value = "";
      refresh(root);
      root.querySelector('[data-input="search"]').focus();
      return;
    } else if (action === "random-inc" || action === "random-dec") {
      randomCount = Math.min(RANDOM_MAX, Math.max(1, randomCount + (action === "random-inc" ? 1 : -1)));
      refresh(root, button.dataset.focus);
      return;
    } else if (action === "random") {
      const picked = pickRandom(randomCandidates(), randomCount);
      app.nextFocus = "random";
      actions.addRecipes(
        picked.map((recipe) => recipe.id),
        `${picked.length > 1 ? `${picked.length} recettes ajoutées` : "1 recette ajoutée"} à la liste : ${picked.map((recipe) => recipe.titre).join(", ")}`,
      );
      return;
    } else if (action === "add") {
      app.nextFocus = `inc:${id}`;
      actions.setPortions(id, data.recipesById.get(id).portions);
      return;
    } else if (action === "inc" || action === "dec") {
      const entry = actions.selectionEntry(id);
      if (!entry) return;
      const next = entry.portions + (action === "inc" ? 1 : -1);
      if (next < 1) app.nextFocus = `add:${id}`;
      actions.setPortions(id, next);
      return;
    } else return;
    refresh(root);
  }

  /** Après un changement d'état : seules les régions dépendantes sont redessinées. */
  function update(meta, root) {
    const focusKey = app.nextFocus ?? undefined;
    app.nextFocus = null;
    refresh(root, focusKey);
    return true;
  }

  return { title: "Recettes", render, handle, update };
}
