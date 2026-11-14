import type { PlanId } from "@/lib/constants";

export type PaymentMethod = {
  readonly id: string;
  /** The accessible name and the alt text. */
  readonly name: string;
  readonly src: string;
  /** The file's own size: the mark is drawn at a fixed height and keeps this ratio. */
  readonly width: number;
  readonly height: number;
  /** The plans whose Grow page offers it. */
  readonly plans: readonly PlanId[];
};

/**
 * What Grow really offers, as seen in its wallet on 2026-11-10 (Bit, card,
 * PayBox; site PR #36): the annual plan opens that wallet, the monthly plan's
 * standing order takes cards only. The marks are the files Grow's own wallet
 * draws (cdn.meshulam.co.il, sdk 1.4.2). Apple Pay is wired (its domain file,
 * Grow's Apple Pay script) but not yet seen in the wallet: add it here only
 * once it is (owner asked, 2026-11-14).
 */
export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  { id: "visa", name: "Visa", src: "/img/pay/visa.svg", width: 33, height: 11, plans: ["annual", "monthly"] },
  { id: "mastercard", name: "Mastercard", src: "/img/pay/mastercard.svg", width: 20, height: 15, plans: ["annual", "monthly"] },
  { id: "bit", name: "Bit", src: "/img/pay/bit.svg", width: 132, height: 75, plans: ["annual"] },
  { id: "paybox", name: "PayBox", src: "/img/pay/paybox.svg", width: 66, height: 18, plans: ["annual"] },
];

/** The methods a plan's payment offers, or every method for no plan. */
export const methodsFor = (plan?: PlanId): readonly PaymentMethod[] =>
  plan ? PAYMENT_METHODS.filter((m) => m.plans.includes(plan)) : PAYMENT_METHODS;
