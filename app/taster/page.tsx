import type { Metadata } from "next";
import Taster from "@/components/taster/Taster";

export const metadata: Metadata = {
  title: "אימון ראשון",
  // Reached only from the questionnaire, right after the SMS code.
  robots: { index: false, follow: false },
};

export default function TasterPage() {
  return <Taster />;
}
