"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Scroll-snap carousel state: which child is most visible, and goTo(index). */
export function useSnapCarousel<T extends HTMLElement>(count: number) {
  const trackRef = useRef<T>(null);
  const [index, setIndex] = useState(0);
  const [atEnd, setAtEnd] = useState(false);

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
    // Entries only report children whose ratio CHANGED, so keep the latest
    // ratio of every child and derive the index from the full set: the first
    // child that is at least 60% visible.
    const ratios = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => ratios.set(e.target, e.intersectionRatio));
        const first = Array.from(track.children).findIndex(
          (child) => (ratios.get(child) ?? 0) >= 0.6,
        );
        if (first >= 0) setIndex(first);
      },
      { root: track, threshold: [0, 0.6, 1] },
    );
    Array.from(track.children).forEach((c) => observer.observe(c));
    // With several cards visible the track stops scrolling before the last card
    // reaches the start edge, so "next" would be a dead click: expose that.
    // abs() because scrollLeft is negative in RTL.
    const onScroll = () =>
      setAtEnd(Math.abs(track.scrollLeft) + track.clientWidth >= track.scrollWidth - 2);
    onScroll();
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", onScroll);
    };
  }, []);

  return { trackRef, index, atEnd, goTo };
}
