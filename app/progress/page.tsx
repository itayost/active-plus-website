import type { Metadata } from "next";
import Image from "next/image";
import BackLink from "@/components/explainers/BackLink";
import FitCheckClose from "@/components/explainers/FitCheckClose";
import PageHero from "@/components/layout/PageHero";
import Reveal from "@/components/ui/Reveal";
import Section from "@/components/ui/Section";
import { MindIcon, MovementIcon } from "@/components/ui/icons";
import { PROGRESS as C } from "@/content/explainers";

export const metadata: Metadata = {
  title: C.title,
  description: C.lede,
};

export default function ProgressPage() {
  return (
    <>
      <PageHero tone="green" title={C.title} lede={C.lede} back={<BackLink />} />

      <Section labelledBy="know-h">
        <div className="grid gap-[clamp(2.5rem,5vw,3.5rem)] lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-x-[clamp(4rem,8vw,8rem)] lg:gap-y-20">
          <div className="lg:col-start-1 lg:row-start-1">
            <p className="max-w-[46ch] text-lead text-ink-soft">{C.tracked}</p>
            <p className="mt-8 max-w-[26ch] font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.125rem)] font-bold leading-[1.3] tracking-tight text-green-deep">
              {C.notJustCount}
            </p>
          </div>

          <figure className="mx-auto max-w-[300px] lg:sticky lg:top-36 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-none lg:self-start">
            <Image
              src={C.image.src}
              width={C.image.width}
              height={C.image.height}
              alt={C.image.alt}
              sizes="(max-width: 1024px) 300px, 360px"
              className="h-auto w-full rounded-[36px] border-8 border-white shadow-lift-2"
            />
          </figure>

          <div className="lg:col-start-1 lg:row-start-2">
            <h2 id="know-h" className="max-w-[18ch] text-h2 font-display font-black text-ink">
              {C.strengths.heading}
            </h2>
            {C.strengths.intro.map((line, i) => (
              <p
                key={line}
                className={`max-w-measure text-base text-ink-soft ${i === 0 ? "mt-7" : "mt-5"}`}
              >
                {line}
              </p>
            ))}
            <ul className="mt-8 grid gap-4">
              {C.strengths.ifs.map((line) => (
                <li key={line} className="rounded-[22px] bg-green-wash px-[min(1.5rem,7.5vw)] py-5 text-base text-ink">
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-8 font-display text-h3 font-bold text-ink">{C.strengths.goal}</p>
          </div>
        </div>
      </Section>

      <Section tone="sunken" labelledBy="one-h">
        <h2 id="one-h" className="text-h2 font-display font-black text-ink">
          {C.onePicture.heading}
        </h2>
        <p className="mt-7 max-w-measure text-lead text-ink-soft">{C.onePicture.lede}</p>

        <ul className="mt-[clamp(2.5rem,5vw,3.5rem)] grid rounded-card bg-white shadow-lift-2 md:grid-cols-2">
          {C.pair.map((item, i) => {
            const isMove = i === 0;
            const Icon = isMove ? MovementIcon : MindIcon;
            return (
              <li
                key={item.label}
                className={`flex flex-col gap-4 p-[clamp(min(1.75rem,8.75vw),4vw,3.25rem)] ${
                  i > 0 ? "border-t border-hairline md:border-s md:border-t-0" : ""
                }`}
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-pill ${
                    isMove ? "bg-blue-wash text-blue-deep" : "bg-purple-wash text-purple-deep"
                  }`}
                >
                  <Icon className="h-7 w-7" />
                </span>
                <h3
                  className={`text-[clamp(1.625rem,1.3rem+1.2vw,2.25rem)] font-display font-black ${
                    isMove ? "text-blue-deep" : "text-purple-deep"
                  }`}
                >
                  {item.label}
                </h3>
                <p className="text-[1.25rem] leading-[1.6] text-ink-soft">{item.body}</p>
              </li>
            );
          })}
        </ul>
        <p className="mt-12 max-w-measure text-lead text-ink-soft">{C.pairOutro}</p>
      </Section>

      <Section labelledBy="beats-h">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <h2
              id="beats-h"
              className="font-display text-[clamp(2.25rem,1.5rem+3.4vw,4.5rem)] font-black leading-[1.05]"
            >
              <span className="block text-ink-faint">{C.beats.heading[0]}</span>{" "}
              <span className="block text-ink-soft">{C.beats.heading[1]}</span>{" "}
              <span className="block text-green-deep">{C.beats.heading[2]}</span>
            </h2>
          </Reveal>
          <Reveal delayIndex={1}>
            {C.beats.body.map((line, i) => (
              <p key={line} className={`max-w-[44ch] text-lead text-ink-soft ${i > 0 ? "mt-5" : ""}`}>
                {line}
              </p>
            ))}
          </Reveal>
        </div>
      </Section>

      <Section tone="sunken" labelledBy="final-h">
        <h2 id="final-h" className="max-w-[20ch] text-h2 font-display font-black text-ink">
          {C.final.heading}
        </h2>
        <p className="mt-6 max-w-measure text-lead text-ink-soft">{C.final.body}</p>
        <div className="mt-[clamp(3rem,6vw,4.5rem)]">
          <FitCheckClose tone="green" cta={C.cta} heading={C.final.question} />
        </div>
      </Section>
    </>
  );
}
