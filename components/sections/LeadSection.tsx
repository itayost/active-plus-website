import LeadForm from "@/components/forms/LeadForm";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import { ClockIcon, PhoneIcon } from "@/components/ui/icons";
import { CONTACT_HOURS, CONTACT_PHONE, CONTACT_PHONE_TEL } from "@/lib/constants";
import PhoneNumber from "@/components/ui/PhoneNumber";

export default function LeadSection({
  source,
  heading = "השאירו פרטים ונחזור אליכם לתיאום",
  lede,
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
      className="lead-section bg-surface py-[var(--section-y)]"
    >
      <Shell>
        <div className="lead-panel grid gap-12 rounded-card bg-[var(--green-wash)] p-[clamp(min(1.75rem,8.75vw),4vw,4rem)] lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <h2
              id="lead-heading"
              className="text-h2 font-display font-black text-green-deep"
            >
              {heading}
            </h2>
            {lede ? (
              <p className="mt-6 max-w-measure text-lead text-ink-soft">{lede}</p>
            ) : null}

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
                    className="inline-flex min-h-12 items-center text-ink-soft underline transition-colors hover:text-green-deep"
                  >
                    <PhoneNumber value={CONTACT_PHONE} />
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
            <div className="lead-form-card rounded-card bg-surface p-[clamp(min(1.5rem,7.5vw),3vw,2.5rem)] shadow-lift-2">
              <LeadForm source={source} submitLabel="שליחה" withEmail={withEmail} />
            </div>
          </Reveal>
        </div>
      </Shell>
    </section>
  );
}
