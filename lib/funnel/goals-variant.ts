/**
 * The goals question in two versions, half the visitors each (owner,
 * 2026-11-27): "list" is the question as it was (cards with icons and a
 * continue button); "photo" is four photo cards under "מה הכי חשוב לך עכשיו?",
 * where a tap moves on by itself. A visitor keeps their version on the phone,
 * and every funnel event carries it (`goals_variant`), so the dashboard can
 * compare how many of each moved past the first screen.
 */

export const GOALS_VARIANT_KEY = "ap.goals_variant";
export type GoalsVariant = "list" | "photo";

type Store = Pick<Storage, "getItem" | "setItem">;

const isVariant = (v: unknown): v is GoalsVariant => v === "list" || v === "photo";

export const pickGoalsVariant = (random: number): GoalsVariant => (random < 0.5 ? "photo" : "list");

/** The visitor's version: the kept one, else a fresh draw that is kept. Never throws. */
export function assignGoalsVariant(store: Store | undefined, random: () => number = Math.random): GoalsVariant {
  try {
    const kept = store?.getItem(GOALS_VARIANT_KEY);
    if (isVariant(kept)) return kept;
  } catch {
    // Blocked storage: a draw for this page.
  }
  const drawn = pickGoalsVariant(random());
  try {
    store?.setItem(GOALS_VARIANT_KEY, drawn);
  } catch {
    // Not kept: the module cache below still holds it for this page.
  }
  return drawn;
}

let cached: GoalsVariant | undefined;

/** This browser's version, the same for the screen and its events. */
export function currentGoalsVariant(): GoalsVariant {
  if (cached) return cached;
  // Never on the server: one draw there would be shared by every visitor.
  if (typeof window === "undefined") return "list";
  let store: Store | undefined;
  try {
    store = typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    store = undefined;
  }
  cached = assignGoalsVariant(store);
  return cached;
}
