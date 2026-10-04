import Image from "next/image";

/**
 * A band, not a section: one slim strip of partner marks that scrolls on its
 * own. Ported from the Improvement Center site, which already carries these
 * logos.
 *
 * The list is rendered three times and the track travels exactly one copy's
 * width, so the second copy lands where the first began and the loop has no
 * seam. Three rather than two so that what is left of the track after one
 * copy has slid away (two copies, about 3,800px) still covers the widest
 * screens. The copies are aria-hidden, so the names are announced once.
 *
 * The clipping strip is LTR, not only the track. In an RTL parent an
 * over-wide LTR track is anchored flush right, so sliding it left emptied the
 * strip from the right: the band was blank for half of every loop on desktop
 * and for most of it on phones.
 *
 * Under reduced motion there is no strip at all: the seven marks sit wrapped
 * and centred, in reading order, all of them visible at once.
 */
const PARTNERS = [
  { src: "/img/partners/histadrut.webp", name: "ההסתדרות" },
  { src: "/img/partners/meuhedet.webp", name: "מאוחדת" },
  { src: "/img/partners/efshari-bari.webp", name: "אפשרי בריא" },
  { src: "/img/partners/nofei-hasharon.webp", name: "נופי השרון" },
  { src: "/img/partners/lev-rehovot.webp", name: "לב רחובות" },
  { src: "/img/partners/kiryat-bialik.webp", name: "עיריית קרית ביאליק" },
  { src: "/img/partners/tirat-carmel.webp", name: "עיריית טירת הכרמל" },
];

const COPIES = 3;

function Logo({
  src,
  name,
  hidden,
  className = "",
}: {
  src: string;
  name: string;
  hidden?: boolean;
  className?: string;
}) {
  return (
    <li
      className={`flex h-[clamp(72px,8vw,104px)] w-[clamp(140px,15vw,210px)] shrink-0 items-center justify-center ${className}`}
      aria-hidden={hidden || undefined}
    >
      <Image
        src={src}
        alt={hidden ? "" : name}
        width={180}
        height={88}
        // Eager on purpose: the marquee parks most of the track outside the
        // visible strip, so the lazy observer never fires for the logos that
        // start there and they render as permanent holes. All seven are 84KB
        // together, which is less than one of the app screenshots.
        //
        // Low fetch priority on purpose too: React 19 server-renders a
        // <link rel="preload"> for every non-lazy <img> unless it is marked
        // low, which put all seven logos in the <head> next to the hero
        // poster and the fonts, competing with them on slow connections. The
        // band sits several screens down; eager plus low still fetches the
        // logos during the load, just after what the first screen needs.
        loading="eager"
        fetchPriority="low"
        className="h-full w-full object-contain opacity-80 [filter:grayscale(45%)]"
      />
    </li>
  );
}

export default function PartnersBand() {
  return (
    <section aria-labelledby="partners-label" className="border-y border-hairline bg-surface py-[clamp(2rem,4vw,3.5rem)]">
      <h2
        id="partners-label"
        className="text-center font-display text-lead font-bold text-ink-soft"
      >
        שיתופי פעולה
      </h2>

      {/*
        The mask keeps logos from appearing and vanishing at hard edges. The
        trailing padding equals the gap, so every copy is exactly one logo plus
        one gap per partner and a shift of one third lands on the seam.
        Reduced motion: the copies hide, the track unwinds into a wrapped,
        centred row in reading order, and the mask comes off.
      */}
      <div dir="ltr" className="partners-strip mt-7 overflow-hidden">
        <ul className="flex w-max animate-marquee items-center gap-[clamp(2rem,4vw,4rem)] pe-[clamp(2rem,4vw,4rem)] motion-reduce:mx-auto motion-reduce:w-full motion-reduce:max-w-shell motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-4 motion-reduce:px-[var(--gutter)] motion-reduce:[direction:rtl]">
          {Array.from({ length: COPIES }, (_, copy) =>
            PARTNERS.map((partner) => (
              <Logo
                key={`${partner.src}-${copy}`}
                {...partner}
                hidden={copy > 0}
                className={copy > 0 ? "motion-reduce:hidden" : ""}
              />
            )),
          )}
        </ul>
      </div>
    </section>
  );
}
