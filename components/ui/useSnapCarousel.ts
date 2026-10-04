"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Scroll-snap carousel state: which child is most visible, and goTo(index). */
export function useSnapCarousel<T extends HTMLElement>(count: number) {
  const trackRef = useRef<T>(null);
  const [index, setIndex] = useState(0);

  const goTo = useCallback(
    (next: number) => {
      const track = trackRef.current;
      if (!track) return;
      const clamped = Math.max(0, Math.min(next, count - 1));
      (track.children[clamped] as HTMLElement | undefined)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
      setIndex(clamped);
    },
    [count],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best) return;
        const i = Array.from(track.children).indexOf(best.target);
        if (i >= 0) setIndex(i);
      },
      { root: track, threshold: 0.6 },
    );
    Array.from(track.children).forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  return { trackRef, index, goTo };
}
