import type { Metadata } from "next";
import SubscriptionManager from "@/components/account/SubscriptionManager";
import Section from "@/components/ui/Section";
import { ACCOUNT_COPY as A } from "@/lib/payment/copy";

export const metadata: Metadata = {
  title: A.title,
  robots: { index: false, follow: false },
};

/** Per-visitor and behind a phone sign-in, so never indexed; works with the web checkout off too. */
export default function SubscriptionPage() {
  return (
    <Section id="subscription" tone="sunken" labelledBy="subscription-heading" className="pt-[clamp(2.5rem,5vw,4.5rem)]">
      <div className="mx-auto max-w-[56.25rem]">
        <h1 id="subscription-heading" className="mb-8 font-display text-[clamp(2rem,1.4rem+2.2vw,3rem)] font-black">{A.title}</h1>
        <div className="rounded-card bg-surface p-[clamp(1.25rem,3.5vw,2.5rem)] shadow-lift-2">
          <SubscriptionManager />
        </div>
      </div>
    </Section>
  );
}
