import type { Metadata } from "next";
import Image from "next/image";
import PageHero from "@/components/layout/PageHero";
import FaqSection from "@/components/sections/FaqSection";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import Section from "@/components/ui/Section";
import { ArrowIcon } from "@/components/ui/icons";
import { ABOUT as C, TEAM } from "@/content/pages";
import { FIT_CHECK } from "@/lib/constants";

export const metadata: Metadata = {
  title: "אודות",
  description: C.lede,
};

const STORY_PHOTO = {
  src: "/img/about.webp",
  width: 1200,
  height: 798,
  alt: "מידד גולן, מייסד ומנכ״ל המרכז לשיפור התנועה, עומד ליד דוכן נואמים",
};

export default function AboutPage() {
  return (
    <>
      <PageHero title={C.title} lede={C.lede} tone="blue" />

      <Section>
        <div className="grid gap-[clamp(2.5rem,5vw,5rem)] lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <Reveal className="lg:sticky lg:top-36">
            <figure className="m-0">
              <Image
                src={STORY_PHOTO.src}
                width={STORY_PHOTO.width}
                height={STORY_PHOTO.height}
                alt={STORY_PHOTO.alt}
                sizes="(min-width: 1024px) 55vw, 92vw"
                className="aspect-[3/2] h-auto w-full rounded-card object-cover shadow-lift-2"
              />
              <figcaption className="mt-4 text-base text-ink-faint">
                מידד גולן, מייסד ומנכ״ל המרכז לשיפור התנועה
              </figcaption>
            </figure>
          </Reveal>
          <div className="grid gap-[clamp(1.5rem,3vw,2.25rem)]">
            {C.story.map((p) => (
              <p key={p} className="max-w-[36ch] text-[clamp(1.25rem,1.1rem+0.6vw,1.5rem)] leading-[1.55] text-ink-soft">
                {p}
              </p>
            ))}
            <blockquote className="m-0 mt-2 border-t-2 border-hairline pt-[clamp(1.5rem,3vw,2.25rem)]">
              <p className="max-w-[18ch] font-display text-[clamp(1.875rem,1.4rem+2vw,3rem)] font-black leading-[1.15] tracking-tight text-blue-deep">
                {C.pullQuote}
              </p>
            </blockquote>
          </div>
        </div>
      </Section>

      <Section tone="sunken" width="narrow" labelledBy="middle-h">
        <h2 id="middle-h" className="text-h2 font-display font-black text-ink">{C.middle.heading}</h2>
        <div className="mt-8 grid gap-6 text-lead leading-[1.55] text-ink-soft">
          {C.middle.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <p className="mt-[clamp(2.5rem,5vw,3.5rem)] font-display text-[clamp(2rem,1.5rem+2.4vw,3.5rem)] font-black leading-[1.1] tracking-tight text-ink">
          {C.middle.closer}
        </p>
      </Section>

      <Section labelledBy="born-h">
        <div className="grid gap-[clamp(2rem,4vw,3.5rem)] lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 id="born-h" className="text-h2 font-display font-black text-ink">{C.born.heading}</h2>
            {C.born.body.map((p) => (
              <p key={p} className="mt-6 max-w-[44ch] text-lead leading-[1.55] text-ink-soft">{p}</p>
            ))}
          </div>
          <div className="rounded-card bg-green-wash p-[clamp(1.75rem,4vw,3.5rem)] text-green-deep">
            <p className="text-lead leading-[1.5]">{C.born.visionLead}</p>
            <p className="mt-4 font-display text-[clamp(1.75rem,1.35rem+1.8vw,2.75rem)] font-black leading-[1.2] tracking-tight">
              {C.born.vision}
            </p>
            <Button href={FIT_CHECK.href} size="lg" className="mt-8">
              {C.born.cta}
              <ArrowIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Section>

      <Section tone="sunken" labelledBy="measure-h">
        <div className="grid items-center gap-[clamp(2rem,5vw,4.5rem)] lg:grid-cols-2">
          <Image
            src="/img/v2/progress-woman.webp"
            width={1600}
            height={900}
            alt="אישה מחייכת מול טאבלט עם מסך ההתקדמות שלה"
            sizes="(min-width: 1024px) 48vw, 92vw"
            className="h-auto w-full rounded-[22px] shadow-lift-2"
          />
          <div>
            <h2 id="measure-h" className="text-h2 font-display font-black text-ink">{C.measure.heading}</h2>
            <p className="mt-6 max-w-[52ch] text-lead text-ink">{C.measure.lede}</p>
            <div className="mt-6 grid max-w-[52ch] gap-5 text-base text-ink-soft">
              {C.measure.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <p className="mt-9 font-display text-h3 font-bold text-ink">{C.measure.line}</p>
            <Button href={FIT_CHECK.href} size="lg" className="mt-4">
              {C.measure.cta}
              <ArrowIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Section>

      <Section labelledBy="team-h">
        <h2 id="team-h" className="text-h2 font-display font-black text-ink">{C.team.heading}</h2>
        <p className="mt-6 max-w-[52ch] text-lead text-ink-soft">{C.team.lede}</p>
        <ul className="mt-[clamp(2.5rem,5vw,4rem)] grid list-none gap-[clamp(2rem,4vw,2.5rem)] p-0 md:grid-cols-3">
          {TEAM.map((m) => (
            <li
              key={m.name}
              className="grid grid-cols-[7.5rem_1fr] items-start gap-x-5 md:block"
            >
              <Image
                src={m.photo}
                width={900}
                height={900}
                alt={m.name}
                sizes="(min-width: 768px) 30vw, 120px"
                className="row-span-3 aspect-square h-auto w-full rounded-[20px] object-cover object-[50%_28%] shadow-lift-2 md:aspect-[4/5] md:rounded-card"
              />
              <h3 className="text-h3 font-display font-bold text-ink md:mt-6">{m.name}</h3>
              <p className="mt-1.5 font-display font-bold leading-snug text-blue-deep">
                {m.role}
                {m.org ? <span className="block">{m.org}</span> : null}
              </p>
              <p className="mt-3 max-w-[34ch] text-base text-ink-soft">{m.bio}</p>
            </li>
          ))}
        </ul>
      </Section>

      <FaqSection />
    </>
  );
}
