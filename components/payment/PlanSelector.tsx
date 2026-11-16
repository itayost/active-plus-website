"use client";

import type { MouseEvent } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { CheckIcon, LockIcon } from "@/components/ui/icons";
import { tapHaptic } from "@/lib/haptics";
import { PLAN_INCLUDES, PLANS, type PlanId } from "@/lib/constants";
import { WEB_CHECKOUT_ENABLED } from "@/lib/payment/config";
import { CHECKOUT_COPY as C } from "@/lib/payment/copy";
import { annualCardCopy, priceParts, type PlanPrices } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { PaymentLogos } from "./PaymentMethods";

const [ANNUAL, MONTHLY] = PLANS;
const STORE_FALLBACK_HREF = "#store-fallback";

type Props = {
  /** web_plans: every figure on the cards is derived from these. */
  prices: PlanPrices;
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
export default function PlanSelector({ prices, selected, onSelect, onContinue, checkoutOpen = false }: Props) {
  // Card and wallet methods only apply to the web checkout. In phase 1 the
  // buyer pays in the app stores, so listing them would mislead.
  const showMethods = WEB_CHECKOUT_ENABLED;
  const choose = (id: PlanId) => () => {
    tapHaptic();
    onSelect(id);
    onContinue?.();
  };
  const href = WEB_CHECKOUT_ENABLED ? undefined : STORE_FALLBACK_HREF;
  // A tap anywhere on a card chooses its plan, as its button does (owner, 2026-11-16: the monthly
  // card answered only on its small "לבחירה"). The button stays the keyboard and screen-reader way
  // in; a tap on it is left to it, so a choice never runs twice.
  const cardTap = (id: PlanId) => (event: MouseEvent<HTMLElement>) => {
    if (href || (event.target instanceof Element && event.target.closest("a, button"))) return;
    choose(id)();
  };
  const card = annualCardCopy(prices);
  const monthly = priceParts(prices, "monthly");

  // One column on every screen: /payment runs full screen in a phone-width column (FullscreenColumn).
  return (
    <div>
      <div className="mt-8 grid gap-4">
        <section
          data-testid="plan-annual"
          aria-labelledby="plan-annual-name"
          onClick={cardTap("annual")}
          className={cn(
            "rounded-card border-2 border-green bg-surface p-[clamp(min(1.375rem,6.9vw),3vw,1.75rem)] transition-shadow",
            !href && "cursor-pointer",
            checkoutOpen && selected === "annual" && "shadow-card ring-2 ring-green ring-offset-2",
          )}
        >
          <h2 id="plan-annual-name" className="sr-only">
            {ANNUAL.longName}
          </h2>
          {card.badge ? (
            <span className="mb-3 inline-block rounded-pill bg-cta px-3 py-1 text-[13px] font-extrabold leading-snug text-white">
              {card.badge}
            </span>
          ) : null}
          <p className="mb-0.5 font-display text-[38px] font-extrabold leading-tight">
            {card.amount} <span className="text-lead font-semibold">{card.suffix}</span>
          </p>
          <p className="text-base leading-normal">
            {card.terms}
            {card.saving ? (
              <>
                <br />
                <b className="font-bold text-blue">{card.saving}</b>
              </>
            ) : null}
          </p>
          {showMethods ? <p className="mt-3 text-base text-ink-soft">{card.charge}</p> : null}
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
          {showMethods ? (
            <>
              <p id="payment-methods-label" className="sr-only">
                {C.methodsLabel}
              </p>
              <PaymentLogos labelledBy="payment-methods-label" className="mt-4" />
              <p className="mt-3 flex items-center justify-center gap-2 font-bold text-green-lo">
                <LockIcon className="h-5 w-5 shrink-0" />
                {C.secureTitle} · Grow
              </p>
            </>
          ) : null}
        </section>

        <Card
          as="section"
          aria-labelledby="plan-monthly-name"
          onClick={cardTap("monthly")}
          className={cn(
            "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 !rounded-tile p-[18px]",
            !href && "cursor-pointer",
            checkoutOpen && selected === "monthly" && "ring-2 ring-green ring-offset-2",
          )}
        >
          <div data-testid="plan-monthly" className="min-w-0">
            <h2 id="plan-monthly-name" className="font-display text-lead font-bold">
              {MONTHLY.longName}
            </h2>
            <p className="font-display text-[22px] font-extrabold leading-tight">
              {monthly.amount} <span className="text-base font-medium">{monthly.suffix}</span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-base font-bold text-green-lo">
              <CheckIcon className="h-[18px] w-[18px] shrink-0" />
              {C.cancelAnytime}
            </p>
          </div>
          <MonthlyChoice href={href} onClick={href ? undefined : choose("monthly")} pressed={checkoutOpen ? selected === "monthly" : undefined} />
        </Card>
      </div>

      <div
        className="mt-10 grid gap-8"
      >
        <div>
          <h2 className="font-display text-h3 font-bold">מה כלול בשני המסלולים</h2>
          <ul className="mt-5 grid gap-4">
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

      </div>
    </div>
  );
}

/** The monthly row's action: an outlined pill, so it reads as a button (the whole row answers a tap too). */
function MonthlyChoice({ href, onClick, pressed }: { href?: string; onClick?: () => void; pressed?: boolean }) {
  const className =
    "inline-flex min-h-12 items-center gap-1.5 rounded-pill border-2 border-blue px-5 font-display text-lead font-bold text-blue " +
    "transition-transform duration-[var(--dur-fast)] hover:bg-blue-wash active:scale-[0.97]";
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
