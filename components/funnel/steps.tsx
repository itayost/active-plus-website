import type { ReactElement } from "react";
import { COPY, g, type Gendered, type GenderedOption, type IconOption, type Plain } from "@/lib/funnel/copy";
import type { FunnelState } from "@/lib/funnel/machine";
import { toggleBodyArea } from "@/lib/funnel/payload";
import type { Segment } from "@/lib/funnel/time";
import type { Answers, Step } from "@/lib/funnel/types";
import BodyAreas from "./BodyAreas";
import { GoalReinforcement, Reinforcement2, Welcome2 } from "./Interstitial";
import OptionList, { type Option } from "./OptionList";
import Otp from "./Otp";
import { ContinueButton, FootNote, Lines, StepTitle, Subtitle } from "./parts";
import PhotoChoice from "./PhotoChoice";
import PlanBuilding from "./PlanBuilding";
import Register from "./Register";
import TimeStep from "./TimeStep";

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
  const saved = state.answers[question.key];
  const draft = state.draft[question.key];
  // goals always opens empty, as in the apps (a fresh pick on every visit).
  const value = (Array.isArray(draft) ? draft[0] : draft) ?? (question.asList ? undefined : (saved as string | undefined));
  const options = question.options.map((o) => optionOf(o, gender));
  const pick = (v: string) => ({ [question.key]: question.asList ? [v] : v }) as Answers;
  return (
    <>
      <StepTitle>
        <Lines text={text(question.title, gender)} />
      </StepTitle>
      {question.subtitle ? <Subtitle text={text(question.subtitle, gender)} /> : null}
      <OptionList name={question.key} options={options} value={value} onChange={(v) => actions.setDraft(pick(v))} />
      <ContinueButton
        pinned
        label={question.cta ? text(question.cta, gender) : continueLabel(gender)}
        disabled={!value}
        onClick={() => value && actions.answer(pick(value))}
      />
    </>
  );
}

function GenderStep({ state, actions }: { state: FunnelState; actions: StepActions }) {
  return (
    <>
      <StepTitle>{COPY.gender.title}</StepTitle>
      <Subtitle text={COPY.gender.subtitle} />
      <PhotoChoice
        options={COPY.gender.options}
        value={state.answers.gender}
        aspect="portrait"
        onChoose={(gender) => actions.answer({ gender })}
      />
      <FootNote text={COPY.common.trust} lock />
    </>
  );
}

function AgeGroupStep({ state, actions }: { state: FunnelState; actions: StepActions }) {
  const set = state.answers.gender === "male" ? "male" : "female";
  const options = COPY.ageGroup.options.map((o) => ({ value: o.value, label: o.label, image: `/img/funnel/app/age-${set}-${o.file}.webp` }));
  return (
    <>
      <StepTitle>{COPY.ageGroup.title}</StepTitle>
      <Subtitle text={COPY.ageGroup.subtitle} />
      <PhotoChoice
        options={options}
        value={state.answers.age_group}
        aspect="landscape"
        onChoose={(age_group) => actions.answer({ age_group })}
      />
      <FootNote text={COPY.common.trust} lock />
    </>
  );
}

function BodyAreasStep({ state, actions }: { state: FunnelState; actions: StepActions }) {
  const gender = state.answers.gender;
  const selected = state.draft.pain_areas ?? state.answers.pain_areas ?? [];
  const toggle = (area: string) => {
    const next = toggleBodyArea(selected, area);
    // "no pain" is the commonest answer: a tap on it moves straight on (owner, 2026-10-21).
    if (area === "none" && next.includes("none")) actions.answer({ pain_areas: next });
    else actions.setDraft({ pain_areas: next });
  };
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
    case "reinforcement2":
      return <Reinforcement2 gender={gender} onContinue={actions.advance} />;
    case "bodyAreas":
      return <BodyAreasStep state={state} actions={actions} />;
    case "planBuilding":
      return <PlanBuilding onDone={actions.advance} />;
    case "time":
      return (
        <TimeStep
          view={state.time}
          gender={gender}
          saved={answers.training_time_of_day}
          draft={state.draft.training_time_of_day}
          onSegment={actions.setSegment}
          onShowHours={actions.showHours}
          onTime={(t) => actions.setDraft({ training_time_of_day: t })}
          onConfirmCustom={(t) => actions.answer({ training_time_of_day: t })}
          onContinue={() => {
            const time = state.draft.training_time_of_day ?? answers.training_time_of_day;
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
          onComplete={actions.complete}
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
