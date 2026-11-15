"use client";

import { useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import type { TasterExercise } from "@/lib/taster/workout";
import { BIG } from "./TasterScreens";

/** Short praise between exercises, one per exercise done; the last one is never shown. */
const PRAISE = ["יופי!", "מצוין!", "כל הכבוד!", "ממש טוב!", "אלופים!"] as const;

/**
 * A short breath between two exercises: what is next, with a countdown that
 * starts it by itself, and a button to start now.
 */
export function TasterBetween({
  done,
  left,
  next,
  secondsLeft,
  onNow,
}: {
  done: number;
  left: number;
  next: TasterExercise;
  secondsLeft: number;
  onNow: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-center bg-ink/95 text-white" role="dialog" aria-modal="true" aria-labelledby="taster-between-title">
      <div className="gutter-x flex w-full max-w-[560px] flex-col pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
        <p id="taster-between-title" className="taster-pop font-display text-[2.5rem] font-extrabold leading-tight text-[#7EE2A8]">
          {PRAISE[(done - 1) % PRAISE.length]}
        </p>
        <p className="mt-1 text-lead text-white/85">{left === 1 ? "עוד תרגיל אחד ומסיימים" : `עוד ${left} תרגילים`}</p>

        <div className="mt-8 flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <p className="text-[1.0625rem] font-bold text-white/75">התרגיל הבא</p>
          {next.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- a remote thumbnail, shown as is
            <img src={next.thumbnailUrl} alt="" className="h-40 w-40 rounded-3xl object-cover" />
          )}
          <p className="font-display text-[1.75rem] font-extrabold leading-tight">{next.name}</p>
          <p className="font-display text-[3.5rem] font-extrabold tabular-nums leading-none" aria-live="polite">
            {secondsLeft}
          </p>
        </div>

        <Button size="lg" className={BIG} onClick={onNow}>
          מתחילים עכשיו
        </Button>
      </div>
    </div>
  );
}

/** "לצאת מהאימון?": staying is the big button, leaving goes on to the plans. */
export function TasterExitDialog({ left, onStay, onLeave }: { left: number; onStay: () => void; onLeave: () => void }) {
  const stay = useRef<HTMLDivElement>(null);
  useEffect(() => {
    stay.current?.querySelector("button")?.focus();
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" role="alertdialog" aria-modal="true" aria-labelledby="taster-exit-title">
      <div className="w-full max-w-[560px] rounded-t-3xl bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 sm:rounded-3xl">
        <h2 id="taster-exit-title" className="font-display text-[1.75rem] font-extrabold leading-tight">
          לצאת מהאימון?
        </h2>
        <p className="mt-2 text-lead text-ink-soft">{left === 1 ? "זה כבר התרגיל האחרון." : `נשארו עוד ${left} תרגילים, כ-${Math.max(1, Math.round(left * 0.8))} דקות.`} חבל לעצור עכשיו.</p>
        <div ref={stay} className="mt-6 flex flex-col gap-2">
          <Button size="lg" className={BIG} onClick={onStay}>
            ממשיכים להתאמן
          </Button>
          <Button variant="ghost" className="min-h-[60px] w-full" onClick={onLeave}>
            יציאה
          </Button>
        </div>
      </div>
    </div>
  );
}
