"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { advance, canGoBack, codeSent, initialState, restore, showHours, showPhone, type FunnelState } from "@/lib/funnel/machine";
import { VIEW_EVENT, type ActionEvent, type FunnelEventName } from "@/lib/funnel/events";
import { cleanOffBranch, firstStep, indicator } from "@/lib/funnel/routing";
import { loadSession, loadStep, resetSession, saveAnswers, saveStep } from "@/lib/funnel/storage";
import type { Segment } from "@/lib/funnel/time";
import { trackFunnelEvent } from "@/lib/funnel/track";
import type { Answers, Step } from "@/lib/funnel/types";
import FunnelChrome from "./FunnelChrome";
import { STEP_TITLE_ID } from "./parts";
import { renderStep, type StepActions } from "./steps";
import { useBrowserBack } from "./useBrowserBack";
import { usePreloadImages } from "./usePreloadImages";

/** The continue taps the app reports as their own events, by the step they leave. */
const CONTINUE_EVENT: Partial<Record<Step, ActionEvent>> = {
  goalReinforcement: "goal_reinforcement_continue",
  reinforcement2: "reinforcement2_continue",
  planBuilding: "plan_build_complete",
};

/** The screens whose photo fills the screen, with the top row drawn over it. */
const PHOTO_STEPS: ReadonlySet<Step> = new Set(["welcome2", "goalReinforcement", "reinforcement2"]);

/**
 * The questionnaire's state owner. It holds the step, the back history and
 * the answers, persists them through lib/funnel/storage, and hands each step
 * its slice of state and the actions it may take. Steps are presentational.
 *
 * The server renders welcome2 (the entry screen); on mount the saved session (if any) replaces it
 * (lib/funnel/resume-script hides welcome2 from a returning visitor until then),
 * and the root gets data-ready.
 */
export default function Funnel() {
  const [state, setState] = useState<FunnelState>(initialState);
  // Counts navigations, so focus moves to the new heading on every move but not on the first paint.
  const [moves, setMoves] = useState(0);
  // The step the saved session restored to; null until the restore has run.
  const [restored, setRestored] = useState<Step | null>(null);
  // The id every event and the merge carry. Read from storage once (on restore and on welcome2's
  // start): with storage blocked each read mints a new id, and another tab may replace the stored one.
  const [sessionId, setSessionId] = useState("");
  // Signed in and merged: nothing to go back to, and cancelling no longer applies.
  const [complete, setComplete] = useState(false);
  // A code is being sent or checked, or the answers merged: back would strand that work.
  const [busy, setBusy] = useState(false);
  // Which way the last move went, so the new screen slides in from the side it came from; null before any move.
  const [enter, setEnter] = useState<"forward" | "back" | null>(null);

  /**
   * Shows a screen and saves where the visitor is; the browser history is the caller's business.
   * Only go() moves forward: every other caller (the browser's back, the back arrow) goes back.
   */
  const show = useCallback((next: FunnelState, direction: "forward" | "back" = "back") => {
    setState(next);
    saveStep(next.step);
    setMoves((n) => n + 1);
    setEnter(direction);
  }, []);

  const browser = useBrowserBack({ state, blocked: busy || complete || state.step === "planBuilding", show });

  // `browser` is stable (its callbacks have stable deps), so this runs once.
  useEffect(() => {
    const { id, answers } = loadSession();
    const next = restore(loadStep(), answers);
    setSessionId(id);
    setState(next);
    setRestored(next.step);
    browser.tag();
  }, [browser]);

  // Runs after the restored step has rendered: lift the pre-hydration hide
  // (even when the restore landed on welcome2), and put a returning visitor
  // on their step's heading.
  useEffect(() => {
    if (restored === null) return;
    delete document.documentElement.dataset.funnelResume;
    if (restored !== "welcome2") document.getElementById(STEP_TITLE_ID)?.focus({ preventScroll: true });
  }, [restored]);

  // The next screens' photos load while this one is read (after the restore, so a returning visitor warms their own step's next).
  usePreloadImages(state.step, state.answers, restored !== null);

  const track = useCallback(
    (event: FunnelEventName) => {
      if (sessionId) trackFunnelEvent(sessionId, event);
    },
    [sessionId],
  );

  // One view event per visit to a step. The ref survives React's dev double-run of effects, and
  // sub-screens of one step (time, register) change `state.step` not at all, so they do not repeat.
  const viewed = useRef<Step | null>(null);
  useEffect(() => {
    if (restored === null || viewed.current === state.step) return;
    viewed.current = state.step;
    track(VIEW_EVENT[state.step]);
  }, [restored, state.step, track]);

  useEffect(() => {
    if (moves === 0) return;
    document.getElementById(STEP_TITLE_ID)?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [moves]);

  /** A forward move: the browser gets an entry for it when it adds a back. */
  const go = useCallback(
    (next: FunnelState) => {
      browser.forward(state, next);
      show(next, "forward");
    },
    [state, browser, show],
  );

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
        setSessionId(loadSession().id); // mints the new session id, read once
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
        browser.goBack(state);
      },
      complete: () => setComplete(true),
      setBusy,
    }),
    [state, go, track, browser],
  );

  const onBack = useCallback(() => browser.goBack(state), [state, browser]);

  const { step } = state;
  const photo = PHOTO_STEPS.has(step);
  const chrome = (
    <FunnelChrome
      bar={indicator(step, state.answers)}
      canGoBack={!complete && !busy && canGoBack(state)}
      showCancel={step === firstStep()}
      bare={step === "planBuilding" || complete}
      overPhoto={photo}
      register={step === "register" ? state.register.sub : null}
      onBack={onBack}
    />
  );
  /*
    Full screen on every device, like the apps: no site header or footer
    (SiteChrome), one column the width of a large phone, centred on desktop,
    filling the viewport's height so the continue button sits at the bottom.
  */
  return (
    <div data-funnel-root="" data-ready={restored === null ? undefined : ""} className="flex min-h-[100dvh] justify-center bg-sunken">
      <div className="relative flex w-full max-w-[560px] flex-col overflow-x-clip bg-sunken md:shadow-lift-2">
        {photo ? (
          <div className="absolute inset-x-0 top-0 z-20 px-2 pt-[max(0.5rem,env(safe-area-inset-top))]">{chrome}</div>
        ) : (
          <div className="px-2 pt-[max(0.5rem,env(safe-area-inset-top))]">{chrome}</div>
        )}
        <section
          key={`${step}-${state.time.sub}-${state.register.sub}`}
          aria-labelledby={STEP_TITLE_ID}
          data-step={step}
          // No slide on the first paint: welcome2 (or a restored step) is simply there.
          data-enter={enter ?? undefined}
          className={photo ? "flex flex-1 flex-col" : "gutter-x flex flex-1 flex-col pt-4"}
        >
          {renderStep(state, actions, sessionId)}
        </section>
      </div>
    </div>
  );
}
