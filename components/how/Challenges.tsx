import type { HOW, HowTone } from "@/content/how-it-works";

type Item = (typeof HOW.challenges.items)[number];

const FIELD: Record<HowTone, { card: string; body: string }> = {
  blue: { card: "bg-blue text-white", body: "text-white/90" },
  green: { card: "bg-green text-white", body: "text-white/95" },
  purple: { card: "bg-purple-wash text-purple-deep", body: "text-purple-deep" },
};

/** Three colour-field cards, one per challenge. */
export default function Challenges({ items }: { items: Item[] }) {
  return (
    <ul className="mt-[clamp(2.5rem,5vw,3.5rem)] grid gap-5 md:grid-cols-3">
      {items.map((c) => (
        <li
          key={c.title}
          className={`flex min-h-[clamp(220px,22vw,300px)] flex-col justify-end gap-3 rounded-card p-[clamp(1.75rem,3vw,2.5rem)] shadow-lift-2 ${FIELD[c.tone].card}`}
        >
          <h3 className="font-display text-[clamp(1.625rem,1.3rem+1.1vw,2.25rem)] font-black leading-[1.1]">
            {c.title}
          </h3>
          <p className={`max-w-[32ch] text-base ${FIELD[c.tone].body}`}>{c.body}</p>
        </li>
      ))}
    </ul>
  );
}
