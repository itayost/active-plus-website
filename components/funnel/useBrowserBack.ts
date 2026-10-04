"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { planPop, pushesEntry, readEntry, withEntry, type Entry } from "@/lib/funnel/browser-history";
import { back, canGoBack, type FunnelState } from "@/lib/funnel/machine";

type Options = {
  state: FunnelState;
  /** Back is not allowed right now (a code checked or sent, sign-in finished, the loader). */
  blocked: boolean;
  /** Shows a screen without touching the browser history. */
  show: (next: FunnelState) => void;
};

/**
 * The phone's back button or gesture as the funnel's back (decisions in
 * lib/funnel/browser-history). Every entry is written over the router's own
 * history state, so Next's keys stay on it.
 */
export function useBrowserBack({ state, blocked, show }: Options) {
  // The funnel's entry the browser is on; null until the restore has tagged one.
  const position = useRef<Entry | null>(null);
  // What a popstate acts on: the screen and lock as last rendered.
  const latest = useRef({ state, blocked });
  useLayoutEffect(() => {
    latest.current = { state, blocked };
  }, [state, blocked]);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const here = position.current;
      if (!here) return;
      const plan = planPop(here, readEntry(event.state), latest.current.state, latest.current.blocked);
      if (plan.kind === "undo" || plan.kind === "leave") {
        window.history.go(plan.delta);
      } else if (plan.kind === "hold") {
        window.history.pushState(withEntry(window.history.state, plan.entry), "");
        position.current = plan.entry;
      } else if (plan.kind === "back") {
        position.current = plan.entry;
        show(plan.state);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [show]);

  /** On restore: tag the entry the funnel opened on (never push). One kept from before a reload keeps its place. */
  const tag = useCallback(() => {
    const entry = readEntry(window.history.state) ?? { idx: 0, base: 0 };
    window.history.replaceState(withEntry(window.history.state, entry), "");
    position.current = entry;
  }, []);

  /** A forward move: a new entry when it adds somewhere to go back to. */
  const forward = useCallback((prev: FunnelState, next: FunnelState) => {
    const here = position.current;
    if (!here || !pushesEntry(prev, next)) return;
    const entry = { idx: here.idx + 1, base: here.base };
    window.history.pushState(withEntry(window.history.state, entry), "");
    position.current = entry;
  }, []);

  /**
   * The back arrow and "ערוך מספר": with a funnel entry to pop, the browser goes
   * back and the popstate moves the funnel, so the two stacks never part. With
   * none (a restored visitor's first screen), the funnel moves on its own.
   */
  const goBack = useCallback(
    (current: FunnelState) => {
      const here = position.current;
      if (here && here.idx > here.base) {
        window.history.back();
        return;
      }
      if (canGoBack(current)) show(back(current));
    },
    [show],
  );

  return useMemo(() => ({ tag, forward, goBack }), [tag, forward, goBack]);
}
