import type { Metadata } from "next";
import HapticsTest from "./HapticsTest";

// TEMPORARY: which way makes an iPhone tap (owner, 2026-11-15). Preview only, never merged.
export const metadata: Metadata = { title: "בדיקת רטט", robots: { index: false, follow: false } };

export default function Page() {
  return <HapticsTest />;
}
