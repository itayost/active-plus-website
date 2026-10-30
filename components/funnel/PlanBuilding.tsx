"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { COPY } from "@/lib/funnel/copy";
import { PLAN_BUILD_HOLD_MS, PLAN_BUILD_MS } from "@/lib/funnel/constants";
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
 * over PLAN_BUILD_MS while three lines turn green, then it moves on by itself.
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
      const progress = Math.min(1, (now - start) / PLAN_BUILD_MS);
      setPercent(Math.round(progress * 100));
      if (progress < 1) {
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

  return (
    <div className="flex flex-1 flex-col pt-6 text-center">
      <div
        role="progressbar"
        aria-labelledby={STEP_TITLE_ID}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="relative mx-auto mb-6 aspect-square w-[min(10rem,100%)]"
      >
        <svg viewBox="0 0 120 120" aria-hidden="true" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="10" className="stroke-ink/10" />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
            className="stroke-green-deep forced-colors:stroke-[Highlight]"
          />
        </svg>
        <b aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-display text-[2.5rem] font-extrabold text-green-deep">
          <bdi dir="ltr">{percent}%</bdi>
        </b>
      </div>
      <StepTitle>{COPY.planBuilding.title}</StepTitle>
      <ul className="mx-auto mt-7 grid max-w-[30rem] gap-4 text-start">
        {planChecklist(painAreas).map((item) => {
          const on = percent >= item.at;
          return (
            <li
              key={item.at}
              className={cn(
                "flex items-center gap-[0.9rem] transition-colors duration-[var(--dur)]",
                on ? "font-medium text-ink" : "text-ink-soft",
              )}
            >
              <Tick on={on} tone="green" />
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
    <figure className="mx-auto mt-8 w-full max-w-[30rem] rounded-card bg-surface p-5 text-start shadow-lift-1">
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
      <blockquote className="mt-3 leading-[1.55] text-ink">&ldquo;{R.text}&rdquo;</blockquote>
    </figure>
  );
}
