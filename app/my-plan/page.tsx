import type { Metadata } from "next";
import MyPlan from "@/components/plan/MyPlan";
import { loadGiftTrialEnabled } from "@/lib/payment/gift";

// The gift switch is read per request, so turning it off needs no deploy.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "התוכנית שלי",
  // Reached only from the questionnaire, right after the SMS code.
  robots: { index: false, follow: false },
};

export default async function MyPlanPage({ searchParams }: { searchParams: Promise<{ giftPreview?: string }> }) {
  const [{ giftPreview }, giftOn] = await Promise.all([searchParams, loadGiftTrialEnabled()]);
  const preview = process.env.NODE_ENV !== "production" && giftPreview === "offer";
  return <MyPlan gift={giftOn || preview} />;
}
