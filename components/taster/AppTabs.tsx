"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { LockIcon, PlayIcon } from "@/components/ui/icons";
import { PROGRAM_COVER, TASTER_GAMES, type TasterChallenge } from "@/lib/taster/catalog";
import { cn } from "@/lib/utils";
import { BIG } from "./TasterScreens";

const GREEN = "text-[#2E7D32]";
const MUTED = "text-[#6B6B66]";
const CARD = "rounded-[16px] bg-white shadow-[0_6px_18px_rgb(20_40_20/0.07)]";

/** The app's screen header (TraineeScreenHeader): a big title and a quiet line under it. */
function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-[2.25rem] font-extrabold leading-tight">{title}</h1>
      <p className={cn("mt-1 text-[1.0625rem]", MUTED)}>{subtitle}</p>
    </div>
  );
}

/** The app's "למנויים" chip. */
function Chip({ children }: { children: string }) {
  return <span className={cn("whitespace-nowrap rounded-full bg-[#EDF5E5] px-3 py-1.5 text-[0.875rem] font-bold", GREEN)}>{children}</span>;
}

/** The app's green button with a lock: "פתיחה עם מנוי". */
function LockedButton({ onClick, label = "פתיחה עם מנוי" }: { onClick: () => void; label?: string }) {
  return (
    <Button size="lg" className={BIG} onClick={onClick}>
      <LockIcon className="h-5 w-5" />
      {label}
    </Button>
  );
}

/** The אתגרים tab: its two segments, challenges and memory games, every item locked. */
export function ChallengesTab({ challenges, onLocked }: { challenges: readonly TasterChallenge[]; onLocked: () => void }) {
  const [segment, setSegment] = useState<"challenges" | "games">("challenges");
  return (
    <div>
      <Header title="אתגרים" subtitle={segment === "games" ? "בחרו מה בא לכם היום" : "בחרו את האתגר שמתאים לכם"} />
      <div className="mb-5 flex rounded-full bg-[#EEEBE4] p-1" role="tablist">
        {(
          [
            ["challenges", "אתגרים"],
            ["games", "משחקי זיכרון"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={segment === id}
            onClick={() => setSegment(id)}
            className={cn(
              "min-h-[52px] flex-1 rounded-full text-[1.0625rem] font-bold",
              segment === id ? "bg-white text-ink shadow-[0_2px_6px_rgb(0_0_0/0.08)]" : MUTED,
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {segment === "challenges" ? <ChallengeList challenges={challenges} onLocked={onLocked} /> : <GameList onLocked={onLocked} />}
    </div>
  );
}

function Cover({ url, className }: { url: string | null; className?: string }) {
  if (!url) return <span className={cn("block bg-[#E8F0E4]", className)} aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element -- a challenge cover from storage, shown as is
  return <img src={url} alt="" className={cn("object-cover", className)} />;
}

function ChallengeList({ challenges, onLocked }: { challenges: readonly TasterChallenge[]; onLocked: () => void }) {
  if (challenges.length === 0) return <p className={cn("py-10 text-center text-lead", MUTED)}>בקרוב יחכו לכם כאן אתגרים חדשים</p>;
  const [featured, ...others] = challenges;
  return (
    <div className="flex flex-col">
      {/* The featured card (FeaturedChallengeCard): cover, days, title, subtitle, the locked button. */}
      <div className={cn(CARD, "rounded-[24px] p-3")}>
        <button type="button" onClick={onLocked} className="relative block w-full" aria-label={featured.title}>
          <Cover url={featured.coverImageUrl} className="aspect-video w-full rounded-[16px]" />
          <span className={cn("absolute right-3 top-3 rounded-full bg-white px-3 py-1.5 text-[1.0625rem] font-bold shadow", GREEN)}>{featured.durationDays} ימים</span>
        </button>
        <div className="px-2 pb-2 pt-3">
          <p className={cn("text-[0.875rem]", MUTED)}>אתגר מומלץ</p>
          <h2 className="font-display text-[1.75rem] font-extrabold leading-tight">{featured.title}</h2>
          {featured.subtitle && <p className={cn("mt-2 line-clamp-3 text-[1.0625rem]", MUTED)}>{featured.subtitle}</p>}
          <div className="mt-4">
            <LockedButton onClick={onLocked} />
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 font-display text-[1.25rem] font-extrabold">אתגרים נוספים</h2>
          <ul className="flex flex-col gap-3">
            {others.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={onLocked} className={cn(CARD, "flex min-h-[60px] w-full items-center gap-3 p-2.5 text-right")}>
                  <Cover url={c.coverImageUrl} className="h-[72px] w-[96px] shrink-0 rounded-[12px]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[1.0625rem] font-bold leading-snug">{c.title}</span>
                    <span className={cn("block text-[0.875rem]", MUTED)}>{c.durationDays} ימים · למנויים</span>
                  </span>
                  <LockIcon className={cn("ml-1 h-5 w-5 shrink-0", MUTED)} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function GameList({ onLocked }: { onLocked: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      {/* The daily program's card (MemoryGamesContent.programCard), on the deep-green stage. */}
      <div className={cn(CARD, "overflow-hidden rounded-[24px]")}>
        <div className="flex h-[150px] items-center justify-center gap-2 px-3" style={{ background: "radial-gradient(circle at 50% 40%, #2F8A36 0%, #1B5E20 58%, #0F3A14 100%)" }} aria-hidden>
          {PROGRAM_COVER.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element -- the app's own game pictures
            <img key={src} src={src} alt="" className="aspect-square min-w-0 max-w-[58px] flex-1 rounded-[12px] bg-[#FFF8E8] object-contain p-1.5 shadow-[0_4px_6px_rgb(0_0_0/0.3)]" />
          ))}
        </div>
        <div className="p-5">
          <h2 className="font-display text-[1.75rem] font-extrabold">האימון היומי</h2>
          <p className={cn("mt-1 text-[1.0625rem]", MUTED)}>5 משחקים קצרים. כל משחק מתחיל מרמה 1 ועולה איתכם.</p>
          <div className="my-3 flex gap-2">
            <Chip>כ-10 דקות ביום</Chip>
            <Chip>למנויים</Chip>
          </div>
          <LockedButton onClick={onLocked} />
        </div>
      </div>

      <h2 className="mt-1 font-display text-[1.25rem] font-extrabold">כל המשחקים</h2>
      {TASTER_GAMES.map((game) => (
        <button key={game.title} type="button" onClick={onLocked} className={cn(CARD, "flex min-h-[72px] items-center gap-3 px-4 py-3 text-right")}>
          {/* eslint-disable-next-line @next/next/no-img-element -- the app's own game pictures */}
          <img src={game.picture} alt="" className="h-12 w-12 shrink-0 object-contain" />
          <span className="min-w-0 flex-1">
            <span className="block text-[1.25rem] font-bold leading-tight">{game.title}</span>
            <span className={cn("block text-[0.875rem]", MUTED)}>למנויים</span>
          </span>
          <LockIcon className={cn("h-5 w-5 shrink-0", MUTED)} />
        </button>
      ))}
    </div>
  );
}

/** התקדמות before any workout: what will show here, and the way to the first one. */
export function ProgressTab({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <Header title="התקדמות" subtitle="האימונים, הרצף והשיאים שלכם" />
      <div className={cn(CARD, "rounded-[24px] p-6 text-center")}>
        <p className="font-display text-[1.5rem] font-extrabold">עוד אין כאן אימונים</p>
        <p className={cn("mt-2 text-[1.0625rem]", MUTED)}>אחרי האימון הראשון תראו כאן כמה התאמנתם, את הרצף ואת ההתקדמות שלכם.</p>
        <div className="mt-5">
          <Button size="lg" className={BIG} onClick={onStart}>
            <PlayIcon className="h-5 w-5" />
            לאימון הראשון
          </Button>
        </div>
      </div>
    </div>
  );
}

/** פרופיל: who is signed in, and the subscription they do not have yet. */
export function ProfileTab({ name, onPlans }: { name: string | null; onPlans: () => void }) {
  return (
    <div>
      <Header title="פרופיל" subtitle={name ? `שלום, ${name}` : "החשבון שלכם"} />
      <div className={cn(CARD, "rounded-[24px] p-5")}>
        <p className={cn("text-[0.875rem]", MUTED)}>המנוי שלכם</p>
        <p className="mt-1 font-display text-[1.5rem] font-extrabold">עדיין אין מנוי</p>
        <p className={cn("mt-2 text-[1.0625rem]", MUTED)}>מנוי פותח את כל האתגרים, משחקי הזיכרון ואימון חדש כל יום.</p>
        <div className="mt-5">
          <Button size="lg" className={BIG} onClick={onPlans}>
            לבחירת מסלול
          </Button>
        </div>
      </div>
    </div>
  );
}
