import Image from "next/image";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import { ArrowIcon } from "@/components/ui/icons";

/**
 * The screens are absolutely placed inside a fixed-ratio box so the cluster
 * can never grow past its column — rotated, negatively-margined siblings in a
 * flex row were spilling the whole document sideways on phones.
 *
 * The box ratio is derived, not eyeballed: the screens are 560x1010, and the
 * tallest child is 50% wide at a 10% top offset, so the box must be at least
 * as tall as it is wide or the cluster overflows downward into the next
 * section. 1/1.06 leaves a little headroom for the rotations.
 */
const SCREENS = [
  {
    src: "/img/app-exercises.webp",
    alt: "מסך התרגילים, עם ספריית התרגולים המותאמים",
    style: "w-[44%] end-0 top-[6%] rotate-[7deg] z-0",
  },
  {
    src: "/img/app-progress.webp",
    alt: "מסך ההתקדמות, המציג את השיפור בתנועה ובחשיבה לאורך זמן",
    style: "w-[46%] left-1/2 -translate-x-1/2 top-0 -rotate-[4deg] z-10",
  },
  {
    src: "/img/app-workout.webp",
    alt: "מסך האימון היומי, עם רצף יומי ותרגול מוכן להתחלה",
    style: "w-[50%] start-0 top-[10%] rotate-[3deg] z-20",
  },
];

export default function Intro() {
  return (
    <section id="how-it-works" className="bg-surface py-[var(--section-y)]">
      <Shell>
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1">
            <div className="relative mx-auto aspect-[1/1.06] w-full max-w-[520px]">
              {SCREENS.map((screen) => (
                <Image
                  key={screen.src}
                  src={screen.src}
                  alt={screen.alt}
                  width={560}
                  height={1010}
                  sizes="(max-width: 1024px) 45vw, 24vw"
                  className={`absolute rounded-[22px] shadow-lift-2 ring-1 ring-ink/5 ${screen.style}`}
                />
              ))}
            </div>
          </Reveal>

          <Reveal className="order-1 lg:order-2" delayIndex={1}>
            <h2 className="text-h2 font-display font-black">
              תוכנית אימון שמאמנת את הגוף ואת המוח{" "}
              <span className="text-blue-deep">בו־זמנית</span>
            </h2>
            <p className="mt-6 max-w-measure text-lead text-ink-soft">
              לא רק להתחזק, ולא רק לחשוב — אלא ללמוד לנוע, לחשוב ולהגיב יחד,
              כדי לשפר את היכולת להתמודד עם משימות ואתגרים בחיי היומיום
              בגילאי <span dir="ltr">55+</span>.
            </p>
            <Button href="/dual-tasking" variant="outline" size="lg" className="mt-9">
              לפרטים נוספים
              <ArrowIcon className="h-5 w-5" />
            </Button>
          </Reveal>
        </div>
      </Shell>
    </section>
  );
}
