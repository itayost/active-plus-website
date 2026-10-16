import Image from "next/image";
import Button from "@/components/ui/Button";
import { HERO } from "@/content/home";
import { FIT_CHECK } from "@/lib/constants";

/**
 * First viewport, on the light-blue wash: headline and sub, then the client's
 * hero photo under them (full-bleed on a phone), then the one action. From lg,
 * and on a phone held sideways, the stack becomes two columns with the text
 * and action at the start and the rounded photo at the end (the `.hero-grid`
 * rules in globals.css).
 *
 * The photo is the LCP element. `priority` alone (Next 15) preloads it at the
 * browser's default Low image priority, where it queued behind the fonts and
 * partner logos on slow connections, so `fetchPriority="high"` goes on both
 * the preload and the <img>. It replaced a looping video (client request,
 * 2026-10-16): no video is mounted or downloaded any more.
 */
export default function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="rounded-b-hero bg-hero-wash pt-[22px] lg:pb-12 lg:pt-10"
    >
      <div className="hero-grid mx-auto w-full max-w-shell">
        {/* gutter-x keeps the copy clear of a landscape notch; the photo may run under it. */}
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

        <div className="hero-media relative mt-[18px] aspect-[1370/1148] w-full overflow-hidden bg-blue-wash">
          <Image
            src={HERO.image.src}
            alt={HERO.image.alt}
            fill
            priority
            fetchPriority="high"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
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
