"use client";

import { forwardRef } from "react";
import { CloseIcon, PauseIcon, PlayIcon } from "@/components/ui/icons";
import { clock, type TimerState } from "@/lib/taster/timer";
import type { TasterExercise } from "@/lib/taster/workout";
import { cn } from "@/lib/utils";

const TIMER_LABEL: Record<TimerState["phase"], string> = { explanation: "הסבר", getReady: "", exercise: "התרגיל" };

type Props = {
  /** Hidden until the workout starts: the element exists from the first paint so the start tap can play it. */
  visible: boolean;
  exercise: TasterExercise | null;
  index: number;
  total: number;
  timer: TimerState;
  paused: boolean;
  /** Playback was refused (no tap behind it): one tap on the big button plays. */
  blocked: boolean;
  onTogglePause: () => void;
  onExit: () => void;
  onTime: () => void;
  onEnded: () => void;
  onFailed: () => void;
};

/**
 * The exercise screen, as the apps lay it out: the clip fills the phone, the
 * exercise and its countdown sit over it, with an 80px play/pause and a 60px exit.
 * One <video> plays every clip, so the tap that started the workout unlocks its
 * sound for the rest (iPhone Safari plays sound only from an element a tap started).
 */
const TasterPlayer = forwardRef<HTMLVideoElement, Props>(function TasterPlayer(
  { visible, exercise, index, total, timer, paused, blocked, onTogglePause, onExit, onTime, onEnded, onFailed },
  video,
) {
  const label = TIMER_LABEL[timer.phase];
  return (
    <div className={cn("fixed inset-0 z-30 flex justify-center bg-black", !visible && "invisible")} aria-hidden={!visible}>
      <div className="relative h-full w-full">
        <video
          ref={video}
          // Fills a phone; on a wide screen the whole clip shows, black at its sides.
          className="absolute inset-0 h-full w-full object-cover landscape:object-contain"
          playsInline
          preload="auto"
          disablePictureInPicture
          onTimeUpdate={onTime}
          onLoadedMetadata={onTime}
          onEnded={onEnded}
          onError={onFailed}
        />

        {/* Top: progress and exit, over a shade so they read on any frame. */}
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent px-4 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 gap-1.5" aria-hidden>
              {Array.from({ length: total }, (_, i) => (
                <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < index ? "bg-white" : i === index ? "bg-white/80" : "bg-white/30")} />
              ))}
            </div>
            <button
              type="button"
              onClick={onExit}
              className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-black/45 text-white"
              aria-label="יציאה מהאימון"
            >
              <CloseIcon className="h-7 w-7" />
            </button>
          </div>
          <p className="mt-1 text-[1.0625rem] font-bold text-white/90">
            תרגיל {index + 1} מתוך {total}
          </p>
        </div>

        {/* Bottom: the exercise, its countdown and play/pause. */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-16">
          <div className="flex items-end gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[1.75rem] font-extrabold leading-tight text-white">{exercise?.name}</h2>
              {timer.remaining !== null && (
                <p className="mt-2 inline-flex items-baseline gap-2 rounded-2xl bg-white/15 px-4 py-2 text-white backdrop-blur" aria-live="off">
                  <span className="text-[1.0625rem] font-bold">{label}</span>
                  <span className="font-display text-[2rem] font-extrabold tabular-nums leading-none" dir="ltr">
                    {clock(timer.remaining)}
                  </span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onTogglePause}
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-lift-3"
              aria-label={paused ? "המשך" : "השהיה"}
            >
              {paused ? <PlayIcon className="h-9 w-9" /> : <PauseIcon className="h-9 w-9" />}
            </button>
          </div>
        </div>

        {blocked && (
          <button
            type="button"
            onClick={onTogglePause}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/55 text-white"
          >
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-ink">
              <PlayIcon className="h-11 w-11" />
            </span>
            <span className="font-display text-[1.5rem] font-extrabold">ממשיכים</span>
          </button>
        )}
      </div>
    </div>
  );
});

export default TasterPlayer;
