import { renderTvPage } from "@/lib/tv/page";

/**
 * peilimplus.co.il/tv: the workout on any smart TV with a pairing code. A
 * plain document (lib/tv/page.ts), not a React page: TV browsers are old.
 * Its Content-Security-Policy is set in next.config.ts (buildTvCsp).
 */
export const dynamic = "force-dynamic";

export function GET(): Response {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return new Response("Not configured", { status: 503 });
  }
  return new Response(renderTvPage({ supabaseUrl, anonKey }), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // The page is the same for every TV; the pairing lives in the TV's storage.
      "Cache-Control": "public, max-age=300",
    },
  });
}
