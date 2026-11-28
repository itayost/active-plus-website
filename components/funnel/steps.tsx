import { useEffect, useRef, useState, type ReactElement } from "react";
import { MY_PLAN_PATH } from "@/lib/funnel/constants";
import { COPY, g, type Gendered, type GenderedOption, type IconOption, type Plain } from "@/lib/funnel/copy";
import { ageImage } from "@/lib/funnel/images";
import type { FunnelState } from "@/lib/funnel/machine";
import { toggleBodyArea } from "@/lib/funnel/payload";
import type { Segment } from "@/lib/funnel/time";
import type { Answers, Step } from "@/lib/funnel/types";
import BodyAreas from "./BodyAreas";
import LevelPreview from "./LevelPreview";
import { GoalReinforcement, Reinforcement2, Welcome2 } from "./Interstitial";
import OptionList, { type Option } from "./OptionList";
import Otp from "./Otp";
import { ContinueButton, FootNote, Lines, StepTitle, Subtitle } from "./parts";
import PhotoChoice from "./PhotoChoice";
import PlanBuilding from "./PlanBuilding";
import Register from "./Register";
import TimeStep from "./TimeStep";
import { useGoalsVariant } from "./useGoalsVariant";

/** What a step can ask of the funnel. The funnel owns all state; steps only render it. */
export type StepActions = {
  /** Hold an unconfirmed choice for the current screen. */
  setDraft: (patch: Answers) => void;
  /** Save these answers, then move on. */
  answer: (patch: Answers) => void;
  /** Move on without answering (interstitials, the loader). */
  advance: () => void;
  /** welcome2's start: a fresh session, then the first question. */
  start: () => void;
  setSegment: (segment: Segment) => void;
  showHours: () => void;
  /** register: save the name, then ask for the phone. */
  saveName: (name: string) => void;
  /** The SMS code is on its way to this number: on to otp. */
  codeSent: (phone: string) => void;
  /** otp's "ערוך מספר": back to the phone screen, number kept. */
  editPhone: () => void;
  /** Signed in and merged: the chrome drops back and cancel. */
  complete: () => void;
  /** A code is being sent or checked, or the answers merged: the chrome hides back meanwhile. */
  setBusy: (busy: boolean) => void;
};

type Text = string | Gendered;
type Question = {
  key: keyof Answers;
  title: Text;
  subtitle?: Text;
  options: readonly (Plain | GenderedOption | IconOption)[];
  /** The continue button's label; the apps' gendered "המשיכי / המשך" when absent. */
  cta?: Text;
  /** The answer is stored as a one-element array (training_goals). */
  asList?: boolean;
};

const QUESTIONS: Partial<Record<Step, Question>> = {
  goals: { key: "training_goals", ...COPY.goals, cta: COPY.common.next, asList: true },
  desiredFeeling: { key: "desired_feeling", ...COPY.desiredFeeling },
  memoryForgetfulness: { key: "memory_forgetfulness", ...COPY.memoryForgetfulness },
  chairRise: { key: "chair_rise_capability", ...COPY.chairRise },
  challengeArea: { key: "mobility_challenge", ...COPY.challengeArea },
  standingComfort: { key: "standing_stability", ...COPY.standingComfort },
  sedentaryLifestyle: { key: "sedentary_lifestyle", ...COPY.sedentaryLifestyle },
  frequency: { key: "training_frequency_choice", ...COPY.frequency },
};

type Gender = Answers["gender"];
const text = (t: Text, gender: Gender) => (typeof t === "string" ? t : g(gender, t.fem, t.masc));
const optionOf = (o: Plain | GenderedOption | IconOption, gender: Gender): Option => ({
  value: o.value,
  label: "label" in o ? o.label : g(gender, o.fem, o.masc),
  ...("icon" in o ? { icon: o.icon } : {}),
});
const continueLabel = (gender: Gender) => g(gender, COPY.common.continue.fem, COPY.common.continue.masc);

function QuestionStep({ question, state, actions }: { question: Question; state: FunnelState; actions: StepActions }) {
  const gender = state.answers.gender;
  const draft = state.draft[question.key];
  // Every answer screen opens with nothing chosen, back or forward (owner, 2026-11-14):
  // only this visit's tap is shown, never the answer saved before.
  const value = Array.isArray(draft) ? draft[0] : draft;
  const options = question.options.map((o) => optionOf(o, gender));
  const pick = (v: string) => ({ [question.key]: question.asList ? [v] : v }) as Answers;
  return (
    <>
      <StepTitle>
        <Lines text={text(question.title, gender)} />
      </StepTitle>
      {question.subtitle ? <Subtitle text={text(question.subtitle, gender)} /> : null}
      <OptionList
        name={question.key}
        options={options}
        value={value}
        onChange={(v) => actions.setDraft(pick(v))}
      />
      <ContinueButton
        pinned
        label={question.cta ? text(question.cta, gender) : continueLabel(gender)}
        disabled={!value}
        onClick={() => value && actions.answer(pick(value))}
      />
    </>
  );
}

/** How long the chosen photo stays marked before the next question (photo version only). */
const PHOTO_ADVANCE_MS = 450;

/**
 * The goals question, in the visitor's version (lib/funnel/goals-variant): the
 * list as it was, or four photos where a tap moves on by itself. Until the
 * version is known (the first render) only the screen's frame is drawn.
 */
function GoalsStep({ state, actions }: { state: FunnelState; actions: StepActions }) {
  const variant = useGoalsVariant();
  if (variant === "list") return <QuestionStep question={QUESTIONS.goals as Question} state={state} actions={actions} />;
  if (variant === "photo") return <GoalsPhotoStep actions={actions} />;
  return <div aria-hidden className="min-h-[60vh]" />;
}

function GoalsPhotoStep({ actions }: { actions: StepActions }) {
  const [chosen, setChosen] = useState<string>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const choose = (value: string) => {
    if (chosen) return;
    setChosen(value);
    actions.setDraft({ training_goals: [value] });
    timer.current = setTimeout(() => actions.answer({ training_goals: [value] }), PHOTO_ADVANCE_MS);
  };
  return (
    <>
      <StepTitle>{COPY.goalsPhoto.title}</StepTitle>
      <Subtitle text={COPY.goalsPhoto.subtitle} />
      <PhotoChoice options={COPY.goalsPhoto.options} value={chosen} aspect="portrait" onChoose={choose} />
      <FootNote text={COPY.goalsPhoto.note} />
    </>
  );
}

function GenderStep({ state, actions }: { state: FunnelState; actions: StepActions }) {
  const gender = state.draft.gender;
  return (
    <>
      <StepTitle>{COPY.gender.title}</StepTitle>
      <Subtitle text={COPY.gender.subtitle} />
      <PhotoChoice
        options={COPY.gender.options}
        value={gender}
        aspect="portrait"
        onChoose={(value) => actions.setDraft({ gender: value as Gender })}
      />
      <FootNote text={COPY.common.trust} lock />
      <ContinueButton
        pinned
        label={continueLabel(gender ?? state.answers.gender)}
        disabled={!gender}
        onClick={() => gender && actions.answer({ gender })}
      />
    </>
  );
}

function AgeGroupStep({ state, actions }: { state: FunnelState; actions: StepActions }) {
  const options = COPY.ageGroup.options.map((o) => ({ value: o.value, label: o.label, image: ageImage(state.answers.gender, o.file) }));
  const ageGroup = state.draft.age_group;
  return (
    <>
      <StepTitle>{COPY.ageGroup.title}</StepTitle>
      <Subtitle text={COPY.ageGroup.subtitle} />
      <PhotoChoice
        options={options}
        value={ageGroup}
        aspect="landscape"
        onChoose={(age_group) => actions.setDraft({ age_group })}
      />
      <FootNote text={COPY.common.trust} lock />
      <ContinueButton
        pinned
        label={continueLabel(state.answers.gender)}
        disabled={!ageGroup}
        onClick={() => ageGroup && actions.answer({ age_group: ageGroup })}
      />
    </>
  );
}

function BodyAreasStep({ state, actions }: { state: FunnelState; actions: StepActions }) {
  const gender = state.answers.gender;
  const selected = state.draft.pain_areas ?? [];
  // Every tap only selects, "no pain" included; the button moves on (owner, 2026-11-10).
  const toggle = (area: string) => actions.setDraft({ pain_areas: toggleBodyArea(selected, area) });
  return (
    <>
      <StepTitle>{COPY.bodyAreas.title}</StepTitle>
      <BodyAreas options={COPY.bodyAreas.options} selected={selected} gender={gender} onToggle={toggle} />
      <ContinueButton
        pinned
        label={continueLabel(gender)}
        disabled={selected.length === 0}
        onClick={() => actions.answer({ pain_areas: selected })}
      />
    </>
  );
}

/** The element for the current step. `sessionId` is the funnel's, read once (Funnel). */
export function renderStep(state: FunnelState, actions: StepActions, sessionId: string): ReactElement {
  const { step, answers } = state;
  const gender = answers.gender;
  if (step === "goals") return <GoalsStep state={state} actions={actions} />;
  const question = QUESTIONS[step];
  if (question) return <QuestionStep question={question} state={state} actions={actions} />;

  switch (step) {
    case "welcome2":
      return <Welcome2 onContinue={actions.start} />;
    case "gender":
      return <GenderStep state={state} actions={actions} />;
    case "dob":
      return <AgeGroupStep state={state} actions={actions} />;
    case "goalReinforcement":
      return <GoalReinforcement gender={gender} goal={answers.training_goals?.[0]} onContinue={actions.advance} />;
    case "levelPreview":
      return <LevelPreview answers={answers} onChoose={(level) => actions.answer({ functionality_level: level })} />;
    case "reinforcement2":
      return <Reinforcement2 gender={gender} onContinue={actions.advance} />;
    case "bodyAreas":
      return <BodyAreasStep state={state} actions={actions} />;
    case "planBuilding":
      return <PlanBuilding painAreas={answers.pain_areas} onDone={actions.advance} />;
    case "time":
      return (
        <TimeStep
          view={state.time}
          gender={gender}
          saved={undefined}
          draft={state.draft.training_time_of_day}
          onSegment={actions.setSegment}
          onShowHours={actions.showHours}
          onTime={(t) => actions.setDraft({ training_time_of_day: t })}
          onConfirmCustom={(t) => actions.answer({ training_time_of_day: t })}
          onContinue={() => {
            const time = state.draft.training_time_of_day;
            if (time) actions.answer({ training_time_of_day: time });
          }}
        />
      );
    case "otp":
      return (
        <Otp
          phone={state.register.phone}
          answers={answers}
          sessionId={sessionId}
          onEditPhone={actions.editPhone}
          onComplete={(kind) => {
            actions.complete();
            // A new account sees its 28-day plan, then the plans, then the app (pay first);
            // an existing user gets the welcome-back screen and its link instead.
            if (kind === "new") window.location.assign(MY_PLAN_PATH);
          }}
          onBusy={actions.setBusy}
        />
      );
    default:
      // register; payment is its own page and never resumes here (lib/funnel/history).
      return (
        <Register
          view={state.register}
          gender={gender}
          name={state.draft.full_name ?? answers.full_name ?? ""}
          onNameChange={(full_name) => actions.setDraft({ full_name })}
          onName={actions.saveName}
          onCodeSent={actions.codeSent}
          onBusy={actions.setBusy}
        />
      );
  }
}
