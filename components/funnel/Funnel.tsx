"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { advance, back, codeSent, initialState, restore, showHours, showPhone, type FunnelState } from "@/lib/funnel/machine";
import { VIEW_EVENT, type ActionEvent } from "@/lib/funnel/events";
import { cleanOffBranch, indicator } from "@/lib/funnel/routing";
import { loadSession, loadStep, resetSession, saveAnswers, saveStep } from "@/lib/funnel/storage";
import type { Segment } from "@/lib/funnel/time";
import { trackFunnelEvent } from "@/lib/funnel/track";
import type { Answers, Step } from "@/lib/funnel/types";
import FunnelChrome from "./FunnelChrome";
import { STEP_TITLE_ID } from "./parts";
import { renderStep, type StepActions } from "./steps";

/** The continue taps the app reports as their own events, by the step they leave. */
const CONTINUE_EVENT: Partial<Record<Step, ActionEvent>> = {
  socialProof: "social_proof_continue",
  reinforcement2: "reinforcement2_continue",
  planBuilding: "plan_build_complete",
};

const track = (event: Parameters<typeof trackFunnelEvent>[1]) => trackFunnelEvent(loadSession().id, event);

/**
 * The questionnaire's state owner. It holds the step, the back history and
 * the answers, persists them through lib/funnel/storage, and hands each step
 * its slice of state and the actions it may take. Steps are presentational.
 *
 * The server renders welcome2; on mount the saved session (if any) replaces it
 * (lib/funnel/resume-script hides welcome2 from a returning visitor until then),
 * and the root gets data-ready.
 */
export default function Funnel() {
  const [state, setState] = useState<FunnelState>(initialState);
  // Counts navigations, so focus moves to the new heading on every move but not on the first paint.
  const [moves, setMoves] = useState(0);
  // The step the saved session restored to; null until the restore has run.
  const [restored, setRestored] = useState<Step | null>(null);
  // Signed in and merged: nothing to go back to, and cancelling no longer applies.
  const [complete, setComplete] = useState(false);
  // A code is being checked or the answers merged: back would strand that work.
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { answers } = loadSession();
    const next = restore(loadStep(), answers);
    setState(next);
    setRestored(next.step);
  }, []);

  // Runs after the restored step has rendered: lift the pre-hydration hide
  // (even when the restore landed on welcome2), and put a returning visitor
  // on their step's heading.
  useEffect(() => {
    if (restored === null) return;
    delete document.documentElement.dataset.funnelResume;
    if (restored !== "welcome2") document.getElementById(STEP_TITLE_ID)?.focus({ preventScroll: true });
  }, [restored]);

  // One view event per visit to a step. The ref survives React's dev double-run of effects, and
  // sub-screens of one step (time, register) change `state.step` not at all, so they do not repeat.
  const viewed = useRef<Step | null>(null);
  useEffect(() => {
    if (restored === null || viewed.current === state.step) return;
    viewed.current = state.step;
    track(VIEW_EVENT[state.step]);
  }, [restored, state.step]);

  useEffect(() => {
    if (moves === 0) return;
    document.getElementById(STEP_TITLE_ID)?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [moves]);

  const go = useCallback((next: FunnelState) => {
    setState(next);
    saveStep(next.step);
    setMoves((n) => n + 1);
  }, []);

  const actions = useMemo<StepActions>(
    () => ({
      setDraft: (patch: Answers) => setState((s) => ({ ...s, draft: { ...s.draft, ...patch } })),
      answer: (patch: Answers) => {
        const answers = cleanOffBranch({ ...state.answers, ...patch });
        saveAnswers(answers);
        go(advance(state, answers));
      },
      advance: () => {
        const event = CONTINUE_EVENT[state.step];
        if (event) track(event);
        go(advance(state));
      },
      start: () => {
        track("welcome2_continue"); // under the session that is about to be replaced
        resetSession();
        loadSession(); // mints the new session id
        go(advance({ ...initialState() }));
      },
      setSegment: (segment: Segment) => setState((s) => ({ ...s, time: { ...s.time, segment } })),
      showHours: () => {
        if (state.time.segment) go(showHours(state, state.time.segment));
      },
      saveName: (name: string) => {
        const answers = cleanOffBranch({ ...state.answers, full_name: name });
        saveAnswers(answers);
        track("register_name_submit");
        go(showPhone({ ...state, answers }));
      },
      codeSent: (phone: string) => {
        track("register_submit");
        go(codeSent(state, phone));
      },
      editPhone: () => {
        track("otp_edit_phone_tap");
        go(back(state));
      },
      complete: () => setComplete(true),
      setBusy,
    }),
    [state, go],
  );

  const onBack = useCallback(() => go(back(state)), [state, go]);

  const { step } = state;
  const canGoBack =
    !complete &&
    !busy &&
    (state.history.length > 0 ||
      (step === "time" && state.time.sub === "B") ||
      (step === "register" && state.register.sub === "phone"));

  return (
    <div
      data-funnel-root=""
      data-ready={restored === null ? undefined : ""}
      className="bg-sunken pb-[clamp(3.5rem,7vw,6rem)] pt-[clamp(1.25rem,3vw,2.5rem)]"
    >
      <div className="mx-auto max-w-[860px] gutter-x">
        <FunnelChrome
          dot={indicator(step, state.answers)}
          canGoBack={canGoBack}
          bare={step === "planBuilding" || complete}
          register={step === "register" ? state.register.sub : null}
          onBack={onBack}
        />
        <section
          key={`${step}-${state.time.sub}-${state.register.sub}`}
          aria-labelledby={STEP_TITLE_ID}
          data-step={step}
          className="mt-[clamp(1.5rem,3vw,2.25rem)]"
        >
          {renderStep(state, actions)}
        </section>
      </div>
    </div>
  );
}
