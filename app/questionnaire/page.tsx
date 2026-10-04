import type { Metadata } from "next";
import Funnel from "@/components/funnel/Funnel";

export const metadata: Metadata = {
  title: "בדיקת התאמה",
  description: "כמה שאלות קצרות כדי להתאים לך תוכנית אימון אישית.",
  // A personal flow, not a landing page (and left out of the sitemap).
  robots: { index: false },
};

export default function QuestionnairePage() {
  return <Funnel />;
}
