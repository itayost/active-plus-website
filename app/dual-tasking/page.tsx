import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import Prose from "@/components/ui/Prose";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import LeadSection from "@/components/sections/LeadSection";
import { DUAL_TASKING } from "@/content/pages";

export const metadata: Metadata = {
  title: "אימון גוף ומוח — Dual Tasking",
  description:
    "מהו Dual Tasking, מה קורה במוח כשזזים וחושבים באותו הזמן, ולמה החיבור הזה נעשה חשוב יותר עם השנים.",
};

export default function DualTaskingPage() {
  return (
    <>
      <PageHero
        title={DUAL_TASKING.title}
        lede="Dual Tasking — כשמערכת התנועה ומערכות החשיבה נדרשות לעבוד יחד."
        tone="purple"
      />

      <section className="bg-surface py-[var(--section-y)]">
        <Shell>
          <Reveal>
            <Prose blocks={DUAL_TASKING.blocks} />
          </Reveal>
        </Shell>
      </section>

      <LeadSection source="dual-tasking" />
    </>
  );
}
