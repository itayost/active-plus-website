import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { CheckIcon, LockIcon } from "@/components/ui/icons";
import { COPY } from "@/lib/funnel/copy";
import { cn } from "@/lib/utils";

/** Every step's h1 carries this id: the section is labelled by it and navigation focuses it. */
export const STEP_TITLE_ID = "funnel-step-title";

const NUMBER_RANGE = /(\d+[–-]\d+)/;

/**
 * A numeric range such as "1–2" runs left to right inside Hebrew; left to the
 * bidi algorithm it renders as "2–1". Each range is isolated as LTR.
 */
export function Isolated({ text }: { text: string }) {
  const parts = text.split(NUMBER_RANGE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <bdi key={i} dir="ltr">
            {part}
          </bdi>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Copy written with "\n" breaks as deliberate lines (block spans, never <br>). */
export function Lines({ text }: { text: string }) {
  const lines = text.split("\n");
  if (lines.length === 1) return <Isolated text={text} />;
  return (
    <>
      {lines.map((line) => (
        <span key={line} className="block">
          <Isolated text={line} />
        </span>
      ))}
    </>
  );
}

const TITLE_SIZE = {
  question: "text-[clamp(1.75rem,1.3rem+1.6vw,2.5rem)] leading-[1.15]",
  interstitial: "text-[clamp(2rem,1.4rem+2.2vw,3rem)] leading-[1.08]",
} as const;

export function StepTitle({
  children,
  size = "question",
}: {
  children: ReactNode;
  size?: keyof typeof TITLE_SIZE;
}) {
  return (
    <h1
      id={STEP_TITLE_ID}
      tabIndex={-1}
      className={cn("font-display font-black tracking-[-0.025em] outline-none", TITLE_SIZE[size])}
    >
      {children}
    </h1>
  );
}

/** Lead plus the green emphasis span, as the interstitial headlines are set. */
export function AccentTitle({ lead, accent }: { lead: string; accent: string }) {
  return (
    <StepTitle size="interstitial">
      {lead}
      <em className="not-italic text-green-deep">{accent}</em>
    </StepTitle>
  );
}

export function Subtitle({ text, className = "" }: { text: string; className?: string }) {
  return (
    // Plain concatenation: tailwind-merge reads text-lead (a custom size) and
    // text-ink-soft as the same group and would drop the size.
    <p className={`mt-3 max-w-measure text-lead text-ink-soft ${className}`}>
      <Lines text={text} />
    </p>
  );
}

export function ContinueButton({
  onClick,
  disabled = false,
  label = COPY.common.next,
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="mt-7 grid gap-3">
      <Button size="lg" className="w-full flex-wrap gap-y-1" disabled={disabled} onClick={onClick}>
        {label}
      </Button>
    </div>
  );
}

export function FootNote({ text, lock = false }: { text: string; lock?: boolean }) {
  return (
    <p className="mt-5 flex items-center justify-center gap-2 text-center text-ink-soft">
      {lock ? <LockIcon className="h-5 w-5 shrink-0" /> : null}
      {text}
    </p>
  );
}

/** The circular (or, for chips, rounded-square) check every choice card carries. */
export function Tick({ on, shape = "round", tone = "blue" }: { on: boolean; shape?: "round" | "square"; tone?: "blue" | "green" }) {
  const filled = tone === "green" ? "border-green-deep bg-green-deep" : "border-blue-deep bg-blue-deep";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center border-2 text-white",
        shape === "round" ? "h-8 w-8 rounded-pill" : "h-7 w-7 rounded-[9px]",
        on ? filled : "border-ink/20 bg-surface",
      )}
    >
      <CheckIcon className={cn("h-[18px] w-[18px]", on ? "opacity-100" : "opacity-0")} />
    </span>
  );
}

/** A choice card at rest and selected; shared by the radio cards and the body-area toggles. */
export const choiceCard = (on: boolean) =>
  cn(
    "flex min-h-[72px] w-full items-center gap-4 rounded-tile border-2 px-5 py-4 text-start text-ink",
    "transition-[border-color,background-color,transform] duration-[var(--dur-fast)] ease-out-expo active:scale-[0.99]",
    "max-[420px]:gap-3 max-[420px]:px-4 max-[420px]:py-[0.9rem]",
    on
      ? "border-blue-deep bg-blue-wash forced-colors:outline forced-colors:outline-[3px] forced-colors:outline-[Highlight]"
      : "border-hairline bg-surface hover:border-ink/30",
  );

export const CHOICE_LABEL = "min-w-0 flex-1 font-display text-[1.25rem] font-bold leading-[1.3] [overflow-wrap:anywhere]";
