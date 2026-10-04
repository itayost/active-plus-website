import { PLANS } from "@/lib/constants";

const MAX_INSTALLMENTS = 12;

const plan = (id: "annual" | "monthly") => {
  const found = PLANS.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown plan: ${id}`);
  return found;
};

/** What a year of the monthly plan costs, minus the annual plan's one charge. */
export function annualSavings(): number {
  return plan("monthly").price * 12 - plan("annual").total;
}

/** Per-installment amount in shekels, rounded to agorot. */
export function installmentAmount(total: number, count: number): number {
  if (!Number.isInteger(count) || count < 1 || count > MAX_INSTALLMENTS) {
    throw new RangeError(`Installments must be an integer 1-${MAX_INSTALLMENTS}, got ${count}`);
  }
  return Math.round((total / count) * 100) / 100;
}

const formatter = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 });

export function formatShekel(amount: number): string {
  return `${formatter.format(amount)} ₪`;
}
