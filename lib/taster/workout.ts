/**
 * The free first workout, as requestWorkout serves it to the apps: one taster per
 * functionality level, the same exercises the app would play (CLAUDE.md, rule 7).
 * The site reads it with the visitor's own session right after the SMS code.
 */

export type TasterExercise = {
  id: string;
  name: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  /** End of the spoken explanation ("הסבר"), seconds into the clip. */
  introSeconds: number | null;
  /** Where the exercise itself starts ("האימון מתחיל"). */
  workoutStartSeconds: number | null;
  /** The hand-typed length; only a fallback until the clip reports its real one. */
  durationSeconds: number;
};

export type TasterWorkout = {
  /** The scheduled_workouts row requestWorkout opened; null only in the preview demo. */
  scheduledWorkoutId: string | null;
  exercises: TasterExercise[];
};

export type WorkoutReply =
  | { kind: "ready"; workout: TasterWorkout }
  /** The one free workout was already done (requiresPayment): straight on to the plans. */
  | { kind: "used" }
  | { kind: "error" };

/** requestWorkout's fallback when duration_seconds is empty (DEFAULT_EXERCISE_SECONDS). */
const DEFAULT_SECONDS = 60;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const seconds = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);

/** The apps play the portrait clip when there is one, else the main one (ExerciseVideoResolver). */
function toExercise(raw: unknown): TasterExercise | null {
  if (!isRecord(raw)) return null;
  const id = text(raw.exercise_id) ?? text(raw.id);
  const name = text(raw.name);
  const videoUrl = text(raw.video_url_portrait) ?? text(raw.video_url);
  if (!id || !name || !videoUrl) return null;
  return {
    id,
    name,
    videoUrl,
    thumbnailUrl: text(raw.thumbnail_url),
    introSeconds: seconds(raw.intro_seconds),
    workoutStartSeconds: seconds(raw.workout_start_seconds),
    durationSeconds: seconds(raw.duration) ?? seconds(raw.duration_seconds) ?? DEFAULT_SECONDS,
  };
}

/** requestWorkout's body, read defensively: anything unexpected is an error, never a half workout. */
export function parseWorkoutReply(body: unknown): WorkoutReply {
  if (!isRecord(body)) return { kind: "error" };
  if (body.requiresPayment === true) return { kind: "used" };
  if (body.success !== true || !isRecord(body.workout)) return { kind: "error" };
  const scheduledWorkoutId = text(body.scheduledWorkoutId);
  const list = Array.isArray(body.workout.exercises) ? body.workout.exercises : [];
  const exercises = list.map(toExercise).filter((e): e is TasterExercise => e !== null);
  if (!scheduledWorkoutId || exercises.length === 0) return { kind: "error" };
  return { kind: "ready", workout: { scheduledWorkoutId, exercises } };
}

/** Whole minutes for the intro line ("כ-4 דקות"), never below one. */
export function totalMinutes(exercises: readonly TasterExercise[]): number {
  const total = exercises.reduce((sum, e) => sum + e.durationSeconds, 0);
  return Math.max(1, Math.round(total / 60));
}
