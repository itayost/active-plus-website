"use client";

import { Children, isValidElement, useState, type PointerEvent, type ReactNode } from "react";

type Props = {
  /** Accessible name of the strip (the enclosing section carries the landmark). */
  label: string;
  /** Item width class, the same tile sizes as SwipeRow's. */
  itemClassName: string;
  children: ReactNode;
};

/* Three sets cover the widest strip (the 1520px shell) plus the one set the
   loop slides by. */
const COPIES = 3;

/**
 * A strip that moves on its own, in a seamless loop: each set slides by its
 * own width (globals.css, .marquee), so when one cycle ends the next set is
 * exactly where the first began. Only the first set is announced and
 * reachable; the repeats are aria-hidden and inert.
 *
 * It stops while a mouse is over it, while it has keyboard focus (one Tab
 * stop, so keyboard users can stop it), and after a tap until the next tap.
 * Under reduced motion it is not shown at all: the caller renders a still
 * row in its place.
 */
export default function Marquee({ label, itemClassName, children }: Props) {
  const [paused, setPaused] = useState(false);

  // A mouse pauses by hovering; a tap has no hover, so it toggles instead.
  const togglePaused = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") setPaused((p) => !p);
  };

  const items = Children.toArray(children).map((child, i) => (
    <li key={isValidElement(child) && child.key !== null ? child.key : i} className={`shrink-0 ${itemClassName}`}>
      {child}
    </li>
  ));

  return (
    <div
      role="group"
      aria-label={label}
      tabIndex={0}
      data-paused={paused || undefined}
      onPointerUp={togglePaused}
      className="marquee flex overflow-hidden gutter-x focus-visible:outline-offset-[-3px]"
    >
      {Array.from({ length: COPIES }, (_, i) => (
        <ul
          key={i}
          role="list"
          aria-hidden={i > 0 || undefined}
          inert={i > 0}
          className="marquee-set flex shrink-0 gap-3.5 pb-10 pe-3.5 pt-5"
        >
          {items}
        </ul>
      ))}
    </div>
  );
}
