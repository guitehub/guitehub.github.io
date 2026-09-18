// Morceaux d'interface partagés par les vues. Classes Tailwind toujours écrites en entier.

import { TYPES } from "../labels.js";
import { html, icon } from "../ui/dom.js";

export const BUTTON_PRIMARY =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50";
export const BUTTON_SECONDARY =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-page px-5 text-sm font-medium text-ink transition-colors hover:bg-soft disabled:opacity-50 disabled:hover:bg-page";
export const BUTTON_COMPACT =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-page px-3 text-sm font-medium whitespace-nowrap text-ink transition-colors hover:bg-soft";
export const ICON_BUTTON =
  "grid size-11 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-soft hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent";
export const INPUT =
  "min-h-11 w-full rounded-xl border border-line bg-page px-3 text-base text-ink placeholder:text-ink-faint";
export const SWITCH =
  "relative h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-line transition-colors before:absolute before:top-1 before:left-1 before:size-5 before:rounded-full before:bg-page before:shadow-sm before:transition-transform checked:bg-accent checked:before:translate-x-5";
export const SECTION_TITLE = "text-lg font-semibold";

export const container = (content, width = "narrow") =>
  width === "wide"
    ? html`<div class="mx-auto w-full max-w-6xl px-4 pt-4 pb-8 sm:px-6 sm:pt-6">${content}</div>`
    : html`<div class="mx-auto w-full max-w-2xl px-4 pt-4 pb-8 sm:px-6 sm:pt-6">${content}</div>`;

export const viewTitle = (text) =>
  html`<h1 class="text-2xl font-bold tracking-tight focus:outline-none sm:text-3xl" tabindex="-1" data-view-title>${text}</h1>`;

export function chip({ label, pressed, action, value = "", focus, count = null }) {
  return html`<button type="button" aria-pressed="${pressed ? "true" : "false"}" data-action="${action}" data-value="${value}" data-focus="${focus}"
    class="${pressed
      ? "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-accent bg-accent px-4 text-sm font-medium whitespace-nowrap text-on-accent"
      : "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line bg-page px-4 text-sm font-medium whitespace-nowrap text-ink transition-colors hover:bg-soft"}">
    ${pressed ? icon("check-lg", "size-4") : ""}${label}${count !== null ? html`<span class="tabular-nums opacity-75">${count}</span>` : ""}
  </button>`;
}

/**
 * Compteur de portions « − 6 personnes + ».
 * `id` sert aux data-id et aux clés de focus (`${prefix}dec:${id}`).
 */
export function stepper({ id, value, unitText, label, decAction, incAction, prefix = "", decLabel = "Retirer une portion", incLabel = "Ajouter une portion" }) {
  return html`<div class="flex min-h-11 items-center justify-between gap-1 rounded-full border border-line bg-page" role="group" aria-label="${label}">
    <button type="button" class="grid size-11 place-items-center rounded-full text-accent transition-colors hover:bg-soft" data-action="${decAction}" data-id="${id}" data-focus="${prefix}dec:${id}" aria-label="${decLabel}">
      ${icon("dash-lg", "size-4")}
    </button>
    <span class="px-1 text-center text-sm font-semibold whitespace-nowrap tabular-nums" aria-live="polite">${value} <span class="font-normal text-ink-soft">${unitText}</span></span>
    <button type="button" class="grid size-11 place-items-center rounded-full text-accent transition-colors hover:bg-soft" data-action="${incAction}" data-id="${id}" data-focus="${prefix}inc:${id}" aria-label="${incLabel}">
      ${icon("plus-lg", "size-4")}
    </button>
  </div>`;
}

export const photoUrl = (id) => `/assets/gueathub/recettes/${encodeURIComponent(id)}.webp`;

/**
 * Carte : photo 4:3, ou icône du type sur fond doux dans la même place réservée.
 * Fiche (`banner`) : photo 4:3 arrondie ; sans photo, simple bandeau pour ne pas occuper l'écran.
 */
export function recipePhoto(app, recipe, banner = false) {
  const type = TYPES[recipe.type];
  if (app.data.photos.has(recipe.id)) {
    return html`<img src="${photoUrl(recipe.id)}" alt="" loading="${banner ? "eager" : "lazy"}" decoding="async" width="1200" height="900"
      class="${banner ? "aspect-[4/3] h-auto w-full rounded-xl bg-soft object-cover" : "aspect-[4/3] h-auto w-full bg-soft object-cover"}">`;
  }
  if (banner) {
    return html`<div class="grid h-24 w-full place-items-center rounded-xl bg-soft text-ink-faint">${icon(type ? type.icon : "fork-knife", "size-8")}</div>`;
  }
  return html`<div class="grid aspect-[4/3] w-full place-items-center bg-soft text-ink-faint">
    ${icon(type ? type.icon : "fork-knife", "size-12")}
  </div>`;
}

export function emptyState({ iconName, title, text, actionHref, actionLabel }) {
  return html`<div class="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-line px-6 py-10 text-center">
    <span class="grid size-14 place-items-center rounded-full bg-soft text-ink-soft">${icon(iconName, "size-6")}</span>
    <p class="font-semibold">${title}</p>
    ${text ? html`<p class="text-sm text-ink-soft">${text}</p>` : ""}
    ${actionHref ? html`<a href="${actionHref}" class="${BUTTON_PRIMARY}" data-focus="empty-action">${actionLabel}</a>` : ""}
  </div>`;
}
