import { ClockIcon, PlayIcon } from "@/components/ui/icons";
import { DIFFICULTY_LABEL, totalMinutes, type TasterWorkout } from "@/lib/taster/workout";
import { cn } from "@/lib/utils";

/** The three bars of the app's difficulty icon, `filled` of them green. */
function DifficultyBars({ filled }: { filled: number }) {
  return (
    <span className="inline-flex h-[18px] w-5 items-end justify-center gap-[3px]" aria-hidden>
      {[8, 13, 18].map((height, i) => (
        <span key={height} className={cn("w-1 rounded-sm", i < filled ? "bg-[#2E7D32]" : "bg-[#E3E8E4]")} style={{ height }} />
      ))}
    </span>
  );
}

/**
 * The app's home hero (HomeHeroWorkoutCard on iOS), as the trainee sees it
 * before their first workout: the photo on the right fading into the text,
 * "האימון שלך", "מוכן/ה לתרגול היום?", length and difficulty, and the
 * full-width "התחל תרגול עכשיו" that starts the workout.
 */
export default function TasterHomeCard({
  workout,
  readyLine,
  onStart,
}: {
  workout: TasterWorkout;
  readyLine: string;
  onStart: () => void;
}) {
  const photo = workout.exercises.find((e) => e.thumbnailUrl)?.thumbnailUrl ?? null;
  const difficulty = workout.difficulty;
  return (
    <div className="relative h-[300px] overflow-hidden rounded-[24px] bg-surface shadow-lift-2">
      {/* The photo takes the right 58%, its inner edge fading into the card. */}
      {photo && (
        <div className="absolute inset-y-0 right-0 w-[58%]" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- a remote thumbnail, shown as is */}
          <img src={photo} alt="" className="h-full w-full object-cover" />
          <div
            className="absolute inset-y-0 left-0 w-[35%]"
            style={{
              background:
                "linear-gradient(to right, #fff 0%, #fff 40%, rgb(255 255 255 / 0.85) 55%, rgb(255 255 255 / 0.5) 72%, rgb(255 255 255 / 0.18) 88%, rgb(255 255 255 / 0) 100%)",
            }}
          />
        </div>
      )}

      <div className="absolute left-0 top-[18px] w-[52%] pl-5">
        <div className="flex justify-end">
          <span className="rounded-full bg-[#EDF5E5] px-3 py-1.5 text-[0.875rem] font-bold text-[#2E7D32]">האימון שלך</span>
        </div>
        <h2 className="mt-2.5 font-display text-[1.75rem] font-extrabold leading-[1.15]">
          <span className="block whitespace-nowrap">{readyLine}</span>
          <span className="block text-[#2E7D32]">היום?</span>
        </h2>
        <p className="mt-3 flex items-center gap-1.5 whitespace-nowrap text-[1.0625rem] text-[#4A564E]">
          <ClockIcon className="h-[18px] w-5 shrink-0 text-[#2E7D32]" />
          משך זמן: {totalMinutes(workout.exercises)} דקות
        </p>
        <p className="mt-2.5 flex items-center gap-1.5 whitespace-nowrap text-[1.0625rem] text-[#4A564E]">
          <DifficultyBars filled={difficulty} />
          רמת קושי: {DIFFICULTY_LABEL[difficulty]}
        </p>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="absolute inset-x-2.5 bottom-2.5 flex min-h-[60px] items-center justify-center gap-2.5 rounded-[30px] bg-cta font-display text-[1.25rem] font-extrabold text-white shadow-cta transition-transform active:scale-[0.97]"
      >
        <PlayIcon className="h-5 w-5" />
        התחל תרגול עכשיו
      </button>
    </div>
  );
}
