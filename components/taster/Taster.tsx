"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PAYMENT_PATH } from "@/lib/funnel/constants";
import { isPressable, tapHaptic } from "@/lib/haptics";
import { loadFirstName, loadFunctionalityLevel, loadTasterSession, progressRecorder, requestTasterWorkout, saveCompletion, type TasterSession } from "@/lib/taster/api";
import { clipLoader } from "@/lib/taster/clips";
import { completionUpdate } from "@/lib/taster/completion";
import { DEMO_WORKOUT, demoAllowed } from "@/lib/taster/demo";
import { musicFor, TASTER_MUSIC } from "@/lib/taster/music";
import { timerAt, type TimerState } from "@/lib/taster/timer";
import type { TasterWorkout } from "@/lib/taster/workout";
import { TasterBetween, TasterExitDialog } from "./TasterOverlays";
import TasterPlayer from "./TasterPlayer";
import { TASTER_TITLE_ID, TasterEnd, TasterError, TasterIntro, TasterLoading } from "./TasterScreens";

type Stage = "loading" | "error" | "intro" | "playing" | "between" | "saving" | "end";

/** The breath between two exercises, counted down on screen. */
export const BETWEEN_SECONDS = 6;
const SAVE_TRIES = 3;

const NO_TIMER: TimerState = { phase: "explanation", remaining: null };

/** On to the plans. A document load, never a client navigation: /payment's CSP applies only to a document. */
const toPlans = () => window.location.assign(PAYMENT_PATH);

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * The free first workout, right after the questionnaire's SMS code (owner, 2026-11-14):
 * requestWorkout serves the visitor's taster, they play it here like in the app, the
 * completion is written as the apps write it, and the end screen sends them on to
 * the plans. Someone who already used the free workout, or has no session, goes
 * straight on to the plans; so does every exit.
 */
export default function Taster() {
  const [stage, setStage] = useState<Stage>("loading");
  const [workout, setWorkout] = useState<TasterWorkout | null>(null);
  const [index, setIndex] = useState(0);
  const [timer, setTimer] = useState<TimerState>(NO_TIMER);
  const [paused, setPaused] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [betweenLeft, setBetweenLeft] = useState(BETWEEN_SECONDS);
  const [name, setName] = useState<string | null>(null);
  const [result, setResult] = useState({ played: 0, minutes: 1 });
  const [musicSrc, setMusicSrc] = useState<string | null>(null);

  const video = useRef<HTMLVideoElement>(null);
  const music = useRef<HTMLAudioElement>(null);
  const session = useRef<TasterSession | null>(null);
  const recorder = useRef<ReturnType<typeof progressRecorder> | null>(null);
  const clips = useRef<ReturnType<typeof clipLoader> | null>(null);
  const startedAt = useRef<Date | null>(null);
  const played = useRef(0);
  const wasPlaying = useRef(false);

  /** The music runs with the exercises and stops with them; a refused play just leaves it silent. */
  const musicOn = useCallback(() => {
    void music.current?.play().catch(() => undefined);
  }, []);
  const musicOff = useCallback(() => music.current?.pause(), []);

  const load = useCallback(async () => {
    setStage("loading");
    clips.current ??= clipLoader();
    const show = (w: TasterWorkout) => {
      setWorkout(w);
      clips.current?.preload([w.exercises[0].videoUrl]);
      setStage("intro");
    };
    if (demoAllowed(window.location.hostname, window.location.search)) {
      setMusicSrc(TASTER_MUSIC.independent);
      return show(DEMO_WORKOUT);
    }
    const signedIn = await loadTasterSession();
    if (!signedIn) return toPlans();
    session.current = signedIn;
    void loadFirstName(signedIn).then(setName);
    void loadFunctionalityLevel(signedIn).then((level) => setMusicSrc(musicFor(level)));
    const reply = await requestTasterWorkout(signedIn);
    if (reply.kind === "used") return toPlans();
    if (reply.kind === "error") return setStage("error");
    if (reply.workout.scheduledWorkoutId) recorder.current = progressRecorder(signedIn, reply.workout.scheduledWorkoutId);
    show(reply.workout);
  }, []);

  useEffect(() => {
    void load();
    return () => clips.current?.dispose();
  }, [load]);

  // The intro, error and end screens bring their heading into focus, as the questionnaire's steps do.
  useEffect(() => {
    if (stage === "intro" || stage === "error" || stage === "end") document.getElementById(TASTER_TITLE_ID)?.focus({ preventScroll: true });
    if (stage === "intro" || stage === "end") window.scrollTo({ top: 0 });
  }, [stage]);

  /** Plays one clip. Called inside a tap when it can be: that is what lets iPhone play its sound. */
  const playClip = useCallback(
    (i: number) => {
      const el = video.current;
      const exercises = workout?.exercises;
      if (!el || !exercises?.[i]) return;
      setIndex(i);
      setTimer(NO_TIMER);
      setPaused(false);
      setStage("playing");
      el.src = clips.current?.source(exercises[i].videoUrl) ?? exercises[i].videoUrl;
      el.currentTime = 0;
      el.play().then(
        () => setBlocked(false),
        () => setBlocked(true),
      );
      recorder.current?.reached(i, exercises[i].id);
      const next = exercises[i + 1];
      if (next) clips.current?.preload([next.videoUrl]);
    },
    [workout],
  );

  const start = () => {
    startedAt.current = new Date();
    played.current = 0;
    // Inside the tap, like the clip: iPhone plays sound only from what a tap started.
    musicOn();
    playClip(0);
  };

  const finish = useCallback(async () => {
    setStage("saving");
    video.current?.pause();
    musicOff();
    recorder.current?.finished();
    const endedAt = new Date();
    const begun = startedAt.current ?? endedAt;
    const total = workout?.exercises.length ?? 0;
    const input = { startedAt: begun, endedAt, played: played.current, total };
    setResult({ played: played.current, minutes: completionUpdate(input).duration_minutes });
    const id = workout?.scheduledWorkoutId;
    if (session.current && id) {
      // The work is done: a dropped save is retried, then the end screen shows either way.
      for (let attempt = 1; attempt <= SAVE_TRIES; attempt++) {
        if (await saveCompletion(session.current, id, input)) break;
        if (attempt < SAVE_TRIES) await wait(1000 * attempt);
      }
    }
    setStage("end");
  }, [workout, musicOff]);

  /** The clip ended, or could not play (the apps skip a clip that fails). */
  const afterClip = useCallback(
    (completed: boolean) => {
      if (stage !== "playing") return;
      if (completed) played.current += 1;
      const total = workout?.exercises.length ?? 0;
      if (index + 1 >= total) return void finish();
      if (!completed) return playClip(index + 1);
      setBetweenLeft(BETWEEN_SECONDS);
      setStage("between");
    },
    [stage, index, workout, finish, playClip],
  );

  // The breath counts itself down and starts the next exercise.
  useEffect(() => {
    if (stage !== "between" || exitOpen) return;
    if (betweenLeft <= 0) return playClip(index + 1);
    const id = window.setTimeout(() => setBetweenLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [stage, betweenLeft, exitOpen, index, playClip]);

  const onTime = () => {
    const el = video.current;
    const exercise = workout?.exercises[index];
    if (!el || !exercise || stage !== "playing") return;
    const next = timerAt(el.currentTime, exercise, Number.isFinite(el.duration) ? el.duration : null);
    setTimer((t) => (t.phase === next.phase && t.remaining === next.remaining ? t : next));
  };

  const resume = () => {
    video.current?.play().then(
      () => {
        setBlocked(false);
        setPaused(false);
        musicOn();
      },
      () => setBlocked(true),
    );
  };

  const togglePause = () => {
    const el = video.current;
    if (!el) return;
    if (blocked || el.paused) return resume();
    el.pause();
    musicOff();
    setPaused(true);
  };

  // A phone call or a switch to another app pauses the workout; the 80px button resumes it.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState !== "hidden") return;
      music.current?.pause();
      if (video.current && !video.current.paused) {
        video.current.pause();
        setPaused(true);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  const openExit = () => {
    wasPlaying.current = !!video.current && !video.current.paused;
    video.current?.pause();
    musicOff();
    setExitOpen(true);
  };

  const stay = () => {
    setExitOpen(false);
    if (wasPlaying.current && stage === "playing") resume();
    else if (stage === "between") musicOn();
  };

  const exercises = workout?.exercises ?? [];
  const inPlayer = stage === "playing" || stage === "between";

  return (
    <div
      dir="rtl"
      // A light tap on every press, as in the questionnaire.
      onClickCapture={(e) => {
        if (isPressable(e.target)) tapHaptic();
      }}
    >
      {/* Loaded during the intro, so it is ready when the start tap plays it. */}
      {musicSrc && <audio ref={music} src={musicSrc} loop preload="auto" />}
      {stage === "loading" && <TasterLoading />}
      {stage === "saving" && <TasterLoading />}
      {stage === "error" && <TasterError onRetry={() => void load()} onSkip={toPlans} />}
      {stage === "intro" && <TasterIntro exercises={exercises} onStart={start} onSkip={toPlans} />}
      {stage === "end" && <TasterEnd name={name} played={result.played} minutes={result.minutes} onContinue={toPlans} />}

      <TasterPlayer
        ref={video}
        visible={inPlayer}
        exercise={exercises[index] ?? null}
        index={index}
        total={exercises.length}
        timer={timer}
        paused={paused}
        blocked={blocked && stage === "playing"}
        onTogglePause={togglePause}
        onExit={openExit}
        onTime={onTime}
        onEnded={() => afterClip(true)}
        onFailed={() => afterClip(false)}
      />

      {stage === "between" && exercises[index + 1] && (
        <TasterBetween
          done={index + 1}
          left={exercises.length - index - 1}
          next={exercises[index + 1]}
          secondsLeft={betweenLeft}
          onNow={() => playClip(index + 1)}
        />
      )}

      {exitOpen && <TasterExitDialog left={exercises.length - index - (stage === "between" ? 1 : 0)} onStay={stay} onLeave={toPlans} />}
    </div>
  );
}
