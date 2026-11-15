"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { PAYMENT_PATH } from "@/lib/funnel/constants";
import { readPlanInputs, type PlanInputs } from "@/lib/funnel/storage";
import { isPressable, tapHaptic } from "@/lib/haptics";
import { curve, outcomes, PLAN_DAYS, smoothPath, targetDate, type Outcome } from "@/lib/plan/twenty-eight";

/** The plans. A document load: /payment's CSP applies only to a document. */
const toPlans = () => window.location.assign(PAYMENT_PATH);

/**
 * "התוכנית שלך מוכנה!" (owner, 2026-11-15): the visitor's name, the two results to
 * reach by a date 28 days away (one for the body, one for memory, from their own
 * answers) and the expected progress toward them, then the plans. Closing the plans
 * (their X) leads to the free first workout.
 */
export default function MyPlan() {
  // Read after mount: sessionStorage does not exist on the server.
  const [inputs, setInputs] = useState<PlanInputs | null | undefined>(undefined);
  const [date, setDate] = useState("");
  const [shortDate, setShortDate] = useState("");
  useEffect(() => {
    const now = new Date();
    setInputs(readPlanInputs());
    setDate(targetDate(now));
    setShortDate(targetDate(now, true));
  }, []);
  const name = inputs === undefined ? undefined : (inputs?.firstName ?? null);
  const results = outcomes(inputs ?? null);

  return (
    <div
      dir="rtl"
      className="flex min-h-[100dvh] justify-center bg-sunken"
      onClickCapture={(e) => {
        if (isPressable(e.target)) tapHaptic();
      }}
    >
      <div className="gutter-x flex w-full max-w-[560px] flex-col pt-[max(2rem,env(safe-area-inset-top))] md:shadow-lift-2">
        <h1 className="font-display text-[clamp(1.875rem,1.5rem+1.4vw,2.375rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
          {name === undefined ? " " : name ? `${name}, התוכנית שלך מוכנה!` : "התוכנית שלך מוכנה!"}
        </h1>

        <p className="mt-5 text-[1.0625rem] font-bold text-ink-soft">{date ? `היעד שלך עד ${date}:` : "\u00A0"}</p>
        <ul className="mt-2 flex flex-col gap-2.5" aria-label="היעדים שלך">
          {results.map((r) => (
            <li key={r.text} className="flex items-center gap-3 rounded-xl border border-hairline bg-surface px-4 py-3.5">
              <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: r.color }} aria-hidden />
              <span className="text-[1.25rem] font-bold leading-snug text-ink">{r.text}</span>
            </li>
          ))}
        </ul>

        <ProgressChart results={results} date={shortDate} />

        <div className="pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
          <Button size="lg" className="min-h-[64px] w-full rounded-[32px] text-[1.25rem]" onClick={toPlans}>
            מתחילים את התוכנית
          </Button>
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
 * one line per box above it in the box's colour, a faint area under each, and the
 * end of each line marked. No values on the y axis: it illustrates, it does not promise.
 * Time runs left to right, as on any chart; the labels are Hebrew.
 */
function ProgressChart({ results, date }: { results: readonly Outcome[]; date: string }) {
  const series = results.map((r, i) => {
    const points = i === 0 ? curve(0) : curve(0.05, 0.72);
    const last = points[points.length - 1];
    return { label: r.text, color: r.color, d: smoothPath(points, PW, PH), end: { x: PW, y: (1 - last.y) * PH } };
  });
  return (
    <figure className="mt-4 rounded-xl border border-hairline bg-surface px-4 pb-3 pt-4">
      <figcaption className="font-display text-[1.25rem] font-extrabold text-ink">ההתקדמות הצפויה שלך ל-28 יום</figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full"
        role="img"
        aria-label={`ההתקדמות לשני היעדים עולה לאורך ${PLAN_DAYS} הימים`}
        direction="ltr"
      >
        <defs>
          <linearGradient id="plan-fill-0" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={series[0].color} stopOpacity="0.12" />
            <stop offset="1" stopColor={series[0].color} stopOpacity="0" />
          </linearGradient>
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
          {/* One faint area, under the top line only: two would muddy into grey. */}
          <path d={`${series[0].d} L${PW} ${PH} L0 ${PH} Z`} fill="url(#plan-fill-0)" className="plan-fade" />
          {series.map((s) => (
            <path key={s.label} d={s.d} fill="none" stroke={s.color} strokeWidth="3" strokeLinecap="round" className="plan-draw" pathLength={1} />
          ))}
          {series.map((s) => (
            <circle key={`${s.label}-end`} cx={s.end.x} cy={s.end.y} r="5" fill={s.color} stroke="#fff" strokeWidth="2" className="plan-fade" />
          ))}
        </g>
      </svg>
      <p className="mt-1 text-[0.875rem] text-ink-faint">המחשה של התקדמות צפויה. הקצב של כל אחד שונה.</p>
    </figure>
  );
}
