"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scrollBehaviorFor } from "@/lib/media";

/**
 * Scroll-snap carousel state: which child is most visible, whether either
 * direction still has somewhere to go, and goTo(index).
 *
 * Wire the arrows through CarouselArrows, which uses aria-disabled rather
 * than disabled: a disabled button drops keyboard focus to <body> the moment
 * the track reaches its end, and the next Tab restarts from the top of the
 * page. It also guards each click with canPrev/canNext: when several cards
 * are visible the track ends (atEnd) before index reaches the last card, and
 * calling goTo there would advance index past what is on screen, leaving
 * later "previous" presses dead.
 */
export function useSnapCarousel<T extends HTMLElement>(count: number) {
  const trackRef = useRef<T>(null);
  const [index, setIndex] = useState(0);
  const [atEnd, setAtEnd] = useState(false);

  const goTo = useCallback(
    (next: number) => {
      const track = trackRef.current;
      if (!track) return;
      const clamped = Math.max(0, Math.min(next, count - 1));
      // JS scrolling ignores the CSS reduced-motion reset, so ask directly.
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      (track.children[clamped] as HTMLElement | undefined)?.scrollIntoView({
        behavior: scrollBehaviorFor(reduce),
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
    // How many cards fit changes with the width (rotating a phone, resizing a
    // window), and with it whether the track can still scroll; scroll events
    // alone would leave "next" lit or dimmed for the old width.
    const resize =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onScroll);
    resize?.observe(track);
    return () => {
      observer.disconnect();
      resize?.disconnect();
      track.removeEventListener("scroll", onScroll);
    };
  }, []);

  const canPrev = index > 0;
  const canNext = !atEnd && index < count - 1;

  return { trackRef, index, atEnd, canPrev, canNext, goTo };
}

