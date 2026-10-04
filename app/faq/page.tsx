import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import FaqSection from "@/components/sections/FaqSection";
import LeadSection from "@/components/sections/LeadSection";
import { FAQ } from "@/content/pages";

export const metadata: Metadata = {
  title: "שאלות נפוצות",
  description:
    "למי פעילים+ מתאימה, כמה זמן צריך להתאמן, איך האימון מותאם אישית ומה קורה אם תרגיל קשה — כל התשובות במקום אחד.",
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Static, first-party content only. `<` is escaped so a stray
        // "</script>" in copy could never break out of the tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <PageHero
        title="שאלות נפוצות"
        lede="ריכזנו את מה שהכי שואלים אותנו לפני שמתחילים."
        tone="purple"
      />
      <FaqSection heading="כל השאלות" />
      <LeadSection
        source="faq"
        heading="לא מצאתם תשובה?"
        lede="השאירו פרטים ונחזור אליכם עם תשובה אישית."
      />
    </>
  );
}
