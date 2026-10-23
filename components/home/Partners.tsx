import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import Marquee from "@/components/ui/Marquee";
import SwipeRow from "@/components/ui/SwipeRow";
import { PARTNERS, PARTNERS_HEADING } from "@/content/home";

const tiles = PARTNERS.map((partner) => (
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
));

/**
 * Partner marks as 138x96 tiles. The client asked (2026-10-17) for the row to
 * move on its own, so it is a marquee at every width. Under reduced motion it
 * is the still swipe row instead (a carousel with arrows from lg), whose tiles
 * are Tab stops so keyboard users can scroll it. CSS picks one, so there is
 * no flash on hydration.
 */
export default function Partners() {
  return (
    <section aria-labelledby="partners-heading" className="pt-12 lg:pt-16">
      <div className="mx-auto w-full max-w-shell gutter-x">
        <SectionHeading id="partners-heading" title={PARTNERS_HEADING} swipeHint="reduced-motion" />
      </div>
      <div className="mx-auto w-full max-w-shell lg:mt-6">
        <div className="motion-reduce:hidden">
          <Marquee label={PARTNERS_HEADING} itemClassName="w-[138px]">
            {tiles}
          </Marquee>
        </div>
        <div className="motion-safe:hidden">
          <SwipeRow label={PARTNERS_HEADING} desktop="carousel" itemWidth="logo" focusableItems>
            {tiles}
          </SwipeRow>
        </div>
      </div>
    </section>
  );
}
