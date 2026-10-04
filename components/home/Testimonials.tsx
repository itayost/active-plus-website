"use client";

import { Shell } from "@/components/ui/Section";
import { CAROUSEL_ARROW, useSnapCarousel } from "@/components/ui/useSnapCarousel";
import { ArrowBackIcon, ArrowIcon } from "@/components/ui/icons";
import { TESTIMONIALS } from "@/content/home";

const SOURCE_LABEL = {
  google: "ביקורת בגוגל",
  facebook: "ביקורת בפייסבוק",
} as const;

/**
 * Written reviews only, no star ratings (none were supplied) and no
 * third-party logos: the source is a text label.
 *
 * TODO(brief): 3-4 testimonial videos are pending from the client. When they
 * arrive they enter above this track as a row of circles with a play button.
 */
export default function Testimonials() {
  const { trackRef, index, canPrev, canNext, goTo } = useSnapCarousel<HTMLUListElement>(
    TESTIMONIALS.length,
  );

  return (
    <section
      aria-labelledby="reviews-heading"
      aria-roledescription="קרוסלה"
      className="bg-sunken py-[var(--section-y)]"
    >
      <Shell>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="reviews-heading" className="max-w-[18ch] text-h2 font-display font-black">
            מה אומרים הלקוחות שלנו
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => canPrev && goTo(index - 1)}
              aria-disabled={!canPrev || undefined}
              className={CAROUSEL_ARROW}
            >
              <span className="sr-only">הביקורת הקודמת</span>
              <ArrowBackIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => canNext && goTo(index + 1)}
              aria-disabled={!canNext || undefined}
              className={CAROUSEL_ARROW}
            >
              <span className="sr-only">הביקורת הבאה</span>
              <ArrowIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </Shell>

      <ul
        ref={trackRef}
        tabIndex={0}
        aria-label="ביקורות לקוחות"
        className="snap-gutter mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth gutter-x pb-6 motion-reduce:scroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TESTIMONIALS.map((item, i) => (
          <li
            key={item.name}
            aria-label={`${i + 1} מתוך ${TESTIMONIALS.length}`}
            className="w-[min(84vw,600px)] shrink-0 snap-start"
          >
            <article className="flex h-full flex-col rounded-[24px] bg-white p-[clamp(1.5rem,3vw,2.5rem)] shadow-lift-1">
              <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="font-display text-h3 font-bold">{item.name}</h3>
                <p className="text-ink-soft">{SOURCE_LABEL[item.source]}</p>
              </header>
              <blockquote className="mt-5 text-lead text-ink-soft">{item.quote}</blockquote>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
