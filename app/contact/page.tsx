import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import LeadForm from "@/components/forms/LeadForm";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import { ClockIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/ui/icons";
import {
  CONTACT_ADDRESS,
  CONTACT_EMAIL,
  CONTACT_HOURS,
  CONTACT_PHONE,
  CONTACT_PHONE_TEL,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "צור קשר",
  description:
    "רוצים לדבר איתנו? טלפון 073-729-66-99 בימים א׳–ה׳ בין 10:00 ל-17:00, או השאירו פרטים ונחזור אליכם.",
};

const DETAILS = [
  {
    Icon: PhoneIcon,
    label: "טלפון",
    value: CONTACT_PHONE,
    href: `tel:${CONTACT_PHONE_TEL}`,
    ltr: true,
  },
  {
    Icon: MailIcon,
    label: "אימייל",
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
    ltr: false,
  },
  { Icon: ClockIcon, label: "שעות פעילות", value: CONTACT_HOURS, href: null, ltr: false },
  { Icon: PinIcon, label: "כתובת", value: CONTACT_ADDRESS, href: null, ltr: false },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="רוצים לדבר איתנו?"
        lede="אפשר להתקשר, לכתוב, או להשאיר פרטים ונחזור אליכם בשעות הפעילות."
        tone="green"
      />

      <section className="bg-surface py-[var(--section-y)]">
        <Shell>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <Reveal>
              <h2 className="text-h2 font-display font-black">פרטי התקשרות</h2>
              <ul className="mt-9 space-y-7">
                {DETAILS.map(({ Icon, label, value, href, ltr }) => (
                  <li key={label} className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-wash text-green-deep">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span>
                      <span className="block font-display font-bold">{label}</span>
                      {href ? (
                        <a
                          href={href}
                          dir={ltr ? "ltr" : undefined}
                          className="inline-flex min-h-[44px] items-center break-all text-ink-soft underline transition-colors hover:text-green-deep"
                        >
                          {value}
                        </a>
                      ) : (
                        <span className="block text-ink-soft">{value}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delayIndex={1}>
              <div className="rounded-card border-2 border-hairline bg-surface p-[clamp(1.5rem,3vw,2.75rem)]">
                <h2 className="text-h3 font-display font-bold">
                  השאירו פרטים ונחזור אליכם
                </h2>
                <LeadForm source="contact" detailed className="mt-8" />
              </div>
            </Reveal>
          </div>
        </Shell>
      </section>
    </>
  );
}
