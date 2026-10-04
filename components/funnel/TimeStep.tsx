"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Button from "@/components/ui/Button";
import { COPY, g } from "@/lib/funnel/copy";
import { defaultSlot, segmentOf, slotsFor, SEGMENTS, type Segment } from "@/lib/funnel/time";
import type { TimeView } from "@/lib/funnel/machine";
import type { Answers } from "@/lib/funnel/types";
import OptionList from "./OptionList";
import { ContinueButton, Lines, StepTitle, Subtitle } from "./parts";
import { NativeSelect } from "./YearSelect";

type Props = {
  view: TimeView;
  gender: Answers["gender"];
  /** The saved time, if any. */
  saved: string | undefined;
  /** The unconfirmed choice on this screen, if any. */
  draft: string | undefined;
  onSegment: (segment: Segment) => void;
  onShowHours: () => void;
  onTime: (time: string) => void;
  onContinue: () => void;
};

const SEGMENT_OPTIONS = COPY.time.periods;

function SegmentScreen({ view, onSegment, onShowHours }: Pick<Props, "view" | "onSegment" | "onShowHours">) {
  return (
    <>
      <StepTitle>
        <Lines text={COPY.time.periodTitle} />
      </StepTitle>
      <Subtitle text={COPY.time.periodSubtitle} />
      <OptionList
        name="segment"
        options={SEGMENT_OPTIONS}
        value={view.segment ?? undefined}
        onChange={(value) => onSegment(value as Segment)}
      />
      <ContinueButton disabled={!view.segment} onClick={onShowHours} />
    </>
  );
}

const OTHER_PANEL_ID = "funnel-other-hour";
const OTHER_SELECT_ID = "funnel-other-hour-select";

function HourScreen({ segment, gender, saved, draft, onTime, onContinue }: Omit<Props, "view" | "onSegment" | "onShowHours"> & { segment: Segment }) {
  const current = draft ?? (segmentOf(saved) === segment ? saved : undefined);
  const presets: readonly string[] = COPY.time.presets[segment];
  const options = [...presets, ...(current && !presets.includes(current) ? [current] : [])].map((t) => ({ value: t, label: t }));
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(current ?? defaultSlot(segment));
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };
  const confirm = () => {
    onTime(pending);
    close();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && open) close();
  };

  return (
    <div onKeyDown={onKeyDown}>
      <StepTitle>
        <Lines text={COPY.time.hourTitle[segment]} />
      </StepTitle>
      <Subtitle text={g(gender, COPY.time.hourSubtitle.fem, COPY.time.hourSubtitle.masc)} />
      <OptionList name="hour" options={options} value={current} onChange={onTime} />
      <div className="mt-7 grid">
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={OTHER_PANEL_ID}
          onClick={() => setOpen(!open)}
          className={`inline-flex min-h-[60px] w-full items-center justify-center rounded-[30px] border-2 border-green-deep pill-pad-lg font-display text-lead font-bold text-green-deep transition-[background-color,transform] duration-[var(--dur-fast)] ease-out-expo hover:bg-green-wash active:scale-[0.97] ${open ? "bg-green-wash" : "bg-white"}`}
        >
          {COPY.time.otherHour}
        </button>
      </div>
      <div
        id={OTHER_PANEL_ID}
        hidden={!open}
        className="mt-3 rounded-tile border-2 border-hairline bg-surface p-5"
      >
        <label htmlFor={OTHER_SELECT_ID} className="mb-2 block font-display font-bold">
          {COPY.time.pickerTitle}
        </label>
        <NativeSelect id={OTHER_SELECT_ID} value={pending} options={slotsFor(segment)} onChange={setPending} />
        <Button size="lg" className="mt-4 w-full" onClick={confirm}>
          {COPY.time.pickerConfirm}
        </Button>
      </div>
      <ContinueButton disabled={!current} onClick={onContinue} />
    </div>
  );
}

/** The time step: A picks the part of the day, B the hour (presets or an inline 15-minute picker; no modal). */
export default function TimeStep(props: Props) {
  const { view } = props;
  if (view.sub === "B" && view.segment && SEGMENTS.includes(view.segment)) {
    return <HourScreen key={view.segment} segment={view.segment} {...props} />;
  }
  return <SegmentScreen view={view} onSegment={props.onSegment} onShowHours={props.onShowHours} />;
}
