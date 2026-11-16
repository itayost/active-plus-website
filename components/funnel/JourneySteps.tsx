import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Where the visitor stands after the questionnaire (owner, 2026-11-16: pay first, then the app):
 * the plan, the plan type, the first workout in the app. Done steps carry a check, the current one
 * is filled, the next one is outlined, so every page says what comes after it.
 */
const STEPS = ["התוכנית שלך", "בחירת מסלול", "אימון ראשון באפליקציה"] as const;

export default function JourneySteps({ current, className }: { current: 0 | 1 | 2; className?: string }) {
  return (
    <ol aria-label="השלבים עד האימון הראשון" className={cn("grid grid-cols-3 gap-2", className)}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={label} aria-current={now ? "step" : undefined} className="flex flex-col items-center gap-1.5 text-center">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full font-display text-[0.9375rem] font-extrabold",
                done && "bg-green-deep text-white",
                now && "bg-blue-deep text-white ring-4 ring-blue-deep/15",
                !done && !now && "border-2 border-ink-faint/40 text-ink-faint",
              )}
            >
              {done ? <CheckIcon className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("text-[0.875rem] font-bold leading-tight", now ? "text-ink" : "text-ink-soft")}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
