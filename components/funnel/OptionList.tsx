"use client";

import { useState } from "react";
import type { AnswerIconName } from "@/lib/funnel/copy";
import { cn } from "@/lib/utils";
import AnswerIcon from "./AnswerIcon";
import { CHOICE_LABEL, Isolated, STEP_TITLE_ID, Tick, choiceCard } from "./parts";

export type Option = { value: string; label: string; icon?: AnswerIconName };

type Props = {
  name: string;
  options: readonly Option[];
  value: string | undefined;
  onChange: (value: string) => void;
  /**
   * A tap or click on an answer (not an arrow key, which only moves the
   * selection): the question moves on by itself after a short beat.
   */
  onPick?: (value: string) => void;
};

/**
 * Single-select answers as native radios (arrow keys, Tab and form semantics
 * from the browser), painted as 72px cards. Choosing highlights the card with
 * a short pop; a tap then moves on by itself (onPick), while "המשך" stays for
 * keyboards. An option with an icon gets the apps' leading answer badge.
 */
export default function OptionList({ name, options, value, onChange, onPick }: Props) {
  // The answer picked on this visit: only it pops, never one restored on arrival.
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div role="radiogroup" aria-labelledby={STEP_TITLE_ID} className="mt-6 grid gap-3">
      {options.map((option) => {
        const on = option.value === value;
        const pop = on && picked === option.value;
        return (
          <label
            key={option.value}
            className="relative block cursor-pointer"
            onClick={(e) => {
              // A real tap or click (detail > 0). The click an arrow key or Space sends the radio has
              // detail 0, and a drag or scroll that ends on the card sends no click here at all.
              if (e.detail > 0) onPick?.(option.value);
            }}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={on}
              onChange={() => {
                setPicked(option.value);
                onChange(option.value);
              }}
              className="peer sr-only"
            />
            <span
              className={cn(
                choiceCard(on),
                pop && "funnel-pop",
                "peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-blue-deep",
              )}
            >
              {option.icon ? <AnswerIcon name={option.icon} on={on} /> : null}
              <span className={CHOICE_LABEL}>
                <Isolated text={option.label} />
              </span>
              <Tick on={on} pop={pop} />
            </span>
          </label>
        );
      })}
    </div>
  );
}
