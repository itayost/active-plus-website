import { back, canGoBack, type FunnelState } from "./machine";

/**
 * Keeps the browser's back (the phone's back button or gesture) in step with
 * the funnel's own back. Pure decisions only; components/funnel/useBrowserBack
 * applies them to window.history.
 *
 * Every screen move that adds a place to go back to pushes one history entry
 * tagged with its position (`idx`) and the position of the funnel's lowest
 * entry in this run (`base`). A popstate is read by comparing positions, so
 * a back gesture becomes one funnel back per entry popped, whatever the
 * entries were created by (this visit, or an earlier one before a reload).
 */
export type Entry = { idx: number; base: number };

/** The key the funnel's entry lives under in history.state, beside the router's own keys. */
const KEY = "apFunnel";

const isIndex = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;

export function readEntry(state: unknown): Entry | null {
  if (typeof state !== "object" || state === null) return null;
  const entry = (state as Record<string, unknown>)[KEY];
  if (typeof entry !== "object" || entry === null) return null;
  const { idx, base } = entry as { idx?: unknown; base?: unknown };
  return isIndex(idx) && isIndex(base) && base <= idx ? { idx, base } : null;
}

/** The current history state (the router's keys included) with the funnel's entry set. */
export function withEntry(state: unknown, entry: Entry): Record<string, unknown> {
  const current = typeof state === "object" && state !== null ? (state as Record<string, unknown>) : {};
  return { ...current, [KEY]: { ...entry } };
}

/** Upper bound on the backs from any screen (every step plus the sub-screens); guards the count. */
const MAX_DEPTH = 64;

/** How many funnel backs this screen has before there is nowhere left to go. */
export function backDepth(state: FunnelState): number {
  let depth = 0;
  for (let s = state; canGoBack(s) && depth < MAX_DEPTH; s = back(s)) depth += 1;
  return depth;
}

/**
 * A forward move pushes an entry only when it adds a back. welcome2 -> gender
 * adds none (gender clears the history) and neither does the loader -> time
 * (back from time skips the loader), so those keep the current entry.
 */
export const pushesEntry = (prev: FunnelState, next: FunnelState): boolean => backDepth(next) > backDepth(prev);

export type PopPlan =
  /** Not the funnel's entry (the router handles it), or no move at all. */
  | { kind: "none" }
  /** A forward gesture: the funnel cannot redo a screen, so history.go(delta) returns to it. */
  | { kind: "undo"; delta: number }
  /** Back is not allowed right now: push this entry to put the one just popped back. */
  | { kind: "hold"; entry: Entry }
  /** Nothing left to go back to in the funnel: history.go(delta) to the page before it. */
  | { kind: "leave"; delta: number }
  /** Show `state`, now standing on `entry`. */
  | { kind: "back"; state: FunnelState; entry: Entry };

/** What a popstate from `here` to `landed` means for the funnel showing `state`. */
export function planPop(here: Entry, landed: Entry | null, state: FunnelState, blocked: boolean): PopPlan {
  if (!landed) return { kind: "none" };
  const delta = landed.idx - here.idx;
  if (delta === 0) return { kind: "none" };
  if (delta > 0) return { kind: "undo", delta: -delta };
  if (blocked) return { kind: "hold", entry: { idx: landed.idx + 1, base: landed.base } };
  let next = state;
  for (let n = 0; n < -delta && canGoBack(next); n++) next = back(next);
  if (next === state) return { kind: "leave", delta: landed.base - landed.idx - 1 };
  return { kind: "back", state: next, entry: landed };
}
