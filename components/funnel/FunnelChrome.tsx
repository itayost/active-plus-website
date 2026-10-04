import Link from "next/link";
import { ArrowBackIcon } from "@/components/ui/icons";
import { COPY } from "@/lib/funnel/copy";
import { cn } from "@/lib/utils";

type Props = {
  /** The step's dot (1-8), or null for steps without one. */
  dot: { index: number; total: number } | null;
  canGoBack: boolean;
  /** planBuilding shows neither back nor cancel. */
  bare: boolean;
  onBack: () => void;
};

function Dots({ index, total }: { index: number; total: number }) {
  const label = COPY.chrome.dots.replace("{i}", String(index)).replace("{n}", String(total));
  return (
    <div role="img" aria-label={label} className="flex items-center gap-2 max-[420px]:gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        return (
          <i
            key={n}
            className={cn(
              "h-2.5 shrink-0 rounded-pill transition-colors duration-[var(--dur-fast)] max-[420px]:h-[9px]",
              n === index ? "w-7 max-[420px]:w-[22px]" : "w-2.5 max-[420px]:w-[9px]",
              n <= index ? "bg-blue-deep forced-colors:bg-[Highlight]" : "bg-ink/15",
            )}
          />
        );
      })}
    </div>
  );
}

/** The funnel's top row: back | progress dots | cancel. */
export default function FunnelChrome({ dot, canGoBack, bare, onBack }: Props) {
  const showBack = canGoBack && !bare;
  return (
    <div className="flex min-h-12 items-center gap-4 max-[420px]:gap-2">
      <button
        type="button"
        aria-label={COPY.chrome.back}
        onClick={onBack}
        disabled={!showBack}
        className={cn(
          "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-pill border-2 border-ink/15 bg-surface text-ink",
          "transition-[border-color,transform] duration-[var(--dur-fast)] ease-out-expo hover:border-ink/35 active:scale-[0.96]",
          !showBack && "invisible",
        )}
      >
        <ArrowBackIcon className="h-6 w-6" />
      </button>
      <div className="min-w-0 flex-1">{dot ? <Dots index={dot.index} total={dot.total} /> : null}</div>
      {bare ? null : (
        <Link
          href="/"
          className="inline-flex min-h-12 shrink-0 items-center rounded-pill px-[0.9rem] font-display text-[1.125rem] font-bold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink max-[420px]:px-2"
        >
          {COPY.chrome.cancel}
        </Link>
      )}
    </div>
  );
}
