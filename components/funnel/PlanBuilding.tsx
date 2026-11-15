"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { COPY } from "@/lib/funnel/copy";
import { PLAN_BUILD_HOLD_MS, PLAN_BUILD_MS } from "@/lib/funnel/constants";
import { planBuildPercent } from "@/lib/funnel/plan-build";
import { planChecklist } from "@/lib/funnel/plan-lines";
import { cn } from "@/lib/utils";
import { ContinueButton, StepTitle, STEP_TITLE_ID, Tick } from "./parts";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Props = {
  /** The body areas answered just before: the checklist names them. */
  painAreas?: readonly string[];
  onDone: () => void;
};

/**
 * The loader between the questions and the time step: a ring filling to 100%
 * over PLAN_BUILD_MS, in uneven bursts (planBuildPercent), while three lines turn
 * green, then it moves on by itself.
 * Under reduced motion it is finished on arrival and waits for "המשך" instead.
 * Under the checklist, a Google review, as in the apps.
 */
export default function PlanBuilding({ painAreas, onDone }: Props) {
  const [percent, setPercent] = useState(0);
  const [waitForTap, setWaitForTap] = useState(false);
  // The run starts once per visit to the step; a new onDone identity must not restart it.
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPercent(100);
      setWaitForTap(true);
      return;
    }
    let frame = 0;
    let hold: ReturnType<typeof setTimeout> | undefined;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      setPercent(planBuildPercent(elapsed));
      if (elapsed < PLAN_BUILD_MS) {
        frame = requestAnimationFrame(tick);
        return;
      }
      hold = setTimeout(() => done.current(), PLAN_BUILD_HOLD_MS);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(hold);
    };
  }, []);

  const items = planChecklist(painAreas);
  const ready = percent >= 100;

  return (
    // One screen, no scroll (owner, 2026-11-15): sizes and gaps follow the screen's height.
    <div className="flex flex-1 flex-col pb-4 pt-[1.5dvh] text-center">
      <div
        role="progressbar"
        aria-labelledby={STEP_TITLE_ID}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className={cn(
          "relative mx-auto mb-[2.5dvh] aspect-square w-[min(10rem,19dvh)] shrink-0",
          ready && "plan-ready",
        )}
      >
        {/* A soft green glow breathes behind the ring while the plan is built. */}
        <span aria-hidden="true" className="plan-glow absolute inset-[-14%] rounded-pill bg-green/25 blur-xl" />
        <svg viewBox="0 0 120 120" aria-hidden="true" className="relative h-full w-full -rotate-90">
          <defs>
            <linearGradient id="plan-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#5CC98A" />
              <stop offset="1" stopColor="var(--green-deep)" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="10" className="stroke-ink/10" />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="url(#plan-ring)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
            className="forced-colors:stroke-[Highlight]"
          />
          {/* A bright point rides the end of the arc. */}
          {percent > 0 && percent < 100 ? (
            <circle
              cx={60 + RADIUS * Math.cos((2 * Math.PI * percent) / 100)}
              cy={60 + RADIUS * Math.sin((2 * Math.PI * percent) / 100)}
              r="3.2"
              fill="white"
              className="plan-spark"
            />
          ) : null}
        </svg>
        <b aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-display text-[min(2.5rem,5dvh)] font-extrabold text-green-deep">
          <bdi dir="ltr">{percent}%</bdi>
        </b>
      </div>
      <StepTitle>{ready ? COPY.planBuilding.ready : COPY.planBuilding.title}</StepTitle>
      <ul className="mx-auto mt-[3dvh] grid max-w-[30rem] gap-[1.8dvh] text-start">
        {items.map((item, i) => {
          const on = percent >= item.at;
          // The line being worked on now: the first not yet done.
          const current = !on && (i === 0 || percent >= items[i - 1].at);
          return (
            <li
              key={item.at}
              className={cn(
                "flex items-center gap-[0.9rem] transition-colors duration-[var(--dur)]",
                on ? "font-medium text-ink" : current ? "text-ink" : "text-ink-soft",
              )}
            >
              {current ? <WorkingTick /> : <Tick on={on} tone="green" pop />}
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>
      <Review />
      {waitForTap ? <ContinueButton pinned onClick={onDone} /> : null}
    </div>
  );
}

const R = COPY.planBuilding.review;

function Review() {
  return (
    <figure className="mx-auto mt-[3dvh] w-full max-w-[30rem] rounded-card bg-surface px-5 py-[min(1.25rem,2dvh)] text-start shadow-lift-1">
      <figcaption className="flex items-center justify-between gap-3">
        <span className="font-display text-[1.125rem] font-bold">{R.name}</span>
        <span className="inline-flex items-center gap-1.5 text-ink-soft">
          <Image src="/img/funnel/app/google-logo.png" alt="" width={20} height={20} className="h-5 w-5" />
          <span dir="ltr">{R.source}</span>
        </span>
      </figcaption>
      <p role="img" aria-label={R.stars} className="mt-1 text-[1.25rem] leading-none text-star">
        <span aria-hidden="true">★★★★★</span>
      </p>
      <blockquote className="mt-2 leading-[1.45] text-ink [@media(max-height:620px)]:line-clamp-3">&ldquo;{R.text}&rdquo;</blockquote>
    </figure>
  );
}

/** The empty circle of the line in progress, with a green arc turning in it. */
function WorkingTick() {
  return (
    <span aria-hidden="true" className="relative inline-flex h-8 w-8 shrink-0 rounded-pill border-2 border-green/25 bg-surface">
      <span className="plan-working absolute inset-[-2px] rounded-pill border-2 border-transparent border-t-green-deep" />
    </span>
  );
}
