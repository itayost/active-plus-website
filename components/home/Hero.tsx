import Image from "next/image";
import DarkHeroCard from "@/components/ui/DarkHeroCard";
import Button from "@/components/ui/Button";
import HeroVideo from "@/components/home/HeroVideo";
import { PlayIcon } from "@/components/ui/icons";

/**
 * First viewport: one full-width rounded card, content centred inside it.
 *
 * The background is the client's hero video, muted and looping. The poster
 * image sits underneath as the LCP element and is all that reduced-motion and
 * save-data visitors get: HeroVideo mounts the video on the client, after the
 * page has loaded, only when motion is allowed, data saving is off and the
 * connection is not known to be slow. One action only: the walkthrough.
 *
 * `priority` alone (Next 15) preloads the poster at the browser's default Low
 * image priority, where it queued behind the fonts and partner logos on slow
 * connections. `fetchPriority="high"` goes on both the preload and the <img>.
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
      className="hero-stack flex min-h-[min(clamp(23rem,40vw,40rem),calc(100dvh-4.5rem))] flex-col items-center justify-center px-[clamp(min(1.25rem,6.25vw),4vw,4rem)] py-[clamp(3.5rem,6vw,5.5rem)] text-center"
      background={
        <>
          <Image
            src="/img/v2/hero-poster.webp"
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="-z-30 object-cover"
          />
          <HeroVideo src="/video/hero.mp4" />

          {/*
            Graded across the reading direction rather than flat: the centre
            band where the copy sits is darkest, and the trainee on the right
            and the lit brain on the left stay readable at the edges.
          */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(var(--hero-field-rgb)_/_0.62)_0%,rgb(var(--hero-field-rgb)_/_0.86)_38%,rgb(var(--hero-field-rgb)_/_0.86)_62%,rgb(var(--hero-field-rgb)_/_0.62)_100%)]"
          />
        </>
      }
    >
      <h1
        id="hero-heading"
        className="max-w-[18ch] text-h1 font-display font-black text-white"
      >
        <span className="block">תוכנית אישית לאימון הגוף</span>
        <span className="block text-emphasis">וחדות המחשבה</span>
      </h1>

      <p className="mt-6 max-w-[34ch] text-lead font-medium leading-snug text-white/90">
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
