import type { ReactElement } from "react";
import { birthYears, defaultBirthYear, yearOf } from "@/lib/funnel/age";
import { COPY, g, type Gendered, type GenderedOption, type Plain } from "@/lib/funnel/copy";
import type { FunnelState } from "@/lib/funnel/machine";
import { dobFromYear, toggleBodyArea } from "@/lib/funnel/payload";
import type { Segment } from "@/lib/funnel/time";
import type { Answers, Step } from "@/lib/funnel/types";
import BodyAreas from "./BodyAreas";
import { Reinforcement2, SocialProof, Welcome2 } from "./Interstitial";
import OptionList from "./OptionList";
import Otp from "./Otp";
import { ContinueButton, FootNote, Lines, StepTitle, Subtitle } from "./parts";
import PlanBuilding from "./PlanBuilding";
import Register from "./Register";
import TimeStep from "./TimeStep";
import YearSelect from "./YearSelect";

/** What a step can ask of the funnel. The funnel owns all state; steps only render it. */
export type StepActions = {
  /** Hold an unconfirmed choice for the current screen. */
  setDraft: (patch: Answers) => void;
  /** Save these answers, then move on. */
  answer: (patch: Answers) => void;
  /** Move on without answering (interstitials, the loader). */
  advance: () => void;
  /** welcome2's start: a fresh session, then gender. */
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
};

type Text = string | Gendered;
type Question = {
  key: keyof Answers;
  title: Text;
  subtitle?: Text;
  options: readonly (Plain | GenderedOption)[];
  lockFoot?: boolean;
};

const QUESTIONS: Partial<Record<Step, Question>> = {
  gender: { key: "gender", ...COPY.gender, lockFoot: true },
  aspiration: { key: "aspiration_goal", ...COPY.aspiration },
  activityLevel: { key: "daily_activity_level", ...COPY.activityLevel },
  chairRise: { key: "chair_rise_capability", ...COPY.chairRise },
  challengeArea: { key: "mobility_challenge", ...COPY.challengeArea },
  standingComfort: { key: "standing_stability", ...COPY.standingComfort },
  frequency: { key: "training_frequency_choice", ...COPY.frequency },
};

type Gender = Answers["gender"];
const text = (t: Text, gender: Gender) => (typeof t === "string" ? t : g(gender, t.fem, t.masc));
const optionLabel = (o: Plain | GenderedOption, gender: Gender) =>
  "label" in o ? o.label : g(gender, o.fem, o.masc);

function QuestionStep({ question, state, actions }: { question: Question; state: FunnelState; actions: StepActions }) {
  const gender = state.answers.gender;
  const value = (state.draft[question.key] ?? state.answers[question.key]) as string | undefined;
  const options = question.options.map((o) => ({ value: o.value, label: optionLabel(o, gender) }));
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
        onChange={(v) => actions.setDraft({ [question.key]: v })}
      />
      <ContinueButton disabled={!value} onClick={() => actions.answer({ [question.key]: value })} />
      {question.lockFoot ? <FootNote text={COPY.common.trust} lock /> : null}
    </>
  );
}

function DobStep({ state, actions }: { state: FunnelState; actions: StepActions }) {
  const currentYear = new Date().getFullYear();
  const year = yearOf(state.draft.date_of_birth ?? state.answers.date_of_birth) ?? defaultBirthYear(currentYear);
  return (
    <>
      <StepTitle>{COPY.dob.title}</StepTitle>
      <Subtitle text={COPY.dob.subtitle} />
      <YearSelect
        years={birthYears(currentYear)}
        value={year}
        onChange={(y) => actions.setDraft({ date_of_birth: dobFromYear(y) })}
      />
      <p className="mt-4 text-ink-soft">{COPY.dob.privacy}</p>
      <ContinueButton onClick={() => actions.answer({ date_of_birth: dobFromYear(year) })} />
      <FootNote text={COPY.dob.footer} />
    </>
  );
}

function BodyAreasStep({ state, actions }: { state: FunnelState; actions: StepActions }) {
  const selected = state.draft.pain_areas ?? state.answers.pain_areas ?? [];
  return (
    <>
      <StepTitle>{COPY.bodyAreas.title}</StepTitle>
      <BodyAreas
        options={COPY.bodyAreas.options}
        selected={selected}
        onToggle={(area) => actions.setDraft({ pain_areas: toggleBodyArea(selected, area) })}
      />
      <ContinueButton disabled={selected.length === 0} onClick={() => actions.answer({ pain_areas: selected })} />
    </>
  );
}

/** The element for the current step. */
export function renderStep(state: FunnelState, actions: StepActions): ReactElement {
  const { step, answers } = state;
  const gender = answers.gender;
  const question = QUESTIONS[step];
  if (question) return <QuestionStep question={question} state={state} actions={actions} />;

  switch (step) {
    case "welcome2":
      return <Welcome2 onContinue={actions.start} />;
    case "dob":
      return <DobStep state={state} actions={actions} />;
    case "socialProof":
      return <SocialProof gender={gender} dob={answers.date_of_birth} onContinue={actions.advance} />;
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
          onEditPhone={actions.editPhone}
          onComplete={actions.complete}
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
        />
      );
  }
}
