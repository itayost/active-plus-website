"use client";

import { Children, type ReactNode } from "react";
import CarouselArrows from "@/components/ui/CarouselArrows";
import { useSnapCarousel } from "@/components/ui/useSnapCarousel";

type Props = {
  /** Accessible name of the region. */
  label: string;
  /** What the row becomes at lg+: a plain grid, or the same track with arrows. */
  desktop: "grid-3" | "grid-4" | "carousel";
  itemWidth: "card" | "video" | "logo";
  children: ReactNode;
};

const ITEM_WIDTH = {
  card: "w-[284px]",
  video: "w-[190px]",
  logo: "w-[138px]",
} as const;

const DESKTOP_TRACK = {
  "grid-3": "lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible",
  "grid-4": "lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible",
  carousel: "",
} as const;

/**
 * Horizontal scroll-snap row on phones, a grid or an arrowed carousel on
 * desktop. Each child becomes a list item; keyboard users reach the links or
 * buttons inside them with Tab and the browser scrolls the focused one into
 * view. Smooth scrolling is dropped under reduced motion (CSS here, the hook
 * for the arrows).
 */
export default function SwipeRow({ label, desktop, itemWidth, children }: Props) {
  const items = Children.toArray(children);
  const { trackRef, index, canPrev, canNext, goTo } = useSnapCarousel<HTMLUListElement>(
    items.length,
  );
  const isGrid = desktop !== "carousel";

  return (
    <div role="region" aria-label={label}>
      {isGrid ? null : (
        <div className="mb-6 hidden justify-end lg:flex">
          <CarouselArrows
            prevLabel="הקודם"
            nextLabel="הבא"
            canPrev={canPrev}
            canNext={canNext}
            onPrev={() => goTo(index - 1)}
            onNext={() => goTo(index + 1)}
          />
        </div>
      )}
      <ul
        ref={trackRef}
        className={`snap-gutter flex snap-x snap-mandatory gap-3.5 overflow-x-auto scroll-smooth gutter-x pb-6 motion-reduce:scroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${DESKTOP_TRACK[desktop]}`}
      >
        {items.map((child, i) => (
          <li
            key={i}
            className={`shrink-0 snap-start ${ITEM_WIDTH[itemWidth]} ${isGrid ? "lg:w-auto" : ""}`}
          >
            {child}
          </li>
        ))}
      </ul>
    </div>
  );
}
