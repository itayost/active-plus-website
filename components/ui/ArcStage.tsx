import type { ReactNode } from "react";

/**
 * Rings anchored to the bottom edge, so only their upper arcs are on screen —
 * arcs rising out of the page rather than closed circles. Children travel the
 * full ring; the lower half is simply clipped.
 *
 * Adapted from the 21st.dev "orbiting circles" mechanism. Two ideas are worth
 * keeping and both are load-bearing here:
 *
 * 1. Each child is a half-height strip pivoting at the ring centre, so a plain
 *    rotation walks it along the curve. No translate, nothing to get wrong in
 *    RTL, and the radius is exact by construction.
 * 2. Every child is rendered twice, 180° apart. Only one of a pair is ever in
 *    the visible half, so nothing appears doubled — but one arrives as the
 *    other leaves, which is what makes a procession possible at all with a
 *    small cast. Without it a seven-portrait ring shows two at a time.
 */
export type Ring = {
  /** Diameter, any CSS length. The visible arc is half of it. */
  size: string;
  /** Seconds for one revolution. */
  duration: number;
  reverse?: boolean;
  items: { key: string; angle: number; node: ReactNode }[];
};

export function ArcStage({
  rings,
  height,
  /**
   * How far below the stage floor the ring centres sit. Zero would put them
   * exactly on the edge and give a semicircle — round and steep, with the
   * apex off the top unless the rings are small. Dropping the centres keeps
   * the radius large while flattening the visible arc, which is the shape
   * that spans the page instead of bulging out of it.
   */
  drop = "0px",
  className = "",
}: {
  rings: Ring[];
  height: string;
  drop?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative flex w-full justify-center overflow-hidden ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      {rings.map((ring, ringIndex) => {
        const spin = ring.reverse ? "animate-arc-ccw" : "animate-arc-cw";
        const unspin = ring.reverse ? "animate-arc-ccw-cancel" : "animate-arc-cw-cancel";
        const timing = {
          animationDuration: `${ring.duration}s`,
        };

        // The mirrored half: same faces, opposite side of the ring.
        const placed = ring.items.flatMap((item) => [
          item,
          { ...item, key: `${item.key}-opposite`, angle: item.angle + 180 },
        ]);

        return (
          <div
            key={ringIndex}
            className="absolute bottom-0 left-1/2 rounded-full border-2 border-hairline"
            style={{
              width: ring.size,
              height: ring.size,
              transform: `translate(-50%, calc(50% + ${drop}))`,
            }}
          >
            {placed.map((item) => (
              <div
                key={item.key}
                className={`absolute left-1/2 top-0 h-1/2 origin-bottom ${spin}`}
                style={{ ...timing, ["--arc-start" as string]: `${item.angle}deg` }}
              >
                <div
                  className={`-translate-x-1/2 -translate-y-1/2 ${unspin}`}
                  style={{ ...timing, ["--arc-start" as string]: `${-item.angle}deg` }}
                >
                  {item.node}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
