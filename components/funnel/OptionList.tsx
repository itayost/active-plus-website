import { CHOICE_LABEL, Isolated, STEP_TITLE_ID, Tick, choiceCard } from "./parts";

export type Option = { value: string; label: string };

type Props = {
  name: string;
  options: readonly Option[];
  value: string | undefined;
  onChange: (value: string) => void;
};

/**
 * Single-select answers as native radios (arrow keys, Tab and form semantics
 * from the browser), painted as 72px cards. Choosing highlights the card;
 * moving on is the "המשך" button's job, as in the app.
 */
export default function OptionList({ name, options, value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-labelledby={STEP_TITLE_ID} className="mt-7 grid gap-3">
      {options.map((option) => {
        const on = option.value === value;
        return (
          <label key={option.value} className="relative block cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={on}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={`${choiceCard(on)} peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-blue-deep`}
            >
              <span className={CHOICE_LABEL}>
                <Isolated text={option.label} />
              </span>
              <Tick on={on} />
            </span>
          </label>
        );
      })}
    </div>
  );
}
