import type { Metadata } from "next";
import MyPlan from "@/components/plan/MyPlan";

export const metadata: Metadata = {
  title: "התוכנית שלי",
  // Reached only from the questionnaire, right after the SMS code.
  robots: { index: false, follow: false },
};

export default function MyPlanPage() {
  return <MyPlan />;
}
