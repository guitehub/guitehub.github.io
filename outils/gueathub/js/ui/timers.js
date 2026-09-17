// Minuteurs de cuisine : plusieurs à la fois, dans une barre collante. À la fin : vibration, son, toast.
// Le temps restant est calculé depuis l'heure de fin : il reste juste même si l'onglet est mis en veille.

import { html, icon, renderInto } from "./dom.js";

function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}

export function createTimers({ bar, toast }) {
  const timers = []; // { id, label, endsAt }
  let interval = null;
  let audio = null;

  function unlockAudio() {
    try {
      audio ??= new AudioContext();
      if (audio.state === "suspended") audio.resume();
    } catch {
      audio = null;
    }
  }

  function beep() {
    if (!audio) return;
    try {
      const start = audio.currentTime;
      for (const offset of [0, 0.35, 0.7]) {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.25, start + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, start + offset + 0.25);
        oscillator.connect(gain).connect(audio.destination);
        oscillator.start(start + offset);
        oscillator.stop(start + offset + 0.25);
      }
    } catch {
      // Pas de son possible : la vibration et le toast suffisent.
    }
  }

  function render() {
    bar.hidden = timers.length === 0;
    if (timers.length === 0) {
      bar.replaceChildren();
      return;
    }
    const now = Date.now();
    renderInto(
      bar,
      html`<ul class="mx-auto flex max-w-2xl flex-wrap gap-2 px-4 py-2 sm:px-6" aria-label="Minuteurs en cours">
        ${timers.map(
          (timer) => html`<li class="flex min-w-0 flex-1 basis-56 items-center gap-2 rounded-full border border-line bg-soft py-1 pr-1 pl-3">
            ${icon("stopwatch", "size-4 text-accent")}
            <span class="min-w-0 flex-1 truncate text-sm">${timer.label}</span>
            <span class="text-sm font-semibold tabular-nums" role="timer">${formatRemaining(timer.endsAt - now)}</span>
            <button type="button" data-timer-cancel="${timer.id}" data-focus="timer:${timer.id}" class="grid size-11 place-items-center rounded-full text-ink-soft hover:bg-page hover:text-ink" aria-label="Arrêter le minuteur : ${timer.label}">
              ${icon("x-lg", "size-4")}
            </button>
          </li>`,
        )}
      </ul>`,
    );
  }

  function tick() {
    const now = Date.now();
    for (let index = timers.length - 1; index >= 0; index -= 1) {
      if (timers[index].endsAt > now) continue;
      const [done] = timers.splice(index, 1);
      navigator.vibrate?.([300, 150, 300, 150, 500]);
      beep();
      toast.show(`Minuteur terminé : ${done.label}`, { duration: 15000 });
    }
    if (timers.length === 0 && interval) {
      clearInterval(interval);
      interval = null;
    }
    render();
  }

  /** start({ label, minutes }) : à appeler depuis un geste de l'utilisateur (déverrouille le son). */
  function start({ label, minutes }) {
    unlockAudio();
    timers.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, label, endsAt: Date.now() + minutes * 60000 });
    interval ??= setInterval(tick, 1000);
    render();
    toast.show(`Minuteur lancé : ${label}`);
  }

  function cancel(id) {
    const index = timers.findIndex((timer) => timer.id === id);
    if (index !== -1) timers.splice(index, 1);
    tick();
  }

  bar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-timer-cancel]");
    if (button) cancel(button.dataset.timerCancel);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tick();
  });

  return { start, cancel };
}
