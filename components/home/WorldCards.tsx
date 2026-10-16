import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import { WORLD } from "@/content/home";

/** "עולם שלם בחיבור אחד": a stack of four on a phone, one row of four from lg. */
export default function WorldCards() {
  return (
    <section
      aria-labelledby="world-heading"
      className="mx-auto w-full max-w-shell gutter-x pb-3 pt-12 lg:pt-16"
    >
      <SectionHeading id="world-heading" title={WORLD.heading} />
      <ul role="list" className="mt-4 flex flex-col gap-3 lg:mt-8 lg:grid lg:grid-cols-4 lg:gap-5">
        {WORLD.cards.map((card) => (
          <li key={card.title}>
            <Card className="h-full rounded-tile p-[18px] lg:p-6">
              <h3 className="text-[19px] font-bold leading-snug text-blue lg:text-xl">{card.title}</h3>
              <p className="mt-1.5 text-lg leading-normal text-ink">{card.body}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
