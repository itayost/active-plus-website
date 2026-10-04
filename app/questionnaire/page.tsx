import type { Metadata } from "next";
import Funnel from "@/components/funnel/Funnel";
import { RESUME_SCRIPT } from "@/lib/funnel/resume-script";

export const metadata: Metadata = {
  title: "בדיקת התאמה",
  description: "כמה שאלות קצרות כדי להתאים לך תוכנית אימון אישית.",
  // A personal flow, not a landing page (and left out of the sitemap).
  robots: { index: false },
};

export default function QuestionnairePage() {
  return (
    <>
      {/* Before the funnel so it runs ahead of welcome2's markup: see lib/funnel/resume-script. */}
      <script dangerouslySetInnerHTML={{ __html: RESUME_SCRIPT }} />
      <Funnel />
    </>
  );
}
