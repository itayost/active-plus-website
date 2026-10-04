import type { Metadata } from "next";
import Image from "next/image";
import Challenges from "@/components/how/Challenges";
import Steps from "@/components/how/Steps";
import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";
import { ArrowIcon } from "@/components/ui/icons";
import { HOW as C } from "@/content/how-it-works";
import { FIT_CHECK } from "@/lib/constants";

export const metadata: Metadata = {
  title: "איך זה עובד",
  description: C.hero.sub,
};

const LEDE_FONT = "font-display font-bold";

export default function HowItWorksPage() {
  return (
    <>
      <section
        aria-labelledby="hero-h"
        className="on-dark bg-surface pb-[clamp(1.5rem,3vw,2.5rem)] pt-[clamp(1rem,2vw,1.75rem)]"
      >
        <div className="mx-auto w-full px-[clamp(0.625rem,1.4vw,1.5rem)]">
          <div className="relative isolate overflow-hidden rounded-[clamp(20px,2.5vw,36px)] bg-[#08222f]">
            {C.hero.image ? (
              <>
                <Image src={C.hero.image} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
                <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#08222f]/80" />
              </>
            ) : null}
            <div className="flex min-h-[clamp(23rem,36vw,34rem)] flex-col items-center justify-center px-[clamp(1.25rem,4vw,4rem)] py-[clamp(3.5rem,6vw,5.5rem)] text-center">
              <h1
                id="hero-h"
                className="max-w-[24ch] font-display text-[clamp(2rem,1.4rem+2.6vw,3.75rem)] font-black leading-[1.1] text-white"
              >
                {C.hero.title}
              </h1>
              <p className="mt-6 max-w-[44ch] text-[clamp(1.2rem,1.05rem+0.8vw,1.5rem)] font-medium leading-snug text-white/90">
                {C.hero.sub}
              </p>
              <Button href={FIT_CHECK.href} variant="onColor" size="lg" className="mt-10">
                {C.hero.cta}
                <ArrowIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Section labelledBy="steps-h" className="!pt-[clamp(3rem,6vw,5.5rem)]">
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-16">
          <h2 id="steps-h" className="max-w-[16ch] text-h2 font-display font-black text-ink">
            {C.intro.heading}
          </h2>
          <div className="grid gap-5 text-lead text-ink-soft">
            {C.intro.body.map((p) => (
              <p key={p} className="max-w-[60ch]">{p}</p>
            ))}
          </div>
        </div>
        <Steps steps={C.steps} />
      </Section>

      <Section tone="sunken" labelledBy="dual-h">
        {C.dual.image ? (
          <div className="relative mb-[clamp(3rem,6vw,5rem)] aspect-[4/3] overflow-hidden rounded-card md:aspect-[21/9]">
            <Image src={C.dual.image} alt="" fill sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
          </div>
        ) : null}
        <div className="grid gap-[clamp(2.5rem,5vw,4.5rem)] lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <h2 id="dual-h" className="text-h2 font-display font-black text-ink">{C.dual.heading}</h2>
            <p className="mt-6 max-w-[58ch] text-lead text-ink">{C.dual.body[0]}</p>
            <p className="mt-6 max-w-[58ch] text-base text-ink-soft">{C.dual.body[1]}</p>
            <p className="mt-8 font-display font-bold text-ink">{C.dual.examplesLabel}</p>
            <ul className="mt-4 grid gap-3">
              {C.dual.examples.map(([move, link, mind]) => (
                <li
                  key={move}
                  className="flex flex-wrap items-center gap-x-2.5 gap-y-2 rounded-[20px] bg-surface px-[1.1rem] py-3.5 text-base text-ink-soft shadow-lift-1"
                >
                  <span className="rounded-pill bg-blue-wash px-3.5 py-1.5 font-display font-bold text-blue-deep">{move}</span>
                  {link}
                  <span className="rounded-pill bg-purple-wash px-3.5 py-1.5 font-display font-bold text-purple-deep">{mind}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <figure className="m-0 rounded-card bg-purple-wash p-[clamp(1.75rem,4vw,3rem)] text-purple-deep">
              <p className="font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.125rem)] font-bold leading-[1.3] tracking-tight">
                {C.dual.definition.before}{" "}
                <span lang="en" dir="ltr" className="inline-block font-black">{C.dual.definition.term}</span>{" "}
                {C.dual.definition.after}
              </p>
            </figure>
            <p className="mt-7 max-w-[52ch] text-base text-ink-soft">{C.dual.outro}</p>
          </div>
        </div>
      </Section>

      <Section labelledBy="daily-h">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 id="daily-h" className="text-h2 font-display font-black text-ink">{C.daily.heading}</h2>
            <p className={`mt-5 max-w-[34ch] text-lead leading-snug text-blue-deep ${LEDE_FONT}`}>{C.daily.lede}</p>
            <div className="mt-5 grid max-w-[56ch] gap-5 text-base text-ink-soft">
              {C.daily.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
          <figure className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[22px] bg-surface shadow-lift-2">
            <Image
              src={C.daily.image.src}
              width={C.daily.image.width}
              height={C.daily.image.height}
              alt={C.daily.image.alt}
              sizes="300px"
              className="h-auto w-full"
            />
          </figure>
        </div>
      </Section>

      <Section tone="sunken" labelledBy="progress-h">
        <h2 id="progress-h" className="mx-auto max-w-[20ch] text-center text-h2 font-display font-black text-ink">
          {C.progress.heading}
        </h2>
        <p className="mx-auto mt-6 max-w-[52ch] text-center text-lead text-ink-soft">{C.progress.lede}</p>
        <div className="mt-[clamp(2.5rem,5vw,4rem)] grid items-center gap-10 lg:grid-cols-[1fr_1.25fr_1fr] lg:gap-12">
          <p className="mx-auto max-w-[40ch] text-base text-ink-soft lg:m-0 lg:self-start lg:pt-24 lg:text-[1.25rem]">
            {C.progress.body[0]}
          </p>
          <div className="relative isolate flex justify-center px-[clamp(1rem,3vw,2rem)] py-[clamp(1.5rem,4vw,3rem)] before:absolute before:inset-x-0 before:bottom-0 before:top-[18%] before:-z-10 before:rounded-card before:bg-green-wash before:content-['']">
            <figure className="w-full max-w-[380px] overflow-hidden rounded-[22px] bg-surface shadow-lift-3 lg:max-w-none">
              <Image
                src={C.progress.image.src}
                width={C.progress.image.width}
                height={C.progress.image.height}
                alt={C.progress.image.alt}
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="h-auto w-full"
              />
            </figure>
          </div>
          <p className="mx-auto max-w-[40ch] text-base text-ink-soft lg:m-0 lg:self-end lg:pb-16 lg:text-[1.25rem]">
            {C.progress.body[1]}
          </p>
        </div>
      </Section>

      <Section labelledBy="ch-h">
        <h2 id="ch-h" className="text-h2 font-display font-black text-ink">{C.challenges.heading}</h2>
        <p className={`mt-6 text-lead text-ink ${LEDE_FONT}`}>{C.challenges.lede}</p>
        <p className="mt-3 text-lead text-ink-soft">{C.challenges.body}</p>
        <Challenges items={C.challenges.items} />
        <p className={`mt-10 text-lead text-ink ${LEDE_FONT}`}>{C.challenges.outro}</p>
      </Section>

      <Section tone="sunken" labelledBy="pros-h">
        <div className="grid items-center gap-[clamp(2.5rem,5vw,4.5rem)] lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 id="pros-h" className="max-w-[16ch] text-h2 font-display font-black text-ink">{C.pros.heading}</h2>
            <div className="mt-6 grid max-w-[54ch] gap-5 text-base text-ink-soft">
              {C.pros.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-[clamp(1rem,3vw,2rem)]">
            {C.pros.people.map((p) => (
              <li key={p.name}>
                <Image
                  src={p.photo}
                  width={900}
                  height={900}
                  alt={p.name}
                  sizes="(min-width: 1024px) 22vw, 45vw"
                  className="aspect-square h-auto w-full rounded-[22px] object-cover object-[50%_25%] shadow-lift-1"
                />
                <h3 className="mt-5 text-h3 font-display font-bold text-ink">{p.name}</h3>
                <p className="mt-1 text-base text-ink-soft">{p.role}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section labelledBy="cta-h">
        <div className="rounded-card bg-blue [--focus-ring:#ffffff] px-[clamp(1.5rem,5vw,4rem)] py-[clamp(2.5rem,6vw,4.5rem)] text-center text-white">
          <h2 id="cta-h" className="mx-auto max-w-[22ch] text-h2 font-display font-black">{C.close.heading}</h2>
          <div className="mt-6 grid gap-4">
            {C.close.body.map((p) => (
              <p key={p} className="mx-auto max-w-[52ch] text-lead leading-normal text-white/90">{p}</p>
            ))}
            <p className={`mx-auto max-w-[52ch] text-lead leading-normal text-white ${LEDE_FONT}`}>{C.close.strong}</p>
          </div>
          <Button href={FIT_CHECK.href} variant="onColor" size="lg" className="mt-9">
            {C.close.cta}
            <ArrowIcon className="h-5 w-5" />
          </Button>
        </div>
      </Section>
    </>
  );
}
