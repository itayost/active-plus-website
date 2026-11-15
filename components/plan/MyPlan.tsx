"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { PAYMENT_PATH } from "@/lib/funnel/constants";
import { readPlanInputs, type PlanInputs } from "@/lib/funnel/storage";
import { readPaymentGender } from "@/lib/payment/checkout";
import type { Answers } from "@/lib/funnel/types";
import { isPressable, tapHaptic } from "@/lib/haptics";
import { buildPlan, curve } from "@/lib/plan/twenty-eight";

const GREEN = "#2E7D32";
const BLUE = "#1E6FD9";

/** The plans. A document load: /payment's CSP applies only to a document. */
const toPlans = () => window.location.assign(PAYMENT_PATH);

/**
 * "התוכנית שלך מוכנה!" (owner, 2026-11-15): the 28-day plan for body and mind, drawn
 * from the questionnaire's answers, with the expected progress toward the chosen goal,
 * then the plans. Closing the plans (their X) leads to the free first workout.
 */
export default function MyPlan() {
  // Read after mount: sessionStorage does not exist on the server.
  const [inputs, setInputs] = useState<PlanInputs | null | undefined>(undefined);
  const [gender, setGender] = useState<Answers["gender"]>(undefined);
  useEffect(() => {
    setInputs(readPlanInputs());
    setGender(readPaymentGender());
  }, []);
  if (inputs === undefined) return <div className="min-h-[100dvh] bg-[#FAF8F4]" />;

  const plan = buildPlan(inputs, gender);
  const name = inputs?.firstName;
  return (
    <div
      dir="rtl"
      className="flex min-h-[100dvh] justify-center bg-[#FAF8F4]"
      onClickCapture={(e) => {
        if (isPressable(e.target)) tapHaptic();
      }}
    >
      <div className="gutter-x flex w-full max-w-[560px] flex-col pt-[max(1.5rem,env(safe-area-inset-top))] md:shadow-lift-2">
        <span className="taster-pop flex h-14 w-14 items-center justify-center rounded-full bg-cta text-white shadow-cta">
          <CheckIcon className="h-7 w-7" />
        </span>
        <h1 className="mt-4 font-display text-[clamp(1.75rem,1.4rem+1.4vw,2.25rem)] font-extrabold leading-[1.15]">
          {name ? `${name}, התוכנית שלך מוכנה!` : "התוכנית שלך מוכנה!"}
        </h1>
        <p className="mt-2 text-lead font-bold text-[#2E7D32]">{plan.promise}</p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[0.9375rem] font-bold leading-tight">
          <Fact>{`${plan.workoutsPerWeek} אימונים בשבוע`}</Fact>
          <Fact>מהבית, בזמן שלך</Fact>
          <Fact>גוף + זיכרון</Fact>
        </div>

        <ProgressGraph lines={plan.lines} />

        {plan.because.length > 0 && (
          <section className="mt-6 rounded-[24px] bg-[#EDF5E5] p-4">
            <h2 className="font-display text-[1.25rem] font-extrabold">בנינו אותה לפי מה שסיפרת</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {plan.because.map((row) => (
                <li key={row.said} className="flex items-start gap-2.5">
                  <CheckIcon className="mt-1 h-5 w-5 shrink-0 text-[#2E7D32]" />
                  <span className="text-[1.0625rem] leading-snug">
                    <strong className="block">{row.said}</strong>
                    {row.does}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <h2 className="mt-7 font-display text-[1.5rem] font-extrabold">מה מחכה לך ב-28 הימים</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {plan.weeks.map((week, i) => (
            <li key={week.title} className="rounded-[16px] bg-white p-4 shadow-[0_6px_18px_rgb(20_40_20/0.07)]">
              <p className="flex items-center gap-2 font-display text-[1.25rem] font-extrabold">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EDF5E5] text-[1rem] text-[#2E7D32]">{i + 1}</span>
                {week.title.replace(/^שבוע \d+: /, "")}
              </p>
              <p className="mt-2 text-[1.0625rem]">
                <span className="font-bold text-[#2E7D32]">גוף: </span>
                {week.body}
              </p>
              <p className="mt-1 text-[1.0625rem]">
                <span className="font-bold text-[#1E6FD9]">זיכרון: </span>
                {week.mind}
              </p>
            </li>
          ))}
        </ol>

        <div
          className="sticky bottom-0 mt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-6"
          style={{ background: "linear-gradient(to top, #FAF8F4 80%, transparent)" }}
        >
          <Button size="lg" className="min-h-[64px] w-full rounded-[32px] text-[1.25rem]" onClick={toPlans}>
            מתחילים את התוכנית
          </Button>
        </div>
      </div>
    </div>
  );
}

function Fact({ children }: { children: string }) {
  return <span className="flex items-center justify-center rounded-2xl bg-white px-2 py-2.5 shadow-[0_2px_8px_rgb(20_40_20/0.08)]">{children}</span>;
}

const W = 320;
const H = 190;
const PAD = { left: 12, right: 12, top: 34, bottom: 30 };

const toPath = (lag: number) =>
  curve(lag)
    .map(({ x, y }, i) => `${i === 0 ? "M" : "L"}${(PAD.left + x * (W - PAD.left - PAD.right)).toFixed(1)} ${(PAD.top + (1 - y) * (H - PAD.top - PAD.bottom)).toFixed(1)}`)
    .join(" ");

/**
 * The expected progress, as an illustration with no numbers: the goal's line and the
 * other half of body-and-mind, from today to day 28. Time runs left to right, as on
 * any graph; the labels are Hebrew.
 */
function ProgressGraph({ lines }: { lines: readonly [string, string] }) {
  const end = { x: W - PAD.right, y: PAD.top + 0.1 * (H - PAD.top - PAD.bottom) };
  return (
    <figure className="mt-5 rounded-[24px] bg-white p-4 shadow-[0_10px_28px_rgb(20_40_20/0.08)]">
      <figcaption className="font-display text-[1.25rem] font-extrabold">ההתקדמות הצפויה שלך</figcaption>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.9375rem] font-bold">
        <Legend color={GREEN} label={lines[0]} />
        <Legend color={BLUE} label={lines[1]} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label={`${lines[0]} ו${lines[1]} עולים לאורך 28 הימים`} direction="ltr">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={PAD.left} x2={W - PAD.right} y1={PAD.top + f * (H - PAD.top - PAD.bottom)} y2={PAD.top + f * (H - PAD.top - PAD.bottom)} stroke="#EEEBE4" />
        ))}
        <path className="plan-draw" d={toPath(0.08)} fill="none" stroke={BLUE} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
        <path className="plan-draw" d={toPath(0)} fill="none" stroke={GREEN} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
        <circle cx={end.x} cy={end.y} r="7" fill={GREEN} className="plan-pop" />
        <g className="plan-pop">
          <rect x={end.x - 92} y={end.y - 30} width="84" height="24" rx="12" fill={GREEN} />
          <text x={end.x - 50} y={end.y - 13} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">
            המטרה שלך
          </text>
        </g>
        <text x={PAD.left} y={H - 8} fontSize="13" fill="#6B6B66">
          היום
        </text>
        <text x={W / 2} y={H - 8} fontSize="13" fill="#6B6B66" textAnchor="middle">
          יום 14
        </text>
        <text x={W - PAD.right} y={H - 8} fontSize="13" fill="#6B6B66" textAnchor="end">
          יום 28
        </text>
      </svg>
      <p className="mt-1 text-[0.875rem] text-[#6B6B66]">המחשה של התקדמות צפויה. הקצב של כל אחד שונה.</p>
    </figure>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
