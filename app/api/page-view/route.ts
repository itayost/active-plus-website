import { MAX_PAGE_VIEW_BODY_BYTES, deviceOf, isBot, parsePageView } from "@/lib/pageviews/parse";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-ip";
import { createServiceClient } from "@/lib/supabase";

// Anonymous page views (lib/pageviews/parse.ts). The IP is used only for the
// rate limit and the user agent only for the device kind; neither is stored.
const isRateLimited = createRateLimiter({ windowMs: 60 * 1000, max: 240 });

/** Measurement never blocks a page: every outcome is an empty 204. */
const done = () => new Response(null, { status: 204 });

async function readBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_PAGE_VIEW_BODY_BYTES) return null;
  try {
    const text = await request.text();
    return text.length > MAX_PAGE_VIEW_BODY_BYTES ? null : JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // Preview deployments and local runs would only add noise to the owner's numbers.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return done();
  const ua = request.headers.get("user-agent") ?? "";
  if (isBot(ua)) return done();
  if (isRateLimited(clientIp(request.headers))) return done();

  const msg = parsePageView(await readBody(request));
  if (!msg) return done();

  try {
    const db = createServiceClient();
    if (msg.t === "view") {
      const { device, os } = deviceOf(ua);
      const { error } = await db.from("web_page_views").insert({
        id: msg.id,
        visit_id: msg.visit,
        path: msg.path,
        referrer_host: msg.referrerHost,
        from_meta: msg.fromMeta,
        meta_ad_id: msg.metaAdId,
        device,
        os,
      });
      // 23505: the same view sent twice (beacon and fetch); already stored.
      if (error && error.code !== "23505") console.error("[page-view] insert failed", { code: error.code });
    } else if (msg.t === "end") {
      // A page hidden and shown again reports again; keep the longest.
      const { error } = await db
        .from("web_page_views")
        .update({ seconds: msg.seconds })
        .eq("id", msg.id)
        .eq("visit_id", msg.visit)
        .or(`seconds.is.null,seconds.lt.${msg.seconds}`);
      if (error) console.error("[page-view] update failed", { code: error.code });
    } else {
      const { error } = await db.from("web_link_clicks").insert({
        page_view_id: msg.id,
        visit_id: msg.visit,
        path: msg.path,
        target: msg.target,
      });
      if (error) console.error("[page-view] click insert failed", { code: error.code });
    }
  } catch {
    console.error("[page-view] unexpected failure");
  }
  return done();
}
