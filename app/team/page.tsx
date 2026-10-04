import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import LeadSection from "@/components/sections/LeadSection";
import { TEAM } from "@/content/pages";

export const metadata: Metadata = {
  title: "הצוות המקצועי",
  description:
    "פיזיותרפיה, ריפוי בעיסוק, שיקום נוירולוגי ונוירולוגיה — הצוות שמאחורי תוכנית האימון של פעילים+.",
};

/** Portraits have not been supplied; initials stand in until they are. */
const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

const TONES = [
  "bg-[var(--blue-wash)] text-blue-deep",
  "bg-[var(--green-wash)] text-green-deep",
  "bg-[var(--purple-wash)] text-purple-deep",
  "bg-[var(--burgundy-wash)] text-burgundy",
];

export default function TeamPage() {
  return (
    <>
      <PageHero
        title="הצוות המקצועי"
        lede="תוכנית האימון נבנית על ידי אנשי מקצוע מתחומי התנועה, התפקוד והקוגניציה."
        tone="green"
      />

      <section className="bg-surface py-[var(--section-y)]">
        <Shell>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((member, index) => (
              <Reveal as="li" key={member.name} delayIndex={index % 3}>
                <article className="flex h-full flex-col gap-5 rounded-card border border-hairline p-7 transition-[box-shadow,transform] duration-[var(--dur)] ease-out-expo hover:-translate-y-1 hover:shadow-lift-2">
                  <span
                    aria-hidden="true"
                    className={`flex h-16 w-16 items-center justify-center rounded-full font-display text-h3 font-black ${TONES[index % TONES.length]}`}
                  >
                    {initials(member.name)}
                  </span>
                  <div>
                    <h2 className="font-display text-h3 font-bold">{member.name}</h2>
                    <p className="mt-2 text-ink-soft">{member.role}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>

          <Reveal>
            <p className="mt-10 max-w-measure text-ink-faint">
              נוירופסיכולוג/ית לתחומי זיכרון, קשב ותפקודים קוגניטיביים —
              המשרה בתהליך איוש.
            </p>
          </Reveal>
        </Shell>
      </section>

      <LeadSection source="team" />
    </>
  );
}
