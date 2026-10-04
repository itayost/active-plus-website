import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { ArcStage, type Ring } from "@/components/ui/ArcStage";

/**
 * The client's own line, given its own section under the hero, with trainees
 * travelling two rising arcs behind it.
 *
 * The portraits are decorative and identify no one, so the whole stage is
 * aria-hidden and they carry no alt text. Replacing the files in
 * public/img/people is the entire swap.
 */
const PEOPLE = [
  "/img/people/5.webp",
  "/img/people/1.webp",
  "/img/people/4.webp",
  "/img/people/6.webp",
  "/img/people/2.webp",
  "/img/people/7.webp",
  "/img/people/3.webp",
] as const;

const LINE = "אלפי לקוחות בוחרים בכל יום להשקיע בעצמם ולשפר את איכות החיים";

function Portrait({ src, size }: { src: string; size: number }) {
  return (
    <span
      className="relative block overflow-hidden rounded-full bg-sunken shadow-lift-1 ring-1 ring-ink/5"
      style={{ width: size, height: size }}
    >
      <Image src={src} alt="" fill sizes="96px" className="object-cover" />
    </span>
  );
}

/** Base angles are half a gap apart so the two rings never line up. */
const RINGS: Ring[] = [
  {
    size: "clamp(525px, 56vw, 820px)",
    duration: 74,
    items: [
      { key: "i0", angle: -58, node: <Portrait src={PEOPLE[1]} size={66} /> },
      { key: "i1", angle: 4, node: <Portrait src={PEOPLE[3]} size={74} /> },
      { key: "i2", angle: 62, node: <Portrait src={PEOPLE[5]} size={62} /> },
    ],
  },
  {
    size: "clamp(640px, 68vw, 1000px)",
    duration: 96,
    reverse: true,
    items: [
      { key: "o0", angle: -72, node: <Portrait src={PEOPLE[0]} size={78} /> },
      { key: "o1", angle: -24, node: <Portrait src={PEOPLE[2]} size={90} /> },
      { key: "o2", angle: 24, node: <Portrait src={PEOPLE[4]} size={84} /> },
      { key: "o3", angle: 72, node: <Portrait src={PEOPLE[6]} size={72} /> },
    ],
  },
];

export default function ChoosingDaily() {
  return (
    <section
      aria-labelledby="choosing-heading"
      className="bg-surface pb-[clamp(2.5rem,5vw,4.5rem)] pt-[clamp(1rem,2vw,2rem)]"
    >
      <div className="hidden md:block">
        <ArcStage
          rings={RINGS}
          height="clamp(300px, 32vw, 470px)"
          drop="clamp(85px, 9vw, 135px)"
        />
      </div>

      {/* Phones: a ring this size has nowhere to turn, so the same idea reads
          as one overlapping row above the line. */}
      <Reveal className="gutter-x pb-2 md:hidden">
        <ul className="flex justify-center" aria-hidden="true">
          {PEOPLE.map((src, index) => (
            <li
              key={src}
              className="relative h-[56px] w-[56px] shrink-0 overflow-hidden rounded-full bg-sunken ring-[3px] ring-surface"
              style={{ marginInlineStart: index === 0 ? 0 : "-14px" }}
            >
              <Image src={src} alt="" fill sizes="56px" className="object-cover" />
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal>
        <p
          id="choosing-heading"
          className="mx-auto mt-6 max-w-[24ch] gutter-x text-center font-display text-[clamp(1.375rem,1rem+1.6vw,2.25rem)] font-bold leading-snug text-ink md:mt-8"
        >
          {LINE}
        </p>
      </Reveal>
    </section>
  );
}
