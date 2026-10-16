"use client";

import { Children, isValidElement, type ReactNode } from "react";
import CarouselArrows from "@/components/ui/CarouselArrows";
import { useSnapCarousel } from "@/components/ui/useSnapCarousel";

type Props = {
  /** Accessible name of the region. */
  label: string;
  /** What the row becomes at lg+: a plain grid, or the same track with arrows. */
  desktop: "grid-3" | "grid-4" | "carousel";
  itemWidth: "card" | "video" | "logo";
  /** Makes every list item a Tab stop (for cards with no link or button inside). */
  focusableItems?: boolean;
  children: ReactNode;
};

const ITEM_WIDTH = {
  card: "w-[284px]",
  video: "w-[190px]",
  logo: "w-[138px]",
} as const;

// A grid drops every carousel-only behaviour at lg+.
const GRID = "lg:grid lg:gap-5 lg:snap-none lg:overflow-visible lg:scroll-auto lg:py-0";

const DESKTOP_TRACK = {
  "grid-3": GRID + " lg:grid-cols-3",
  "grid-4": GRID + " lg:grid-cols-4",
  carousel: "",
} as const;

/**
 * Horizontal scroll-snap row on phones, a grid or an arrowed carousel on
 * desktop. Each child becomes a list item; keyboard users reach the links or
 * buttons inside them with Tab and the browser scrolls the focused one into
 * view. Cards with nothing interactive inside pass `focusableItems` so each
 * item itself is a Tab stop. Smooth scrolling is dropped under reduced motion (CSS here, the hook
 * for the arrows).
 */
export default function SwipeRow({ label, desktop, itemWidth, focusableItems = false, children }: Props) {
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
        role="list"
        ref={trackRef}
        className={`snap-gutter flex snap-x snap-mandatory gap-3.5 overflow-x-auto scroll-smooth gutter-x pb-10 pt-2 motion-reduce:scroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${DESKTOP_TRACK[desktop]}`}
      >
        {items.map((child, i) => (
          <li
            key={isValidElement(child) && child.key !== null ? child.key : i}
            tabIndex={focusableItems ? 0 : undefined}
            className={`${focusableItems ? "rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue " : ""}shrink-0 snap-start ${ITEM_WIDTH[itemWidth]} ${isGrid ? "lg:w-auto" : ""}`}
          >
            {child}
          </li>
        ))}
      </ul>
    </div>
  );
}
