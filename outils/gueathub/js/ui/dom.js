// Gabarits HTML avec échappement systématique, icônes et rendu qui préserve focus et défilement.
// Le module ne touche pas au DOM à l'import : les fonctions de gabarit sont testables dans Node.

import { ICONS } from "./icons.js";

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Fragment HTML déjà sûr : inséré tel quel par `html`. */
class SafeHtml {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/** Marque une chaîne comme HTML sûr. À réserver aux chaînes produites par le code, jamais aux données. */
export function raw(value) {
  return new SafeHtml(String(value));
}

function interpolate(value) {
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(interpolate).join("");
  if (value === null || value === undefined || value === false) return "";
  return escapeHtml(value);
}

/**
 * Gabarit : html`<p>${texte}</p>`. Toute valeur est échappée, sauf les fragments `html`/`raw`.
 * Les tableaux sont concaténés ; null, undefined et false ne produisent rien.
 */
export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((value, index) => {
    out += interpolate(value) + strings[index + 1];
  });
  return new SafeHtml(out);
}

/** Icône SVG en ligne, décorative (aria-hidden). `className` : classes Tailwind littérales. */
export function icon(name, className = "size-5") {
  const body = ICONS[name] ?? ICONS["three-dots"];
  return raw(
    `<svg class="${escapeHtml(className)} shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">${body}</svg>`,
  );
}

/**
 * Remplace le contenu de `root` en conservant le défilement et le focus.
 * L'élément focalisé est retrouvé par son attribut data-focus (ou `focusKey` s'il est fourni),
 * avec la position du curseur dans les champs texte.
 */
export function renderInto(root, content, { focusKey } = {}) {
  const active = document.activeElement;
  const activeKey = root.contains(active) ? active.closest("[data-focus]")?.dataset.focus : undefined;
  const key = focusKey ?? activeKey;
  let selection = null;
  try {
    if (activeKey && typeof active.selectionStart === "number") selection = [active.selectionStart, active.selectionEnd];
  } catch {
    selection = null;
  }
  const { scrollX, scrollY } = window;

  root.innerHTML = interpolate(content);

  if (key) focusByKey(root, key, selection);
  window.scrollTo(scrollX, scrollY);
}

/** Donne le focus à l'élément [data-focus=key] de `root`, sans faire défiler. */
export function focusByKey(root, key, selection = null) {
  const target = root.querySelector(`[data-focus="${CSS.escape(key)}"]`);
  if (!target) return false;
  target.focus({ preventScroll: true });
  if (selection) {
    try {
      target.setSelectionRange(...selection);
    } catch {
      // Champ sans sélection (checkbox, select…).
    }
  }
  return true;
}
