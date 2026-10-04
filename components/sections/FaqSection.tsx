import Accordion from "@/components/ui/Accordion";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import { FAQ } from "@/content/home";

export default function FaqSection({
  heading = "שאלות ותשובות",
}: {
  heading?: string;
}) {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="bg-sunken py-[var(--section-y)]"
    >
      <Shell width="narrow">
        <Reveal>
          <h2 id="faq-heading" className="text-h2 font-display font-black">
            {heading}
          </h2>
        </Reveal>

        <Reveal className="mt-10">
          <Accordion items={FAQ} />
        </Reveal>
      </Shell>
    </section>
  );
}
