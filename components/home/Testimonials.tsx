import Card from "@/components/ui/Card";
import ReviewSourceLogo from "@/components/ui/ReviewSourceLogo";
import SectionHeading from "@/components/ui/SectionHeading";
import SwipeRow from "@/components/ui/SwipeRow";
import { TESTIMONIALS, TESTIMONIALS_HEADING } from "@/content/home";

const SOURCE_NAME = { google: "Google", facebook: "Facebook" } as const;

/**
 * Written reviews as a swipe row. The cards hold nothing interactive, so the
 * row makes each one a Tab stop (`focusableItems`) and keyboard users reach
 * every card.
 */
export default function Testimonials() {
  return (
    <section aria-labelledby="testimonials-heading" className="pt-12 lg:pt-16">
      <div className="mx-auto w-full max-w-shell gutter-x">
        <SectionHeading id="testimonials-heading" title={TESTIMONIALS_HEADING} swipeHint />
      </div>
      <div className="mx-auto w-full max-w-shell lg:mt-6">
        <SwipeRow label={TESTIMONIALS_HEADING} desktop="carousel" itemWidth="card" focusableItems>
          {TESTIMONIALS.map((item) => (
            <Card key={item.name} as="article" className="flex h-full flex-col gap-2.5 p-[18px]">
              <header className="flex items-center justify-between gap-2">
                <h3 className="text-[17px] font-bold text-ink">{item.name}</h3>
                <span className="flex items-center gap-1.5 text-sm font-bold text-blue-deep">
                  <ReviewSourceLogo source={item.source} />
                  <span aria-hidden="true">{SOURCE_NAME[item.source]}</span>
                </span>
              </header>
              <span role="img" aria-label="5 כוכבים" className="text-xl leading-none tracking-[2px] text-star">
                ★★★★★
              </span>
              <blockquote className="text-lg leading-relaxed text-ink">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
            </Card>
          ))}
        </SwipeRow>
      </div>
    </section>
  );
}
