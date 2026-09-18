// Écran « Fiche recette » (#/recette/:id) : portions, ingrédients, étapes, minuteurs, écran allumé.

import { portionsUnit, recipeIngredientGroups } from "../domain/scale.js";
import { isHttpUrl, totalTime } from "../domain/text.js";
import { formatDuration } from "../domain/units.js";
import { DIFFICULTIES, TYPES, portionsText, tagLabel } from "../labels.js";
import { href } from "../router.js";
import { html, icon } from "../ui/dom.js";
import { setWakeLock, wakeLockSupported } from "../ui/wakelock.js";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  SECTION_TITLE,
  SWITCH,
  container,
  emptyState,
  recipePhoto,
  stepper,
  viewTitle,
} from "./parts.js";

export function recipeView(app, { id }) {
  const { data, actions, store } = app;
  const recipe = data.recipesById.get(id);

  if (!recipe) {
    return {
      title: "Recette introuvable",
      render: () =>
        container(html`${viewTitle("Recette introuvable")}
          ${emptyState({
            iconName: "journal-bookmark",
            title: "Cette recette n'existe pas ou a été retirée",
            actionHref: href.recipes(),
            actionLabel: "Voir les recettes",
          })}`),
    };
  }

  const unit = portionsUnit(recipe);
  let portions = actions.selectionEntry(recipe.id)?.portions ?? recipe.portions;
  let wakeLockOn = false;

  function timeCards() {
    const items = [
      ["Préparation", recipe.temps.preparation],
      ["Cuisson", recipe.temps.cuisson],
      ["Repos", recipe.temps.repos],
    ].filter(([, minutes]) => minutes > 0);
    items.push(["Total", totalTime(recipe)]);
    return html`<dl class="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
      ${items.map(
        ([label, minutes]) => html`<div class="rounded-xl bg-soft px-3 py-2">
          <dt class="text-xs text-ink-soft">${label}</dt>
          <dd class="font-semibold tabular-nums">${formatDuration(minutes)}</dd>
        </div>`,
      )}
      <div class="rounded-xl bg-soft px-3 py-2">
        <dt class="text-xs text-ink-soft">Difficulté</dt>
        <dd class="font-semibold">${DIFFICULTIES[recipe.difficulte] ?? recipe.difficulte}</dd>
      </div>
    </dl>`;
  }

  function portionsBlock() {
    const entry = actions.selectionEntry(recipe.id);
    let button;
    if (!entry) {
      button = html`<button type="button" class="${BUTTON_PRIMARY} w-full sm:w-auto" data-action="list-add" data-focus="list-main">${icon("plus-lg", "size-4")} Ajouter à la liste</button>`;
    } else if (entry.portions !== portions) {
      button = html`<button type="button" class="${BUTTON_PRIMARY} w-full sm:w-auto" data-action="list-update" data-focus="list-main">${icon("arrow-counterclockwise", "size-4")} Mettre à jour la liste</button>`;
    } else {
      button = html`<button type="button" class="${BUTTON_SECONDARY} w-full sm:w-auto" data-action="list-remove" data-focus="list-main">${icon("trash3", "size-4")} Retirer de la liste</button>`;
    }
    return html`<section class="mt-6 flex flex-col gap-3 rounded-xl border border-line p-4" aria-labelledby="portions-title">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 id="portions-title" class="${SECTION_TITLE}">Portions</h2>
        <div class="w-full min-[400px]:w-56">
          ${stepper({
            id: recipe.id,
            value: portions,
            unitText: portionsText(portions, unit).replace(/^\d+ /, ""),
            label: "Nombre de portions",
            decAction: "portions-dec",
            incAction: "portions-inc",
          })}
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        ${button}
        <p class="text-sm text-ink-soft">
          ${entry ? `Dans ta liste : ${portionsText(entry.portions, unit)}` : "Pas encore dans ta liste"}
        </p>
      </div>
    </section>`;
  }

  function ingredientsBlock() {
    const groups = recipeIngredientGroups(recipe, portions);
    return html`<section class="mt-8" aria-labelledby="ingredients-title">
      <h2 id="ingredients-title" class="${SECTION_TITLE}">Ingrédients</h2>
      ${groups.map(
        (group) => html`
          ${group.groupe ? html`<h3 class="mt-4 text-sm font-semibold tracking-wide text-ink-soft uppercase">${group.groupe}</h3>` : ""}
          <ul class="mt-2 divide-y divide-line border-y border-line">
            ${group.ingredients.map(
              (ingredient) => html`<li class="flex items-baseline justify-between gap-4 py-2.5">
                <span class="min-w-0">
                  <span>${ingredient.nom}</span>
                  ${ingredient.optionnel ? html`<span class="ml-1 rounded-full bg-soft px-2 py-0.5 text-xs text-ink-soft">facultatif</span>` : ""}
                  ${ingredient.precision ? html`<span class="block text-sm text-ink-soft">${ingredient.precision}</span>` : ""}
                </span>
                ${ingredient.quantiteAffichee
                  ? html`<span class="shrink-0 text-right font-medium whitespace-nowrap tabular-nums">${ingredient.quantiteAffichee}</span>`
                  : html`<span class="shrink-0 text-right text-sm whitespace-nowrap text-ink-soft">au goût</span>`}
              </li>`,
            )}
          </ul>`,
      )}
    </section>`;
  }

  function stepsBlock() {
    const done = new Set(store.state.etapesFaites[recipe.id] ?? []);
    return html`<section class="mt-8" aria-labelledby="steps-title">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 id="steps-title" class="${SECTION_TITLE}">Étapes</h2>
        ${done.size > 0
          ? html`<button type="button" class="${BUTTON_SECONDARY}" data-action="steps-reset" data-focus="steps-reset">${icon("arrow-counterclockwise", "size-4")} Recommencer</button>`
          : ""}
      </div>
      ${wakeLockSupported
        ? html`<label class="mt-3 flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl bg-soft px-4 py-2">
            <span class="flex items-center gap-2 text-sm">${icon("lightbulb", "size-4 text-ink-soft")} Garder l'écran allumé</span>
            <input type="checkbox" role="switch" class="${SWITCH}" data-change="wakelock" data-focus="wakelock" ${wakeLockOn ? "checked" : ""}>
          </label>`
        : ""}
      <ol class="mt-3 flex flex-col gap-2">
        ${recipe.etapes.map((step, index) => {
          const isDone = done.has(index);
          return html`<li class="${isDone ? "flex items-start gap-2 rounded-xl border border-line bg-soft p-2" : "flex items-start gap-2 rounded-xl border border-line bg-page p-2"}">
            <label class="flex min-h-11 flex-1 cursor-pointer items-start gap-3 rounded-lg p-2">
              <input type="checkbox" class="mt-1 size-5 shrink-0 accent-accent" data-change="step" data-index="${index}" data-focus="step:${index}" ${isDone ? "checked" : ""}>
              <span class="${isDone ? "text-ink-faint line-through" : ""}">
                <span class="font-semibold tabular-nums">${index + 1}.</span> ${step.texte}
              </span>
            </label>
            ${step.minuteur
              ? html`<button type="button" data-action="timer" data-index="${index}" data-focus="timer-start:${index}"
                  class="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line bg-page px-3 text-sm font-medium tabular-nums transition-colors hover:bg-soft"
                  aria-label="Lancer un minuteur de ${formatDuration(step.minuteur)} pour l'étape ${index + 1}">
                  ${icon("stopwatch", "size-4 text-accent")} ${formatDuration(step.minuteur)}
                </button>`
              : ""}
          </li>`;
        })}
      </ol>
    </section>`;
  }

  function render() {
    const type = TYPES[recipe.type];
    return container(html`
      <a href="${href.recipes()}" class="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm text-ink-soft hover:text-ink" data-focus="back">
        ${icon("arrow-left", "size-4")} Recettes
      </a>
      <div class="mt-2">${recipePhoto(app, recipe, true)}</div>
      <header class="mt-5">
        ${type ? html`<p class="flex items-center gap-1.5 text-sm text-ink-soft">${icon(type.icon, "size-4")} ${type.label}</p>` : ""}
        <div class="mt-1">${viewTitle(recipe.titre)}</div>
        ${recipe.description ? html`<p class="mt-2 text-ink-soft">${recipe.description}</p>` : ""}
        ${timeCards()}
        ${recipe.tags.length > 0
          ? html`<ul class="mt-3 flex flex-wrap gap-2" aria-label="Tags">
              ${recipe.tags.map((tag) => html`<li class="rounded-full border border-line px-3 py-1 text-xs text-ink-soft">${tagLabel(tag)}</li>`)}
            </ul>`
          : ""}
        ${recipe.source
          ? html`<p class="mt-3 text-sm text-ink-soft">Source :
              ${isHttpUrl(recipe.source)
                ? html`<a class="text-accent underline-offset-2 hover:underline" href="${recipe.source.trim()}" target="_blank" rel="noopener noreferrer">${recipe.source.trim()}</a>`
                : recipe.source}
            </p>`
          : ""}
      </header>
      ${portionsBlock()}
      ${ingredientsBlock()}
      ${stepsBlock()}
      ${recipe.notes
        ? html`<section class="mt-8 rounded-xl bg-soft p-4" aria-labelledby="notes-title">
            <h2 id="notes-title" class="${SECTION_TITLE}">Notes</h2>
            <p class="mt-1 whitespace-pre-line">${recipe.notes}</p>
          </section>`
        : ""}
      <p class="mt-10 text-center">
        <button type="button" class="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm text-ink-soft hover:text-ink" data-action="copy-link" data-focus="copy-link">
          ${icon("link-45deg", "size-4")} Copier le lien de la recette
        </button>
      </p>
    `);
  }

  async function handle(event) {
    const target = event.target;
    if (event.type === "change") {
      if (target.matches('[data-change="step"]')) {
        actions.toggleStep(recipe.id, Number(target.dataset.index), target.checked);
      } else if (target.matches('[data-change="wakelock"]')) {
        wakeLockOn = target.checked;
        const ok = await setWakeLock(wakeLockOn);
        if (!ok) {
          wakeLockOn = false;
          target.checked = false;
          app.toast.show("Impossible de garder l'écran allumé sur cet appareil");
        }
      }
      return;
    }
    if (event.type !== "click") return;
    const button = target.closest("[data-action]");
    if (!button) return;
    const entry = actions.selectionEntry(recipe.id);

    switch (button.dataset.action) {
      case "portions-inc":
      case "portions-dec": {
        portions = Math.min(99, Math.max(1, portions + (button.dataset.action === "portions-inc" ? 1 : -1)));
        app.rerender();
        break;
      }
      case "list-add":
        actions.setPortions(recipe.id, portions);
        app.toast.show("Recette ajoutée à la liste", { action: { label: "Voir la liste", run: () => app.navigate(href.list()) } });
        break;
      case "list-update":
        actions.setPortions(recipe.id, portions);
        app.toast.show(`Liste mise à jour : ${portionsText(portions, unit)}`);
        break;
      case "list-remove":
        if (entry) actions.removeRecipe(recipe.id);
        break;
      case "steps-reset":
        app.nextFocus = "step:0";
        actions.resetSteps(recipe.id);
        break;
      case "copy-link":
        actions.copyPageLink();
        break;
      case "timer": {
        const index = Number(button.dataset.index);
        app.timers.start({ label: `${recipe.titre} · étape ${index + 1}`, minutes: recipe.etapes[index].minuteur });
        break;
      }
      default:
        break;
    }
  }

  function destroy() {
    if (wakeLockOn) setWakeLock(false);
  }

  return { title: recipe.titre, render, handle, destroy };
}
