import type { Metadata } from "next";
import PaymentSuccess from "@/components/payment/PaymentSuccess";
import Section from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "התשלום התקבל",
  robots: { index: false, follow: false },
};

export default function PaymentSuccessPage() {
  return (
    <Section id="payment-success" tone="sunken" labelledBy="payment-success-heading" className="pt-[clamp(2.5rem,5vw,4.5rem)]">
      <PaymentSuccess />
    </Section>
  );
}
