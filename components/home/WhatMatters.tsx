"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import { CheckIcon } from "@/components/ui/icons";
import { WHAT_MATTERS } from "@/content/home";

const ROTATE_MS = 6000;

/** Without photos the three points read as one plain list: no rotator, no toggles. */
export default function WhatMatters() {
  const hasImages = WHAT_MATTERS.some((w) => w.image);
  return (
    <section
      aria-labelledby="matters-heading"
      className="bg-sunken py-[var(--section-y)]"
    >
      <Shell>
        <h2 id="matters-heading" className="text-h2 font-display font-black">
          מה חשוב לנו?
        </h2>
        {hasImages ? <MattersRotator /> : <MattersList />}
      </Shell>
    </section>
  );
}

function MattersList() {
  return (
    <ul className="mt-12 border-b border-ink/15">
      {WHAT_MATTERS.map((w) => (
        <li
          key={w.title}
          className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-5 gap-y-2 border-t border-ink/15 py-[clamp(1.75rem,3vw,2.75rem)] lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-x-10"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-deep text-white">
            <CheckIcon className="h-6 w-6" />
          </span>
          <h3 className="text-h3 font-display font-bold">{w.title}</h3>
          <p className="col-start-2 text-ink-soft lg:col-start-3">{w.body}</p>
        </li>
      ))}
    </ul>
  );
}

function MattersRotator() {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % WHAT_MATTERS.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(id);
  }, [paused]);

  const item = WHAT_MATTERS[active];

  return (
    <div
      className="mt-12 grid items-center gap-12 lg:grid-cols-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
    >
      <ul className="space-y-3">
        {WHAT_MATTERS.map((w, i) => (
          <li key={w.title}>
            <button
              type="button"
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className="grid w-full grid-cols-[auto_1fr] gap-4 rounded-tile p-4 text-start transition-colors hover:bg-surface"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-green-deep ${
                  i === active ? "bg-green-deep text-white" : "text-green-deep"
                }`}
              >
                <CheckIcon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-h3 font-display font-bold">
                  {w.title}
                </span>
                <span className="mt-1 block text-ink-soft">{w.body}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Reveal>
        {item.image ? (
          <Image
            src={item.image}
            alt=""
            width={1200}
            height={900}
            className="h-auto w-full rounded-panel shadow-lift-2"
          />
        ) : null}
      </Reveal>
    </div>
  );
}
