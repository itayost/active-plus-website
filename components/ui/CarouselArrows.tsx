import { ArrowBackIcon, ArrowIcon } from "@/components/ui/icons";

/*
 * Exhausted arrows are aria-disabled rather than disabled: dimmed and inert to
 * hover, but still focusable, so keyboard focus stays where the reader left it
 * (see useSnapCarousel). The dimming is on the border and the icon, not the
 * button: opacity on the button faded the focus ring with it, to about 2:1
 * on white, on exactly the arrow keyboard focus is parked on. `hover:`
 * compiles out on touch, so the press itself is the feedback a finger gets,
 * as on Button.
 */
const ARROW =
  "inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink/15 bg-surface text-ink " +
  "transition-[border-color,background-color,transform] duration-[var(--dur-fast)] ease-out-expo " +
  "[&_svg]:transition-opacity [&_svg]:duration-[var(--dur-fast)] " +
  "hover:-translate-y-0.5 hover:border-ink/40 active:translate-y-0 active:scale-95 " +
  "aria-disabled:cursor-default aria-disabled:border-ink/5 aria-disabled:bg-surface/35 aria-disabled:[&_svg]:opacity-35 " +
  "aria-disabled:hover:translate-y-0 aria-disabled:hover:border-ink/5 aria-disabled:active:scale-100";

type Props = {
  prevLabel: string;
  nextLabel: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

/**
 * The two arrows beside a carousel heading. RTL travel runs right to left, so
 * each arrow points the way its own button moves the track: back points right
 * and sits on the trailing (right) edge, forward points left on the leading
 * edge. Putting forward first made the two arrows point at each other.
 *
 * Clicks are guarded by canPrev/canNext: with several cards visible the track
 * ends before the index reaches the last card, and advancing past it would
 * leave later "previous" presses dead.
 */
export default function CarouselArrows({
  prevLabel,
  nextLabel,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => canPrev && onPrev()}
        aria-disabled={!canPrev || undefined}
        className={ARROW}
      >
        <span className="sr-only">{prevLabel}</span>
        <ArrowBackIcon className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={() => canNext && onNext()}
        aria-disabled={!canNext || undefined}
        className={ARROW}
      >
        <span className="sr-only">{nextLabel}</span>
        <ArrowIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
