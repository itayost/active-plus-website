import Accordion from "@/components/ui/Accordion";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import { ArrowIcon } from "@/components/ui/icons";
import { FAQ } from "@/content/pages";

export default function FaqSection({
  limit,
  showMore = false,
  heading = "שאלות נפוצות",
}: {
  limit?: number;
  showMore?: boolean;
  heading?: string;
}) {
  const items = limit ? FAQ.slice(0, limit) : FAQ;

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="bg-surface py-[var(--section-y)]"
    >
      <Shell width="narrow">
        <Reveal>
          <h2 id="faq-heading" className="text-h2 font-display font-black">
            {heading}
          </h2>
        </Reveal>

        <Reveal className="mt-10">
          <Accordion items={items} />
        </Reveal>

        {showMore ? (
          <Reveal>
            <Button href="/faq" variant="outline" size="lg" className="mt-9">
              לכל השאלות
              <ArrowIcon className="h-5 w-5" />
            </Button>
          </Reveal>
        ) : null}
      </Shell>
    </section>
  );
}
