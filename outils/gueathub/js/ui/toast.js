// Toasts : un message à la fois, action facultative (« Annuler »), annoncé par aria-live.
// Un toast `persistent` (« Nouvelle version disponible ») reste affiché sans limite de temps ;
// s'il est recouvert par un autre message, il revient quand celui-ci disparaît.

import { html, icon } from "./dom.js";

export function createToaster(container) {
  let timer = null;
  let remaining = 0;
  let startedAt = 0;
  let action = null;
  let current = null;
  let persistent = null;

  function hide() {
    clearTimeout(timer);
    timer = null;
    action = null;
    container.replaceChildren();
    if (current === persistent) persistent = null;
    current = null;
    if (persistent) render(persistent);
  }

  function schedule(duration) {
    clearTimeout(timer);
    remaining = duration;
    startedAt = Date.now();
    timer = setTimeout(hide, duration);
  }

  /**
   * show("Liste copiée") ; show("Liste vidée", { action: { label: "Annuler", run }, duration: 5000 }) ;
   * show("Nouvelle version disponible", { action, persistent: true }).
   */
  function show(message, options = {}) {
    const toast = { message, ...options };
    if (toast.persistent) persistent = toast;
    render(toast);
  }

  function render(toast) {
    const { message, duration = 4000 } = toast;
    current = toast;
    action = toast.action ?? null;
    container.innerHTML = String(html`
      <div class="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-xl bg-ink py-2 pr-2 pl-4 text-sm text-page shadow-lg transition-[opacity,translate] duration-200 starting:translate-y-2 starting:opacity-0">
        <p class="min-w-0 flex-1 py-1.5">${message}</p>
        ${action
          ? html`<button type="button" data-toast="action" class="min-h-11 shrink-0 rounded-lg px-3 font-semibold text-page underline-offset-2 hover:underline">${action.label}</button>`
          : ""}
        <button type="button" data-toast="close" aria-label="Fermer le message" class="grid size-11 shrink-0 place-items-center rounded-lg opacity-80 hover:opacity-100">
          ${icon("x-lg", "size-4")}
        </button>
      </div>`);
    clearTimeout(timer);
    timer = null;
    if (!toast.persistent) schedule(duration);
  }

  container.addEventListener("click", (event) => {
    const button = event.target.closest("[data-toast]");
    if (!button) return;
    const run = button.dataset.toast === "action" ? action?.run : null;
    hide();
    run?.();
  });

  // Le temps s'arrête tant que le message est survolé ou a le focus (pour avoir le temps d'annuler).
  const pause = () => {
    if (!timer || current?.persistent) return;
    clearTimeout(timer);
    timer = null;
    remaining -= Date.now() - startedAt;
  };
  const resume = () => {
    if (timer || !container.firstElementChild || current?.persistent) return;
    schedule(Math.max(remaining, 1500));
  };
  container.addEventListener("pointerenter", pause);
  container.addEventListener("pointerleave", resume);
  container.addEventListener("focusin", pause);
  container.addEventListener("focusout", (event) => {
    if (!container.contains(event.relatedTarget)) resume();
  });

  return { show, hide };
}
