import type { Metadata } from "next";
import Image from "next/image";
import BackLink from "@/components/explainers/BackLink";
import FitCheckClose from "@/components/explainers/FitCheckClose";
import PageHero from "@/components/layout/PageHero";
import Reveal from "@/components/ui/Reveal";
import Section from "@/components/ui/Section";
import { ScanIcon } from "@/components/ui/icons";
import { MOTION_DETECTION as C } from "@/content/explainers";

export const metadata: Metadata = {
  title: C.title,
  description: C.lede,
};

export default function MotionDetectionPage() {
  return (
    <>
      <PageHero
        tone="blue"
        title={C.title}
        lede={C.lede}
        back={<BackLink />}
        aside={
          <Image
            src={C.image.src}
            width={C.image.width}
            height={C.image.height}
            alt={C.image.alt}
            priority
            sizes="(max-width: 1024px) 92vw, 46vw"
            className="h-auto w-full rounded-card shadow-lift-2"
          />
        }
      />

      <Section width="narrow" labelledBy="pivot-h">
        <h2 id="pivot-h" className="max-w-[16ch] text-h2 font-display font-black text-blue-deep">
          {C.pivotHeading}
        </h2>
        <p className="mt-7 text-lead text-ink">{C.checks}</p>

        <Reveal className="mt-[clamp(2.5rem,5vw,3.5rem)] grid gap-5 rounded-card bg-blue-wash p-[clamp(1.5rem,3.5vw,2.5rem)] sm:grid-cols-[auto_1fr] sm:items-start">
          <span className="flex h-14 w-14 items-center justify-center rounded-pill bg-white text-blue-deep shadow-lift-1">
            <ScanIcon className="h-7 w-7" />
          </span>
          <p className="text-[1.25rem] leading-[1.6] text-ink">{C.example}</p>
        </Reveal>

        <ol className="mt-[clamp(3.5rem,7vw,5.5rem)]">
          {C.steps.map((step, i) => {
            const isKey = i === C.keyStepIndex;
            const isLast = i === C.steps.length - 1;
            return (
              <Reveal as="li" key={step} className={`relative ps-[3.25rem] ${isLast ? "" : "pb-11"}`}>
                <span
                  aria-hidden="true"
                  className={`absolute start-0 top-[0.2rem] h-7 w-7 rounded-pill border-2 border-blue-deep ${
                    isKey ? "bg-blue-deep" : "bg-white"
                  }`}
                />
                {isLast ? null : (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1 start-[13px] top-9 w-0.5 rounded-sm bg-hairline"
                  />
                )}
                <p
                  className={
                    isKey
                      ? "max-w-[60ch] font-display text-h3 font-bold tracking-tight text-ink"
                      : "max-w-[60ch] text-[1.25rem] leading-[1.6] text-ink-soft"
                  }
                >
                  {step}
                </p>
              </Reveal>
            );
          })}
        </ol>
      </Section>

      <Section tone="sunken" width="narrow" labelledBy="close-h">
        <p className="font-display text-[clamp(1.5rem,1.2rem+1.3vw,2.25rem)] font-medium leading-[1.4] tracking-tight text-ink">
          {C.emphasis.before}
          <strong className="font-black text-blue-deep">{C.emphasis.strong}</strong>
          {C.emphasis.after}
        </p>
        <p className="mt-8 text-lead text-ink-soft">{C.precise}</p>
        <div className="mt-[clamp(3rem,6vw,4.5rem)]">
          <FitCheckClose tone="blue" cta={C.cta} heading={C.closing} headingId="close-h" />
        </div>
      </Section>
    </>
  );
}
