import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import SwipeRow from "@/components/ui/SwipeRow";
import { PARTNERS, PARTNERS_HEADING } from "@/content/home";

/**
 * Partner marks as 138x96 tiles in a swipe row (a carousel with arrows from
 * lg). The tiles are Tab stops so keyboard users can scroll the row.
 */
export default function Partners() {
  return (
    <section aria-labelledby="partners-heading" className="pt-12 lg:pt-16">
      <div className="mx-auto w-full max-w-shell gutter-x">
        <SectionHeading id="partners-heading" title={PARTNERS_HEADING} swipeHint />
      </div>
      <div className="mx-auto w-full max-w-shell lg:mt-6">
        <SwipeRow label={PARTNERS_HEADING} desktop="carousel" itemWidth="logo" focusableItems>
          {PARTNERS.map((partner) => (
            <div
              key={partner.src}
              className="flex h-24 items-center justify-center rounded-logo border border-hairline bg-surface p-3 shadow-card"
            >
              <Image
                src={partner.src}
                alt={partner.name}
                width={180}
                height={88}
                sizes="138px"
                className="h-full w-full object-contain"
              />
            </div>
          ))}
        </SwipeRow>
      </div>
    </section>
  );
}
