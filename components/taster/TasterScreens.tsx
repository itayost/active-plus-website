import Button from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import type { TasterWorkout } from "@/lib/taster/workout";
import { cn } from "@/lib/utils";
import TasterHomeCard from "./TasterHomeCard";

/** The taster's big buttons: 64px tall, past the 60px floor for a senior's finger. */
export const BIG = "w-full min-h-[64px] rounded-[32px] text-[1.25rem]";

export const TASTER_TITLE_ID = "taster-title";

function Title({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h1
      id={TASTER_TITLE_ID}
      tabIndex={-1}
      className={cn("font-display text-[clamp(1.75rem,1.4rem+1.4vw,2.25rem)] font-extrabold leading-[1.15] tracking-[-0.02em] outline-none", className)}
    >
      {children}
    </h1>
  );
}

/** A column the width of a large phone, the continue button at the bottom, as the questionnaire is set. */
export function Column({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] justify-center bg-sunken">
      <div className="gutter-x flex w-full max-w-[560px] flex-col bg-sunken pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] md:shadow-lift-2">
        {children}
      </div>
    </div>
  );
}

export function TasterLoading() {
  return (
    <Column>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center" role="status">
        <span className="h-14 w-14 animate-spin rounded-full border-[5px] border-blue-wash border-t-blue motion-reduce:animate-none" aria-hidden />
        <p className="text-lead font-bold text-ink-soft">מכינים את האימון הראשון שלך...</p>
      </div>
    </Column>
  );
}

/**
 * "התוכנית שלך מוכנה!" over the app's own home card (owner, 2026-11-14): the screen a
 * new trainee meets in the app, whose "התחל תרגול עכשיו" plays the workout as the app does.
 */
export function TasterIntro({
  workout,
  readyLine,
  onStart,
  onSkip,
}: {
  workout: TasterWorkout;
  readyLine: string;
  onStart: () => void;
  onSkip: () => void;
}) {
  return (
    <>
      <span className="taster-pop flex h-16 w-16 items-center justify-center rounded-full bg-cta text-white shadow-cta">
        <CheckIcon className="h-8 w-8" />
      </span>
      <Title className="mt-4">התוכנית שלך מוכנה!</Title>
      <p className="mt-2 text-lead text-ink-soft">האימון הראשון כבר מחכה, בדיוק כמו באפליקציה. כדאי להגביר את הקול ולפנות קצת מקום סביבך.</p>

      <div className="mt-6">
        <TasterHomeCard workout={workout} readyLine={readyLine} onStart={onStart} />
      </div>

      <div className="mt-auto pt-4">
        <Button variant="ghost" className="min-h-[60px] w-full" onClick={onSkip}>
          דילוג לבחירת מסלול
        </Button>
      </div>
    </>
  );
}

/** The home tab once the free workout is behind them: the app's done card, then the offer. */
export function TasterUsedHome({ onPlans }: { onPlans: () => void }) {
  return (
    <>
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cta text-white shadow-cta">
        <CheckIcon className="h-8 w-8" />
      </span>
      <Title className="mt-4">כל הכבוד!</Title>
      <p className="mt-2 text-lead text-ink-soft">את האימון הראשון כבר עשית. מכאן ממשיכים בתוכנית: אימון חדש כל יום, אתגרים ומשחקי זיכרון.</p>
      <div className="mt-6">
        <Button size="lg" className={BIG} onClick={onPlans}>
          ממשיכים בתוכנית
        </Button>
      </div>
    </>
  );
}

export function TasterError({ onRetry, onSkip }: { onRetry: () => void; onSkip: () => void }) {
  return (
    <Column>
      <div className="flex flex-1 flex-col justify-center">
        <Title>לא הצלחנו לטעון את האימון</Title>
        <p className="mt-3 text-lead text-ink-soft">כנראה בגלל החיבור לאינטרנט. אפשר לנסות שוב, או להמשיך לבחירת מסלול.</p>
      </div>
      <div className="flex flex-col gap-2 pt-6">
        <Button size="lg" className={BIG} onClick={onRetry}>
          לנסות שוב
        </Button>
        <Button variant="ghost" className="min-h-[60px] w-full" onClick={onSkip}>
          המשך לבחירת מסלול
        </Button>
      </div>
    </Column>
  );
}

export function TasterEnd({
  name,
  played,
  minutes,
  onContinue,
}: {
  name: string | null;
  played: number;
  minutes: number;
  onContinue: () => void;
}) {
  return (
    <Column>
      <div className="flex flex-col items-center pt-4 text-center">
        <span className="taster-pop flex h-24 w-24 items-center justify-center rounded-full bg-cta text-white shadow-cta">
          <CheckIcon className="h-12 w-12" />
        </span>
        <Title className="mt-5">{name ? `כל הכבוד, ${name}!` : "כל הכבוד!"}</Title>
        <p className="mt-2 text-lead text-ink-soft">סיימת את האימון הראשון שלך</p>
        <div className="mt-5 flex gap-3">
          <Stat value={played} label="תרגילים" />
          <Stat value={minutes} label={minutes === 1 ? "דקה" : "דקות"} />
        </div>
      </div>

      <div className="mt-7 rounded-3xl bg-surface p-5 shadow-lift-2">
        <p className="font-display text-[1.75rem] font-extrabold leading-tight text-green-deep">התוכנית שלך מוכנה!</p>
        <p className="mt-1 text-[1.0625rem] font-bold text-ink-soft">זו הייתה רק טעימה. בתוכנית המלאה:</p>
        <ul className="mt-3 flex flex-col gap-2.5 text-[1.0625rem] font-bold">
          {["אימון חדש כל יום, מותאם בדיוק לך", "מתקדמים בקצב שלך, מהבית", "משחקים שמחדדים את הזיכרון והריכוז"].map((line) => (
            <li key={line} className="flex items-start gap-2.5">
              <CheckIcon className="mt-0.5 h-6 w-6 text-green-deep" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pt-6">
        <Button size="lg" className={BIG} onClick={onContinue}>
          ממשיכים: בחירת מסלול
        </Button>
      </div>
    </Column>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[7rem] flex-col items-center rounded-2xl bg-surface px-5 py-3 shadow-lift-1">
      <span className="font-display text-[2.25rem] font-extrabold leading-none text-blue">{value}</span>
      <span className="mt-1 text-[1.0625rem] font-bold text-ink-soft">{label}</span>
    </div>
  );
}
