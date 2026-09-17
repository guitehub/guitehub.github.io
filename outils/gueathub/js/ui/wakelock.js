// Écran maintenu allumé (API Screen Wake Lock). Le verrou est relâché par le navigateur quand
// l'onglet passe en arrière-plan : on le redemande au retour tant que l'option est active.

export const wakeLockSupported = "wakeLock" in navigator;

let wanted = false;
let sentinel = null;

async function acquire() {
  if (!wanted || sentinel || document.visibilityState !== "visible") return true;
  try {
    sentinel = await navigator.wakeLock.request("screen");
    sentinel.addEventListener("release", () => {
      sentinel = null;
    });
    return true;
  } catch {
    wanted = false;
    return false;
  }
}

/** Active ou désactive. Retourne false si le navigateur a refusé (batterie faible, permission…). */
export async function setWakeLock(on) {
  wanted = on && wakeLockSupported;
  if (wanted) return acquire();
  const current = sentinel;
  sentinel = null;
  await current?.release().catch(() => {});
  return true;
}

export const isWakeLockWanted = () => wanted;

if (wakeLockSupported) {
  document.addEventListener("visibilitychange", () => {
    acquire();
  });
}
