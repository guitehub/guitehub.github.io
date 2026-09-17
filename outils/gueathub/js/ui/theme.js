// Thème partagé avec le blog : même clé localStorage « theme » ("light" | "dark", absente = système),
// appliqué par l'attribut data-theme sur <html>, comme le script anti-FOUC du blog.

const KEY = "theme";
const darkQuery = matchMedia("(prefers-color-scheme: dark)");

/** "light", "dark" ou "system". */
export function getThemePreference() {
  try {
    const value = localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return document.documentElement.getAttribute("data-theme") ?? "system";
  }
}

/** Ajuste <meta name="theme-color"> à la couleur de fond du thème actif. */
export function updateThemeColor() {
  const background = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && background) meta.setAttribute("content", background);
}

export function applyTheme(preference = getThemePreference()) {
  const root = document.documentElement;
  if (preference === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", preference);
  updateThemeColor();
}

export function setThemePreference(preference) {
  try {
    if (preference === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, preference);
  } catch {
    // Stockage indisponible : le thème s'applique pour cette visite seulement.
  }
  applyTheme(preference);
}

/** Suit le blog ouvert dans un autre onglet et le thème du système. */
export function watchTheme(onChange) {
  window.addEventListener("storage", (event) => {
    if (event.key === KEY || event.key === null) {
      applyTheme();
      onChange();
    }
  });
  darkQuery.addEventListener("change", () => {
    updateThemeColor();
    onChange();
  });
}
