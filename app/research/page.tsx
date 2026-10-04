import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import Prose from "@/components/ui/Prose";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import LeadSection from "@/components/sections/LeadSection";
import { RESEARCH } from "@/content/pages";

export const metadata: Metadata = {
  title: "המחקר והגישה המקצועית",
  description:
    "הגישה של פעילים+ מבוססת על מחקר Dual Tasking, ובהם מחקר אקראי מבוקר שפורסם ב־The Lancet בהובלת חוקרים מאיכילוב ואוניברסיטת תל אביב.",
};

export default function ResearchPage() {
  return (
    <>
      <PageHero
        title={RESEARCH.title}
        lede="הגוף והמוח עובדים יחד — וכך גם נכון לאמן אותם."
        tone="blue"
      />

      <section className="bg-surface py-[var(--section-y)]">
        <Shell>
          <div className="grid gap-14 lg:grid-cols-[1fr_0.75fr] lg:items-start">
            <Reveal>
              <Prose blocks={RESEARCH.blocks} />
            </Reveal>

            <Reveal delayIndex={1} className="lg:sticky lg:top-28">
              <figure className="rounded-card bg-[#0f2230] p-[clamp(1.75rem,3vw,2.75rem)] text-center text-white">
                <div className="font-display text-[clamp(4rem,3rem+5vw,7rem)] font-black leading-none tracking-tighter text-[#5fd3ff]">
                  42%
                </div>
                <figcaption className="mt-4 text-white/85">
                  פחות נפילות באימון ששילב הליכה עם אתגרים מוטוריים
                  וקוגניטיביים, בהשוואה לאימון הליכה בלבד.
                </figcaption>
                <p className="mt-6 border-t border-white/15 pt-5 text-white/55">
                  <span className="whitespace-nowrap">The Lancet</span> · מחקר אקראי מבוקר · פרופ׳ ענת מירלמן, פרופ׳ ג׳פרי
                  האוסדורף
                </p>
              </figure>
            </Reveal>
          </div>
        </Shell>
      </section>

      <LeadSection source="research" />
    </>
  );
}
