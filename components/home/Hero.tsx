import Image from "next/image";
import Button from "@/components/ui/Button";
import { PlayIcon } from "@/components/ui/icons";

/**
 * First viewport: one full-width rounded card, content centred inside it.
 *
 * The background is the client's own hero image — a 55+ trainee mid-movement
 * with the neural path lit from leg to brain, which is Dual Tasking made
 * visible and the right audience. It is cropped to a wide band at build time
 * rather than left to object-cover, which decapitated her. The brief lists a
 * hero video as "יצורף";
 * when it arrives it replaces the <Image> below with a muted looping <video>
 * using this same file as its poster, and nothing else here changes.
 */
export default function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="on-dark bg-surface pb-[clamp(1.5rem,3vw,2.5rem)] pt-[clamp(1rem,2vw,1.75rem)]"
    >
      {/*
        Not the page shell: the hero card runs almost the full viewport,
        inset only by a small margin so the rounded corners read.
      */}
      <div className="mx-auto w-full px-[clamp(0.625rem,1.4vw,1.5rem)]">
        <div className="relative isolate overflow-hidden rounded-[clamp(20px,2.5vw,36px)] bg-[#08222f]">
          <Image
            src="/img/hero.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover object-[50%_28%]"
          />

          {/*
            Graded across the reading direction rather than flat: the centre
            band where the copy sits is darkest, and the trainee on the right
            and the lit brain on the left stay readable at the edges.
          */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,34,47,0.62)_0%,rgba(8,34,47,0.86)_38%,rgba(8,34,47,0.86)_62%,rgba(8,34,47,0.62)_100%)]"
          />

          {/*
            The card's height is driven by viewport width, which is the right
            instinct in portrait and exactly wrong held sideways: 40vw of a wide
            landscape screen asks for a tall card on the one layout that has no
            height to give, and pushes both actions under the fold. Capping it
            against the height actually left below the header keeps the decided
            primary CTA — השארת פרטים — inside the first viewport. `dvh` rather
            than `vh` so a mobile browser's collapsing toolbar does not leave the
            card taller than the screen it is measured against. See the short-
            viewport rule in globals.css, which tightens the stack to match.
          */}
          <div className="hero-stack flex min-h-[min(clamp(23rem,40vw,40rem),calc(100dvh-4.5rem))] flex-col items-center justify-center px-[clamp(1.25rem,4vw,4rem)] py-[clamp(3.5rem,6vw,5.5rem)] text-center">
            <h1
              id="hero-heading"
              className="max-w-[18ch] text-h1 font-display font-black text-white"
            >
              <span className="block">מערכת לאימון הגוף</span>
              <span className="block text-[#5fd3ff]">ולחדות המחשבה</span>
            </h1>

            <p className="mt-6 max-w-[34ch] text-[clamp(1.2rem,1.05rem+0.8vw,1.625rem)] font-medium leading-snug text-white/90">
              רק 10 דקות ביום כדי להמשיך לעשות את מה שאנחנו אוהבים.
            </p>

            <div className="mt-10 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
              <Button href="#lead" size="lg" className="w-full sm:w-auto">
                השארת פרטים
              </Button>
              <Button
                href="#how-it-works"
                variant="onColor"
                size="lg"
                className="w-full sm:w-auto"
              >
                <PlayIcon className="h-5 w-5" />
                בואו לראות איך זה עובד
              </Button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
