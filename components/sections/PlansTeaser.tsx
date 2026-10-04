import Image from "next/image";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import { ArrowIcon } from "@/components/ui/icons";
import { PLANS } from "@/lib/constants";
import { annualSavings, formatShekel } from "@/lib/pricing";

/**
 * Two photo cards that point at /payment, which owns the details (what is
 * included, installments, store links). The figures sit under the picture.
 */
export default function PlansTeaser() {
  return (
    <section aria-labelledby="plans-heading" className="bg-surface py-[var(--section-y)]">
      <Shell>
        <Reveal>
          <h2 id="plans-heading" className="text-h2 font-display font-black">
            המסלול שמתאים בדיוק בשבילך
          </h2>
          <p className="mt-5 max-w-measure text-lead text-ink-soft">
            הכנו בעבורכם 2 מסלולים כדי שאתם תוכלו להחליט מה מתאים לכם.
          </p>
        </Reveal>

        <ul className="mt-12 grid items-stretch gap-6 lg:grid-cols-2">
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
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[linear-gradient(0deg,rgb(var(--hero-field-rgb)_/_0.78)_0%,rgb(var(--hero-field-rgb)_/_0.18)_46%,rgb(var(--hero-field-rgb)_/_0)_72%)]"
                  />
                  <h3 className="absolute bottom-5 start-6 font-display text-[clamp(1.75rem,1.3rem+1.8vw,2.75rem)] font-black text-white">
                    {plan.name}
                  </h3>
                  {plan.featured ? (
                    <p className="absolute top-5 start-6 rounded-pill bg-ink/85 px-4 py-2 font-display text-lead font-bold text-yellow">
                      {`חיסכון של ${formatShekel(annualSavings())}`}
                    </p>
                  ) : null}
                </div>

                <div className="mt-auto flex flex-1 flex-col justify-between gap-6 bg-surface p-[clamp(min(1.5rem,7.5vw),3vw,2.25rem)]">
                  <div>
                    <p className="font-display text-[clamp(2rem,1.6rem+1.6vw,3rem)] font-black leading-none tracking-tight text-ink">
                      {formatShekel(plan.price)}{" "}
                      <small className="text-lead font-bold text-ink-soft">{plan.priceSuffix}</small>
                    </p>
                    <p className="mt-2 text-lead text-ink-soft">{plan.terms}</p>
                  </div>

                  <Button
                    href={`/payment?plan=${plan.id}`}
                    variant={plan.featured ? "primary" : "outline"}
                    size="lg"
                    className="w-full"
                  >
                    {plan.id === "annual" ? "לבחירת המנוי השנתי" : "לבחירת המנוי החודשי"}
                    <ArrowIcon className="h-5 w-5" />
                  </Button>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </Shell>
    </section>
  );
}
