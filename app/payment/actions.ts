"use server";

import { revalidateTag } from "next/cache";
import { PLAN_PRICES_TAG } from "@/lib/plan-prices";

/**
 * Called by the checkout when createGrowPayment answered price_changed: drops
 * the cached web_plans rows, so the refreshed page shows the new price instead
 * of waiting out the cache. It changes no data, only when the next read happens.
 */
export async function refreshPlanPrices(): Promise<void> {
  revalidateTag(PLAN_PRICES_TAG);
}
