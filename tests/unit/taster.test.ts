import { describe, expect, it } from "vitest";
import { completionUpdate } from "@/lib/taster/completion";
import { DEMO_WORKOUT, demoAllowed } from "@/lib/taster/demo";
import { clock, timerAt } from "@/lib/taster/timer";
import { parseWorkoutReply, totalMinutes } from "@/lib/taster/workout";

const exercise = (over: Record<string, unknown> = {}) => ({
  id: "row-id",
  exercise_id: "ex-1",
  name: "הליכה עם תנועות ידיים",
  video_url: "https://x.supabase.co/v/main.mp4",
  video_url_portrait: "https://x.supabase.co/v/portrait.mp4",
  thumbnail_url: "https://x.supabase.co/t/1.jpg",
  intro_seconds: 10,
  workout_start_seconds: 11,
  duration_seconds: 52,
  duration: 52,
  ...over,
});
const reply = (exercises: unknown[], over: Record<string, unknown> = {}) => ({
  success: true,
  scheduledWorkoutId: "sw-1",
  workout: { id: "sw-1", exercises },
  ...over,
});

describe("parseWorkoutReply", () => {
  it("reads requestWorkout's workout, portrait clip first", () => {
    const parsed = parseWorkoutReply(reply([exercise()]));
    expect(parsed).toEqual({
      kind: "ready",
      workout: {
        scheduledWorkoutId: "sw-1",
        difficulty: 1,
        exercises: [
          {
            id: "ex-1",
            name: "הליכה עם תנועות ידיים",
            videoUrl: "https://x.supabase.co/v/portrait.mp4",
            thumbnailUrl: "https://x.supabase.co/t/1.jpg",
            introSeconds: 10,
            workoutStartSeconds: 11,
            durationSeconds: 52,
          },
        ],
      },
    });
  });
  it("reads the workout's difficulty, easy when unknown", () => {
    const hard = parseWorkoutReply(reply([exercise()], { workout: { exercises: [exercise()], difficulty: 3 } }));
    expect(hard.kind === "ready" && hard.workout.difficulty).toBe(3);
    const odd = parseWorkoutReply(reply([exercise()], { workout: { exercises: [exercise()], difficulty: 9 } }));
    expect(odd.kind === "ready" && odd.workout.difficulty).toBe(1);
  });
  it("falls back to the main clip and the default length", () => {
    const parsed = parseWorkoutReply(reply([exercise({ video_url_portrait: null, duration: null, duration_seconds: null, intro_seconds: null })]));
    expect(parsed.kind === "ready" && parsed.workout.exercises[0]).toMatchObject({ videoUrl: "https://x.supabase.co/v/main.mp4", durationSeconds: 60, introSeconds: null });
  });
  it("drops an exercise without a clip or a name", () => {
    const parsed = parseWorkoutReply(reply([exercise({ video_url: null, video_url_portrait: null }), exercise({ name: " " }), exercise()]));
    expect(parsed.kind === "ready" && parsed.workout.exercises).toHaveLength(1);
  });
  it("sends a used free workout on to the plans", () => {
    expect(parseWorkoutReply({ success: false, requiresPayment: true })).toEqual({ kind: "used" });
  });
  it("treats anything else as an error, never a half workout", () => {
    expect(parseWorkoutReply(null)).toEqual({ kind: "error" });
    expect(parseWorkoutReply({ success: false })).toEqual({ kind: "error" });
    expect(parseWorkoutReply(reply([]))).toEqual({ kind: "error" });
    expect(parseWorkoutReply(reply([exercise()], { scheduledWorkoutId: null }))).toEqual({ kind: "error" });
  });
});

describe("totalMinutes", () => {
  it("rounds the clips' lengths to whole minutes, at least one", () => {
    expect(totalMinutes(DEMO_WORKOUT.exercises)).toBe(4);
    expect(totalMinutes([])).toBe(1);
  });
});

describe("timerAt (the apps' countdown)", () => {
  const clip = { introSeconds: 10, workoutStartSeconds: 13, durationSeconds: 45 };
  it("counts the explanation down to the intro marker", () => {
    expect(timerAt(0, clip, 48)).toEqual({ phase: "explanation", remaining: 10 });
    expect(timerAt(9.2, clip, 48)).toEqual({ phase: "explanation", remaining: 1 });
  });
  it("hides the plate between the two markers", () => {
    expect(timerAt(11, clip, 48)).toEqual({ phase: "getReady", remaining: null });
  });
  it("counts the exercise down to the clip's real end", () => {
    expect(timerAt(13, clip, 48)).toEqual({ phase: "exercise", remaining: 35 });
    expect(timerAt(47.5, clip, 48)).toEqual({ phase: "exercise", remaining: 1 });
    expect(timerAt(50, clip, 48)).toEqual({ phase: "exercise", remaining: 0 });
  });
  it("uses the typed length only until the clip reports its own", () => {
    expect(timerAt(13, clip, null)).toEqual({ phase: "exercise", remaining: 32 });
    expect(timerAt(13, clip, Number.NaN)).toEqual({ phase: "exercise", remaining: 32 });
  });
  it("has no gap with one marker, and no explanation with none", () => {
    expect(timerAt(5, { introSeconds: null, workoutStartSeconds: 8, durationSeconds: 40 }, 40)).toEqual({ phase: "explanation", remaining: 3 });
    expect(timerAt(8, { introSeconds: null, workoutStartSeconds: 8, durationSeconds: 40 }, 40)).toEqual({ phase: "exercise", remaining: 32 });
    expect(timerAt(0, { introSeconds: null, workoutStartSeconds: null, durationSeconds: 40 }, 40)).toEqual({ phase: "exercise", remaining: 40 });
  });
});

describe("clock", () => {
  it("is m:ss", () => {
    expect(clock(0)).toBe("0:00");
    expect(clock(35)).toBe("0:35");
    expect(clock(61)).toBe("1:01");
  });
});

describe("completionUpdate (the apps' completion write)", () => {
  const startedAt = new Date("2026-11-14T10:00:00Z");
  it("writes the apps' columns, minutes rounded half up", () => {
    expect(completionUpdate({ startedAt, endedAt: new Date("2026-11-14T10:04:31Z"), played: 5, total: 5 })).toEqual({
      status: "completed",
      started_at: "2026-11-14T10:00:00.000Z",
      completed_at: "2026-11-14T10:04:31.000Z",
      duration_minutes: 5,
      exercises_completed: 5,
      exercises_total: 5,
      completion_percentage: 100,
    });
  });
  it("never records under a minute, and floors the percentage", () => {
    const update = completionUpdate({ startedAt, endedAt: new Date("2026-11-14T10:00:10Z"), played: 2, total: 3 });
    expect(update.duration_minutes).toBe(1);
    expect(update.completion_percentage).toBe(66);
  });
  it("carries no feedback columns", () => {
    const update = completionUpdate({ startedAt, endedAt: startedAt, played: 0, total: 0 });
    expect(Object.keys(update)).not.toContain("difficulty_feedback");
    expect(update.completion_percentage).toBe(0);
  });
});

describe("demoAllowed", () => {
  it("runs on previews and localhost with ?demo=1 only", () => {
    expect(demoAllowed("active-plus-website-git-x-active-plus.vercel.app", "?demo=1")).toBe(true);
    expect(demoAllowed("localhost", "?demo=1")).toBe(true);
    expect(demoAllowed("localhost", "")).toBe(false);
  });
  it("never on the live site", () => {
    expect(demoAllowed("peilimplus.co.il", "?demo=1")).toBe(false);
    expect(demoAllowed("www.peilimplus.co.il", "?demo=1")).toBe(false);
  });
  it("writes nothing: the demo has no workout row", () => {
    expect(DEMO_WORKOUT.scheduledWorkoutId).toBeNull();
  });
});

describe("musicFor (the apps' music by level)", () => {
  it("plays the standing music for fully independent only", async () => {
    const { musicFor, TASTER_MUSIC } = await import("@/lib/taster/music");
    expect(musicFor("fully_independent")).toBe(TASTER_MUSIC.independent);
    expect(musicFor("balance_issues")).toBe(TASTER_MUSIC.seated);
    expect(musicFor("chair_only")).toBe(TASTER_MUSIC.seated);
    expect(musicFor(null)).toBe(TASTER_MUSIC.seated);
  });
});
