// Écran « Réglages » (#/reglages).

import { html, icon } from "../ui/dom.js";
import { getThemePreference, setThemePreference } from "../ui/theme.js";
import { BUTTON_SECONDARY, ICON_BUTTON, SECTION_TITLE, container, viewTitle } from "./parts.js";

const THEMES = [
  { value: "light", label: "Clair", icon: "sun" },
  { value: "dark", label: "Sombre", icon: "moon-stars" },
  { value: "system", label: "Système", icon: "circle-half" },
];

const dateTimeFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });

export function settingsView(app) {
  const { data, actions, store } = app;

  function orderBlock() {
    const order = actions.categoryOrder();
    const isDefault = store.state.ordreRayons.length === 0 || order.every((id, index) => id === data.categories[index].id);
    return html`<section class="mt-6" aria-labelledby="order-title">
      <h2 id="order-title" class="${SECTION_TITLE}">Ordre des rayons</h2>
      <p class="mt-1 text-sm text-ink-soft">Range les rayons dans l'ordre de ton magasin : la liste de courses suit cet ordre.</p>
      <ol class="mt-3 divide-y divide-line rounded-xl border border-line">
        ${order.map((id, index) => {
          const category = data.categoriesById.get(id);
          return html`<li class="flex items-center gap-3 py-1 pr-1 pl-4">
            ${icon(category.icone, "size-4 text-ink-soft")}
            <span class="min-w-0 flex-1">${category.libelle}</span>
            <button type="button" class="${ICON_BUTTON}" data-action="up" data-id="${id}" data-focus="up:${id}" aria-label="Monter « ${category.libelle} »" ${index === 0 ? "disabled" : ""}>
              ${icon("arrow-up", "size-4")}
            </button>
            <button type="button" class="${ICON_BUTTON}" data-action="down" data-id="${id}" data-focus="down:${id}" aria-label="Descendre « ${category.libelle} »" ${index === order.length - 1 ? "disabled" : ""}>
              ${icon("arrow-down", "size-4")}
            </button>
          </li>`;
        })}
      </ol>
      <button type="button" class="${BUTTON_SECONDARY} mt-3" data-action="reset-order" data-focus="reset-order" ${isDefault ? "disabled" : ""}>
        ${icon("arrow-counterclockwise", "size-4")} Rétablir l'ordre par défaut
      </button>
    </section>`;
  }

  function themeBlock() {
    const current = getThemePreference();
    return html`<section class="mt-8" aria-labelledby="theme-title">
      <h2 id="theme-title" class="${SECTION_TITLE}">Thème</h2>
      <p class="mt-1 text-sm text-ink-soft">Le même que sur le blog Le Hub de la Guite.</p>
      <div class="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="theme-title">
        ${THEMES.map(
          (theme) => html`<label class="${current === theme.value
            ? "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-accent bg-soft px-2 text-sm font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
            : "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line px-2 text-sm hover:bg-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"}">
            <input type="radio" name="theme" value="${theme.value}" class="sr-only" data-change="theme" data-focus="theme:${theme.value}" ${current === theme.value ? "checked" : ""}>
            ${icon(theme.icon, "size-4")} ${theme.label}
          </label>`,
        )}
      </div>
    </section>`;
  }

  function placardBlock() {
    const entries = Object.entries(store.state.placardPerso).sort(([a], [b]) => a.localeCompare(b, "fr"));
    return html`<section class="mt-8" aria-labelledby="placard-title">
      <h2 id="placard-title" class="${SECTION_TITLE}">Basiques du placard</h2>
      ${entries.length === 0
        ? html`<p class="mt-1 text-sm text-ink-soft">
            Aucune préférence. Dans la liste de courses, le bouton « détails » d'un article permet de le ranger
            « Toujours au placard » ou « Pas au placard ».
          </p>`
        : html`<ul class="mt-3 divide-y divide-line rounded-xl border border-line">
            ${entries.map(
              ([key, value]) => html`<li class="flex items-center gap-3 py-1 pr-1 pl-4">
                <span class="min-w-0 flex-1">${key}
                  <span class="block text-sm text-ink-soft">${value ? "Toujours au placard" : "Pas au placard"}</span>
                </span>
                <button type="button" class="${ICON_BUTTON}" data-action="remove-pref" data-key="${key}" data-focus="pref:${key}" aria-label="Supprimer la préférence pour « ${key} »">
                  ${icon("trash3", "size-4")}
                </button>
              </li>`,
            )}
          </ul>`}
    </section>`;
  }

  function dataBlock() {
    return html`<section class="mt-8" aria-labelledby="data-title">
      <h2 id="data-title" class="${SECTION_TITLE}">Données</h2>
      <p class="mt-1 text-sm text-ink-soft">
        ${store.persistent
          ? "Ta sélection, tes coches et tes réglages sont enregistrés sur cet appareil uniquement."
          : "Tes choix ne seront pas conservés sur cet appareil (stockage indisponible)."}
      </p>
      <button type="button" class="${BUTTON_SECONDARY} mt-3" data-action="erase" data-focus="erase">
        ${icon("trash3", "size-4")} Effacer les données de l'app sur cet appareil
      </button>
      <dl class="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt class="text-ink-soft">Recettes générées le</dt>
        <dd>${data.genere ? dateTimeFormat.format(data.genere) : "date inconnue"}</dd>
        <dt class="text-ink-soft">Version de l'app</dt>
        <dd class="tabular-nums">${app.version}</dd>
      </dl>
    </section>`;
  }

  function render() {
    return container(html`${viewTitle("Réglages")}${orderBlock()}${themeBlock()}${placardBlock()}${dataBlock()}`);
  }

  function handle(event) {
    const target = event.target;
    if (event.type === "change" && target.matches('[data-change="theme"]')) {
      setThemePreference(target.value);
      app.rerender();
      return;
    }
    if (event.type !== "click") return;
    const button = target.closest("[data-action]");
    if (!button) return;
    const { action, id, key } = button.dataset;
    if (action === "up" || action === "down") {
      const order = actions.categoryOrder();
      const index = order.indexOf(id) + (action === "up" ? -1 : 1);
      // Arrivé en bout de liste, le bouton se désactive : le focus passe sur l'autre.
      const atEdge = index === 0 || index === order.length - 1;
      app.nextFocus = atEdge ? `${action === "up" ? "down" : "up"}:${id}` : `${action}:${id}`;
      actions.moveCategory(id, action === "up" ? -1 : 1);
    } else if (action === "reset-order") {
      app.nextFocus = `down:${data.categories[0].id}`;
      actions.resetCategoryOrder();
    } else if (action === "remove-pref") {
      app.nextFocus = "erase";
      actions.removePlacardPref(key);
    } else if (action === "erase") {
      actions.eraseAll();
    }
  }

  return { title: "Réglages", render, handle };
}
