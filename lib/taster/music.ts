/**
 * The music under the exercises, as in the apps (WorkoutIntroAssets.musicTracks):
 * the standing set for fully_independent, the seated set for everyone else,
 * an unknown level included. One track of each, cut to six minutes from the
 * apps' own files, looped. The apps play it at 15% under the coach's voice;
 * iPhone Safari ignores a volume set from code, so that level is in the file
 * itself (public/audio, made with ffmpeg's volume=0.15).
 */
export const TASTER_MUSIC = {
  independent: "/audio/taster-music-independent.m4a",
  seated: "/audio/taster-music-seated.m4a",
} as const;

export function musicFor(level: string | null): string {
  return level === "fully_independent" ? TASTER_MUSIC.independent : TASTER_MUSIC.seated;
}
