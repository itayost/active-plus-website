"use client";

import Button from "@/components/ui/Button";
import { ArrowIcon, CheckIcon } from "@/components/ui/icons";
import { PLAN_INCLUDES, PLANS, type PlanId } from "@/lib/constants";
import { WEB_CHECKOUT_ENABLED } from "@/lib/payment/config";
import { annualSavings, formatShekel } from "@/lib/pricing";

const PAYMENT_METHODS = ["Bit", "Apple Pay", "Google Pay", "Visa", "Mastercard"] as const;
const GROUP_LABEL_ID = "plan-group-label";

type Props = {
  selected: PlanId;
  onSelect: (id: PlanId) => void;
  /**
   * Called by "המשך לרכישה". Pass it only when the web checkout exists (flag
   * on, plan 3). In phase 1 the owner omits it and no continue button renders,
   * because the store fallback sits directly under the plans.
   */
  onContinue?: () => void;
};

/**
 * Controlled plan picker. Native radio inputs share one name, so arrow keys,
 * Tab and form semantics come from the browser; the label only paints them.
 */
export default function PlanSelector({ selected, onSelect, onContinue }: Props) {
  // Card and wallet methods only apply to the web checkout. In phase 1 the
  // buyer pays in the app stores, so listing them would mislead.
  const showMethods = WEB_CHECKOUT_ENABLED;
  return (
    <>
      <div
        role="radiogroup"
        aria-labelledby={GROUP_LABEL_ID}
        className="mt-10 grid gap-5 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-stretch"
      >
        <span id={GROUP_LABEL_ID} className="sr-only">
          בחירת מסלול
        </span>
        {PLANS.map((plan) => {
          const isSelected = selected === plan.id;
          const isAnnual = plan.id === "annual";
          return (
            <label key={plan.id} className="relative block min-w-0 cursor-pointer">
              <input
                type="radio"
                name="plan"
                value={plan.id}
                checked={isSelected}
                onChange={() => onSelect(plan.id)}
                className="peer sr-only"
              />
              <span
                className={`flex h-full flex-col gap-4 rounded-card border-2 bg-surface p-[clamp(1.5rem,3vw,2.25rem)] shadow-lift-1 transition-[border-color,box-shadow,transform] duration-[var(--dur-fast)] ease-out-expo peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-blue-deep hover:-translate-y-0.5 hover:border-ink/30 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                  isSelected ? "border-blue-deep shadow-lift-2" : "border-hairline"
                }`}
              >
                <span className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-white ${
                      isSelected ? "border-blue-deep bg-blue-deep" : "border-ink/25 bg-surface"
                    }`}
                  >
                    <CheckIcon className={`h-[18px] w-[18px] ${isSelected ? "opacity-100" : "opacity-0"}`} />
                  </span>
                  <span className="font-display text-[clamp(1.5rem,1.25rem+1vw,2rem)] font-black leading-[1.1]">
                    {plan.longName}
                  </span>
                  {isAnnual ? (
                    <span className="ms-auto whitespace-nowrap rounded-pill bg-ink px-4 py-1.5 font-display text-lead font-bold text-yellow">
                      {`חיסכון של ${formatShekel(annualSavings())}`}
                    </span>
                  ) : null}
                </span>

                <span
                  className={`font-display font-black leading-none tracking-tight ${
                    isAnnual
                      ? "text-[clamp(2.5rem,2rem+2vw,3.75rem)]"
                      : "text-[clamp(2rem,1.7rem+1.4vw,2.75rem)]"
                  }`}
                >
                  {formatShekel(plan.price)}{" "}
                  <small className="text-lead font-bold text-ink-soft">{plan.priceSuffix}</small>
                </span>

                {isAnnual ? (
                  <>
                    <span className="text-lead font-medium text-ink">
                      {`סה״כ ${formatShekel(plan.price)} × 12 חודשים = ${formatShekel(plan.total)} לשנה`}
                    </span>
                    <span className="text-base text-ink-soft">
                      {`חיוב אחד של ${formatShekel(plan.total)}, אפשר לחלק עד ${plan.maxInstallments} תשלומים`}
                    </span>
                  </>
                ) : (
                  <span className="text-base text-ink-soft">{plan.terms}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      <div
        className={`mt-10 grid gap-8 ${
          showMethods ? "md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-end" : ""
        }`}
      >
        <div>
          <h3 className="font-display text-h3 font-bold">מה כלול בשני המסלולים</h3>
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
            <p id="payment-methods-label" className="text-base text-ink-faint">
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
            {onContinue ? (
              <Button size="lg" className="mt-6 w-full" onClick={onContinue}>
                המשך לרכישה
                <ArrowIcon className="h-5 w-5" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
