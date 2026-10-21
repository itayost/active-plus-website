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

const months = (id: PlanId): number => {
  const found = PLANS.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown plan: ${id}`);
  return found.months;
};

const toAgorot = (amount: number): number => Math.round(amount * 100) / 100;

/** The price shown with "לחודש": the annual total spread over its 12 months, the monthly charge as is. */
export function pricePerMonth(prices: PlanPrices, id: PlanId): number {
  return toAgorot(prices[id].total / months(id));
}

/** What a year of the monthly plan costs, minus the annual plan's one charge. */
export function annualSavings(prices: PlanPrices): number {
  return toAgorot(prices.monthly.total * months("annual") - prices.annual.total);
}

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
