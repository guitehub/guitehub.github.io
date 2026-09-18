// Écran « Liste de courses » (#/liste).

import { PLACARD_LABEL, progress } from "../domain/aggregate.js";
import { portionsUnit } from "../domain/scale.js";
import { portionsText } from "../labels.js";
import { href } from "../router.js";
import { html, icon, renderInto } from "../ui/dom.js";
import {
  BUTTON_COMPACT,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  ICON_BUTTON,
  INPUT,
  SWITCH,
  container,
  emptyState,
  stepper,
  viewTitle,
} from "./parts.js";

// Section placard dépliée ou non : conservé pendant la visite.
let placardOpen = false;
// Rayons terminés (tout coché) que l'utilisateur a dépliés.
const doneOpen = new Set();

export function listView(app) {
  const { data, actions, store } = app;

  function lineItem(line) {
    const checked = line.state === "checked";
    return html`<li class="flex items-stretch" data-line="${line.key}">
      <label class="flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-3 py-2 pl-4">
        <input type="checkbox" class="size-5 shrink-0 accent-accent" data-change="check" data-key="${line.key}" data-focus="check:${line.key}" ${checked ? "checked" : ""}>
        <span class="${checked ? "min-w-0 flex-1 text-ink-faint line-through" : "min-w-0 flex-1"}">
          <span class="break-words">${line.nom}</span>
          ${line.optionnel ? html`<span class="ml-1 text-xs text-ink-soft no-underline">facultatif</span>` : ""}
          ${line.ajout ? html`<span class="ml-1 rounded-full bg-soft px-2 py-0.5 text-xs text-ink-soft">ajout</span>` : ""}
          ${line.state === "stale" ? html`<span class="block text-xs text-accent">quantité modifiée</span>` : ""}
        </span>
        ${line.quantite
          ? html`<span class="${checked ? "max-w-[45%] shrink-0 text-right text-ink-faint tabular-nums line-through" : "max-w-[45%] shrink-0 text-right font-medium tabular-nums"}">${line.quantite}</span>`
          : ""}
      </label>
      ${line.ajout
        ? html`<button type="button" class="${ICON_BUTTON} self-center" data-action="remove-manual" data-id="${line.id}" data-focus="remove:${line.key}" aria-label="Supprimer : ${line.nom}">
            ${icon("trash3", "size-4")}
          </button>`
        : html`<button type="button" class="${ICON_BUTTON} self-center" data-action="details" data-key="${line.key}" data-focus="details:${line.key}" aria-label="Détails : ${line.nom}">
            ${icon("three-dots-vertical", "size-4")}
          </button>`}
    </li>`;
  }

  const visible = (lines) => (store.state.masquerCoches ? lines.filter((line) => line.state !== "checked") : lines);

  function sectionBlock(section) {
    const category = data.categoriesById.get(section.categorie);
    const total = section.lines.length;
    const done = section.lines.filter((line) => line.state === "checked").length;
    const count = html`<span class="font-normal tabular-nums normal-case" aria-label="${done} sur ${total} cochés">${done}/${total}</span>`;

    // Rayon terminé : replié sur une ligne, dépliable pour décocher.
    if (done === total) {
      return html`<section class="mt-3" aria-labelledby="rayon-${section.categorie}" data-section="${section.categorie}">
        <details class="group rounded-xl border border-line" data-done="${section.categorie}" ${doneOpen.has(section.categorie) ? "open" : ""}>
          <summary class="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-4 text-sm font-semibold tracking-wide text-ink-faint uppercase [&::-webkit-details-marker]:hidden" data-focus="section:${section.categorie}">
            ${icon(category.icone, "size-4")} <span id="rayon-${section.categorie}" class="flex-1 line-through">${category.libelle}</span>
            ${icon("check-lg", "size-4 text-accent")} ${count}
            ${icon("chevron-down", "size-4 transition-transform group-open:rotate-180")}
          </summary>
          <ul class="divide-y divide-line border-t border-line">${section.lines.map(lineItem)}</ul>
        </details>
      </section>`;
    }

    doneOpen.delete(section.categorie);
    return html`<section class="mt-6" aria-labelledby="rayon-${section.categorie}" data-section="${section.categorie}">
      <h2 id="rayon-${section.categorie}" class="flex items-center gap-2 px-1 text-sm font-semibold tracking-wide text-ink-soft uppercase">
        ${icon(category.icone, "size-4")} <span class="flex-1">${category.libelle}</span>
        ${count}
      </h2>
      <ul class="mt-2 divide-y divide-line rounded-xl border border-line bg-page">${visible(section.lines).map(lineItem)}</ul>
    </section>`;
  }

  function placardBlock(lines) {
    if (lines.length === 0) return "";
    const done = lines.filter((line) => line.state === "checked").length;
    const shown = visible(lines);
    return html`<details class="group mt-6 rounded-xl border border-line bg-page" data-placard ${placardOpen ? "open" : ""}>
      <summary class="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-xl px-4 font-semibold [&::-webkit-details-marker]:hidden" data-focus="placard">
        ${icon("basket3", "size-4 text-ink-soft")}
        <span class="flex-1">${PLACARD_LABEL}</span>
        <span class="text-sm font-normal text-ink-soft tabular-nums">${done}/${lines.length}</span>
        ${icon("chevron-down", "size-4 text-ink-soft transition-transform group-open:rotate-180")}
      </summary>
      <p class="border-t border-line px-4 py-2 text-sm text-ink-soft">Des basiques qu'on a souvent chez soi : vérifie avant de partir.</p>
      ${shown.length > 0
        ? html`<ul class="divide-y divide-line border-t border-line">${shown.map(lineItem)}</ul>`
        : html`<p class="border-t border-line px-4 py-3 text-sm text-ink-soft">Tout est vérifié.</p>`}
    </details>`;
  }

  function progressBlock(sections) {
    const { done, total } = progress({ sections });
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    return html`<div class="flex items-center gap-3">
      <div class="h-2 flex-1 overflow-hidden rounded-full bg-soft" aria-hidden="true">
        <div class="h-full rounded-full bg-accent transition-[width] duration-300" style="width: ${percent}%"></div>
      </div>
      <p class="text-sm font-semibold tabular-nums" aria-live="polite">
        ${done} / ${total}<span class="sr-only"> articles cochés</span>
      </p>
    </div>`;
  }

  function manualForm() {
    const state = store.state;
    const order = actions.categoryOrder(state);
    return html`<form class="mt-8 rounded-xl border border-line bg-soft p-4" data-submit="add-manual" aria-labelledby="manual-title">
      <h2 id="manual-title" class="font-semibold">Ajouter un article</h2>
      <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_9rem]">
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-ink-soft">Article</span>
          <input name="nom" required maxlength="80" autocomplete="off" class="${INPUT}" data-focus="manual-nom" placeholder="ex. éponges">
        </label>
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-ink-soft">Quantité <span class="text-ink-faint">(facultatif)</span></span>
          <input name="quantite" maxlength="40" autocomplete="off" class="${INPUT}" data-focus="manual-quantite" placeholder="ex. 2 paquets">
        </label>
        <label class="flex flex-col gap-1 text-sm sm:col-span-2">
          <span class="text-ink-soft">Rayon</span>
          <select name="categorie" class="${INPUT}" data-focus="manual-categorie">
            ${order.map((id) => html`<option value="${id}" ${id === "autre" ? "selected" : ""}>${data.categoriesById.get(id).libelle}</option>`)}
          </select>
        </label>
      </div>
      <button type="submit" class="${BUTTON_PRIMARY} mt-4 w-full sm:w-auto" data-focus="manual-submit">${icon("plus-lg", "size-4")} Ajouter</button>
    </form>`;
  }

  function render() {
    const state = store.state;
    if (state.selection.length === 0 && state.ajouts.length === 0) {
      return container(html`${viewTitle("Liste de courses")}
        ${emptyState({
          iconName: "card-checklist",
          title: "Ta liste est vide.",
          text: "Choisis des recettes pour la remplir.",
          actionHref: href.recipes(),
          actionLabel: "Voir les recettes",
        })}
        ${manualForm()}`);
    }

    const { sections, placard } = actions.sections(state);
    return container(html`
      ${viewTitle("Liste de courses")}
      <div class="mt-4" data-region="progress">${progressBlock(sections)}</div>

      ${state.selection.length > 0
        ? html`<ul class="mt-4 flex flex-wrap gap-2" aria-label="Recettes de la liste">
            ${state.selection.map((item) => {
              const recipe = data.recipesById.get(item.id);
              return html`<li>
                <button type="button" data-action="recipe-sheet" data-id="${item.id}" data-focus="recipe:${item.id}"
                  class="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-page px-4 text-sm transition-colors hover:bg-soft"
                  aria-label="${recipe.titre}, ${portionsText(item.portions, portionsUnit(recipe))} : modifier">
                  <span class="font-medium">${recipe.titre}</span>
                  <span class="tabular-nums text-ink-soft">${item.portions}</span>
                </button>
              </li>`;
            })}
          </ul>`
        : ""}

      <div class="mt-4 flex flex-col gap-3 rounded-xl bg-soft p-3">
        <label class="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-1">
          <span class="text-sm">Masquer les articles cochés</span>
          <input type="checkbox" role="switch" class="${SWITCH}" data-change="hide-checked" data-focus="hide-checked" ${state.masquerCoches ? "checked" : ""}>
        </label>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button type="button" class="${BUTTON_PRIMARY} col-span-2 sm:col-span-1" data-action="copy" data-focus="copy">${icon("clipboard", "size-4")} Copier la liste</button>
          <button type="button" class="${BUTTON_COMPACT}" data-action="uncheck-all" data-focus="uncheck-all">${icon("arrow-counterclockwise", "size-4")} Tout décocher</button>
          <button type="button" class="${BUTTON_COMPACT}" data-action="clear" data-focus="clear">${icon("trash3", "size-4")} Vider la liste</button>
        </div>
      </div>

      <div data-region="sections">
        ${sections.map(sectionBlock)}
        ${sections.length === 0 && placard.length > 0
          ? html`<p class="mt-6 text-sm text-ink-soft">Tous les ingrédients sont des basiques du placard.</p>`
          : ""}
      </div>
      <div data-region="placard">${placardBlock(placard)}</div>
      ${manualForm()}
    `);
  }

  function openRecipeSheet(id) {
    const recipe = data.recipesById.get(id);
    app.sheet.open({
      title: recipe.titre,
      body: () => {
        const entry = actions.selectionEntry(id);
        if (!entry) return null;
        return html`<div class="flex flex-col gap-4">
          ${stepper({
            id,
            value: entry.portions,
            unitText: portionsText(entry.portions, portionsUnit(recipe)).replace(/^\d+ /, ""),
            label: "Portions dans la liste",
            decAction: "sheet-dec",
            incAction: "sheet-inc",
            prefix: "sheet-",
            decLabel: entry.portions <= 1 ? "Retirer de la liste" : "Retirer une portion",
          })}
          <div class="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
            <a href="${href.recipe(id)}" class="${BUTTON_SECONDARY}" data-action="sheet-open">${icon("journal-bookmark", "size-4")} Voir la recette</a>
            <button type="button" class="${BUTTON_SECONDARY}" data-action="sheet-remove">${icon("trash3", "size-4")} Retirer de la liste</button>
          </div>
        </div>`;
      },
      handle: (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) return;
        const entry = actions.selectionEntry(id);
        const action = button.dataset.action;
        if (action === "sheet-open") app.sheet.close();
        else if (action === "sheet-remove") {
          app.sheet.close();
          actions.removeRecipe(id);
        } else if (entry && (action === "sheet-inc" || action === "sheet-dec")) {
          actions.setPortions(id, entry.portions + (action === "sheet-inc" ? 1 : -1));
        }
      },
    });
  }

  function openDetailsSheet(key) {
    const initial = actions.lines().find((line) => line.key === key);
    app.sheet.open({
      title: initial.nom,
      body: () => {
        const line = actions.lines().find((candidate) => candidate.key === key);
        if (!line) return null;
        return html`<div class="flex flex-col gap-4">
          <p class="text-2xl font-semibold tabular-nums">${line.quantite || "Quantité au goût"}</p>
          ${line.optionnel ? html`<p class="text-sm text-ink-soft">Facultatif dans toutes ses recettes.</p>` : ""}
          <div>
            <h3 class="text-sm font-semibold text-ink-soft">Utilisé dans</h3>
            <ul class="mt-1 divide-y divide-line">
              ${line.sources.map((source) => {
                const recipe = data.recipesById.get(source.recetteId);
                return html`<li class="flex items-baseline justify-between gap-3 py-2">
                  <span>${source.titre}
                    <span class="block text-sm text-ink-soft">${portionsText(source.portions, portionsUnit(recipe))}${source.groupe ? ` · ${source.groupe}` : ""}</span>
                  </span>
                  <span class="shrink-0 tabular-nums">${source.quantiteAffichee || "au goût"}</span>
                </li>`;
              })}
            </ul>
          </div>
          <div class="rounded-xl bg-soft p-3">
            <p class="text-sm text-ink-soft">
              ${line.placard
                ? "Rangé dans « À vérifier au placard » : on l'a normalement chez soi."
                : "Dans la liste de courses."}
            </p>
            <button type="button" class="${BUTTON_SECONDARY} mt-3 w-full" data-action="placard" data-value="${line.placard ? "false" : "true"}" data-focus="placard-toggle">
              ${icon("basket3", "size-4")} ${line.placard ? "Pas au placard" : "Toujours au placard"}
            </button>
          </div>
        </div>`;
      },
      handle: (event) => {
        const button = event.target.closest('[data-action="placard"]');
        if (button) actions.setPlacard(key, button.dataset.value === "true");
      },
    });
  }

  function handle(event, root) {
    const target = event.target;

    if (event.type === "toggle" && target.matches("[data-placard]")) {
      placardOpen = target.open;
      return;
    }
    if (event.type === "toggle" && target.matches("[data-done]")) {
      if (target.open) doneOpen.add(target.dataset.done);
      else doneOpen.delete(target.dataset.done);
      return;
    }
    if (event.type === "submit" && target.matches('[data-submit="add-manual"]')) {
      event.preventDefault();
      const form = new FormData(target);
      const nom = String(form.get("nom") ?? "").trim();
      if (!nom) return;
      app.nextFocus = "manual-nom";
      actions.addManual({ nom, quantite: String(form.get("quantite") ?? ""), categorie: String(form.get("categorie")) });
      return;
    }
    if (event.type === "change") {
      if (target.matches('[data-change="check"]')) {
        // Si la ligne disparaît (articles cochés masqués, rayon terminé replié), le focus passe
        // à la ligne voisine, sinon à l'en-tête du rayon replié.
        const item = target.closest("li");
        const neighbour = item.nextElementSibling ?? item.previousElementSibling;
        const section = target.closest("[data-section]")?.dataset.section;
        app.fallbackFocus = neighbour ? `check:${neighbour.dataset.line}` : section ? `section:${section}` : null;
        actions.toggleCheck(target.dataset.key, target.checked);
      } else if (target.matches('[data-change="hide-checked"]')) {
        actions.setHideChecked(target.checked);
      }
      return;
    }
    if (event.type !== "click") return;
    const button = target.closest("[data-action]");
    if (!button) return;
    switch (button.dataset.action) {
      case "recipe-sheet":
        openRecipeSheet(button.dataset.id);
        break;
      case "details":
        openDetailsSheet(button.dataset.key);
        break;
      case "remove-manual":
        actions.removeManual(button.dataset.id);
        break;
      case "copy":
        actions.copyList();
        break;
      case "uncheck-all":
        actions.uncheckAll();
        break;
      case "clear":
        app.nextFocus = "empty-action";
        actions.clearList();
        break;
      default:
        break;
    }
  }

  /**
   * Cochage : seuls la section concernée, la progression et le placard sont redessinés.
   * Tout autre changement : rendu complet.
   */
  function update(meta, root) {
    const state = store.state;
    if (meta.type !== "check" || state.masquerCoches) return false;
    const { sections, placard } = actions.sections(state);
    const section = sections.find((candidate) => candidate.lines.some((line) => line.key === meta.key));
    const sectionElement = section && root.querySelector(`[data-section="${CSS.escape(section.categorie)}"]`);
    const inPlacard = placard.some((line) => line.key === meta.key);
    if (!sectionElement && !inPlacard) return false;

    const focusKey = `check:${meta.key}`;
    const holder = document.createElement("div");
    if (sectionElement) {
      renderInto(holder, sectionBlock(section));
      sectionElement.replaceWith(holder.firstElementChild);
    } else {
      renderInto(root.querySelector('[data-region="placard"]'), placardBlock(placard));
    }
    renderInto(root.querySelector('[data-region="progress"]'), progressBlock(sections));
    const focusTarget = root.querySelector(`[data-focus="${CSS.escape(focusKey)}"]`);
    if (focusTarget?.checkVisibility()) focusTarget.focus({ preventScroll: true });
    else if (section) root.querySelector(`[data-focus="${CSS.escape(`section:${section.categorie}`)}"]`)?.focus({ preventScroll: true });
    return true;
  }

  return { title: "Liste de courses", render, handle, update };
}
