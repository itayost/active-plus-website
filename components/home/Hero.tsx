import Image from "next/image";
import DarkHeroCard from "@/components/ui/DarkHeroCard";
import Button from "@/components/ui/Button";
import { PlayIcon } from "@/components/ui/icons";

/**
 * First viewport: one full-width rounded card, content centred inside it.
 *
 * The background is the client's hero video, muted and looping. The poster
 * image sits underneath as the LCP element and as the reduced-motion
 * fallback (the video is hidden there). One action only: the walkthrough.
 */
export default function Hero() {
  /*
    The card's height is driven by viewport width, which is wrong held
    sideways: 40vw of a wide landscape screen pushes the action under the
    fold. Capping it against the height left below the header (`dvh`, so a
    collapsing mobile toolbar does not leave it taller than the screen) keeps
    the action in the first viewport. See the short-viewport rule for
    .hero-stack in globals.css.
  */
  return (
    <DarkHeroCard
      labelledBy="hero-heading"
      className="hero-stack flex min-h-[min(clamp(23rem,40vw,40rem),calc(100dvh-4.5rem))] flex-col items-center justify-center px-[clamp(1.25rem,4vw,4rem)] py-[clamp(3.5rem,6vw,5.5rem)] text-center"
      background={
        <>
          <Image
            src="/img/v2/hero-poster.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-30 object-cover"
          />
          <video
            className="absolute inset-0 -z-20 h-full w-full object-cover motion-reduce:hidden"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/img/v2/hero-poster.webp"
            aria-hidden="true"
          >
            <source src="/video/hero.mp4" type="video/mp4" />
          </video>

          {/*
            Graded across the reading direction rather than flat: the centre
            band where the copy sits is darkest, and the trainee on the right
            and the lit brain on the left stay readable at the edges.
          */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,34,47,0.62)_0%,rgba(8,34,47,0.86)_38%,rgba(8,34,47,0.86)_62%,rgba(8,34,47,0.62)_100%)]"
          />
        </>
      }
    >
          <h1
            id="hero-heading"
            className="max-w-[18ch] text-h1 font-display font-black text-white"
          >
            <span className="block">תוכנית אישית לאימון הגוף</span>
            <span className="block text-[#5fd3ff]">וחדות המחשבה</span>
          </h1>

          <p className="mt-6 max-w-[34ch] text-[clamp(1.2rem,1.05rem+0.8vw,1.625rem)] font-medium leading-snug text-white/90">
            רק 10 דקות ביום כדי להישאר פעילים, חדים ובטוחים יותר.
          </p>

          <div className="mt-10 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
            <Button
              href="/how-it-works"
              variant="onColor"
              size="lg"
              className="w-full sm:w-auto"
            >
              <PlayIcon className="h-5 w-5" />
              בואו לראות איך זה עובד
            </Button>
          </div>
    </DarkHeroCard>
  );
}
