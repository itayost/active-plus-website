import Image from "next/image";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import { ArrowIcon, CheckIcon } from "@/components/ui/icons";
import { PLANS, STORE_ANDROID, STORE_IOS } from "@/lib/constants";

const INCLUDED = [
  "אימון יומי קצר שמשלב תנועה וחשיבה",
  "התאמה אישית של רמת הקושי לפי הביצועים",
  "זיהוי תנועה ומשוב מיידי דרך המצלמה",
  "דוח התקדמות בתנועה ובחשיבה",
  "תרגול מהבית, ללא ציוד",
];

/**
 * Two photo cards, not a price table.
 *
 * The brief asks for the plans to read as two pictures of the life the plan
 * buys — a couple walking for the annual, a woman training at home for the
 * monthly — with the annual carrying the weight and one shared action below.
 * A three-column table of figures made the two plans look interchangeable and
 * put the price before the reason. The figures are still here; they sit under
 * the picture instead of being the picture.
 */
export default function Pricing({ heading = "מסלולים ומחירים" }: { heading?: string }) {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="bg-sunken py-[var(--section-y)]"
    >
      <Shell>
        <Reveal>
          <h2 id="pricing-heading" className="text-h2 font-display font-black">
            {heading}
          </h2>
          <p className="mt-5 max-w-measure text-lead text-ink-soft">
            יצרנו שני מסלולים לבחירה. בשניהם מקבלים את אותה תוכנית מלאה.
          </p>
        </Reveal>

        <ul className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {PLANS.map((plan, index) => (
            <Reveal as="li" key={plan.id} delayIndex={index}>
              <article
                className={`group relative flex h-full flex-col overflow-hidden rounded-card shadow-lift-2 ${
                  plan.featured ? "ring-2 ring-blue-deep" : ""
                }`}
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={plan.image}
                    alt={plan.alt}
                    fill
                    sizes="(max-width: 1024px) 92vw, 46vw"
                    className="object-cover transition-transform duration-[var(--dur-slow)] ease-out-expo group-hover:scale-[1.03]"
                  />
                  {/* The label sits on the photo, as a caption on a picture
                      rather than as a table header. */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,34,47,0.78)_0%,rgba(8,34,47,0.18)_46%,rgba(8,34,47,0)_72%)]"
                  />
                  <h3 className="absolute bottom-5 start-6 font-display text-[clamp(1.75rem,1.3rem+1.8vw,2.75rem)] font-black text-white">
                    {plan.name}
                  </h3>
                  {plan.note ? (
                    <p className="absolute top-5 start-6 rounded-pill bg-[#0f2230]/85 px-4 py-2 font-display text-lead font-bold text-yellow backdrop-blur-sm">
                      {plan.note}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col justify-between gap-6 bg-surface p-[clamp(1.5rem,3vw,2.25rem)]">
                  <div>
                    <p className="font-display text-[clamp(2rem,1.6rem+1.6vw,3rem)] font-black leading-none tracking-tight text-ink whitespace-nowrap">
                      {plan.total}
                    </p>
                    <p className="mt-2 text-lead text-ink-soft">{plan.perMonth}</p>
                  </div>

                  <Button
                    href="#lead"
                    variant={plan.featured ? "primary" : "outline"}
                    size="lg"
                    className="w-full"
                  >
                    לבחירת מסלולים
                    <ArrowIcon className="h-5 w-5" />
                  </Button>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>

        {/* What you get is the same either way, so it is stated once, under
            both cards, instead of being a third card competing with them. */}
        <Reveal>
          <div className="mt-10 rounded-card border-2 border-hairline bg-surface p-[clamp(1.5rem,3vw,2.5rem)]">
            <h3 className="font-display text-h3 font-bold">מה כלול בשני המסלולים</h3>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-wash text-green-deep">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  <span className="text-ink-soft">{item}</span>
                </li>
              ))}
            </ul>

            {/* One wrapping row put the prompt and both stores on the same line,
                which holds on a desktop and falls apart on a phone: the label and
                App Store fill line one, Google Play orphans onto line two, and the
                two pills sit at different widths because their labels are different
                lengths. Narrow screens get the prompt on its own line and the two
                stores stacked full width — equal, aligned, and the same treatment
                the hero's actions already use at this width. */}
            <div className="mt-8 border-t border-hairline pt-6 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
              <p className="font-display font-bold">כבר החלטתם?</p>
              <div className="mt-4 flex flex-col gap-3 sm:mt-0 sm:flex-row">
                {[
                  { href: STORE_IOS, label: "App Store" },
                  { href: STORE_ANDROID, label: "Google Play" },
                ].map((store) => (
                  <a
                    key={store.label}
                    href={store.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-pill border-2 border-ink/15 px-5 font-display font-bold transition-colors hover:border-ink/40 sm:w-auto"
                  >
                    {store.label}
                    <span className="sr-only"> (נפתח בחלון חדש)</span>
                    <ArrowIcon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <p className="mt-6 max-w-measure text-ink-faint">
            ההצטרפות והתשלום מתבצעים בתוך האפליקציה, אחרי שאלון קצר שמתאים את
            התוכנית אליכם.
          </p>
        </Reveal>
      </Shell>
    </section>
  );
}
