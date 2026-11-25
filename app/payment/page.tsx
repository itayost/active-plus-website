import type { Metadata } from "next";
import { cache } from "react";
import FullscreenColumn from "@/components/layout/FullscreenColumn";
import PaymentFlow from "@/components/payment/PaymentFlow";
import PaymentHeading from "@/components/payment/PaymentHeading";
import { PLANS, type PlanId } from "@/lib/constants";
import { loadGiftTrialEnabled } from "@/lib/payment/gift";
import { loadPlanPrices } from "@/lib/plan-prices";
import { describePlans } from "@/lib/pricing";
import { GROW_APPLE_PAY_SDK_URL } from "@/lib/security/csp";

const TITLE = "מסלולים ומחירים";
// One web_plans read per request, shared by the metadata and the page.
const planPrices = cache(() => loadPlanPrices());

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: TITLE,
    description: describePlans(await planPrices()),
    // Unlisted at the client's request: reached only from the questionnaire's
    // hand-off, so search engines should not offer it either.
    robots: { index: false, follow: true },
  };
}

/** The plan an explicit link names; undefined without one (or with an unknown one). */
function parsePlan(value: string | string[] | undefined): PlanId | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  return PLANS.find((plan) => plan.id === candidate)?.id;
}

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string | string[]; cancelled?: string | string[]; giftPreview?: string | string[] }>;
}) {
  const [{ plan, cancelled, giftPreview }, prices, giftOn] = await Promise.all([searchParams, planPrices(), loadGiftTrialEnabled()]);
  // Local preview only: ?giftPreview=offer|claimed shows the gift without the server switch.
  const preview = process.env.NODE_ENV !== "production" ? (Array.isArray(giftPreview) ? giftPreview[0] : giftPreview) : undefined;
  const gift = giftOn || preview === "offer" || preview === "claimed";
  // No X to the free workout any more (owner, 2026-11-16: pay first); the way out is a call back under the plans.
  // The 7-day gift (owner, 2026-11-25) is one premium screen of its own: no plans, no payment.
  if (gift) {
    return <PaymentFlow prices={prices} gift previewGiftClaimed={preview === "claimed"} />;
  }
  return (
    <FullscreenColumn>
      {/* React moves an async script into the head, where Grow requires it. */}
      <script src={GROW_APPLE_PAY_SDK_URL} async />
      <PaymentFlow
        prices={prices}
        linkPlan={parsePlan(plan)}
        cancelled={(Array.isArray(cancelled) ? cancelled[0] : cancelled) === "1"}
      >
        <PaymentHeading />
      </PaymentFlow>
    </FullscreenColumn>
  );
}
