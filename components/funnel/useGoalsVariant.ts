"use client";

import { useSyncExternalStore } from "react";
import { currentGoalsVariant, type GoalsVariant } from "@/lib/funnel/goals-variant";

const noop = () => () => {};

/** The visitor's goals version; null on the server and in the first render. */
export function useGoalsVariant(): GoalsVariant | null {
  return useSyncExternalStore(noop, currentGoalsVariant, () => null);
}
