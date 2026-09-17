// Enregistrement du service worker et toast « Nouvelle version disponible ».

export function registerServiceWorker({ toast }) {
  if (!("serviceWorker" in navigator)) return;
  const container = navigator.serviceWorker;
  let reloading = false;

  // Rechargement seulement après « Recharger » (pas lors de la toute première installation).
  container.addEventListener("controllerchange", () => {
    if (reloading) location.reload();
  });

  function promptUpdate(worker) {
    toast.show("Nouvelle version disponible", {
      persistent: true,
      action: {
        label: "Recharger",
        run: () => {
          reloading = true;
          worker.postMessage("skip-waiting");
        },
      },
    });
  }

  container
    .register("sw.js")
    .then((registration) => {
      if (registration.waiting && container.controller) promptUpdate(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && container.controller) promptUpdate(worker);
        });
      });
      // App restée ouverte longtemps (écran d'accueil) : on revérifie au retour au premier plan.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") registration.update().catch(() => {});
      });
    })
    .catch(() => {
      // Pas de service worker (navigation privée, navigateur ancien…) : l'app marche en ligne.
    });
}
