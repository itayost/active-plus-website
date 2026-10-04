import { cleanOffBranch } from "./routing";
import type { Answers } from "./types";

const PAIN_ORDER = ["neck", "shoulders_neck", "elbows", "lower_back", "hips", "knees", "ankle", "none"];

export const dobFromYear = (year: number) => `${year}-01-01`;

export const normalizePainAreas = (areas: string[]): string[] =>
  PAIN_ORDER.filter((a) => areas.includes(a));

export function toggleBodyArea(current: string[], area: string): string[] {
  if (area === "none") return current.includes("none") ? [] : ["none"];
  const without = current.filter((a) => a !== "none");
  return without.includes(area)
    ? without.filter((a) => a !== area)
    : normalizePainAreas([...without, area]);
}

const isAnswered = (value: unknown) =>
  value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0);

/** Exactly what merge_funnel_session / fill_missing_funnel_answers receive. */
export function buildMergePayload(answers: Answers): Answers {
  const answered = Object.fromEntries(
    Object.entries(cleanOffBranch(answers)).filter(([, v]) => isAnswered(v)),
  ) as Answers;
  return {
    ...answered,
    ...(answered.pain_areas ? { pain_areas: normalizePainAreas(answered.pain_areas) } : {}),
    ...(answered.full_name ? { full_name: answered.full_name.trim() } : {}),
  };
}
