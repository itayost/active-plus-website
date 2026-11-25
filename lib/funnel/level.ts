import type { Answers } from "./types";

export type FunctionalityLevel = "fully_independent" | "balance_issues" | "chair_only";

/**
 * The level from the chair answers, for a visitor whose stored answers predate
 * the training preference (2026-11-25): the same rule as the server's
 * merge_funnel_session. Undefined when there is no chair answer; today the
 * level is the visitor's own choice, answers.functionality_level.
 */
export function functionalityLevelOf(answers: Answers): FunctionalityLevel | undefined {
  const chair = answers.chair_rise_capability;
  if (chair === "alone" || chair === "with_support") return "fully_independent";
  if (chair === "with_handles") return answers.standing_stability === "seated" ? "chair_only" : "balance_issues";
  return undefined;
}
