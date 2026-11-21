/**
 * What the app's אתגרים tab shows, for the site's locked copy of it (owner, 2026-11-15:
 * the visitor sees the challenges and the memory games as in the app but can open
 * only the taster workout). The challenges come live from getChallenges; the games
 * are the app's list (MemoryGamesContent), with the app's own pictures in public/taster.
 */
export type TasterChallenge = {
  id: string;
  title: string;
  subtitle: string | null;
  durationDays: number;
  coverImageUrl: string | null;
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/** getChallenges' body; anything unexpected is an empty list, so the tab just shows none. */
export function parseChallenges(body: unknown): TasterChallenge[] {
  if (!isRecord(body) || !Array.isArray(body.challenges)) return [];
  return body.challenges.flatMap((raw): TasterChallenge[] => {
    if (!isRecord(raw)) return [];
    const id = text(raw.id);
    const title = text(raw.title);
    const days = typeof raw.durationDays === "number" && raw.durationDays > 0 ? raw.durationDays : null;
    if (!id || !title || !days) return [];
    return [{ id, title, subtitle: text(raw.subtitle), durationDays: days, coverImageUrl: text(raw.coverImageUrl) }];
  });
}

export type TasterGame = { title: string; picture: string };

/**
 * The games under "כל המשחקים", in the app's order: the silver coins first (owner,
 * 2026-11-14), then DailyProgram.allGames. "נגד הזרם" took the place of "שומרים על האוצר"
 * (owner, 2026-11-21). "זכירת פרצופים" shows a drawn face here:
 * its app icon is a real person's photo, consented for the app only.
 */
export const TASTER_GAMES: readonly TasterGame[] = [
  { title: "מטבעות הכסף", picture: "/taster/MemorySilverCoin.png" },
  { title: "זכרו את הרצף", picture: "/taster/DualTaskPictureBanana.png" },
  { title: "נגד הזרם", picture: "/taster/MemoryAgainstIcon.png" },
  { title: "זיכרון פורח", picture: "/taster/MemoryBloomFlowerPoppy.png" },
  { title: "מה חסר בדוכן?", picture: "/taster/MemoryGamePictureStrawberry.png" },
  { title: "הגולה המהירה", picture: "/taster/MemoryMarbleIcon.png" },
  { title: "המטבח של אורלי", picture: "/taster/DualTaskPictureTomato.png" },
  { title: "זכירת פרצופים", picture: "/taster/face.svg" },
];

/** The five pictures on the daily program's cover. */
export const PROGRAM_COVER = TASTER_GAMES.slice(1, 6).map((g) => g.picture);
