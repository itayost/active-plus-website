import { ChevronIcon } from "@/components/ui/icons";
import { STEP_TITLE_ID } from "./parts";

type Props = {
  years: readonly number[];
  value: number;
  onChange: (year: number) => void;
  id?: string;
  labelledBy?: string;
};

export const SELECT_FIELD =
  "w-full min-w-0 cursor-pointer appearance-none rounded-field border-2 border-hairline bg-white py-3.5 ps-4 pe-[3.25rem] " +
  "font-display text-lead font-bold text-ink transition-colors duration-[var(--dur-fast)] hover:border-ink/25 " +
  "focus:border-blue-deep focus:outline-none min-h-[60px]";

/** A native select: the most legible and familiar picker for this audience on every platform. */
export function NativeSelect({
  id,
  value,
  options,
  onChange,
  labelledBy,
}: {
  id: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  labelledBy?: string;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        aria-labelledby={labelledBy}
        onChange={(event) => onChange(event.target.value)}
        className={SELECT_FIELD}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronIcon className="pointer-events-none absolute end-4 top-1/2 h-[22px] w-[22px] -translate-y-1/2 text-ink-soft" />
    </div>
  );
}

export default function YearSelect({ years, value, onChange, id = "funnel-year", labelledBy = STEP_TITLE_ID }: Props) {
  return (
    <div className="mt-7">
      <NativeSelect
        id={id}
        value={String(value)}
        options={years.map(String)}
        onChange={(year) => onChange(Number(year))}
        labelledBy={labelledBy}
      />
    </div>
  );
}
