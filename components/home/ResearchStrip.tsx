import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import { ArrowIcon } from "@/components/ui/icons";

/**
 * The trust anchor. One real finding, attributed, with the researchers named.
 * Nothing here is rounded, embellished or invented.
 */
export default function ResearchStrip() {
  return (
    <section
      aria-labelledby="research-heading"
      className="on-dark bg-[#0f2230] py-[var(--section-y)] text-white"
    >
      <Shell>
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <Reveal>
            <h2
              id="research-heading"
              className="text-h2 font-display font-black text-white"
            >
              לא רעיון יפה, ממצא מדוד
            </h2>
            <p className="mt-6 max-w-measure text-lead text-white/75">
              במחקר אקראי מבוקר שפורסם ב־<span className="whitespace-nowrap">The Lancet</span>, בהובלת חוקרים מאיכילוב
              ואוניברסיטת תל אביב, אימון ששילב הליכה עם אתגרים מוטוריים
              וקוגניטיביים נמצא קשור לפחות נפילות בהשוואה לאימון הליכה בלבד.
            </p>
            <p className="mt-5 text-white/60">
              המחקר כלל את פרופ׳ ענת מירלמן ופרופ׳ ג׳פרי האוסדורף, מהחוקרים
              הבולטים בישראל בתחום הקשר שבין תנועה, הליכה וקוגניציה.
            </p>
            <Button href="/research" variant="onColor" size="lg" className="mt-9">
              המחקר והגישה המקצועית
              <ArrowIcon className="h-5 w-5" />
            </Button>
          </Reveal>

          <Reveal delayIndex={1}>
            <figure className="rounded-card border border-white/15 bg-white/5 p-[clamp(2rem,4vw,3.5rem)] text-center">
              <div className="font-display text-[clamp(5rem,4rem+8vw,10rem)] font-black leading-none tracking-tighter text-[#5fd3ff]">
                42%
              </div>
              <figcaption className="mt-4 text-lead text-white/85">
                פחות נפילות באימון שמשלב תנועה עם אתגר קוגניטיבי, לעומת אימון
                הליכה בלבד.
              </figcaption>
              <p className="mt-6 border-t border-white/15 pt-5 text-white/55">
                <span className="whitespace-nowrap">The Lancet</span> · מחקר אקראי מבוקר
              </p>
            </figure>
          </Reveal>
        </div>
      </Shell>
    </section>
  );
}
