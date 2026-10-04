import type { Option } from "./OptionList";
import { CHOICE_LABEL, STEP_TITLE_ID, Tick, choiceCard } from "./parts";

type Props = {
  options: readonly Option[];
  selected: readonly string[];
  onToggle: (value: string) => void;
};

const NONE = "none";

/**
 * Multi-select as toggle buttons (aria-pressed) in two columns, with the
 * exclusive "no pain" answer full width and last. The column count drops to
 * one when enlarged text can no longer fit two labels side by side.
 */
export default function BodyAreas({ options, selected, onToggle }: Props) {
  return (
    <div
      role="group"
      aria-labelledby={STEP_TITLE_ID}
      className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(max(8rem,calc(50%-0.4rem)),1fr))] gap-3"
    >
      {options.map((option) => {
        const on = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(option.value)}
            className={`${choiceCard(on)} cursor-pointer ${option.value === NONE ? "col-span-full" : ""}`}
          >
            <span className={CHOICE_LABEL}>{option.label}</span>
            <Tick on={on} shape="square" />
          </button>
        );
      })}
    </div>
  );
}
