import Accordion from "@/components/ui/Accordion";
import SectionHeading from "@/components/ui/SectionHeading";
import { FAQ, FAQ_HEADING } from "@/content/home";

/** The home FAQ; `id="faq"` is the target of the menu's /#faq link. */
export default function FaqSection({ heading = FAQ_HEADING }: { heading?: string }) {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mx-auto w-full max-w-narrow scroll-mt-4 gutter-x pb-4 pt-12 lg:pt-16"
    >
      <SectionHeading id="faq-heading" title={heading} />
      <div className="mt-2 lg:mt-5">
        <Accordion items={FAQ} />
      </div>
    </section>
  );
}
