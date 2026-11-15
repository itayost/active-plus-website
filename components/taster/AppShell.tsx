"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import { LockIcon, PlayIcon } from "@/components/ui/icons";
import type { TasterChallenge } from "@/lib/taster/catalog";
import { cn } from "@/lib/utils";
import { ChallengesTab, ProfileTab, ProgressTab } from "./AppTabs";
import { BIG } from "./TasterScreens";

export type Tab = "challenges" | "progress" | "workout" | "profile";

/** The app's tab bar (TraineeTabBar), right to left: אתגרים, התקדמות, האימון היומי, פרופיל. */
const TABS: readonly { id: Tab; title: string; icon: ReactNode }[] = [
  { id: "challenges", title: "אתגרים", icon: <RunIcon /> },
  { id: "progress", title: "התקדמות", icon: <ChartIcon /> },
  { id: "workout", title: "האימון היומי", icon: <PlayIcon className="h-6 w-6" /> },
  { id: "profile", title: "פרופיל", icon: <PersonIcon /> },
];

/** The app's warm field behind every trainee screen. */
export const FIELD = "#FAF8F4";

/**
 * The app as a new trainee meets it, on the site (owner, 2026-11-15): the four tabs,
 * the challenges and the memory games to look at, every one of them locked, and the
 * taster workout on the home tab the only thing that plays. A locked tap opens the
 * same offer the app opens (its promo), here leading to the plans.
 */
export default function AppShell({
  home,
  challenges,
  name,
  onPlans,
}: {
  home: ReactNode;
  challenges: readonly TasterChallenge[];
  name: string | null;
  onPlans: () => void;
}) {
  const [tab, setTab] = useState<Tab>("workout");
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab]);
  const lock = () => setLocked(true);

  return (
    <div className="flex min-h-[100dvh] justify-center" style={{ background: FIELD }}>
      <div className="relative flex w-full max-w-[560px] flex-col pb-[calc(88px+env(safe-area-inset-bottom))] md:shadow-lift-2">
        <main className="gutter-x flex flex-1 flex-col pt-[max(1.25rem,env(safe-area-inset-top))]">
          {tab === "workout" && home}
          {tab === "challenges" && <ChallengesTab challenges={challenges} onLocked={lock} />}
          {tab === "progress" && <ProgressTab onStart={() => setTab("workout")} />}
          {tab === "profile" && <ProfileTab name={name} onPlans={onPlans} />}
        </main>

        <nav
          aria-label="תפריט"
          className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[560px] gap-1 rounded-t-[28px] border border-black/5 bg-white px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_18px_rgb(0_0_0/0.10)]"
        >
          {TABS.map((t) => {
            const selected = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1 rounded-[14px] text-[0.8125rem]",
                  selected ? "bg-gradient-to-b from-[#43A047] to-[#2E7D32] font-bold text-white shadow-[0_4px_8px_rgb(46_125_50/0.35)]" : "text-[#6B6B66]",
                )}
              >
                <span className="flex h-7 items-center">{t.icon}</span>
                <span className="whitespace-nowrap">{t.title}</span>
              </button>
            );
          })}
        </nav>

        {locked && <LockedSheet onPlans={onPlans} onClose={() => setLocked(false)} />}
      </div>
    </div>
  );
}

/** What a locked challenge, game or program opens: the subscription, then the plans. */
function LockedSheet({ onPlans, onClose }: { onPlans: () => void; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.querySelector("button")?.focus();
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55" role="dialog" aria-modal="true" aria-labelledby="locked-title" onClick={onClose}>
      <div
        ref={box}
        className="w-full max-w-[560px] rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF5E5] text-[#2E7D32]">
          <LockIcon className="h-7 w-7" />
        </span>
        <h2 id="locked-title" className="mt-4 font-display text-[1.75rem] font-extrabold leading-tight">
          פתוח למנויים
        </h2>
        <p className="mt-2 text-lead text-ink-soft">עם מנוי נפתחים כל האתגרים, משחקי הזיכרון ואימון חדש כל יום, מותאם בדיוק לך.</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button size="lg" className={BIG} onClick={onPlans}>
            לבחירת מסלול
          </Button>
          <Button variant="ghost" className="min-h-[60px] w-full" onClick={onClose}>
            אחר כך
          </Button>
        </div>
      </div>
    </div>
  );
}

function RunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
      <circle cx="14.5" cy="4" r="2.2" />
      <path d="M10.6 7.2 7 9.1a1 1 0 0 0-.5.7l-.6 3a1 1 0 1 0 2 .4l.5-2.5 1.6-.8-1.3 5.4-3.2 3.3a1 1 0 1 0 1.4 1.4l3.4-3.5.2-.6 2 1.8.9 3.6a1 1 0 1 0 2-.5l-1-4a1 1 0 0 0-.3-.5l-2-1.8.8-3.3.6 1.1a1 1 0 0 0 .7.5l3 .6a1 1 0 1 0 .4-2l-2.5-.5-1.4-2.6a2.6 2.6 0 0 0-3.1-1.3z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 3v18h18" />
      <path d="m6 15 4-4 3 3 6-7" />
      <path d="M15 7h4v4" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
      <circle cx="12" cy="7.5" r="4" />
      <path d="M4 20.5c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}
