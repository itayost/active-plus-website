import Image from "next/image";

/**
 * A band, not a section: one slim strip of partner marks that scrolls on its
 * own. Ported from the Improvement Center site, which already carries these
 * logos.
 *
 * The list is rendered twice and the track travels exactly half its width, so
 * the second copy lands where the first began and the loop has no seam. The
 * duplicate is aria-hidden, so the names are announced once rather than
 * fourteen times.
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

function Logo({ src, name, hidden }: { src: string; name: string; hidden?: boolean }) {
  return (
    <li
      className="flex h-[clamp(72px,8vw,104px)] w-[clamp(140px,15vw,210px)] shrink-0 items-center justify-center"
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
        loading="eager"
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
        עובדים איתנו
      </h2>

      {/* The mask keeps logos from appearing and vanishing at hard edges. */}
      <div
        className="mt-7 overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, var(--ink) 6%, var(--ink) 94%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, var(--ink) 6%, var(--ink) 94%, transparent)",
        }}
      >
        <ul
          dir="ltr"
          className="flex w-max animate-marquee items-center gap-[clamp(2rem,4vw,4rem)] motion-reduce:animate-none"
        >
          {PARTNERS.map((partner) => (
            <Logo key={partner.src} {...partner} />
          ))}
          {PARTNERS.map((partner) => (
            <Logo key={`${partner.src}-loop`} {...partner} hidden />
          ))}
        </ul>
      </div>
    </section>
  );
}
