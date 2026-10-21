import { PLANS, type PlanId } from "@/lib/constants";

/** Grow's ceiling for one charge, and the most any web_plans row may allow. */
export const MAX_INSTALLMENTS = 12;

/**
 * A plan's price as Supabase's web_plans holds it (lib/plan-prices.ts reads
 * it): the one charge, and how many installments it may be split into. The
 * same row is what createGrowPayment charges, so every figure on the site is
 * derived from these two numbers, never typed.
 */
export type PlanPrice = { total: number; maxInstallments: number };
export type PlanPrices = Record<PlanId, PlanPrice>;

const plan = (id: PlanId) => {
  const found = PLANS.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown plan: ${id}`);
  return found;
};

const [ANNUAL] = PLANS;

const toAgorot = (amount: number): number => Math.round(amount * 100) / 100;

/** Per-installment amount in shekels, rounded to agorot. */
export function installmentAmount(total: number, count: number): number {
  if (!Number.isInteger(count) || count < 1 || count > MAX_INSTALLMENTS) {
    throw new RangeError(`Installments must be an integer 1-${MAX_INSTALLMENTS}, got ${count}`);
  }
  return toAgorot(total / count);
}

const formatter = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 });

export function formatShekel(amount: number): string {
  return `${formatter.format(amount)} ₪`;
}

/**
 * The figure a plan is shown at: the annual total split over the installment
 * ceiling it is offered with (so the figure and the "ל-N תשלומים" beside it
 * always agree), the monthly charge as is.
 */
export function perPayment(prices: PlanPrices, id: PlanId): number {
  return id === "annual" ? installmentAmount(prices.annual.total, prices.annual.maxInstallments) : prices[id].total;
}

const singlePayment = (prices: PlanPrices, id: PlanId): boolean => id === "annual" && prices.annual.maxInstallments === 1;

/** What follows the figure: a month, or one payment when the annual cannot be split. */
const priceSuffix = (prices: PlanPrices, id: PlanId): string => (singlePayment(prices, id) ? "בתשלום אחד" : plan(id).priceSuffix);

/** The figure with "לחודש", or with "בתשלום אחד" when the annual is one payment. */
export function priceLabel(prices: PlanPrices, id: PlanId): string {
  return `${formatShekel(perPayment(prices, id))} ${priceSuffix(prices, id)}`;
}

/** What a year of the monthly plan costs, minus the annual plan's one charge. */
export function annualSavings(prices: PlanPrices): number {
  return toAgorot(prices.monthly.total * plan("annual").months - prices.annual.total);
}

export type AnnualCard = {
  amount: string;
  suffix: string;
  terms: string;
  charge: string;
  /** Null when the annual plan saves nothing: then neither the line nor the badge's claim is shown. */
  saving: string | null;
  badge: string | null;
};

/** Everything the annual card says about money, in Hebrew, from the prices. */
export function annualCardCopy(prices: PlanPrices): AnnualCard {
  const { total, maxInstallments } = prices.annual;
  const saving = annualSavings(prices);
  const single = maxInstallments === 1;
  return {
    amount: formatShekel(perPayment(prices, "annual")),
    suffix: priceSuffix(prices, "annual"),
    terms: `${single ? "תשלום אחד" : `ל-${maxInstallments} תשלומים`} · ${plan("annual").terms}`,
    charge: `חיוב אחד של ${formatShekel(total)}${single ? "" : `, אפשר לחלק עד ${maxInstallments} תשלומים`}`,
    saving: saving > 0 ? `חיסכון של ${formatShekel(saving)} לעומת המנוי החודשי` : null,
    badge: saving > 0 ? ANNUAL.badge : null,
  };
}

const INCLUDED = "שני המסלולים כוללים תוכנית אימון מותאמת אישית.";

/** The /payment description search and share previews show; without prices it names no figure. */
export function describePlans(prices: PlanPrices | null): string {
  if (!prices) return `מנוי שנתי או מנוי חודשי ללא התחייבות. ${INCLUDED}`;
  const { total, maxInstallments } = prices.annual;
  const annual = maxInstallments === 1
    ? `מנוי שנתי בתשלום אחד של ${formatShekel(total)}`
    : `מנוי שנתי ב־${priceLabel(prices, "annual")} (חיוב אחד של ${formatShekel(total)}, עד ${maxInstallments} תשלומים)`;
  return `${annual} או מנוי חודשי ב־${formatShekel(prices.monthly.total)}, ללא התחייבות. ${INCLUDED}`;
}
