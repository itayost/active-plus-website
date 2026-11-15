import { CANONICAL_HOST, LEGACY_HOSTS } from "@/lib/domains";
import type { TasterWorkout } from "./workout";

/**
 * A preview-only run of the taster, for checking the screens on a phone without
 * signing up a new number: /taster?demo=1 on a Vercel preview or localhost.
 * It plays the fully_independent taster as it stood on 2026-11-14 and writes
 * nothing (no scheduled_workouts row, no progress). Never on the live site.
 */
export function demoAllowed(host: string, search: string): boolean {
  const live = host === CANONICAL_HOST || (LEGACY_HOSTS as readonly string[]).includes(host);
  return !live && new URLSearchParams(search).get("demo") === "1";
}

const VIDEO = "https://fyktrpgufhibhstsnxwo.supabase.co/storage/v1/object/public/exercise-videos";
const THUMB = "https://fyktrpgufhibhstsnxwo.supabase.co/storage/v1/object/public/exercise-thumbnails";

const clip = (id: string, file: string, name: string, durationSeconds: number, introSeconds: number, workoutStartSeconds: number) => ({
  id,
  name,
  videoUrl: `${VIDEO}/${id}/portrait/${file}`,
  thumbnailUrl: `${THUMB}/${id}.jpg`,
  introSeconds,
  workoutStartSeconds,
  durationSeconds,
});

export const DEMO_WORKOUT: TasterWorkout = {
  scheduledWorkoutId: null,
  difficulty: 1,
  exercises: [
    clip("83b212f6-9650-47f0-9d81-4f8dfbef63e7", "1790576816685-opt.mp4", "הליכה עם תנועות ידיים", 52, 10, 11),
    clip("ca2b64dc-758f-4051-bb6a-db3dca8eef22", "1785942562849-opt.mp4", "הרחקה ופשיטת ירך בעמידה", 50, 9, 11),
    clip("7420a6a4-8616-4b69-b8ee-6f9934acb3a5", "1790576954808-opt.mp4", "יד לכתף נגדית והרמת ברך", 54, 8, 10),
    clip("cc708d8a-0de8-4bff-a5f6-440450c30f20", "1785942596521-opt.mp4", "הרמת ברך עם לחיצת כתפיים", 45, 10, 13),
    clip("56c1d735-c90f-41a1-b79d-c4d1ab5b194c", "1790577241857-opt.mp4", "מתיחת רחב גבי", 37, 8, 13),
  ],
};
