import { isTransient, restoreHistory, resumeStep } from "./history";
import { clearsHistory, nextStep } from "./routing";
import { segmentOf, type Segment } from "./time";
import type { Answers, Step } from "./types";

/** The time step's two screens: A picks the part of the day, B the hour within it. */
export type TimeView = { sub: "A" | "B"; segment: Segment | null };

export type FunnelState = {
  step: Step;
  /** Steps to return to with back, most recent last. */
  history: Step[];
  /** Saved answers (what localStorage holds). */
  answers: Answers;
  /** The current screen's unconfirmed choice; saved only on "המשך". */
  draft: Answers;
  time: TimeView;
};

export const initialState = (): FunnelState => ({
  step: "welcome2",
  history: [],
  answers: {},
  draft: {},
  time: { sub: "A", segment: null },
});

const timeView = (sub: TimeView["sub"], answers: Answers): TimeView => {
  const segment = segmentOf(answers.training_time_of_day);
  return { sub: sub === "B" && segment ? "B" : "A", segment };
};

function moveTo(state: FunnelState, target: Step, answers: Answers): FunnelState {
  const history = clearsHistory(target)
    ? []
    : isTransient(state.step)
      ? state.history
      : [...state.history, state.step];
  return {
    step: target,
    history,
    answers,
    draft: {},
    time: target === "time" ? timeView("A", answers) : state.time,
  };
}

/** Moves on along the route `answers` take (the freshly saved ones, when the move follows an answer). */
export function advance(state: FunnelState, answers: Answers = state.answers): FunnelState {
  const target = nextStep(state.step, answers);
  return target ? moveTo(state, target, answers) : { ...state, answers };
}

/** time A -> time B for the chosen part of the day. */
export const showHours = (state: FunnelState, segment: Segment): FunnelState => ({
  ...state,
  draft: {},
  time: { sub: "B", segment },
});

export function back(state: FunnelState): FunnelState {
  if (state.step === "time" && state.time.sub === "B") {
    return { ...state, draft: {}, time: { ...state.time, sub: "A" } };
  }
  // The app replays the 9.4s loader on back from time; the web goes straight to bodyAreas.
  const target = state.step === "time" ? "bodyAreas" : state.history.at(-1);
  if (!target) return state;
  const cut = state.history.lastIndexOf(target);
  return {
    ...state,
    step: target,
    history: cut >= 0 ? state.history.slice(0, cut) : state.history,
    draft: {},
    time: target === "time" ? timeView("B", state.answers) : state.time,
  };
}

/** The state a returning visitor resumes in. */
export function restore(saved: Step | null, answers: Answers): FunnelState {
  const step = resumeStep(saved, answers);
  return {
    ...initialState(),
    step,
    history: restoreHistory(step, answers),
    answers,
    time: timeView("A", answers),
  };
}
