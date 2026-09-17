// Panneau : tiroir depuis le bas sur mobile, dialogue centré sur écran large.
// Basé sur <dialog> (focus piégé, Échap, retour du focus gérés par le navigateur).

import { html, icon, renderInto } from "./dom.js";

export function createSheet(dialog) {
  let current = null; // { title, body: () => contenu | null, handle(event) }

  function renderBody() {
    const content = current.body();
    if (content === null) {
      close();
      return;
    }
    renderInto(dialog.querySelector("[data-sheet-body]"), content);
  }

  /** open({ title, body, handle }) : `body` est rappelée à chaque rafraîchissement ; null ferme le panneau. */
  function open(options) {
    current = options;
    dialog.innerHTML = String(html`
      <div class="flex max-h-[inherit] flex-col">
        <header class="flex items-center gap-2 border-b border-line py-2 pr-2 pl-5">
          <h2 id="sheet-title" class="min-w-0 flex-1 text-lg font-semibold">${options.title}</h2>
          <button type="button" data-sheet-close class="grid size-11 place-items-center rounded-full text-ink-soft hover:bg-soft hover:text-ink" aria-label="Fermer">
            ${icon("x-lg", "size-4")}
          </button>
        </header>
        <div data-sheet-body class="overflow-y-auto px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"></div>
      </div>`);
    renderBody();
    if (current && !dialog.open) dialog.showModal();
  }

  function close() {
    if (dialog.open) dialog.close();
    current = null;
  }

  /** Redessine le contenu (après un changement d'état), en gardant le focus. */
  function refresh() {
    if (current && dialog.open) renderBody();
  }

  dialog.addEventListener("click", (event) => {
    // Clic sur le fond (hors du contenu) ou sur le bouton Fermer.
    if (event.target === dialog || event.target.closest("[data-sheet-close]")) {
      close();
      return;
    }
    current?.handle?.(event);
  });
  dialog.addEventListener("change", (event) => current?.handle?.(event));
  dialog.addEventListener("close", () => {
    current = null;
  });

  return { open, close, refresh };
}
