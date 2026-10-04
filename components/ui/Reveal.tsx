"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const REVEAL_THRESHOLD = 0.15;
const STAGGER_MS = 90;

/**
 * The site's one authored entrance: content rises, sharpens and settles once,
 * on first sight. Content renders visible by default and only hides itself
 * after JS confirms the browser supports the observer and motion is welcome.
 */
export default function Reveal({
  children,
  delayIndex = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delayIndex?: number;
  className?: string;
  as?: "div" | "li" | "article" | "section";
}) {
  const ref = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setArmed(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        /*
         * A ratio threshold is a trap for anything taller than the viewport:
         * an element can only ever expose `viewport / its own height` of
         * itself, so past about 6x the viewport it never reaches 15% and the
         * entrance never runs — the content simply stays at opacity 0. The
         * long-form article on /dual-tasking is 6613px against a 700px phone,
         * or 9.7%, and was invisible for exactly this reason.
         *
         * For those, arrival is the trigger: the top edge crossing into view
         * is all the signal there is. Everything shorter keeps the authored
         * 15% timing, so the motion the site was tuned with is unchanged.
         */
        const rootHeight = entry.rootBounds?.height ?? window.innerHeight;
        const tallerThanRoot = entry.boundingClientRect.height > rootHeight;
        if (!tallerThanRoot && entry.intersectionRatio < REVEAL_THRESHOLD) return;
        setShown(true);
        observer.disconnect();
      },
      { threshold: [0, REVEAL_THRESHOLD], rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const state = armed ? (shown ? "reveal reveal-in" : "reveal") : "";

  return (
    <Tag
      ref={ref as never}
      className={`${state} ${className}`}
      style={
        armed && shown
          ? { transitionDelay: `${delayIndex * STAGGER_MS}ms` }
          : undefined
      }
    >
      {children}
    </Tag>
  );
}
