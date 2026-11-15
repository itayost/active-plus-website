import { useId } from "react";

/*
  The pain marks on the body figure, drawn as the muscle around each joint
  (owner, 2026-11-15: "סימנים עם צורות של שרירים בכל צד", like an anatomy
  chart, not blobs). Each shape is drawn for the figure's right side (the
  image's right) and mirrored for the left. Width is a share of the figure's
  width; the height follows the drawing.
*/

export type MuscleArea = "neck" | "shoulders_neck" | "elbows" | "lower_back" | "hips" | "knees" | "ankle";

type Shape = {
  viewBox: readonly [number, number];
  /** Share of the figure's width. */
  width: number;
  /** Muscle bellies. */
  bellies: readonly string[];
  /** Fibre lines across the bellies. */
  fibres: readonly string[];
  /** Bone or tendon caps (kneecap), drawn pale over the muscle. */
  caps?: readonly string[];
};

const SHAPES: Record<MuscleArea, Shape> = {
  // Sternocleidomastoid pair, a V down to the collarbones.
  neck: {
    viewBox: [100, 100],
    width: 0.2,
    bellies: [
      "M24 6 C32 30 41 60 47 92 C45 96 41 96 39 93 C30 62 20 34 14 10 C16 5 21 4 24 6 Z",
      "M76 6 C68 30 59 60 53 92 C55 96 59 96 61 93 C70 62 80 34 86 10 C84 5 79 4 76 6 Z",
    ],
    fibres: ["M20 14 C28 40 36 66 42 90", "M80 14 C72 40 64 66 58 90"],
  },
  // Deltoid cap over the shoulder joint.
  shoulders_neck: {
    viewBox: [100, 100],
    width: 0.26,
    bellies: ["M18 16 C42 4 78 8 91 36 C98 54 89 79 71 95 C63 71 49 53 31 45 C17 39 10 26 18 16 Z"],
    fibres: ["M30 20 C54 28 69 53 72 84", "M46 13 C68 25 80 48 82 72", "M22 30 C42 38 56 58 63 88"],
  },
  // Forearm extensors just below the elbow.
  elbows: {
    viewBox: [100, 140],
    width: 0.17,
    bellies: ["M50 6 C72 20 77 60 67 100 C61 124 39 124 33 100 C23 60 28 20 50 6 Z"],
    fibres: ["M44 16 C38 50 38 84 44 112", "M56 16 C62 50 62 84 56 112", "M50 10 C50 50 50 90 50 118"],
  },
  // The two lumbar muscles either side of the spine.
  lower_back: {
    viewBox: [200, 100],
    width: 0.42,
    bellies: [
      "M30 14 C58 4 88 9 95 20 L95 86 C70 95 44 92 29 84 C19 60 19 35 30 14 Z",
      "M170 14 C142 4 112 9 105 20 L105 86 C130 95 156 92 171 84 C181 60 181 35 170 14 Z",
    ],
    fibres: [
      "M28 32 C50 28 74 30 93 36",
      "M25 52 C48 50 72 52 93 56",
      "M28 72 C50 72 72 74 93 76",
      "M172 32 C150 28 126 30 107 36",
      "M175 52 C152 50 128 52 107 56",
      "M172 72 C150 72 128 74 107 76",
    ],
  },
  // Gluteus medius fan over the hip joint.
  hips: {
    viewBox: [100, 100],
    width: 0.22,
    bellies: ["M14 42 C24 12 70 4 89 30 C97 46 89 71 70 89 C55 72 35 62 14 42 Z"],
    fibres: ["M22 40 C42 30 62 26 84 30", "M30 52 C48 44 66 42 88 46", "M44 64 C58 58 72 58 84 62"],
  },
  // Quadriceps tendon over the kneecap.
  knees: {
    viewBox: [100, 130],
    width: 0.19,
    bellies: ["M28 4 C44 -1 56 -1 72 4 C70 30 66 52 62 70 C58 82 42 82 38 70 C34 52 30 30 28 4 Z"],
    fibres: ["M38 8 C40 30 42 50 44 70", "M50 4 C50 28 50 52 50 74", "M62 8 C60 30 58 50 56 70"],
    caps: ["M50 72 C62 72 70 84 70 96 C70 110 60 120 50 120 C40 120 30 110 30 96 C30 84 38 72 50 72 Z"],
  },
  // Achilles tendon and the calf's lowest part above the ankle.
  ankle: {
    viewBox: [60, 120],
    width: 0.12,
    bellies: ["M20 4 C34 -1 42 4 41 12 C43 50 45 84 39 110 C33 118 25 116 23 106 C18 78 16 40 20 4 Z"],
    fibres: ["M28 8 C28 44 29 78 31 108", "M35 10 C36 44 36 78 34 104"],
  },
};

export default function MuscleMark({ area, mirror }: { area: MuscleArea; mirror: boolean }) {
  const shape = SHAPES[area];
  const [w, h] = shape.viewBox;
  const id = `muscle-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{ transform: mirror ? "scaleX(-1)" : undefined, overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#E2483A" />
          <stop offset="0.55" stopColor="#C8202F" />
          <stop offset="1" stopColor="#9E1424" />
        </linearGradient>
      </defs>
      {shape.bellies.map((d) => (
        <path key={d} d={d} fill={`url(#${id}-fill)`} stroke="#7E0E1C" strokeWidth={1.4} strokeLinejoin="round" opacity={0.92} />
      ))}
      {shape.fibres.map((d) => (
        <path key={d} d={d} fill="none" stroke="#FFFFFF" strokeOpacity={0.38} strokeWidth={1.3} strokeLinecap="round" />
      ))}
      {shape.caps?.map((d) => (
        <path key={d} d={d} fill="#F4D7CF" stroke="#9E1424" strokeWidth={1.4} opacity={0.95} />
      ))}
    </svg>
  );
}

/** Share of the figure's width and height-to-width ratio, for placing a mark. */
export function muscleBox(area: MuscleArea): { width: number; ratio: number } {
  const shape = SHAPES[area];
  return { width: shape.width, ratio: shape.viewBox[1] / shape.viewBox[0] };
}
