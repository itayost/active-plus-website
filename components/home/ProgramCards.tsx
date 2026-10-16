import Image from "next/image";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import SwipeRow from "@/components/ui/SwipeRow";
import { PROGRAM_HEADING } from "@/content/home";
import { PROGRAM_CARDS } from "@/lib/constants";

/** "מעטפת מקצועית": three explainer cards, a swipe row on a phone and a grid from lg. */
export default function ProgramCards() {
  return (
    <section aria-labelledby="program-heading" className="pt-12 lg:pt-16">
      <div className="mx-auto w-full max-w-shell gutter-x">
        <SectionHeading id="program-heading" title={PROGRAM_HEADING} swipeHint />
      </div>
      <div className="mx-auto mt-3 w-full max-w-shell lg:mt-6">
        <SwipeRow label={PROGRAM_HEADING} desktop="grid-3" itemWidth="card">
          {PROGRAM_CARDS.map((card) => (
            <Card key={card.id} as="article" className="flex h-full flex-col overflow-hidden">
              <div className="relative aspect-[284/160] w-full bg-blue-wash">
                <Image
                  src={card.image}
                  alt={card.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, 284px"
                  className="object-cover"
                  style={{ objectPosition: card.focus }}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-[18px] lg:p-6">
                <h3 className="text-xl font-bold leading-tight text-ink">{card.title}</h3>
                <p className="flex-1 text-lg leading-normal text-ink">{card.body}</p>
                <Button href={card.href} size="md" className="self-start">
                  {card.cta}
                </Button>
              </div>
            </Card>
          ))}
        </SwipeRow>
      </div>
    </section>
  );
}
