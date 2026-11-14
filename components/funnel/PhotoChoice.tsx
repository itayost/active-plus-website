"use client";

import Image from "next/image";
import { SIZES } from "@/lib/funnel/images";
import { tapHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { STEP_TITLE_ID } from "./parts";

export type PhotoChoiceOption = { value: string; label: string; image: string };

type Props = {
  options: readonly PhotoChoiceOption[];
  value: string | undefined;
  /** Photo box shape (width / height): the gender portraits stand, the age photos lie down. */
  aspect: "portrait" | "landscape";
  /** A tap selects the card; the step's "המשך" moves on (owner, 2026-11-10). */
  onChoose: (value: string) => void;
};

/**
 * Photo cards, two per row (an odd last card keeps a card's width). A tap
 * highlights the card and nothing more: another tap changes the choice, and
 * the step's continue button moves on.
 */
export default function PhotoChoice({ options, value, aspect, onChoose }: Props) {

  return (
    <div role="group" aria-labelledby={STEP_TITLE_ID} className="mt-6 grid grid-cols-2 gap-3">
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            onClick={() => {
              tapHaptic();
              onChoose(option.value);
            }}
            className={cn(
              "flex flex-col overflow-hidden rounded-card border-2 bg-surface pb-3 text-ink shadow-lift-1",
              "transition-[border-color,background-color,transform] duration-[var(--dur-fast)] ease-out-expo active:scale-[0.98]",
              on ? "scale-[1.02] border-green-deep bg-green-wash" : "border-hairline hover:border-ink/30",
            )}
          >
            <span className={cn("relative block w-full", aspect === "portrait" ? "aspect-[3/4]" : "aspect-[1.6]")}>
              <Image src={option.image} alt="" fill sizes={SIZES.card} className="object-cover object-top" />
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
