import type { TasterChallenge } from "./catalog";

const COVER = "https://fyktrpgufhibhstsnxwo.supabase.co/storage/v1/object/public/challenge-covers";

/** The preview demo's challenges, as live on 2026-11-15 (lib/taster/demo.ts gates it). */
export const DEMO_CHALLENGES: TasterChallenge[] = [
  { id: "power-14", title: "אתגר הגוף החזק", subtitle: "28 ימים שיחזקו את הגוף, ימלאו אתכם באנרגיה וישפרו את הביטחון בכל תנועה.", durationDays: 28, coverImageUrl: `${COVER}/b9b86022-f097-4809-9fa4-ddc767ad785b/1791033116874.jpg` },
  { id: "challenge-7-h10v3o", title: "משקולות בישיבה", subtitle: null, durationDays: 7, coverImageUrl: `${COVER}/52cf8cd1-07bc-4608-8554-e657fa205298/1791621763379.png` },
  { id: "young-21", title: "לחשוב תוך כדי תנועה", subtitle: null, durationDays: 21, coverImageUrl: `${COVER}/0319a88d-7251-469b-bf1c-f6ed5a96c299/1791029026381.jpg` },
  { id: "balance-7", title: "שחרור הגב התחתון", subtitle: null, durationDays: 7, coverImageUrl: `${COVER}/bf881704-58c4-49c7-bdc7-cce7c9da557d/1791621723210.png` },
  { id: "active-28", title: "אתגר חיזוק רגליים", subtitle: null, durationDays: 14, coverImageUrl: `${COVER}/b77259b6-8a61-4708-a0f0-279f4a84753a/1791034488428.png` },
];
