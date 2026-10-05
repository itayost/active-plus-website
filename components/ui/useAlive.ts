"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * False once the component has unmounted: a request that resolves later
 * checks it before it acts (sets state, moves focus, calls back).
 */
export function useAlive(): RefObject<boolean> {
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  return alive;
}
