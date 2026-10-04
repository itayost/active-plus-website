import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/icons";
import { FIT_CHECK } from "@/lib/constants";

type Props = {
  tone: "purple" | "blue" | "green";
  cta: string;
  heading: ReactNode;
  headingId?: string;
  body?: string;
};

const CTA_ICON = <ArrowIcon className="h-5 w-5" />;

/**
 * The fit-check close shared by the three explainers. Same action, three
 * deliberately different shapes: a centred lavender panel (the light surface
 * takes the one filled purple button, DESIGN.md's Inverted Action Exception),
 * a left-heavy blue card, and a centred green band.
 */
export default function FitCheckClose({ tone, cta, heading, headingId, body }: Props) {
  if (tone === "purple") {
    return (
      <div className="rounded-card bg-purple-wash px-[clamp(1.5rem,5vw,4.5rem)] py-[clamp(2.25rem,6vw,5rem)] text-center">
        <h2
          id={headingId}
          className="mx-auto max-w-[20ch] text-h2 font-display font-black text-purple-deep"
        >
          {heading}
        </h2>
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

  if (tone === "blue") {
    return (
      <div className="grid gap-8 rounded-card bg-blue p-[clamp(2rem,5vw,3.5rem)] text-white shadow-lift-2">
        <h2
          id={headingId}
          className="max-w-[22ch] font-display text-[clamp(1.75rem,1.3rem+1.8vw,2.75rem)] font-black leading-[1.15]"
        >
          {heading}
        </h2>
        <Button href={FIT_CHECK.href} variant="onColor" size="lg" className="justify-self-start">
          {cta}
          {CTA_ICON}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-card bg-green px-[clamp(1.5rem,5vw,4rem)] py-[clamp(2.5rem,6vw,4.5rem)] text-center text-white">
      <h2
        id={headingId}
        className="mx-auto max-w-[22ch] text-h2 font-display font-black"
      >
        {heading}
      </h2>
      <Button href={FIT_CHECK.href} variant="onColor" size="lg" className="mt-9">
        {cta}
        {CTA_ICON}
      </Button>
    </div>
  );
}
