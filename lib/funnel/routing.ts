import { FUNNEL_STEPS } from "./contract.generated";
import type { Answers, Step } from "./types";

/** Canonical order comes from the app's contract; only the branch rules live here. */
const ORDER: readonly Step[] = FUNNEL_STEPS;

const onHandlesBranch = (a: Answers) => a.chair_rise_capability === "with_handles";

export const firstStep = (): Step => "welcome2";

/** Mirrors FunnelOrchestrator.nextStep (iOS) for the web's standard (OTP) path. */
export function nextStep(step: Step, answers: Answers): Step | null {
  switch (step) {
    case "chairRise":
      return onHandlesBranch(answers) ? "standingComfort" : "challengeArea";
    case "challengeArea":
    case "standingComfort":
      return "reinforcement2";
    case "payment":
      return null;
    default: {
      const i = ORDER.indexOf(step);
      if (i < 0) return null;
      return ORDER[i + 1] ?? null;
    }
  }
}

const DOTS: Partial<Record<Step, number>> = {
  gender: 1, aspiration: 2, activityLevel: 3, chairRise: 4,
  challengeArea: 5, standingComfort: 5, frequency: 6, bodyAreas: 7, time: 8,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function indicator(step: Step, _answers: Answers): { index: number; total: 8 } | null {
  const index = DOTS[step];
  return index ? { index, total: 8 } : null;
}

export const clearsHistory = (step: Step) => step === "gender";

/** Remove the follow-up answer that belongs to the branch the user is no longer on. */
export function cleanOffBranch(answers: Answers): Answers {
  const { standing_stability, mobility_challenge, ...rest } = answers;
  if (onHandlesBranch(answers)) return standing_stability ? { ...rest, standing_stability } : rest;
  return mobility_challenge ? { ...rest, mobility_challenge } : rest;
}
