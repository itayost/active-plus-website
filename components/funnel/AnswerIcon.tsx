import type { ReactNode } from "react";
import type { AnswerIconName } from "@/lib/funnel/copy";
import { cn } from "@/lib/utils";

/*
  The leading badge on the goals and desired-feeling cards, after the apps'
  AnswerIconPalette: each answer keeps its own soft accent, so the four cards
  read apart at a glance. Line icons drawn on a 24px grid.
*/
const PATHS: Record<AnswerIconName, ReactNode> = {
  dumbbell: (
    <>
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
    </>
  ),
  scale: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M8 9.5a5.5 5.5 0 0 1 8 0M12 9.5l1.5-2" />
    </>
  ),
  brain: (
    <>
      <path d="M12 5.5a3 3 0 0 0-5.6 1.4A3 3 0 0 0 5 12.2a3 3 0 0 0 2.3 4.9A3 3 0 0 0 12 18.5z" />
      <path d="M12 5.5a3 3 0 0 1 5.6 1.4 3 3 0 0 1 1.4 5.3 3 3 0 0 1-2.3 4.9A3 3 0 0 1 12 18.5" />
    </>
  ),
  stretch: (
    <>
      <circle cx="12" cy="4.5" r="1.8" />
      <path d="M4 8.5l8 1.5 8-1.5M12 10v5l-4 5M12 15l4 5" />
    </>
  ),
  shield: <path d="M12 3.5l7 2.5v5.5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z" />,
  bolt: <path d="M13 3L5.5 13.5H12L11 21l7.5-10.5H12z" />,
  progress: <path d="M5 17l5-5 3.5 3.5L19 10M14 10h5v5" />,
  leaf: (
    <>
      <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z" />
      <path d="M5 19l7-7" />
    </>
  ),
};

const TONES: Record<AnswerIconName, string> = {
  dumbbell: "bg-blue-wash text-blue-deep",
  scale: "bg-green-wash text-green-deep",
  brain: "bg-[#f3e8ff] text-[#6b3fa0]",
  stretch: "bg-[#fff1e0] text-[#a8540f]",
  shield: "bg-blue-wash text-blue-deep",
  bolt: "bg-[#fff1e0] text-[#a8540f]",
  progress: "bg-green-wash text-green-deep",
  leaf: "bg-green-wash text-green-deep",
};

export default function AnswerIcon({ name, on }: { name: AnswerIconName; on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-pill transition-colors duration-[var(--dur-fast)]",
        on ? "bg-green-deep text-white" : TONES[name],
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        {PATHS[name]}
      </svg>
    </span>
  );
}
