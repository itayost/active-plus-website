import type { Metadata } from "next";
import Image from "next/image";
import PageHero from "@/components/layout/PageHero";
import Prose from "@/components/ui/Prose";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import LeadSection from "@/components/sections/LeadSection";
import { ABOUT } from "@/content/pages";

export const metadata: Metadata = {
  title: "הכירו את פעילים+",
  description:
    "למה הקמנו את פעילים+: מהמרכז לשיפור התנועה אל אימון יומי שמשלב תנועה וחשיבה לגילאי 55+.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        title={ABOUT.title}
        lede="מידד גולן, מייסד פעילים+ והמרכז לשיפור התנועה, על הדרך שהובילה לכאן."
        tone="blue"
      />

      <section className="bg-surface py-[var(--section-y)]">
        <Shell>
          <div className="grid gap-14 lg:grid-cols-[1fr_0.8fr] lg:items-start">
            <Reveal>
              <h2 className="text-h2 font-display font-black">{ABOUT.heading}</h2>
              <Prose blocks={ABOUT.blocks} className="mt-8" />
            </Reveal>

            <Reveal delayIndex={1} className="lg:sticky lg:top-28">
              {/*
                The photo carries its own natural 1200x798 ratio rather than a
                crop: the Histadrut backdrop is part of what the picture says,
                and squeezing it to a portrait box cuts the flags out.
              */}
              <figure className="overflow-hidden rounded-card border-2 border-hairline bg-sunken">
                <Image
                  src="/img/about.webp"
                  alt="מידד גולן, מייסד פעילים+, נואם באירוע של ההסתדרות"
                  width={1200}
                  height={798}
                  sizes="(max-width: 1024px) 92vw, 36vw"
                  className="h-auto w-full object-cover"
                />
                <div className="p-[clamp(1.5rem,3vw,2.5rem)]">
                  {/*
                    A pull-quote may repeat body copy — that is what a pull-quote
                    is — but only at a distance. Below lg the columns stack and it
                    lands directly under the identical closing paragraph, so the
                    card keeps just the portrait and its credit there.
                  */}
                  <blockquote className="hidden font-display lg:block text-[clamp(1.25rem,1.1rem+0.9vw,1.75rem)] font-bold leading-snug text-blue-deep">
                    המרכז לשיפור התנועה נולד כדי לעזור לאנשים אחרי שכבר הופיע
                    קושי. פעילים+ נולדה כדי להיות שם קודם.
                  </blockquote>
                  <figcaption className="text-ink-soft lg:mt-5">
                    מידד גולן, מייסד ומנכ״ל
                  </figcaption>
                </div>
              </figure>
            </Reveal>
          </div>
        </Shell>
      </section>

      <LeadSection source="about" />
    </>
  );
}
