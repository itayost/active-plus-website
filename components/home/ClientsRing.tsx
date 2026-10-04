import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";

const LINE = "אלפי לקוחות מידי יום בוחרים להשקיע בעצמם ולשפר את איכות החיים";

/**
 * The client's own ring of portraits, with their line set in its open centre.
 * The edges fade so the artwork's own background never meets the page in a
 * hard rectangle. Below sm the centre is too small for the line, so it drops
 * under the picture.
 */
export default function ClientsRing() {
  return (
    <section
      aria-labelledby="clients-heading"
      className="bg-surface pb-[clamp(2rem,4vw,3.5rem)] pt-[clamp(1.5rem,3vw,3rem)]"
    >
      <Shell>
        <Reveal className="relative mx-auto max-w-[1040px]">
          <Image
            src="/img/v2/clients-arc.webp"
            alt=""
            width={1447}
            height={1087}
            sizes="(max-width: 1100px) 92vw, 1040px"
            className="h-auto w-full [-webkit-mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_80%,transparent_100%)] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_80%,transparent_100%)]"
          />
          <p
            id="clients-heading"
            className="mt-4 text-center font-display text-[clamp(1.25rem,0.8rem+1.7vw,2.5rem)] font-bold leading-snug text-ink [text-wrap:balance] sm:absolute sm:inset-0 sm:m-auto sm:h-fit sm:w-[min(52%,30ch)]"
          >
            {LINE}
          </p>
        </Reveal>
      </Shell>
    </section>
  );
}
