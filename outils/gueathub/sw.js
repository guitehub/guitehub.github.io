---
layout: null
permalink: /outils/gueathub/sw.js
---
// Service worker de gueathub. Fichier traité par Jekyll : la version change à chaque build,
// ce qui suffit à déclencher la mise à jour de l'app chez les visiteurs.
//
//   coquille (HTML, CSS, JS, icônes…) : pré-cachée à l'installation, servie depuis le cache
//   recettes.json                       : réseau d'abord, copie en cache si hors ligne ou trop lent
//   photos des recettes                 : cache d'abord, au fil des consultations (80 max)
//   navigations dans l'app              : index.html du cache

const VERSION = "{{ site.time | date: '%s' }}";
const SCOPE = "/outils/gueathub/";
const SHELL_CACHE = `gueathub-${VERSION}`;
const PHOTOS_CACHE = `gueathub-photos-${VERSION}`;
const RECIPES_URL = `${SCOPE}recettes.json`;
const PHOTOS_PATH = "/assets/gueathub/recettes/";
const PHOTOS_MAX = 80;
const NETWORK_TIMEOUT = 4000;

// Liste générée par Jekyll : tous les fichiers publiés sous /outils/gueathub/.
const SHELL = [
  "/assets/css/tokens.css",
  RECIPES_URL,
{%- for file in site.static_files %}
  {%- assign prefix = file.path | slice: 0, 17 %}
  {%- if prefix == "/outils/gueathub/" %}
  {{ file.path | jsonify }},
  {%- endif %}
{%- endfor %}
];
const SHELL_PATHS = new Set(SHELL);
const INDEX_URL = `${SCOPE}index.html`;

self.addEventListener("install", (event) => {
  // cache: "reload" contourne le cache HTTP (10 min sur GitHub Pages) pour ne rien mélanger entre versions.
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL.map((url) => new Request(url, { cache: "reload" })))),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, PHOTOS_CACHE]);
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith("gueathub-") && !keep.has(key)).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

// La page demande l'activation quand on touche « Recharger » sur le toast « Nouvelle version disponible ».
self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    if (url.pathname === SCOPE || url.pathname === INDEX_URL) event.respondWith(fromShell(INDEX_URL, request));
    return;
  }
  if (url.pathname === RECIPES_URL) {
    event.respondWith(recipesNetworkFirst(event));
    return;
  }
  if (url.pathname.startsWith(PHOTOS_PATH)) {
    event.respondWith(photoCacheFirst(event));
    return;
  }
  if (SHELL_PATHS.has(url.pathname)) {
    event.respondWith(fromShell(url.pathname, request));
  }
});

/** Fichier de la coquille : cache de cette version, sinon réseau. */
async function fromShell(path, request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(path);
  return cached ?? fetch(request);
}

/** Copie en cache marquée « servie hors ligne » (lue par la page pour afficher le bandeau). */
async function markedCopy(cached) {
  const headers = new Headers(cached.headers);
  headers.set("X-Gueathub-Cache", "1");
  return new Response(await cached.blob(), { status: cached.status, statusText: cached.statusText, headers });
}

async function recipesNetworkFirst(event) {
  const cache = await caches.open(SHELL_CACHE);
  const network = fetch(event.request).then(async (response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await cache.put(RECIPES_URL, response.clone());
    return response;
  });
  // La requête réseau continue en arrière-plan même si la copie est servie avant (connexion lente).
  event.waitUntil(network.catch(() => {}));

  const cached = await cache.match(RECIPES_URL);
  if (!cached) return network;
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT, "timeout"));
  try {
    const winner = await Promise.race([network, timeout]);
    if (winner !== "timeout") return winner;
  } catch {
    // Hors ligne ou erreur serveur : copie en cache.
  }
  return markedCopy(cached);
}

async function photoCacheFirst(event) {
  const cache = await caches.open(PHOTOS_CACHE);
  const cached = await cache.match(event.request);
  if (cached) return cached;
  try {
    const response = await fetch(event.request);
    if (response.ok) event.waitUntil(cache.put(event.request, response.clone()).then(() => trimCache(cache, PHOTOS_MAX)));
    return response;
  } catch {
    return new Response("", { status: 504, statusText: "Hors ligne" });
  }
}

/** Garde les `max` entrées les plus récentes (les clés sont dans l'ordre d'ajout). */
async function trimCache(cache, max) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key)));
}
