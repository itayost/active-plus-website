import type { Answers, Step } from "./types";

const onHandlesBranch = (a: Answers) => a.chair_rise_capability === "with_handles";

/** The first question, as in the apps. welcome2 is the website's entry screen before it. */
export const firstStep = (): Step => "goals";

/**
 * Mirrors FunnelOrchestrator.nextStep (iOS / Android) for the web's standard (OTP) path.
 * socialProof, aspiration and activityLevel stay in the contract but the apps no longer
 * show them (owner, 2026-10-18), so neither does the web; their arms are kept for parity.
 */
export function nextStep(step: Step, answers: Answers): Step | null {
  switch (step) {
    case "welcome2":
      return "goals";
    case "goals":
      return "gender";
    case "gender":
      return "dob";
    case "dob":
      return "goalReinforcement";
    case "goalReinforcement":
      return "desiredFeeling";
    case "desiredFeeling":
      return "memoryForgetfulness";
    case "memoryForgetfulness":
      return "chairRise";
    case "socialProof":
      return "aspiration";
    case "aspiration":
      return "activityLevel";
    case "activityLevel":
      return "chairRise";
    case "chairRise":
      return onHandlesBranch(answers) ? "standingComfort" : "challengeArea";
    case "challengeArea":
    case "standingComfort":
      return "reinforcement2";
    case "reinforcement2":
      return "sedentaryLifestyle";
    case "sedentaryLifestyle":
      return "frequency";
    case "frequency":
      return "bodyAreas";
    case "bodyAreas":
      return "planBuilding";
    case "planBuilding":
      return "time";
    case "time":
      return "register";
    case "register":
      return "otp";
    case "otp":
      return "payment";
    default:
      return null;
  }
}

/** The caption over each progress section, as the apps write them (StepIndicator). */
export const SECTION_LABELS = ["נעים להכיר", "מכירים אתכם טוב יותר", "התאמה אישית"] as const;

export type Indicator = { index: number; total: number; label: string };

/**
 * The apps' progress sections: each runs up to a reinforcement screen and
 * restarts after it. Exactly one of challengeArea / standingComfort shows.
 */
function sections(answers: Answers): Step[][] {
  const branch: Step = onHandlesBranch(answers) ? "standingComfort" : "challengeArea";
  return [
    ["goals", "gender", "dob"],
    ["desiredFeeling", "memoryForgetfulness", "chairRise", branch],
    ["sedentaryLifestyle", "frequency", "bodyAreas"],
  ];
}

/** The step's position in its section, or null for screens without a bar. */
export function indicator(step: Step, answers: Answers): Indicator | null {
  const all = sections(answers);
  for (let s = 0; s < all.length; s++) {
    const i = all[s].indexOf(step);
    if (i >= 0) return { index: i + 1, total: all[s].length, label: SECTION_LABELS[s] };
  }
  return null;
}

/** goals is the first question: nothing before it may be returned to. */
export const clearsHistory = (step: Step) => step === "goals";

/** Remove the follow-up answer that belongs to the branch the user is no longer on. */
export function cleanOffBranch(answers: Answers): Answers {
  const { standing_stability, mobility_challenge, ...rest } = answers;
  if (onHandlesBranch(answers)) return standing_stability ? { ...rest, standing_stability } : rest;
  return mobility_challenge ? { ...rest, mobility_challenge } : rest;
}
