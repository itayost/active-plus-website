import type { Metadata, Viewport } from "next";
import Funnel from "@/components/funnel/Funnel";
import { RESUME_SCRIPT } from "@/lib/funnel/resume-script";

export const metadata: Metadata = {
  title: "בדיקת התאמה",
  description: "כמה שאלות קצרות כדי להתאים לך תוכנית אימון אישית.",
  // A personal flow, not a landing page (and left out of the sitemap).
  robots: { index: false },
};

/** The browser's bar takes the questionnaire's own background, so the screen reads as one app. */
export const viewport: Viewport = { themeColor: "#F7F9FC" };

export default function QuestionnairePage() {
  return (
    <>
      {/* Before the funnel so it runs ahead of welcome2's markup: see lib/funnel/resume-script. */}
      <script dangerouslySetInnerHTML={{ __html: RESUME_SCRIPT }} />
      <Funnel />
    </>
  );
}
