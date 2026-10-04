import type { Metadata } from "next";
import ArticlesStrip from "@/components/articles/ArticlesStrip";
import PaymentFlow from "@/components/payment/PaymentFlow";
import Section from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "מסלולים ומחירים",
  description: "מנוי שנתי ב־59 ₪ לחודש או מנוי חודשי ב־99 ₪, ללא התחייבות. שני המסלולים כוללים תוכנית אימון מותאמת אישית.",
};

export default function PaymentPage() {
  return (
    <>
      <Section id="plans" labelledBy="payment-heading" className="!pb-[clamp(3rem,6vw,5rem)] !pt-[clamp(2.5rem,5vw,4.5rem)]">
        <h1
          id="payment-heading"
          className="max-w-[18ch] font-display text-[clamp(1.66rem,1.09rem+2.8vw,4.29rem)] font-black leading-[1.05] tracking-[-0.025em]"
        >
          חיים פעילים יותר, חיים טובים יותר.
        </h1>
        <h2 className="mt-4 font-display text-h3 font-bold text-blue-deep">התוכנית האישית שלך</h2>
        <PaymentFlow />
      </Section>

      <ArticlesStrip />
    </>
  );
}
