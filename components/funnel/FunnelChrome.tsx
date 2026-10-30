import Link from "next/link";
import { ArrowBackIcon } from "@/components/ui/icons";
import { COPY } from "@/lib/funnel/copy";
import type { Indicator } from "@/lib/funnel/routing";
import { cn } from "@/lib/utils";

type Props = {
  /** The step's place in its progress section, or null for screens without a bar. */
  bar: Indicator | null;
  canGoBack: boolean;
  /** "ביטול" shows on the first question only, as in the apps; back everywhere else. */
  showCancel: boolean;
  /** planBuilding (and a finished sign-in) shows neither back nor cancel. */
  bare: boolean;
  /** The photo screens: the row sits over the photo in white. */
  overPhoto?: boolean;
  /** register's own header in place of the bar: name (50%), then phone (100%). */
  register?: "name" | "phone" | null;
  onBack: () => void;
};

const REGISTER_HEADER = {
  name: { label: COPY.register.nameHeader, value: 50 },
  phone: { label: COPY.register.phoneHeader, value: 100 },
} as const;

function RegisterBar({ sub }: { sub: "name" | "phone" }) {
  const { label, value } = REGISTER_HEADER[sub];
  return (
    <>
      <span className="block font-display text-[1.125rem] font-bold leading-[1.3] text-ink-soft">{label}</span>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="mt-1.5 h-2.5 overflow-hidden rounded-pill bg-ink/10"
      >
        <i className="block h-full rounded-pill bg-green-deep forced-colors:bg-[Highlight]" style={{ width: `${value}%` }} />
      </div>
    </>
  );
}

/**
 * One segment per screen of the section, filled up to the current one, with
 * the section's caption above. The segment just reached fills from the right
 * on every arrival (keyed by the step), so each answer visibly moves the bar.
 */
function SectionBar({ bar }: { bar: Indicator }) {
  const step = COPY.chrome.dots.replace("{i}", String(bar.index)).replace("{n}", String(bar.total));
  return (
    <div role="img" aria-label={`${bar.label}, ${step}`}>
      <span aria-hidden="true" className="block text-center text-[0.95rem] font-medium leading-[1.3] text-green-deep">
        {bar.label}
      </span>
      <div aria-hidden="true" className="mt-1.5 flex gap-1.5">
        {Array.from({ length: bar.total }, (_, i) => (
          <i key={i} className="h-3 flex-1 overflow-hidden rounded-pill bg-ink/[0.12]">
            {i < bar.index ? (
              <i
                key={i === bar.index - 1 ? `${bar.label}-${bar.index}` : "done"}
                className={cn("block h-full rounded-pill bg-green-deep forced-colors:bg-[Highlight]", i === bar.index - 1 && "funnel-fill")}
              />
            ) : null}
          </i>
        ))}
      </div>
    </div>
  );
}

/** The funnel's top row: back | progress | cancel. */
export default function FunnelChrome({ bar, canGoBack, showCancel, bare, overPhoto = false, register = null, onBack }: Props) {
  const showBack = canGoBack && !bare;
  return (
    <div className={cn("flex min-h-[60px] items-center gap-3", overPhoto && "text-white")}>
      <button
        type="button"
        aria-label={COPY.chrome.back}
        onClick={onBack}
        disabled={!showBack}
        className={cn(
          "inline-flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-pill",
          "transition-[background-color,transform] duration-[var(--dur-fast)] ease-out-expo active:scale-[0.96]",
          overPhoto ? "bg-[rgb(14_30_60/0.35)] hover:bg-[rgb(14_30_60/0.5)]" : "text-ink hover:bg-ink/5",
          !showBack && "invisible",
        )}
      >
        <ArrowBackIcon className="h-7 w-7" />
      </button>
      <div className="min-w-0 flex-1">
        {bar ? <SectionBar bar={bar} /> : register ? <RegisterBar sub={register} /> : null}
      </div>
      {showCancel && !bare ? (
        <Link
          href="/"
          className="inline-flex min-h-[60px] shrink-0 items-center rounded-pill px-3 font-display text-[1.125rem] font-bold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
        >
          {COPY.chrome.cancel}
        </Link>
      ) : (
        // Keeps the bar centred when there is no cancel.
        <span aria-hidden="true" className="w-[60px] shrink-0" />
      )}
    </div>
  );
}
