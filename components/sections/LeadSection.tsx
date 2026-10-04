import LeadForm from "@/components/forms/LeadForm";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import { ClockIcon, PhoneIcon } from "@/components/ui/icons";
import { CONTACT_HOURS, CONTACT_PHONE, CONTACT_PHONE_TEL } from "@/lib/constants";

export default function LeadSection({
  source,
  heading = "השאירו פרטים ונחזור אליכם לתיאום",
  lede = "שיחה קצרה, בלי התחייבות — נבין מה מתאים לכם ונסביר איך מתחילים.",
  withEmail = true,
}: {
  source: string;
  heading?: string;
  lede?: string;
  withEmail?: boolean;
}) {
  return (
    <section
      id="lead"
      aria-labelledby="lead-heading"
      className="bg-surface py-[var(--section-y)]"
    >
      <Shell>
        <div className="grid gap-12 rounded-card bg-[var(--green-wash)] p-[clamp(1.75rem,4vw,4rem)] lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <h2
              id="lead-heading"
              className="text-h2 font-display font-black text-green-deep"
            >
              {heading}
            </h2>
            <p className="mt-6 max-w-measure text-lead text-ink-soft">{lede}</p>

            <ul className="mt-9 space-y-4">
              <li className="flex items-start gap-3">
                <PhoneIcon className="mt-1 h-6 w-6 shrink-0 text-green-deep" />
                <span>
                  <span className="block font-display font-bold">
                    מעדיפים לדבר?
                  </span>
                  <a
                    href={`tel:${CONTACT_PHONE_TEL}`}
                    dir="ltr"
                    className="inline-flex min-h-[44px] items-center text-ink-soft underline transition-colors hover:text-green-deep"
                  >
                    {CONTACT_PHONE}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ClockIcon className="mt-1 h-6 w-6 shrink-0 text-green-deep" />
                <span className="text-ink-soft">{CONTACT_HOURS}</span>
              </li>
            </ul>
          </Reveal>

          <Reveal delayIndex={1}>
            <div className="rounded-card bg-surface p-[clamp(1.5rem,3vw,2.5rem)] shadow-lift-2">
              <LeadForm source={source} submitLabel="שליחה" withEmail={withEmail} />
            </div>
          </Reveal>
        </div>
      </Shell>
    </section>
  );
}
