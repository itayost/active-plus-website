"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { STEP_TITLE_ID } from "./parts";

export type PhotoChoiceOption = { value: string; label: string; image: string };

type Props = {
  options: readonly PhotoChoiceOption[];
  value: string | undefined;
  /** Photo box shape (width / height): the gender portraits stand, the age photos lie down. */
  aspect: "portrait" | "landscape";
  onChoose: (value: string) => void;
};

/** How long the highlight shows before moving on, as in the apps (0.15s). */
const ADVANCE_MS = 150;

/**
 * Photo cards, two per row (an odd last card keeps a card's width). As in the
 * apps there is no "המשך": a tap highlights the card, then moves on. A second
 * tap while moving on is ignored, so one tap can never advance twice.
 */
export default function PhotoChoice({ options, value, aspect, onChoose }: Props) {
  const [picked, setPicked] = useState<string | undefined>(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const choose = (next: string) => {
    if (timer.current) return;
    setPicked(next);
    timer.current = setTimeout(() => onChoose(next), ADVANCE_MS);
  };

  return (
    <div role="group" aria-labelledby={STEP_TITLE_ID} className="mt-6 grid grid-cols-2 gap-3">
      {options.map((option) => {
        const on = option.value === picked;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            onClick={() => choose(option.value)}
            className={cn(
              "flex flex-col overflow-hidden rounded-card border-2 bg-surface pb-3 text-ink shadow-lift-1",
              "transition-[border-color,background-color,transform] duration-[var(--dur-fast)] ease-out-expo active:scale-[0.98]",
              on ? "scale-[1.02] border-green-deep bg-green-wash" : "border-hairline hover:border-ink/30",
            )}
          >
            <span className={cn("relative block w-full", aspect === "portrait" ? "aspect-[3/4]" : "aspect-[1.6]")}>
              <Image src={option.image} alt="" fill sizes="(min-width: 560px) 260px, 45vw" className="object-cover object-top" />
            </span>
            <span className="mt-2.5 block text-center font-display text-[1.25rem] font-bold leading-[1.3]">
              <bdi dir="ltr">{option.label}</bdi>
            </span>
          </button>
        );
      })}
    </div>
  );
}
