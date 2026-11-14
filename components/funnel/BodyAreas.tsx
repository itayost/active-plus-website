import Image from "next/image";
import { bodyModel, SIZES } from "@/lib/funnel/images";
import type { Answers } from "@/lib/funnel/types";
import { tapHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import type { Option } from "./OptionList";
import { CHOICE_LABEL, STEP_TITLE_ID, Tick, choiceCard } from "./parts";

type Props = {
  options: readonly Option[];
  selected: readonly string[];
  gender: Answers["gender"];
  onToggle: (value: string) => void;
};

const NONE = "none";

type Point = readonly [x: number, y: number];

/*
  Glow centres as fractions of the body-model images, measured in the apps
  (BodyAreasQuestionContent, owner 2026-10-19: both sides of the body, on the
  joint). Paired joints carry two points. Recalibrate if an image changes.
*/
const GLOWS: Record<string, { male: readonly Point[]; female: readonly Point[]; wide?: boolean }> = {
  neck: { male: [[0.511, 0.152]], female: [[0.585, 0.148]] },
  shoulders_neck: { male: [[0.15, 0.215], [0.868, 0.215]], female: [[0.31, 0.225], [0.885, 0.23]] },
  elbows: { male: [[0.07, 0.375], [0.93, 0.375]], female: [[0.24, 0.39], [0.94, 0.39]] },
  lower_back: { male: [[0.509, 0.435]], female: [[0.58, 0.44]], wide: true },
  hips: { male: [[0.27, 0.515], [0.75, 0.515]], female: [[0.32, 0.52], [0.84, 0.52]] },
  knees: { male: [[0.281, 0.715], [0.675, 0.715]], female: [[0.39, 0.725], [0.738, 0.725]] },
  ankle: { male: [[0.27, 0.878], [0.679, 0.878]], female: [[0.38, 0.875], [0.736, 0.875]] },
};

function Figure({ gender, selected }: { gender: Answers["gender"]; selected: readonly string[] }) {
  const key = gender === "female" ? "female" : "male";
  const model = bodyModel(gender);
  return (
    <div
      aria-hidden="true"
      className="relative col-start-2 row-span-7 row-start-1 h-[calc(var(--body-chip)*7+2.25rem)] self-center"
      style={{ aspectRatio: `${model.width} / ${model.height}` }}
    >
      <Image src={model.src} alt="" fill sizes={SIZES.body} className="object-contain" />
      {Object.entries(GLOWS).flatMap(([area, glow]) =>
        glow[key].map(([x, y], i) => (
          <span
            key={`${area}-${i}`}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-pill bg-[radial-gradient(circle,rgb(230_57_70/0.75)_0%,rgb(230_57_70/0.35)_45%,transparent_70%)]",
              "transition-opacity duration-[var(--dur)]",
              glow.wide ? "h-6 w-14" : "h-8 w-8",
              // The gentle breathing runs only on a chosen area: animate-pulse drives opacity itself.
              selected.includes(area) ? "opacity-100 motion-safe:animate-pulse" : "opacity-0",
            )}
            style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
          />
        )),
      )}
    </div>
  );
}

/**
 * The apps' body-areas screen: the areas in one column beside a body figure
 * where each chosen area glows softly (owner, 2026-11-14: "הכל בטור אחד"), and
 * the exclusive "no pain" answer full width below. Several areas may be chosen
 * (owner, 2026-10-19). An answer's height follows the screen's, 56px to 72px,
 * so the page fits with no scrolling on a phone 768px tall or more.
 */
export default function BodyAreas({ options, selected, gender, onToggle }: Props) {
  const areas = options.filter((o) => o.value !== NONE);
  const none = options.find((o) => o.value === NONE);
  const chip = (option: Option, row: number) => {
    const on = selected.includes(option.value);
    return (
      <button
        key={option.value}
        type="button"
        aria-pressed={on}
        onClick={() => {
          tapHaptic();
          onToggle(option.value);
        }}
        style={{ gridRow: row }}
        className={cn(
          choiceCard(on),
          "min-h-[var(--body-chip)] cursor-pointer py-1 max-[420px]:py-1",
          option.value === NONE ? "col-span-full" : "col-start-1",
        )}
      >
        <span className={CHOICE_LABEL}>{option.label}</span>
        <Tick on={on} shape="square" />
      </button>
    );
  };
  return (
    <div
      role="group"
      aria-labelledby={STEP_TITLE_ID}
      // 320px: the header, title, gaps and the pinned button; 8 rows share the rest. Fits from a 768px-tall screen; a smaller one scrolls a little rather than go under 56px.
      className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 [--body-chip:clamp(56px,calc((100vh-320px)/8),72px)] supports-[height:100dvh]:[--body-chip:clamp(56px,calc((100dvh-320px)/8),72px)]"
    >
      {areas.map((o, i) => chip(o, i + 1))}
      <Figure gender={gender} selected={selected} />
      {none ? chip(none, areas.length + 1) : null}
    </div>
  );
}
