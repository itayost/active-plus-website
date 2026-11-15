"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { logAuthFailure } from "@/lib/funnel/log";
import { loadSupabaseSession } from "@/lib/supabase/lazy";
import { parseChallenges, type TasterChallenge } from "./catalog";
import { completionUpdate } from "./completion";
import { parseWorkoutReply, type WorkoutReply } from "./workout";

/**
 * The site's side of the free first workout, the same calls the apps make:
 * requestWorkout serves it (and opens today's scheduled_workouts row), the two
 * progress RPCs say where the visitor reached, and the row is completed by id.
 * Nothing here writes what the apps do not.
 */
export type TasterSession = { supabase: SupabaseClient; userId: string };

export async function loadTasterSession(): Promise<TasterSession | null> {
  const supabase = await loadSupabaseSession();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  return userId ? { supabase, userId } : null;
}

export async function requestTasterWorkout(session: TasterSession): Promise<WorkoutReply> {
  try {
    const { data, error } = await session.supabase.functions.invoke("requestWorkout", { body: {} });
    if (error) {
      logAuthFailure("taster:request", error);
      return { kind: "error" };
    }
    return parseWorkoutReply(data);
  } catch (caught) {
    logAuthFailure("taster:request", caught);
    return { kind: "error" };
  }
}

/** The live challenge list, shown locked on the site; empty on any failure. */
export async function loadChallenges(session: TasterSession): Promise<TasterChallenge[]> {
  try {
    const { data, error } = await session.supabase.functions.invoke("getChallenges", { body: {} });
    return error ? [] : parseChallenges(data);
  } catch {
    return [];
  }
}

/** The level the questionnaire set, which picks the music as the apps do; null on any failure. */
export async function loadFunctionalityLevel(session: TasterSession): Promise<string | null> {
  try {
    const { data } = await session.supabase.from("trainee_profiles").select("functionality_level").eq("user_id", session.userId).maybeSingle();
    return (data as { functionality_level?: string | null } | null)?.functionality_level ?? null;
  } catch {
    return null;
  }
}

/** The first name on the visitor's own row, for the end screen; null on any failure. */
export async function loadFirstName(session: TasterSession): Promise<string | null> {
  try {
    const { data } = await session.supabase.from("users").select("full_name").eq("id", session.userId).maybeSingle();
    const full = (data as { full_name?: string | null } | null)?.full_name?.trim();
    return full ? full.split(/\s+/)[0] : null;
  } catch {
    return null;
  }
}

/**
 * Where the visitor reached, for the office's exercise-stay report; fire and forget,
 * one call after another (the server closes the previous exercise when the next arrives),
 * as WorkoutExerciseProgressRecorder does on the apps.
 */
export function progressRecorder(session: TasterSession, scheduledWorkoutId: string) {
  const sessionId = crypto.randomUUID();
  let tail: Promise<void> = Promise.resolve();
  let last: number | null = null;
  let finished = false;
  const enqueue = (call: () => PromiseLike<{ error: unknown }>) => {
    tail = tail.then(async () => {
      try {
        const { error } = await call();
        if (error) logAuthFailure("taster:progress", error);
      } catch (caught) {
        logAuthFailure("taster:progress", caught);
      }
    });
  };
  return {
    reached(position: number, exerciseId: string) {
      if (finished || position === last) return;
      last = position;
      enqueue(() =>
        session.supabase.rpc("record_workout_exercise_reached", {
          p_scheduled_workout_id: scheduledWorkoutId,
          p_session_id: sessionId,
          p_position: position,
          p_exercise_id: exerciseId,
        }),
      );
    },
    finished() {
      if (finished || last === null) return;
      finished = true;
      enqueue(() => session.supabase.rpc("record_workout_exercise_finished", { p_session_id: sessionId }));
    },
  };
}

/** Completes the row by id; true only when a row was really updated. */
export async function saveCompletion(
  session: TasterSession,
  scheduledWorkoutId: string,
  input: { startedAt: Date; endedAt: Date; played: number; total: number },
): Promise<boolean> {
  try {
    const { data, error } = await session.supabase
      .from("scheduled_workouts")
      .update(completionUpdate(input))
      .eq("id", scheduledWorkoutId)
      .select("id");
    if (error) {
      logAuthFailure("taster:complete", error);
      return false;
    }
    return Array.isArray(data) && data.length > 0;
  } catch (caught) {
    logAuthFailure("taster:complete", caught);
    return false;
  }
}
