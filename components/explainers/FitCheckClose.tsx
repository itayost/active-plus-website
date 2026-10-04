import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/icons";
import { FIT_CHECK } from "@/lib/constants";

type Props = {
  tone: "purple" | "blue" | "green";
  cta: string;
  heading: ReactNode;
  headingId?: string;
  body?: string | string[];
  /** Emphasised last line under the body (centred band only). */
  strong?: string;
  /** Blue only: the centred band instead of the left-heavy card. */
  centered?: boolean;
  /** h3 when the close sits under its section's own h2 (/progress). */
  level?: 2 | 3;
};

const CTA_ICON = <ArrowIcon className="h-5 w-5" />;

/**
 * The fit-check close shared by the three explainers. Same action, three
 * deliberately different shapes: a centred lavender panel (the light surface
 * takes the one filled purple button, DESIGN.md's Inverted Action Exception),
 * a left-heavy blue card, and a centred green band.
 */
export default function FitCheckClose({ tone, cta, heading, headingId, body, strong, centered, level = 2 }: Props) {
  const Heading = level === 3 ? "h3" : "h2";

  if (tone === "purple") {
    return (
      <div className="rounded-card bg-purple-wash px-[clamp(min(1.5rem,7.5vw),5vw,4.5rem)] py-[clamp(2.25rem,6vw,5rem)] text-center">
        <Heading
          id={headingId}
          className="mx-auto max-w-[20ch] text-h2 font-display font-black text-purple-deep"
        >
          {heading}
        </Heading>
        {body ? (
          <p className="mx-auto mt-7 max-w-[46ch] text-lead text-ink-soft">{body}</p>
        ) : null}
        <Button href={FIT_CHECK.href} variant="purple" size="lg" className="mt-10">
          {cta}
          {CTA_ICON}
        </Button>
      </div>
    );
  }

  if (tone === "blue" && !centered) {
    return (
      <div className="grid gap-8 rounded-card bg-blue [--focus-ring:#ffffff] p-[clamp(min(2rem,10vw),5vw,3.5rem)] text-white shadow-lift-2">
        <Heading
          id={headingId}
          className="max-w-[22ch] font-display text-[clamp(1.75rem,1.3rem+1.8vw,2.75rem)] font-black leading-[1.15]"
        >
          {heading}
        </Heading>
        <Button href={FIT_CHECK.href} variant="onColor" size="lg" className="justify-self-start">
          {cta}
          {CTA_ICON}
        </Button>
      </div>
    );
  }

  const lines = body === undefined ? [] : Array.isArray(body) ? body : [body];
  const field = tone === "blue" ? "bg-blue" : "bg-green";

  return (
    <div className={`rounded-card ${field} [--focus-ring:#ffffff] px-[clamp(min(1.5rem,7.5vw),5vw,4rem)] py-[clamp(2.5rem,6vw,4.5rem)] text-center text-white`}>
      <Heading
        id={headingId}
        className="mx-auto max-w-[22ch] text-h2 font-display font-black"
      >
        {heading}
      </Heading>
      {lines.length > 0 || strong ? (
        <div className="mt-6 grid gap-4">
          {lines.map((line) => (
            <p key={line} className="mx-auto max-w-[52ch] text-lead leading-normal text-white/90">
              {line}
            </p>
          ))}
          {strong ? (
            <p className="mx-auto max-w-[52ch] font-display text-lead font-bold leading-normal text-white">
              {strong}
            </p>
          ) : null}
        </div>
      ) : null}
      <Button href={FIT_CHECK.href} variant="onColor" size="lg" className="mt-9">
        {cta}
        {CTA_ICON}
      </Button>
    </div>
  );
}
