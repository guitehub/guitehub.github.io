// Écran « Menu » (#/selection) : les recettes choisies pour la période, avec leurs portions.

import { portionsUnit } from "../domain/scale.js";
import { totalTime } from "../domain/text.js";
import { formatDuration } from "../domain/units.js";
import { TYPES, plural, portionsText } from "../labels.js";
import { href } from "../router.js";
import { html, icon } from "../ui/dom.js";
import { BUTTON_SECONDARY, ICON_BUTTON, container, emptyState, recipePhoto, stepper, viewTitle } from "./parts.js";

export function selectionView(app) {
  const { data, actions, store } = app;

  function item(entry) {
    const recipe = data.recipesById.get(entry.id);
    const type = TYPES[recipe.type];
    return html`<li class="overflow-hidden rounded-xl border border-line bg-page" data-item="${recipe.id}">
      <div class="flex gap-3 p-3">
        <div class="w-28 shrink-0 self-start overflow-hidden rounded-lg sm:w-40">${recipePhoto(app, recipe)}</div>
        <div class="min-w-0 flex-1">
          <h2 class="leading-snug font-semibold">
            <a href="${href.recipe(recipe.id)}" class="hover:underline" data-focus="title:${recipe.id}">${recipe.titre}</a>
          </h2>
          ${recipe.description ? html`<p class="mt-1 text-sm text-ink-soft">${recipe.description}</p>` : ""}
          <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
            <span class="inline-flex items-center gap-1">${icon("clock", "size-3.5")}<span class="tabular-nums">${formatDuration(totalTime(recipe))}</span></span>
            ${type ? html`<span>${type.label}</span>` : ""}
          </p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2 border-t border-line p-3">
        <div class="w-full sm:w-auto sm:max-w-64 sm:flex-1">
          ${stepper({
            id: recipe.id,
            value: entry.portions,
            unitText: portionsText(entry.portions, portionsUnit(recipe)).replace(/^\d+ /, ""),
            label: `Portions de « ${recipe.titre} » dans la liste`,
            decAction: "dec",
            incAction: "inc",
            decLabel: entry.portions <= 1 ? "Retirer de la liste" : "Retirer une portion",
          })}
        </div>
        <a href="${href.recipe(recipe.id)}" class="${BUTTON_SECONDARY} flex-1 sm:ml-auto sm:flex-none" data-focus="open:${recipe.id}" aria-label="Voir la recette « ${recipe.titre} »">
          ${icon("journal-bookmark", "size-4")} Voir la recette
        </a>
        <button type="button" class="${ICON_BUTTON}" data-action="remove" data-id="${recipe.id}" data-focus="remove:${recipe.id}" aria-label="Retirer « ${recipe.titre} » de la liste">
          ${icon("trash3", "size-4")}
        </button>
      </div>
    </li>`;
  }

  function render() {
    const { selection } = store.state;
    if (selection.length === 0) {
      return container(html`${viewTitle("Menu")}
        ${emptyState({
          iconName: "journal-bookmark",
          title: "Ton menu est vide.",
          text: "Choisis des recettes pour le composer.",
          actionHref: href.recipes(),
          actionLabel: "Voir les recettes",
        })}`);
    }
    return container(html`${viewTitle("Menu")}
      <p class="mt-1 text-sm text-ink-soft">${plural(selection.length, "recette")} pour la liste de courses</p>
      <ul class="mt-4 flex flex-col gap-3">${selection.map(item)}</ul>`);
  }

  /** Focus de repli quand une recette quitte la liste : la voisine, sinon le lien vers les recettes. */
  function focusAfterRemoval(button) {
    const current = button.closest("li");
    const neighbour = current.nextElementSibling ?? current.previousElementSibling;
    app.fallbackFocus = neighbour ? `remove:${neighbour.dataset.item}` : "empty-action";
  }

  function handle(event) {
    if (event.type !== "click") return;
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "remove") {
      focusAfterRemoval(button);
      actions.removeRecipe(id);
    } else if (action === "inc" || action === "dec") {
      const entry = actions.selectionEntry(id);
      if (!entry) return;
      const next = entry.portions + (action === "inc" ? 1 : -1);
      if (next < 1) focusAfterRemoval(button);
      actions.setPortions(id, next);
    }
  }

  return { title: "Menu", render, handle };
}
