import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import StoreButtons from "@/components/payment/StoreButtons";
import { Shell } from "@/components/ui/Section";
import { platformOf, storeUrlFor } from "@/lib/store-link";

/**
 * One link for the app, for ads, WhatsApp and print: peilimplus.co.il/download. An iPhone goes straight
 * to the App Store and an Android phone to Google Play; a computer or anything unrecognised sees both
 * buttons. Decided per request, from the visitor's own User-Agent, so it is never cached.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "הורדת האפליקציה",
  description: "הורידו את אפליקציית פעילים פלוס ל-iPhone או לאנדרואיד.",
  alternates: { canonical: "/download" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DownloadPage({ searchParams }: Props) {
  const platform = platformOf((await headers()).get("user-agent"));
  if (platform) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(await searchParams)) {
      if (typeof value === "string") params.set(key, value);
    }
    redirect(storeUrlFor(platform, params));
  }
  return (
    <section className="bg-surface py-[var(--section-y)]">
      <Shell width="narrow">
        <h1 className="text-h2 font-display font-extrabold text-blue">הורידו את פעילים פלוס</h1>
        <p className="mt-5 max-w-measure text-lead text-ink-soft">
          האפליקציה זמינה ל-iPhone ולאנדרואיד. בחרו את החנות של הטלפון שלכם.
        </p>
        <StoreButtons className="mt-9 flex flex-wrap gap-4" variant="primary" size="lg" />
      </Shell>
    </section>
  );
}
