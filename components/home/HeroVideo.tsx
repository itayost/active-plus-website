"use client";

import { useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "@/components/ui/icons";
import { shouldLoadHeroVideo } from "@/lib/media";

type NetworkInformationLike = { saveData?: boolean; effectiveType?: string };

/**
 * The hero's moving picture, mounted only after hydration and only when it
 * will be seen.
 *
 * In the server HTML a <video autoPlay> ignores preload="metadata" and
 * downloads the whole file, which it did for every visitor, including the
 * reduced-motion ones who never see it (the CSS only hid it). Rendering nothing
 * until the client has checked the motion preference and the browser's
 * save-data flag means those visitors fetch zero bytes of video and keep the
 * poster, which stays the LCP image either way.
 *
 * The decision also waits for the window's `load` event. Until then the
 * page's own images and fonts are still arriving, and a 1.4 MB stream started
 * at hydration would share the connection with them; the poster is already
 * painted, so starting the video a moment later costs nothing visible.
 *
 * It fills its positioned parent and paints above the poster by DOM order.
 *
 * A looping video needs a way to stop it (WCAG 2.2.2, IS 5568): a 48px
 * pause/play button sits in the bottom end corner, clear of the subjects at
 * the centre of the frame, and exists only while the video does.
 *
 * No `poster` attribute: the optimised next/image poster already sits directly
 * underneath, and a video with no frame yet is transparent, so the attribute
 * only cost a second, unoptimised download of the same picture.
 */
export default function HeroVideo({ src }: { src: string }) {
  // "pending" until the client has decided, so tests (and anyone debugging)
  // can wait for the decision instead of guessing at hydration timing.
  const [mode, setMode] = useState<"pending" | "on" | "off">("pending");
  const enabled = mode === "on";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: NetworkInformationLike })
      .connection;
    const update = () =>
      setMode(
        shouldLoadHeroVideo({
          prefersReducedMotion: motion.matches,
          saveData: connection?.saveData,
          effectiveType: connection?.effectiveType,
        })
          ? "on"
          : "off",
      );
    const start = () => {
      update();
      motion.addEventListener("change", update);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      motion.removeEventListener("change", update);
    };
  }, []);

  // React sets `muted` as a property, not an attribute, on client-rendered
  // video, and some mobile browsers only honour autoplay for an element that
  // was muted before play(). Set it explicitly and start playback ourselves;
  // a refused play() simply leaves the poster showing.
  useEffect(() => {
    const video = videoRef.current;
    if (!enabled || !video) return;
    video.muted = true;
    video.play().catch(() => setPaused(true));
  }, [enabled]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => setPaused(true));
    else video.pause();
  };

  const marker = <span hidden data-hero-video={mode} />;
  if (!enabled) return marker;

  return (
    <>
      {marker}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
      >
        <source src={src} type="video/mp4" />
      </video>
      {/* The white halo keeps the 3px focus ring readable over grass and sky. */}
      <button
        type="button"
        onClick={toggle}
        className="absolute bottom-3 end-3 inline-flex h-12 w-12 items-center justify-center rounded-pill bg-white/90 text-ink shadow-lift-1 transition-colors hover:bg-white focus-visible:outline-offset-0 focus-visible:shadow-[0_0_0_6px_#fff]"
      >
        <span className="sr-only">{paused ? "הפעלת הסרטון" : "השהיית הסרטון"}</span>
        {paused ? <PlayIcon className="h-6 w-6" /> : <PauseIcon className="h-6 w-6" />}
      </button>
    </>
  );
}
