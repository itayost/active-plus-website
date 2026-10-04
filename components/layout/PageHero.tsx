import type { ReactNode } from "react";
import { Shell } from "@/components/ui/Section";
import type { Tone } from "@/lib/constants";

const FIELD: Record<Tone, string> = {
  blue: "bg-blue-wash",
  green: "bg-green-wash",
  purple: "bg-purple-wash",
  burgundy: "bg-burgundy-wash",
};

const INK: Record<Tone, string> = {
  blue: "text-blue-deep",
  green: "text-green-deep",
  purple: "text-purple-deep",
  burgundy: "text-burgundy",
};

export default function PageHero({
  title,
  lede,
  tone = "blue",
  back,
  aside,
  article = false,
}: {
  title: string;
  lede?: string;
  tone?: Tone;
  /** Rendered above the h1: a BackLink (home from the explainers, the list from an article). */
  back?: ReactNode;
  /** Optional media beside the copy on wide screens, below it on narrow ones. */
  aside?: ReactNode;
  /** Long editorial title: wider measure, smaller scale, extra room for an overlapping cover. */
  article?: boolean;
}) {
  return (
    <section className={`${FIELD[tone]} ${article ? "pb-[clamp(7rem,13vw,12rem)]" : "pb-[clamp(3rem,6vw,5rem)]"} pt-[clamp(3rem,6vw,5.5rem)]`}>
      <Shell className={aside ? "grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16" : ""}>
        <div>
          {back}

          <h1
            className={`font-display font-black ${INK[tone]} ${
              article ? "max-w-[24ch] text-h1-article leading-[1.08]" : "max-w-[20ch] text-h1"
            }`}
          >
            {title}
          </h1>

          {lede ? (
            <p className={`mt-7 text-lead text-ink-soft ${article ? "max-w-[60ch]" : "max-w-measure"}`}>{lede}</p>
          ) : null}
        </div>
        {aside}
      </Shell>
    </section>
  );
}
