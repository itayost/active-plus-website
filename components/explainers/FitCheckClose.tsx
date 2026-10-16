import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/icons";
import { FIT_CHECK } from "@/lib/constants";

type Props = {
  cta: string;
  heading: ReactNode;
  headingId?: string;
  body?: string | string[];
  /** Emphasised last line under the body. */
  strong?: string;
  /** h3 when the close sits under its section's own h2 (/progress). */
  level?: 2 | 3;
};

const CTA_ICON = <ArrowIcon className="h-5 w-5" />;

/**
 * The fit-check close shared by the explainers and the articles list: one
 * centred #EAF1FB panel with blue-deep heading, ink body and the green CTA.
 */
export default function FitCheckClose({ cta, heading, headingId, body, strong, level = 2 }: Props) {
  const Heading = level === 3 ? "h3" : "h2";
  const lines = body === undefined ? [] : Array.isArray(body) ? body : [body];

  return (
    <div className="rounded-card bg-blue-wash px-[clamp(min(1.5rem,7.5vw),5vw,4.5rem)] py-[clamp(2.25rem,6vw,5rem)] text-center">
      <Heading
        id={headingId}
        className="mx-auto max-w-[22ch] text-h2 font-display font-extrabold text-blue-deep"
      >
        {heading}
      </Heading>
      {lines.length > 0 || strong ? (
        <div className="mt-6 grid gap-4">
          {lines.map((line) => (
            <p key={line} className="mx-auto max-w-[46ch] text-lead text-ink-soft">
              {line}
            </p>
          ))}
          {strong ? (
            <p className="mx-auto max-w-[46ch] font-display text-lead font-bold text-ink">{strong}</p>
          ) : null}
        </div>
      ) : null}
      <Button href={FIT_CHECK.href} variant="primary" size="lg" className="mt-9">
        {cta}
        {CTA_ICON}
      </Button>
    </div>
  );
}
