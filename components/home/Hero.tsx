import Image from "next/image";
import Button from "@/components/ui/Button";
import HeroVideo from "@/components/home/HeroVideo";
import { HERO } from "@/content/home";
import { FIT_CHECK } from "@/lib/constants";

/**
 * First viewport, on the light-blue wash: headline and sub, then the client's
 * hero video as a picture under them (full-bleed on a phone), then the one
 * action. From lg, and on a phone held sideways, the stack becomes two columns
 * with the text and action at the start and a rounded video at the end (the
 * `.hero-grid` rules in globals.css).
 *
 * The video is muted and looping. The poster image under it is the LCP element
 * and is all that reduced-motion and save-data visitors get: HeroVideo mounts
 * the video on the client, after load, only when it will be seen.
 *
 * `priority` alone (Next 15) preloads the poster at the browser's default Low
 * image priority, where it queued behind the fonts and partner logos on slow
 * connections. `fetchPriority="high"` goes on both the preload and the <img>.
 */
export default function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="rounded-b-[32px] bg-hero-wash pt-[22px] lg:pb-12 lg:pt-10"
    >
      <div className="hero-grid mx-auto w-full max-w-shell">
        {/* gutter-x keeps the copy clear of a landscape notch; the video may run under it. */}
        <div className="hero-text gutter-x flex flex-col gap-2.5">
          <h1
            id="hero-heading"
            className="text-[2.3125rem] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink lg:text-[clamp(2.75rem,4vw,4.5rem)]"
          >
            {HERO.titleLead}
            <br />
            <span className="block text-balance text-blue">{HERO.titleAccent}</span>
          </h1>
          <p className="text-lg leading-[1.45] text-ink lg:text-lead">{HERO.sub}</p>
        </div>

        <div className="hero-media relative mt-[18px] aspect-[832/464] w-full overflow-hidden bg-blue-wash">
          <Image
            src="/img/v2/hero-poster.webp"
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
          <HeroVideo src="/video/hero.mp4" />
        </div>

        <div className="hero-cta gutter-x py-5">
          <Button href={FIT_CHECK.href} variant="primary" size="lg" className="w-full lg:w-auto">
            {HERO.cta}
          </Button>
        </div>
      </div>
    </section>
  );
}
