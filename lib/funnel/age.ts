import { AGE_BAND_FALLBACK, AGE_BAND_STEP, DEFAULT_AGE, MAX_AGE, MIN_AGE } from "./constants";

/** Birth years for the picker, newest first. */
export function birthYears(currentYear: number): number[] {
  const count = MAX_AGE - MIN_AGE + 1;
  return Array.from({ length: count }, (_, i) => currentYear - MIN_AGE - i);
}

export const defaultBirthYear = (currentYear: number): number => currentYear - DEFAULT_AGE;

/** The year of a stored `"<year>-01-01"` date of birth. */
export function yearOf(dob: string | undefined): number | null {
  const match = /^(\d{4})-/.exec(dob ?? "");
  return match ? Number(match[1]) : null;
}

export function ageBand(dob: string | undefined, currentYear: number): number {
  const year = yearOf(dob);
  if (year === null) return AGE_BAND_FALLBACK;
  return Math.floor((currentYear - year) / AGE_BAND_STEP) * AGE_BAND_STEP;
}
