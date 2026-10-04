import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import Pricing from "@/components/sections/Pricing";
import FaqSection from "@/components/sections/FaqSection";
import LeadSection from "@/components/sections/LeadSection";

export const metadata: Metadata = {
  title: "מסלולים ומחירים",
  description:
    "מנוי שנתי 2,496 ₪ (208 ₪ לחודש) או מנוי חודשי 299 ₪. אותה תוכנית מלאה בשני המסלולים.",
};

export default function PricingPage() {
  return (
    <>
      <PageHero
        title="מה מתאים לי?"
        lede="שני מסלולים, אותה תוכנית. ההבדל היחיד הוא איך משלמים."
        tone="blue"
      />
      <Pricing heading="מסלולים ומחירים" />
      <FaqSection limit={5} showMore heading="שאלות לפני שמצטרפים" />
      <LeadSection
        source="pricing"
        heading="רוצים שנעזור לבחור?"
        lede="השאירו פרטים ונסביר בטלפון מה ההבדל בין המסלולים ומה מתאים לכם."
      />
    </>
  );
}
