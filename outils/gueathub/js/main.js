// Démarrage de gueathub : store, chargement des recettes, routeur, navigation et rendu des vues.

import { createActions } from "./actions.js";
import { compareText } from "./domain/text.js";
import { plural } from "./labels.js";
import { href, startRouter } from "./router.js";
import { STORAGE_KEY, createStore, purgeState } from "./store.js";
import { focusByKey, html, icon, renderInto } from "./ui/dom.js";
import { createSheet } from "./ui/sheet.js";
import { applyTheme, watchTheme } from "./ui/theme.js";
import { createTimers } from "./ui/timers.js";
import { registerServiceWorker } from "./ui/pwa.js";
import { createToaster } from "./ui/toast.js";
import { listView } from "./views/list.js";
import { BUTTON_PRIMARY, container } from "./views/parts.js";
import { recipeView } from "./views/recipe.js";
import { recipesView } from "./views/recipes.js";
import { settingsView } from "./views/settings.js";

const APP_VERSION = "1.3.0";

const VIEWS = { recipes: recipesView, recipe: recipeView, list: listView, settings: settingsView };

const NAV = [
  { route: "recipes", href: href.recipes(), label: "Recettes", icon: "journal-bookmark" },
  { route: "list", href: href.list(), label: "Liste", icon: "card-checklist" },
  { route: "settings", href: href.settings(), label: "Réglages", icon: "gear" },
];

const $ = (selector) => document.querySelector(selector);

const elements = {
  view: $("#view"),
  banners: $("#banners"),
  navTop: $("#nav-top"),
  navBottom: $("#nav-bottom"),
  bottom: $("#bottom"),
};

const app = {
  version: APP_VERSION,
  store: null,
  data: null,
  actions: null,
  toast: createToaster($("#toasts")),
  sheet: createSheet($("#sheet")),
  timers: null,
  nextFocus: null,
  fallbackFocus: null,
  navigate: (hash) => {
    location.hash = hash;
  },
  rerender: () => renderView(),
};
app.timers = createTimers({ bar: $("#timers"), toast: app.toast });

let current = null; // { route, view }

// --- Stockage et thème ------------------------------------------------------

function localStorageOrNull() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

app.store = createStore({ storage: localStorageOrNull() });
applyTheme();
watchTheme(() => {
  if (current?.route.name === "settings") renderView();
});

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) app.store.syncFromStorage(event.newValue);
});
window.addEventListener("pagehide", () => app.store.flush());
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") app.store.flush();
});

// La barre du bas (minuteurs + onglets) réserve sa hauteur sous le contenu.
new ResizeObserver(([entry]) => {
  document.documentElement.style.setProperty("--bottom-space", `${Math.ceil(entry.borderBoxSize[0].blockSize)}px`);
}).observe(elements.bottom);

// --- Navigation -------------------------------------------------------------

function renderNav() {
  const active = current?.route.name === "recipe" ? "recipes" : current?.route.name;
  const remaining = app.actions ? app.actions.remaining() : 0;
  const badge = (className) =>
    remaining > 0
      ? html`<span class="${className}" aria-label="${plural(remaining, "article")} à cocher">${remaining}</span>`
      : "";

  renderInto(
    elements.navTop,
    html`${NAV.map(
      (item) => html`<a href="${item.href}" data-focus="nav-top:${item.route}" ${item.route === active ? html`aria-current="page"` : ""}
        class="${item.route === active
          ? "inline-flex min-h-11 items-center gap-2 rounded-full bg-soft px-4 text-sm font-semibold text-ink"
          : "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm text-ink-soft transition-colors hover:bg-soft hover:text-ink"}">
        ${icon(item.icon, "size-4")} ${item.label}
        ${item.route === "list" ? badge("min-w-5 rounded-full bg-accent px-1.5 text-center text-xs leading-5 font-semibold text-on-accent tabular-nums") : ""}
      </a>`,
    )}`,
  );
  renderInto(
    elements.navBottom,
    html`${NAV.map(
      (item) => html`<a href="${item.href}" data-focus="nav-bottom:${item.route}" ${item.route === active ? html`aria-current="page"` : ""}
        class="${item.route === active
          ? "relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold text-accent"
          : "relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-ink-soft"}">
        <span class="relative">
          ${icon(item.icon, "size-5")}
          ${item.route === "list" ? badge("absolute -top-1.5 left-3.5 min-w-5 rounded-full bg-accent px-1.5 text-center text-[0.6875rem] leading-5 font-semibold text-on-accent tabular-nums") : ""}
        </span>
        ${item.label}
      </a>`,
    )}`,
  );
}

// --- Vues -------------------------------------------------------------------

function renderView() {
  if (!current) return;
  const focusKey = app.nextFocus ?? undefined;
  app.nextFocus = null;
  renderInto(elements.view, current.view.render(), { focusKey });
  if (app.fallbackFocus && !elements.view.contains(document.activeElement)) {
    focusByKey(elements.view, app.fallbackFocus);
  }
  app.fallbackFocus = null;
}

function showRoute(route, { initial = false } = {}) {
  app.sheet.close();
  current?.view.destroy?.();
  current = { route, view: VIEWS[route.name](app, route.params) };
  document.title = `${current.view.title} · gueathub`;
  renderNav();
  renderView();
  if (!initial) {
    window.scrollTo(0, 0);
    elements.view.querySelector("[data-view-title]")?.focus({ preventScroll: true });
  }
}

function onStateChange(state, previous, meta) {
  renderNav();
  if (current) {
    const handled = current.view.update?.(meta, elements.view) === true;
    if (!handled) renderView();
  }
  app.sheet.refresh();
}

for (const type of ["click", "input", "change", "submit"]) {
  elements.view.addEventListener(type, (event) => current?.view.handle?.(event, elements.view));
}
// « toggle » (details) ne remonte pas : écoute en capture.
elements.view.addEventListener("toggle", (event) => current?.view.handle?.(event, elements.view), true);

// --- Données ----------------------------------------------------------------

function banner(iconName, text) {
  return html`<p class="flex items-center justify-center gap-2 border-b border-line bg-soft px-4 py-2 text-center text-sm text-ink-soft" role="status">
    ${icon(iconName, "size-4 shrink-0")} ${text}
  </p>`;
}

function prepareData(json) {
  const recipes = [...json.recettes].sort((a, b) => compareText(a.titre, b.titre));
  const genere = json.genere ? new Date(json.genere) : null;
  return {
    recipes,
    recipesById: new Map(recipes.map((recipe) => [recipe.id, recipe])),
    categories: json.categories,
    categoriesById: new Map(json.categories.map((category) => [category.id, category])),
    photos: new Set(json.photos ?? []),
    genere: genere && !Number.isNaN(genere.getTime()) ? genere : null,
  };
}

async function loadRecipes() {
  const response = await fetch("recettes.json", { cache: "no-cache" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { json: await response.json(), fromCache: response.headers.get("X-Gueathub-Cache") === "1" };
}

function showLoadError() {
  renderInto(
    elements.view,
    container(html`<div class="mt-10 flex flex-col items-center gap-3 text-center" role="alert">
      <span class="grid size-14 place-items-center rounded-full bg-soft text-ink-soft">${icon("wifi-off", "size-6")}</span>
      <h1 class="text-xl font-semibold">Impossible de charger les recettes</h1>
      <p class="text-ink-soft">Vérifie ta connexion, puis réessaie.</p>
      <button type="button" class="${BUTTON_PRIMARY}" data-retry>Réessayer</button>
    </div>`),
  );
  elements.view.querySelector("[data-retry]").addEventListener("click", () => location.reload(), { once: true });
}

async function start() {
  let loaded;
  try {
    loaded = await loadRecipes();
  } catch {
    showLoadError();
    return;
  }
  app.data = prepareData(loaded.json);
  app.actions = createActions(app);

  const { state, removed } = purgeState(app.store.state, app.data);
  if (JSON.stringify(state) !== JSON.stringify(app.store.state)) app.store.replace(state, { type: "purge" });
  if (removed.length === 1) app.toast.show("1 recette retirée : elle n'existe plus");
  else if (removed.length > 1) app.toast.show(`${removed.length} recettes retirées : elles n'existent plus`);

  const banners = [];
  if (loaded.fromCache) {
    const day = app.data.genere
      ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(app.data.genere)
      : "?";
    banners.push(banner("wifi-off", `Hors ligne — recettes du ${day}`));
  }
  if (!app.store.persistent) banners.push(banner("exclamation-triangle", "Tes choix ne seront pas conservés sur cet appareil"));
  renderInto(elements.banners, html`${banners}`);

  app.store.subscribe(onStateChange);
  let first = true;
  startRouter((route) => {
    showRoute(route, { initial: first });
    first = false;
  });
}

start();
registerServiceWorker(app);
