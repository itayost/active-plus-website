/** One short tap, long enough to feel on an Android phone and too short to be a buzz. */
export const TAP_MS = 12;

/** Two calls closer than this are one tap (a card and its continue, a capture and a handler). */
const SAME_TAP_MS = 60;

let lastTap = 0;

/**
 * iPhone Safari has no Vibration API, but since iOS 18 toggling a switch input
 * (`<input type="checkbox" switch>`) plays the system's light tap. A fresh one,
 * never shown, is clicked through its label inside the user's own tap and taken
 * away again (owner, 2026-11-15: no tap on his iPhone with one hidden switch
 * kept off-screen). The phone's "System Haptics" setting must be on. Older
 * iPhones ignore the attribute: a plain checkbox, no tap, no harm.
 */
function iosSwitchTap(): void {
  if (typeof document === "undefined") return;
  const label = document.createElement("label");
  label.setAttribute("aria-hidden", "true");
  label.style.display = "none";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  label.appendChild(input);
  document.head.appendChild(label);
  try {
    label.click();
  } finally {
    label.remove();
  }
}

/**
 * A small vibration on a tap in the questionnaire (owner, 2026-11-14: every tap).
 * Android browsers vibrate; iPhones get the system tap through a hidden switch;
 * desktops have no motor, so there it does nothing. Must run inside the tap's own
 * handler: browsers ignore a vibration without a user gesture.
 */
export function tapHaptic(): void {
  const now = Date.now();
  if (now - lastTap < SAME_TAP_MS) return;
  lastTap = now;
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(TAP_MS);
      return;
    }
    iosSwitchTap();
  } catch {
    // A browser that refuses (a blocked frame, a policy) only loses the tap.
  }
}

/** Whether a tap landed on something you can press: a button, a link, an answer. */
export function isPressable(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.closest('button, a[href], label, [role="button"], [role="radio"], [role="checkbox"], select') !== null;
}
