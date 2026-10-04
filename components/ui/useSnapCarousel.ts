"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scrollBehaviorFor } from "@/lib/media";

/**
 * Scroll-snap carousel state: which child is most visible, whether either
 * direction still has somewhere to go, and goTo(index).
 *
 * The arrows are meant to be wired with aria-disabled, not disabled: a
 * disabled button drops keyboard focus to <body> the moment the track reaches
 * its end, and the next Tab restarts from the top of the page. Guard each
 * click with canPrev/canNext: when several cards are visible the track ends
 * (atEnd) before index reaches the last card, and calling goTo there would
 * advance index past what is on screen, leaving later "previous" presses dead.
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
    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", onScroll);
    };
  }, []);

  const canPrev = index > 0;
  const canNext = !atEnd && index < count - 1;

  return { trackRef, index, atEnd, canPrev, canNext, goTo };
}

/**
 * Shared arrow styling. Exhausted arrows are aria-disabled: dimmed and inert to
 * hover, but still focusable, so keyboard focus stays where the reader left it.
 */
export const CAROUSEL_ARROW =
  "inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink/15 bg-surface text-ink " +
  "transition-[border-color,background-color,transform,opacity] duration-[var(--dur-fast)] " +
  "hover:-translate-y-0.5 hover:border-ink/40 " +
  "aria-disabled:cursor-default aria-disabled:opacity-35 aria-disabled:hover:translate-y-0 aria-disabled:hover:border-ink/15";
