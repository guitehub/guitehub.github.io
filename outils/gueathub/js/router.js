// Routes par hash : #/ (recettes), #/recette/:id, #/liste, #/reglages.

/** Analyse un hash. Toute adresse inconnue renvoie vers les recettes. */
export function parseRoute(hash) {
  const path = String(hash).replace(/^#/, "").replace(/^\/?/, "/");
  const recipe = path.match(/^\/recette\/([^/?#]+)\/?$/);
  if (recipe) {
    let id = recipe[1];
    try {
      id = decodeURIComponent(id);
    } catch {
      // Séquence % invalide : on garde l'identifiant brut, qui ne correspondra à aucune recette.
    }
    return { name: "recipe", params: { id } };
  }
  if (/^\/liste\/?$/.test(path)) return { name: "list", params: {} };
  if (/^\/reglages\/?$/.test(path)) return { name: "settings", params: {} };
  if (path === "/") return { name: "recipes", params: {} };
  return { name: "recipes", params: {}, redirect: true };
}

export const href = {
  recipes: () => "#/",
  recipe: (id) => `#/recette/${encodeURIComponent(id)}`,
  list: () => "#/liste",
  settings: () => "#/reglages",
};

/** Écoute les changements d'adresse et appelle `onRoute(route)`, y compris au démarrage. */
export function startRouter(onRoute) {
  const handle = () => {
    const route = parseRoute(location.hash);
    if (route.redirect) {
      history.replaceState(null, "", href.recipes());
    }
    onRoute(route);
  };
  window.addEventListener("hashchange", handle);
  handle();
}
