import { Shell } from "@/components/ui/Section";
import { CheckIcon } from "@/components/ui/icons";
import { WHAT_MATTERS } from "@/content/home";

/**
 * The three points as one unboxed list: rows ruled top and bottom, a check
 * badge, the title, and the body moving into a third column on lg.
 *
 * The photo rotator that once sat behind this (for when each point had an
 * image) never rendered, since no point has one, yet it shipped its interval
 * and hover state in the client bundle, without the pause control WCAG 2.2.2
 * asks of auto-advancing content. If photos arrive, bring it back from git
 * history with a visible pause control.
 */
export default function WhatMatters() {
  return (
    <section
      aria-labelledby="matters-heading"
      className="bg-sunken py-[var(--section-y)]"
    >
      <Shell>
        <h2 id="matters-heading" className="text-h2 font-display font-black">
          מה חשוב לנו?
        </h2>
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
      </Shell>
    </section>
  );
}
