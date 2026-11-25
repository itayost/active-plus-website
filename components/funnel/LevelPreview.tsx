"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckIcon } from "@/components/ui/icons";
import { COPY, g } from "@/lib/funnel/copy";
import type { Answers } from "@/lib/funnel/types";
import { cn } from "@/lib/utils";
import { ContinueButton, Subtitle, StepTitle } from "./parts";

type Level = "fully_independent" | "balance_issues" | "chair_only";

/** The three ways to train, each with its trainer photo (owner, 2026-11-25). */
const WAYS: readonly { level: Level; image: string; title: string; sub: string }[] = [
  { level: "fully_independent", image: "/img/funnel/level/standing.webp", title: "בעמידה, בלי תמיכה", sub: "תרגילים בעמידה חופשית" },
  { level: "balance_issues", image: "/img/funnel/level/support.webp", title: "בעמידה, עם כיסא", sub: "כיסא לידך, לתמיכה וליציבות" },
  { level: "chair_only", image: "/img/funnel/level/seated.webp", title: "בישיבה על כיסא", sub: "כל התרגילים בישיבה, בנוחות" },
];

/**
 * "איך היית מעדיפה להתאמן?" (owner, 2026-11-25): a preference, not a functional test. The visitor
 * chooses how to train, the way large fitness apps ask it, with three photo cards; the choice
 * becomes functionality_level.
 */
export default function LevelPreview({ answers, onChoose }: { answers: Answers; onChoose: (level: Level) => void }) {
  const gender = answers.gender;
  // No functional questions any more (owner, 2026-11-25): nothing is chosen for the visitor.
  const [chosen, setChosen] = useState<Level | null>((answers.functionality_level as Level | undefined) ?? null);
  return (
    <>
      <StepTitle>{g(gender, COPY.levelPreview.title.fem, COPY.levelPreview.title.masc)}</StepTitle>
      <Subtitle text={g(gender, COPY.levelPreview.subtitle.fem, COPY.levelPreview.subtitle.masc)} />
      <div role="radiogroup" aria-label={COPY.levelPreview.title.fem} className="mt-6 grid gap-3">
        {WAYS.map((way) => {
          const selected = chosen === way.level;
          return (
            <button
              key={way.level}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setChosen(way.level)}
              className={cn(
                "flex min-h-[104px] w-full items-center gap-4 rounded-2xl border-2 bg-white p-2.5 text-start shadow-[0_2px_10px_rgb(31_107_61/0.06)] transition-colors",
                selected ? "border-green bg-green-wash" : "border-transparent",
              )}
            >
              <span className="relative h-[84px] w-[68px] shrink-0 overflow-hidden rounded-xl">
                <Image src={way.image} alt="" fill sizes="68px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[1.1875rem] font-bold leading-tight text-ink">{way.title}</span>
                <span className="mt-0.5 block text-[1rem] leading-snug text-ink-soft">{way.sub}</span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                  selected ? "border-green bg-green text-white" : "border-ink-faint/40",
                )}
              >
                {selected ? <CheckIcon className="h-4 w-4" /> : null}
              </span>
            </button>
          );
        })}
      </div>
      <ContinueButton
        pinned
        disabled={!chosen}
        label={g(gender, COPY.common.continue.fem, COPY.common.continue.masc)}
        onClick={() => chosen && onChoose(chosen)}
      />
    </>
  );
}
