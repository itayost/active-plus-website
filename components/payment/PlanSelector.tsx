"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { CheckIcon } from "@/components/ui/icons";
import { PLAN_INCLUDES, PLANS, type PlanId } from "@/lib/constants";
import { WEB_CHECKOUT_ENABLED } from "@/lib/payment/config";
import { annualSavings, formatShekel } from "@/lib/pricing";
import { cn } from "@/lib/utils";

// Grow's hosted pages: card for both plans. Task 9 adds Bit / Apple Pay / Google Pay if the one-time page shows them.
const PAYMENT_METHODS = ["Visa", "Mastercard"] as const;
const [ANNUAL, MONTHLY] = PLANS;
const STORE_FALLBACK_HREF = "#store-fallback";

type Props = {
  selected: PlanId;
  onSelect: (id: PlanId) => void;
  /**
   * Called by a plan's button after it selects the plan. Pass it only when the
   * web checkout exists (flag on, plan 3) and is not open yet. In phase 1 the
   * owner omits it and the buttons lead to the store fallback under the plans.
   */
  onContinue?: () => void;
  /** The checkout is open: the chosen plan's button shows as pressed. */
  checkoutOpen?: boolean;
};

/**
 * The two plan cards, in the handoff's style: the annual card with its green
 * border and full-width button, the monthly plan as a lighter row. Each button
 * selects its plan and, with the web checkout on, opens it; with the checkout
 * off it jumps to the store fallback. A pressed button marks the
 * chosen plan once the checkout is open.
 */
export default function PlanSelector({ selected, onSelect, onContinue, checkoutOpen = false }: Props) {
  // Card and wallet methods only apply to the web checkout. In phase 1 the
  // buyer pays in the app stores, so listing them would mislead.
  const showMethods = WEB_CHECKOUT_ENABLED;
  const choose = (id: PlanId) => () => {
    onSelect(id);
    onContinue?.();
  };
  const href = WEB_CHECKOUT_ENABLED ? undefined : STORE_FALLBACK_HREF;

  return (
    <>
      <div className="mt-8 grid max-w-xl gap-4">
        <section
          data-testid="plan-annual"
          aria-labelledby="plan-annual-name"
          className={cn(
            "rounded-card border-2 border-green bg-surface p-[clamp(min(1.375rem,6.9vw),3vw,1.75rem)] transition-shadow",
            checkoutOpen && selected === "annual" && "shadow-card ring-2 ring-green ring-offset-2",
          )}
        >
          <h2 id="plan-annual-name" className="sr-only">
            {ANNUAL.longName}
          </h2>
          <span className="inline-block rounded-pill bg-cta px-3 py-1 text-[13px] font-extrabold leading-snug text-white">
            {ANNUAL.badge}
          </span>
          <p className="mb-0.5 mt-3 font-display text-[38px] font-extrabold leading-tight">
            {formatShekel(ANNUAL.price)}{" "}
            <span className="text-lead font-semibold">{ANNUAL.priceSuffix}</span>
          </p>
          <p className="text-base leading-normal">
            {ANNUAL.terms}
            <br />
            <b className="font-bold text-blue">{`חיסכון של ${formatShekel(annualSavings())} לעומת המנוי החודשי`}</b>
          </p>
          {showMethods ? (
            <p className="mt-3 text-base text-ink-soft">
              {`חיוב אחד של ${formatShekel(ANNUAL.total)}, אפשר לחלק עד ${ANNUAL.maxInstallments} תשלומים`}
            </p>
          ) : null}
          <Button
            size="lg"
            href={href}
            className="mt-4 w-full"
            onClick={href ? undefined : choose("annual")}
            aria-describedby="plan-annual-name"
            aria-pressed={checkoutOpen ? selected === "annual" : undefined}
          >
            {ANNUAL.cta}
          </Button>
        </section>

        <Card
          as="section"
          aria-labelledby="plan-monthly-name"
          className={cn(
            "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 !rounded-tile p-[18px]",
            checkoutOpen && selected === "monthly" && "ring-2 ring-green ring-offset-2",
          )}
        >
          <div data-testid="plan-monthly" className="min-w-0">
            <h2 id="plan-monthly-name" className="font-display text-lead font-bold">
              {MONTHLY.longName}
            </h2>
            <p className="font-display text-[22px] font-extrabold leading-tight">
              {formatShekel(MONTHLY.price)}{" "}
              <span className="text-base font-medium">{MONTHLY.priceSuffix}</span>
            </p>
          </div>
          <MonthlyChoice href={href} onClick={href ? undefined : choose("monthly")} pressed={checkoutOpen ? selected === "monthly" : undefined} />
        </Card>
      </div>

      <div
        className={`mt-10 grid gap-8 ${
          showMethods ? "md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-start" : ""
        }`}
      >
        <div>
          <h2 className="font-display text-h3 font-bold">מה כלול בשני המסלולים</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {PLAN_INCLUDES.map((item) => (
              <li key={item} className="flex items-center gap-3 text-lead font-medium">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-deep text-white">
                  <CheckIcon className="h-[18px] w-[18px]" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {showMethods ? (
          <div>
            <p id="payment-methods-label" className="text-base text-ink-soft">
              אמצעי תשלום
            </p>
            <ul
              aria-labelledby="payment-methods-label"
              dir="ltr"
              className="mt-3 flex flex-wrap gap-2"
            >
              {PAYMENT_METHODS.map((method) => (
                <li
                  key={method}
                  className="inline-flex min-h-[40px] items-center rounded-pill border-2 border-hairline bg-surface px-4 font-display text-base font-bold text-ink-soft"
                >
                  {method}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </>
  );
}

/** The monthly row's action: a text button with the 48px hit area every control keeps. */
function MonthlyChoice({ href, onClick, pressed }: { href?: string; onClick?: () => void; pressed?: boolean }) {
  const className =
    "inline-flex min-h-12 items-center rounded-pill px-4 font-display text-lead font-bold text-blue hover:underline";
  const label = (
    <>
      {MONTHLY.cta} <span aria-hidden="true">←</span>
    </>
  );
  // The arrow is decoration, so the accessible name is just "לבחירה"; the row's heading says which plan.
  const props = { className, "aria-describedby": "plan-monthly-name" } as const;
  return href ? (
    <a href={href} {...props}>
      {label}
    </a>
  ) : (
    <button type="button" onClick={onClick} aria-pressed={pressed} {...props}>
      {label}
    </button>
  );
}
