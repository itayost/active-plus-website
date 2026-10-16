import LeadForm from "@/components/forms/LeadForm";
import Card from "@/components/ui/Card";
import PhoneNumber from "@/components/ui/PhoneNumber";
import { LEAD_HEADING } from "@/content/home";
import { CONTACT_HOURS, CONTACT_PHONE, CONTACT_PHONE_TEL } from "@/lib/constants";

/**
 * The home lead card: heading, the form, and a line for people who would
 * rather call. The padding gives way on a narrow phone so enlarged text keeps
 * its width.
 */
export default function LeadSection({
  source,
  heading = LEAD_HEADING,
}: {
  source: string;
  heading?: string;
}) {
  return (
    <section
      id="lead"
      aria-labelledby="lead-heading"
      className="mx-auto w-full max-w-shell gutter-x pt-12 lg:pt-16"
    >
      <Card className="mx-auto flex max-w-[40rem] flex-col gap-3.5 p-[min(22px,5.5vw)] lg:p-10">
        <h2 id="lead-heading" className="text-[22px] font-extrabold leading-tight text-ink lg:text-[28px]">
          {heading}
        </h2>
        <LeadForm source={source} submitLabel="שליחה" variant="short" />
        <p className="text-lg text-ink">
          מעדיפים לדבר?{" "}
          <a
            href={`tel:${CONTACT_PHONE_TEL}`}
            dir="ltr"
            className="inline-flex min-h-12 items-center font-bold text-blue-deep underline"
          >
            <PhoneNumber value={CONTACT_PHONE} />
          </a>
          <span className="block text-ink-soft">{CONTACT_HOURS}</span>
        </p>
      </Card>
    </section>
  );
}
