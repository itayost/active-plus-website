"use client";

import { useEffect, useState } from "react";
import JourneySteps from "@/components/funnel/JourneySteps";
import Button from "@/components/ui/Button";
import { LockIcon } from "@/components/ui/icons";
import { PAYMENT_PATH } from "@/lib/funnel/constants";
import { readPlanInputs, type PlanInputs } from "@/lib/funnel/storage";
import { isPressable, tapHaptic } from "@/lib/haptics";
import { curve, curveAt, PLAN_DAYS, PLAN_LINES, smoothPath, targetDate } from "@/lib/plan/twenty-eight";

/** Straight to the plans (owner, 2026-11-16, second word: pay before the product, then the app). A document load. */
const toPlans = () => window.location.assign(PAYMENT_PATH);

/**
 * "התוכנית שלך מוכנה!" (owner, 2026-11-15): the visitor's name, the expected progress
 * toward the plan's two goals (muscle strength, memory) by a date 28 days away, then
 * the plans; the first workout is in the app, after payment (owner, 2026-11-16).
 */
export default function MyPlan() {
  // Read after mount: sessionStorage does not exist on the server.
  const [inputs, setInputs] = useState<PlanInputs | null | undefined>(undefined);
  const [date, setDate] = useState("");
  const [shortDate, setShortDate] = useState("");
  useEffect(() => {
    const now = new Date();
    const read = readPlanInputs();
    // Opened without the questionnaire (a shared link, an old tab): start at its first page
    // (owner, 2026-11-21).
    if (read === null) {
      window.location.replace("/questionnaire");
      return;
    }
    setInputs(read);
    setDate(targetDate(now));
    setShortDate(targetDate(now, true));
  }, []);
  const name = inputs === undefined ? undefined : (inputs?.firstName ?? null);

  return (
    <div
      dir="rtl"
      className="flex min-h-[100dvh] justify-center"
      // A soft mint wash at the top that settles into the page's light grey.
      style={{ background: "linear-gradient(180deg, #E4F4EA 0%, #EEF6F8 38%, #F7F9FC 100%)" }}
      onClickCapture={(e) => {
        if (isPressable(e.target)) tapHaptic();
      }}
    >
      <div className="gutter-x flex w-full max-w-[560px] flex-col pt-[max(2rem,env(safe-area-inset-top))] md:shadow-lift-2">
        <JourneySteps current={0} className="mb-5" />
        <h1 className="font-display text-[clamp(1.875rem,1.5rem+1.4vw,2.375rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
          {name === undefined ? (
            "\u00A0"
          ) : name ? (
            <>
              <span className="text-[#1F6B3D]">{name},</span> התוכנית שלך מוכנה!
            </>
          ) : (
            "התוכנית שלך מוכנה!"
          )}
        </h1>

        <p className="mt-4 inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-full bg-white/80 px-3.5 py-2 text-[0.9375rem] font-bold text-ink-soft shadow-[0_2px_10px_rgb(31_107_61/0.08)]">
          <CalendarIcon />
          {date ? (
            <span>
              הצפי להגיע למטרות שלך עד <span className="text-[#1F6B3D]">{date}</span>
            </span>
          ) : (
            "\u00A0"
          )}
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-3" aria-label="המטרות שלך">
          {PLAN_LINES.map((line) => (
            <li key={line.label} className="flex flex-col items-start gap-2.5 rounded-2xl px-4 py-4" style={{ background: line.tint }}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgb(0_0_0/0.06)]" style={{ color: line.color }} aria-hidden>
                <GoalIcon name={line.icon} />
              </span>
              <span className="whitespace-nowrap text-[1.125rem] font-extrabold leading-tight" style={{ color: line.deep }}>
                {line.label}
              </span>
            </li>
          ))}
        </ul>

        <ProgressChart date={shortDate} />

        <div className="pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
          <Button size="lg" className="min-h-[64px] w-full rounded-[32px] text-[1.25rem]" onClick={toPlans}>
            לבחירת המסלול שלי
          </Button>
          <p className="mt-3 flex items-center justify-center gap-2 text-[0.9375rem] font-bold text-ink-soft">
            <LockIcon className="h-4 w-4 shrink-0" />
            תשלום מאובטח · אפשר לבטל בכל עת
          </p>
        </div>
      </div>
    </div>
  );
}

const W = 320;
const H = 230;
const PLOT = { left: 8, right: 16, top: 16, bottom: 34 };
const PW = W - PLOT.left - PLOT.right;
const PH = H - PLOT.top - PLOT.bottom;
const TICKS = [0, 7, 14, 21, 28] as const;

/**
 * The expected progress, drawn as a plain line chart: a light grid, the day axis,
 * one wavy line per box above it in the box's colour (progress rises with small ups
 * and downs, the owner's pick), a faint area under the top one, a point at each week
 * and the end of each line marked. No values on the y axis: it illustrates, it does not promise.
 * Time runs left to right, as on any chart; the labels are Hebrew.
 */
function ProgressChart({ date }: { date: string }) {
  const series = PLAN_LINES.map((line, i) => {
    const points = i === 0 ? curve(0, 0.86, 0) : curve(0.04, 0.7, 1.6);
    // Rounded, so the server's and the browser's numbers match to the last digit (hydration).
    const round = (n: number) => Math.round(n * 10) / 10;
    const at = (day: number) => ({ x: round((day / PLAN_DAYS) * PW), y: round((1 - curveAt(points, day)) * PH) });
    return { ...line, d: smoothPath(points, PW, PH), weeks: [7, 14, 21].map(at), end: at(PLAN_DAYS) };
  });
  return (
    <figure className="mt-4 rounded-2xl bg-white px-4 pb-3 pt-4 shadow-[0_12px_32px_rgb(20_60_40/0.10)]">
      <figcaption className="font-display text-[1.25rem] font-extrabold text-ink">ההתקדמות הצפויה שלך ל-28 יום</figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full"
        role="img"
        aria-label={`${PLAN_LINES[0].label} ו${PLAN_LINES[1].label} עולים לאורך ${PLAN_DAYS} הימים`}
        direction="ltr"
      >
        <defs>
          {series.map((s, i) => (
            <linearGradient key={`fill-${s.label}`} id={`plan-fill-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={s.color} stopOpacity={i === 0 ? 0.18 : 0.1} />
              <stop offset="1" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
          {/* Each line brightens as it rises: light at today, full colour at the goal. */}
          {series.map((s, i) => (
            <linearGradient key={`stroke-${s.label}`} id={`plan-stroke-${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={s.light} />
              <stop offset="1" stopColor={s.color} />
            </linearGradient>
          ))}
        </defs>
        <g transform={`translate(${PLOT.left} ${PLOT.top})`}>
          {[0, 0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={0} x2={PW} y1={f * PH} y2={f * PH} stroke="#EEF0F3" />
          ))}
          <line x1={0} x2={PW} y1={PH} y2={PH} stroke="#D5D9DF" />
          {TICKS.map((day) => (
            <g key={day} transform={`translate(${(day / PLAN_DAYS) * PW} ${PH})`}>
              <line y2={4} stroke="#D5D9DF" />
              <text y={20} fontSize="12" fill="#5b6470" textAnchor={day === 0 ? "start" : day === PLAN_DAYS ? "end" : "middle"}>
                {day === 0 ? "היום" : day === PLAN_DAYS && date ? date : `יום ${day}`}
              </text>
            </g>
          ))}
          {series.map((s, i) => (
            <path key={`${s.label}-area`} d={`${s.d} L${PW} ${PH} L0 ${PH} Z`} fill={`url(#plan-fill-${i})`} className="plan-fade" />
          ))}
          {series.map((s, i) => (
            <path key={s.label} d={s.d} fill="none" stroke={`url(#plan-stroke-${i})`} strokeWidth="3.5" strokeLinecap="round" className="plan-draw" pathLength={1} />
          ))}
          {series.flatMap((s) =>
            s.weeks.map((p) => <circle key={`${s.label}-${p.x}`} cx={p.x} cy={p.y} r="4" fill="#fff" stroke={s.color} strokeWidth="2" className="plan-fade" />),
          )}
          {series.map((s) => (
            <circle key={`${s.label}-halo`} cx={s.end.x} cy={s.end.y} r="11" fill={s.color} opacity="0.18" className="plan-fade" />
          ))}
          {series.map((s) => (
            <circle key={`${s.label}-end`} cx={s.end.x} cy={s.end.y} r="6" fill={s.color} stroke="#fff" strokeWidth="2" className="plan-fade" />
          ))}
        </g>
      </svg>
      <p className="mt-1 text-[0.875rem] text-ink-faint">המחשה של התקדמות צפויה. הקצב של כל אחד שונה.</p>
    </figure>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#2E9E5B]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

/** The questionnaire's own goal icons (components/funnel/AnswerIcon): a dumbbell and a brain. */
function GoalIcon({ name }: { name: "dumbbell" | "brain" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {name === "dumbbell" ? (
        <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
      ) : (
        <>
          <path d="M12 5.5a3 3 0 0 0-5.6 1.4A3 3 0 0 0 5 12.2a3 3 0 0 0 2.3 4.9A3 3 0 0 0 12 18.5z" />
          <path d="M12 5.5a3 3 0 0 1 5.6 1.4 3 3 0 0 1 1.4 5.3 3 3 0 0 1-2.3 4.9A3 3 0 0 1 12 18.5" />
        </>
      )}
    </svg>
  );
}
