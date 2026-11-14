/** One short tap, long enough to feel on an Android phone and too short to be a buzz. */
export const TAP_MS = 12;

/**
 * A small vibration when an answer is chosen or the continue button is pressed
 * (owner, 2026-11-14). Android browsers vibrate; iOS Safari has no Vibration API
 * and desktops have no motor, so there it does nothing. Must run inside the tap's
 * own handler: browsers ignore a vibration without a user gesture.
 */
export function tapHaptic(): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(TAP_MS);
  } catch {
    // A browser that refuses (a blocked frame, a policy) only loses the tap.
  }
}
