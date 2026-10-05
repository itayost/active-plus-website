import type { Metadata } from "next";
import ArticlesStrip from "@/components/articles/ArticlesStrip";
import PaymentFlow from "@/components/payment/PaymentFlow";
import { PLANS, type PlanId } from "@/lib/constants";

export const metadata: Metadata = {
  title: "מסלולים ומחירים",
  description: "מנוי שנתי ב־59 ₪ לחודש או מנוי חודשי ב־99 ₪, ללא התחייבות. שני המסלולים כוללים תוכנית אימון מותאמת אישית.",
};

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
  const { plan, cancelled } = await searchParams;
  return (
    <>
      <PaymentFlow linkPlan={parsePlan(plan)} cancelled={(Array.isArray(cancelled) ? cancelled[0] : cancelled) === "1"}>
        <h1
          id="payment-heading"
          className="max-w-[18ch] font-display text-[clamp(1.66rem,1.09rem+2.8vw,4.29rem)] font-black leading-[1.05] tracking-[-0.025em]"
        >
          חיים פעילים יותר, חיים טובים יותר.
        </h1>
        <h2 className="mt-4 font-display text-h3 font-bold text-blue-deep">התוכנית האישית שלך</h2>
      </PaymentFlow>

      <ArticlesStrip />
    </>
  );
}
