"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Shell } from "@/components/ui/Section";
import CarouselArrows from "@/components/ui/CarouselArrows";
import { useSnapCarousel } from "@/components/ui/useSnapCarousel";
import { ArrowIcon } from "@/components/ui/icons";
import { FEATURE_CARDS, FIT_CHECK, type Tone } from "@/lib/constants";

const CARD_ACTION_LABEL = "תראו לי עוד";
const FIT_CHECK_LABEL = "לבדיקת התאמה";

/**
 * Light cards on the white page, separated by the card shadow and a hairline
 * rather than by saturated fields: a blue wash for the plan and technology
 * cards, a green wash for progress.
 */
const FIELD: Record<Tone, string> = {
  blue: "border border-hairline bg-blue-wash text-ink",
  green: "border border-hairline bg-green-wash text-ink",
};

/** Secondary copy is the reading ink, which clears AAA on both washes. */
const SOFT: Record<Tone, string> = {
  blue: "text-ink-soft",
  green: "text-ink-soft",
};

/** The action is the site's one primary button treatment on every card. */
const ACTION = "bg-cta text-white shadow-cta";

export default function FeatureCards() {
  const { trackRef, index, canPrev, canNext, goTo } = useSnapCarousel<HTMLUListElement>(
    FEATURE_CARDS.length,
  );

  return (
    <section
      aria-labelledby="cards-heading"
      aria-roledescription="קרוסלה"
      className="bg-surface py-[var(--section-y)]"
    >
      <Shell>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2
            id="cards-heading"
            className="text-h2 font-display font-extrabold"
          >
            מעטפת מקצועית במיוחד בשבילכם
          </h2>

          <CarouselArrows
            prevLabel="הכרטיס הקודם"
            nextLabel="הכרטיס הבא"
            canPrev={canPrev}
            canNext={canNext}
            onPrev={() => goTo(index - 1)}
            onNext={() => goTo(index + 1)}
          />
        </div>
      </Shell>

      <ul
        ref={trackRef}
        className="snap-gutter mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth gutter-x pb-6 motion-reduce:scroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {FEATURE_CARDS.map((card, cardIndex) => (
          <li
            key={card.id}
            aria-label={`${cardIndex + 1} מתוך ${FEATURE_CARDS.length}`}
            className="w-[min(88vw,620px)] shrink-0 snap-start lg:w-[min(76vw,1280px)]"
          >
            <article
              className={`flex h-full flex-col overflow-hidden rounded-card shadow-card lg:flex-row-reverse ${FIELD[card.tone]}`}
            >
              {/*
                The illustrations carry their own background colour, so butting
                them against the field produced two different blues meeting on a
                straight line — a join that reads as a mistake. Insetting them
                makes the artwork a deliberate tile floating on the field, and
                the same treatment keeps all four cards consistent.
              */}
              <div className="w-full shrink-0 p-[clamp(min(0.75rem,3.75vw),1.6vw,1.25rem)] lg:w-[44%]">
                <div className="relative aspect-[16/10] h-full w-full overflow-hidden rounded-tile lg:aspect-auto lg:min-h-[clamp(280px,26vw,460px)]">
                  <Image
                    src={card.image}
                    alt={card.alt}
                    fill
                    sizes="(max-width: 1024px) 88vw, 40vw"
                    className="object-cover [object-position:var(--focus,50%_50%)] lg:[object-position:var(--focus-lg,var(--focus,50%_50%))]"
                    style={
                      "focus" in card
                        ? ({ "--focus": card.focus.base, "--focus-lg": card.focus.lg } as CSSProperties)
                        : undefined
                    }
                  />
                </div>
              </div>

              <div className="flex flex-1 flex-col p-[clamp(min(1.5rem,7.5vw),3vw,3rem)] lg:ps-[clamp(min(1rem,5vw),2vw,2rem)]">
                <h3 className="text-card-title font-display font-extrabold leading-tight">
                  {card.title}
                </h3>
                <div className={`mt-5 space-y-4 ${SOFT[card.tone]}`}>
                  {card.body.map((paragraph) => (
                    <p key={paragraph} className="max-w-[54ch]">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <Link
                  href={card.href}
                  className={`mt-9 inline-flex min-h-[56px] w-fit items-center gap-2.5 rounded-pill px-7 font-display text-lead font-extrabold transition-[transform,filter] duration-[var(--dur-fast)] ease-out-expo hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0 active:scale-[0.97] forced-colors:border-2 ${ACTION}`}
                >
                  {CARD_ACTION_LABEL}
                  <ArrowIcon className="h-5 w-5" />
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <Shell>
        <div
          className="h-1.5 w-full overflow-hidden rounded-pill bg-ink/10"
          role="presentation"
        >
          <div
            className="h-full w-full origin-right rounded-pill bg-ink transition-transform duration-[var(--dur-slow)] ease-out-expo"
            style={{
              transform: `scaleX(${(index + 1) / FEATURE_CARDS.length})`,
            }}
          />
        </div>
        <div className="mt-12 flex justify-center">
          <Button href={FIT_CHECK.href} size="lg">
            {FIT_CHECK_LABEL}
          </Button>
        </div>
      </Shell>
    </section>
  );
}
