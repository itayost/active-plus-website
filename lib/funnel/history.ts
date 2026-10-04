import { nextStep } from "./routing";
import type { Answers, Step } from "./types";

/** The answer each question step must hold before the visitor can be past it. */
const ANSWER_OF: Partial<Record<Step, keyof Answers>> = {
  gender: "gender",
  dob: "date_of_birth",
  aspiration: "aspiration_goal",
  activityLevel: "daily_activity_level",
  chairRise: "chair_rise_capability",
  challengeArea: "mobility_challenge",
  standingComfort: "standing_stability",
  frequency: "training_frequency_choice",
  bodyAreas: "pain_areas",
  time: "training_time_of_day",
};

/** Steps that are passed through, never returned to with back. */
const TRANSIENT: ReadonlySet<Step> = new Set(["planBuilding"]);

/** A saved step that cannot be resumed as-is, mapped to where the visitor picks up instead. */
const RESUME_AS: Partial<Record<Step, Step>> = { otp: "register" };

function isAnswered(step: Step, answers: Answers): boolean {
  const key = ANSWER_OF[step];
  if (!key) return true;
  const value = answers[key];
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

/** The route from gender to `target` (exclusive) that these answers take, or null if it never arrives. */
function routeTo(target: Step, answers: Answers): Step[] | null {
  const route: Step[] = [];
  for (let step: Step | null = "gender"; step; step = nextStep(step, answers)) {
    if (step === target) return route;
    route.push(step);
  }
  return null;
}

/**
 * Where a returning visitor lands: the saved step, unless an earlier question
 * on the route their answers take is still unanswered, in which case that one.
 */
export function resumeStep(saved: Step | null, answers: Answers): Step {
  if (!saved || saved === "welcome2") return "welcome2";
  const target = RESUME_AS[saved] ?? saved;
  for (let step: Step | null = "gender"; step; step = nextStep(step, answers)) {
    if (step === target || !isAnswered(step, answers)) return step;
  }
  return "gender";
}

/** The back stack for a resumed step: the route walked so far, minus pass-through steps. */
export function restoreHistory(step: Step, answers: Answers): Step[] {
  if (step === "welcome2") return [];
  return (routeTo(step, answers) ?? []).filter((s) => !TRANSIENT.has(s));
}

export const isTransient = (step: Step): boolean => TRANSIENT.has(step);
