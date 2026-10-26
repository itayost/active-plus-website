import type { Metadata } from "next";
import PaymentSuccess from "@/components/payment/PaymentSuccess";
import FullscreenColumn from "@/components/layout/FullscreenColumn";

export const metadata: Metadata = {
  title: "התשלום התקבל",
  robots: { index: false, follow: false },
};

export default function PaymentSuccessPage() {
  return (
    <FullscreenColumn>
      <section id="payment-success" aria-labelledby="payment-success-heading" className="gutter-x pb-10 pt-6">
        <PaymentSuccess />
      </section>
    </FullscreenColumn>
  );
}
