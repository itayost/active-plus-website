/**
 * The completion the apps write when the workout's last clip ends
 * (WorkoutCompletionViewModel.submitScheduledWorkout): an UPDATE of the
 * scheduled_workouts row requestWorkout opened, by its id, read back so a
 * zero-row update is caught. The feedback columns stay empty: the site asks
 * no feedback questions.
 */
export type CompletionUpdate = {
  status: "completed";
  started_at: string;
  completed_at: string;
  duration_minutes: number;
  exercises_completed: number;
  exercises_total: number;
  completion_percentage: number;
};

export function completionUpdate(input: { startedAt: Date; endedAt: Date; played: number; total: number }): CompletionUpdate {
  const elapsed = Math.max(0, Math.floor((input.endedAt.getTime() - input.startedAt.getTime()) / 1000));
  return {
    status: "completed",
    started_at: input.startedAt.toISOString(),
    completed_at: input.endedAt.toISOString(),
    // Rounded half up, never below one, as the apps do.
    duration_minutes: Math.max(1, Math.floor((elapsed + 30) / 60)),
    exercises_completed: input.played,
    exercises_total: input.total,
    completion_percentage: input.total > 0 ? Math.floor((input.played / input.total) * 100) : 0,
  };
}
