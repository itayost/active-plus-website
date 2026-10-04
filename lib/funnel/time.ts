import { COPY } from "./copy";

export type Segment = keyof typeof COPY.time.presets;

export const SEGMENTS: readonly Segment[] = ["morning", "midday", "afternoon"];

const pad = (n: number) => String(n).padStart(2, "0");

/** The segment whose picker range holds this "HH:mm", if any. */
export function segmentOf(time: string | undefined): Segment | null {
  const match = /^(\d{2}):\d{2}$/.exec(time ?? "");
  if (!match) return null;
  const hour = Number(match[1]);
  return SEGMENTS.find((s) => hour >= COPY.time.pickerRanges[s].from && hour <= COPY.time.pickerRanges[s].to) ?? null;
}

/** Every slot the "other hour" picker offers for a segment, in picker steps. */
export function slotsFor(segment: Segment): string[] {
  const { from, to } = COPY.time.pickerRanges[segment];
  const step = COPY.time.pickerStepMinutes;
  const slots: string[] = [];
  for (let hour = from; hour <= to; hour += 1) {
    for (let minute = 0; minute < 60; minute += step) slots.push(`${pad(hour)}:${pad(minute)}`);
  }
  return slots;
}

/** Where the picker opens when nothing in the segment is chosen yet. */
export const defaultSlot = (segment: Segment): string => COPY.time.presets[segment][1];
