/**
 * The countdown over a clip, ported from the iOS player (WorkoutSessionViewModel.updateTimer):
 * "הסבר" until the intro marker, nothing until the exercise starts, then "התרגיל"
 * counting down to the clip's end. The end is the clip's real length once the
 * video knows it: the typed length is often shorter and hit 0:00 mid-movement.
 */
export type TimerPhase = "explanation" | "getReady" | "exercise";

export type TimerState = { phase: TimerPhase; remaining: number | null };

export type ClipMarkers = { introSeconds: number | null; workoutStartSeconds: number | null; durationSeconds: number };

export function timerAt(at: number, clip: ClipMarkers, realDuration: number | null): TimerState {
  const clipEnd = realDuration && Number.isFinite(realDuration) && realDuration > 0 ? realDuration : clip.durationSeconds;
  // With only one marker there is no hidden gap; with neither the whole clip is the exercise.
  const explanationEnd = clip.introSeconds ?? clip.workoutStartSeconds;
  const exerciseStart = clip.workoutStartSeconds ?? clip.introSeconds;
  if (explanationEnd !== null && at < explanationEnd) {
    return { phase: "explanation", remaining: Math.max(0, Math.ceil(explanationEnd - at)) };
  }
  if (explanationEnd !== null && exerciseStart !== null && exerciseStart > explanationEnd && at < exerciseStart) {
    return { phase: "getReady", remaining: null };
  }
  return { phase: "exercise", remaining: Math.max(0, Math.ceil(clipEnd - at)) };
}

/** m:ss, as the apps' plate shows it. */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
