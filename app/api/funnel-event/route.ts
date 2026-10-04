import { MAX_BODY_BYTES, parseFunnelEvent } from "@/lib/funnel/events";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-ip";
import { createServiceClient } from "@/lib/supabase";

const FUNNEL_VERSION = "v2-web";
const isRateLimited = createRateLimiter({ windowMs: 60 * 1000, max: 120 });

/** Analytics never blocks the funnel: every outcome, valid or not, is an empty 204. */
const done = () => new Response(null, { status: 204 });

/**
 * sendBeacon with a Blob may arrive as application/json or text/plain, so the
 * body is always read as text (capped) and parsed here.
 */
async function readBody(request: Request): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return null;
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  if (ip !== "unknown" && isRateLimited(ip)) return done();

  const event = parseFunnelEvent(await readBody(request));
  if (!event) return done();

  try {
    const { error } = await createServiceClient()
      .from("funnel_events")
      .insert({
        session_id: event.sessionId,
        step: event.step,
        data: { ...event.data, funnel_version: FUNNEL_VERSION },
        client_platform: "web",
        client_version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
      });
    // Code only: no payload, no address.
    if (error) console.error("[funnel-event] insert failed", { code: error.code });
  } catch {
    console.error("[funnel-event] unexpected failure");
  }
  return done();
}
