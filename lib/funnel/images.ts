import { COPY } from "./copy";
import { nextStep } from "./routing";
import type { Answers, Step } from "./types";

/**
 * Every photo the questionnaire shows, by step, in one place, so the screens
 * and the preloader (components/funnel/usePreloadImages) ask next/image for
 * the very same files at the very same sizes. A step's photo used to be
 * requested only once the step was on screen, which left an empty box for
 * half a second or more on a phone; warming the next screens removes that.
 */

export const IMG = "/img/funnel/app";

/** next/image `sizes` per kind of photo; the screens pass the same string. */
export const SIZES = {
  /** Full-screen photo screens, in a column at most 560px wide. */
  screen: "(min-width: 560px) 560px, 100vw",
  /** Two photo cards per row (gender, age). */
  card: "(min-width: 560px) 260px, 45vw",
  /** The body figure on bodyAreas. */
  body: "150px",
} as const;

export type FunnelImage = { src: string; sizes: string };

type Gender = Answers["gender"];
type GoalKey = keyof typeof COPY.goalReinforcement;

const isGoal = (goal: string | undefined): goal is GoalKey =>
  goal !== undefined && Object.prototype.hasOwnProperty.call(COPY.goalReinforcement, goal);

/** The goal screen's photo: the goal's own for a woman, one photo for a man (strength when no goal was saved). */
export function goalImage(gender: Gender, goal: string | undefined): string {
  const copy = COPY.goalReinforcement[isGoal(goal) ? goal : "strength"];
  return `${IMG}/${gender === "female" ? copy.female : "goal-male"}.webp`;
}

export const reinforcement2Image = (gender: Gender) =>
  `${IMG}/${gender === "female" ? "reinforcement2-female" : "reinforcement2-male"}.webp`;

export const ageImage = (gender: Gender, file: string) => `${IMG}/age-${gender === "male" ? "male" : "female"}-${file}.webp`;

export const BODY_MODEL = {
  male: { src: `${IMG}/body-male.webp`, width: 274, height: 878 },
  female: { src: `${IMG}/body-female.webp`, width: 295, height: 876 },
} as const;

const many = (sizes: string, srcs: readonly string[]): FunnelImage[] => srcs.map((src) => ({ src, sizes }));

/**
 * The photos a step shows. With the gender still unknown, the small age cards
 * of both sets are listed and the large gendered photos are not: they would
 * fetch a screen-sized photo for the wrong person.
 */
export function stepImages(step: Step, answers: Answers): FunnelImage[] {
  const gender = answers.gender;
  switch (step) {
    case "welcome2":
      return many(SIZES.screen, [`${IMG}/entry-hero.webp`]);
    case "gender":
      return many(SIZES.card, COPY.gender.options.map((o) => o.image));
    case "dob": {
      const sets: Gender[] = gender ? [gender] : ["female", "male"];
      return many(SIZES.card, sets.flatMap((g) => COPY.ageGroup.options.map((o) => ageImage(g, o.file))));
    }
    case "goalReinforcement":
      return gender ? many(SIZES.screen, [goalImage(gender, answers.training_goals?.[0])]) : [];
    case "reinforcement2":
      return gender ? many(SIZES.screen, [reinforcement2Image(gender)]) : [];
    case "bodyAreas":
      return gender ? many(SIZES.body, [BODY_MODEL[gender === "female" ? "female" : "male"].src]) : [];
    default:
      return [];
  }
}

/** How many screens ahead to warm: enough to cover a fast tapper, little enough to stay light on mobile data. */
const LOOKAHEAD = 2;

/** The photos of the next screens, nearest first, without the current step's own. */
export function upcomingImages(step: Step, answers: Answers): FunnelImage[] {
  const out: FunnelImage[] = [];
  let next = nextStep(step, answers);
  for (let i = 0; i < LOOKAHEAD && next; i++) {
    out.push(...stepImages(next, answers));
    next = nextStep(next, answers);
  }
  return out;
}
