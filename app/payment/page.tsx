import type { Metadata } from "next";
import { cache } from "react";
import FullscreenColumn from "@/components/layout/FullscreenColumn";
import PaymentFlow from "@/components/payment/PaymentFlow";
import { PLANS, type PlanId } from "@/lib/constants";
import { loadPlanPrices } from "@/lib/plan-prices";
import { describePlans } from "@/lib/pricing";

const TITLE = "מסלולים ומחירים";
/** The questionnaire ends here, right after the SMS code: the plan is ready, now the plan type. */
const HEADING = "התוכנית האישית שלך מוכנה";
const SUBHEADING = "בחרו מסלול ומתחילים להתאמן";
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
  searchParams: Promise<{ plan?: string | string[]; cancelled?: string | string[] }>;
}) {
  const [{ plan, cancelled }, prices] = await Promise.all([searchParams, planPrices()]);
  return (
    <FullscreenColumn>
      <PaymentFlow
        prices={prices}
        linkPlan={parsePlan(plan)}
        cancelled={(Array.isArray(cancelled) ? cancelled[0] : cancelled) === "1"}
      >
        <h1
          id="payment-heading"
          className="font-display text-[clamp(1.75rem,1.5rem+1vw,2.25rem)] font-extrabold leading-[1.15] text-blue"
        >
          {HEADING}
        </h1>
        <p className="mt-2 text-lead text-ink-soft">{SUBHEADING}</p>
      </PaymentFlow>
    </FullscreenColumn>
  );
}
