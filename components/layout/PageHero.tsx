import Link from "next/link";
import type { ReactNode } from "react";
import { Shell } from "@/components/ui/Section";
import { ArrowBackIcon } from "@/components/ui/icons";
import type { Tone } from "@/lib/constants";

const FIELD: Record<Tone, string> = {
  blue: "bg-[var(--blue-wash)]",
  green: "bg-[var(--green-wash)]",
  purple: "bg-[var(--purple-wash)]",
  burgundy: "bg-[var(--burgundy-wash)]",
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
  breadcrumb,
  back,
  aside,
}: {
  title: string;
  lede?: string;
  tone?: Tone;
  breadcrumb?: { href: string; label: string };
  /** Rendered above the h1 (explainer pages use it for the back link). */
  back?: ReactNode;
  /** Optional media beside the copy on wide screens, below it on narrow ones. */
  aside?: ReactNode;
}) {
  return (
    <section className={`${FIELD[tone]} pb-[clamp(3rem,6vw,5rem)] pt-[clamp(3rem,6vw,5.5rem)]`}>
      <Shell className={aside ? "grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16" : ""}>
        <div>
        {back}
        {breadcrumb ? (
          <Link
            href={breadcrumb.href}
            className={`mb-7 inline-flex min-h-[44px] items-center gap-2 font-display font-bold ${INK[tone]} transition-opacity hover:opacity-70`}
          >
            <ArrowBackIcon className="h-5 w-5" />
            {breadcrumb.label}
          </Link>
        ) : null}

        <h1 className={`max-w-[20ch] text-h1 font-display font-black ${INK[tone]}`}>
          {title}
        </h1>

        {lede ? (
          <p className="mt-7 max-w-measure text-lead text-ink-soft">{lede}</p>
        ) : null}
        </div>
        {aside}
      </Shell>
    </section>
  );
}
