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
 * body is always read as text and parsed here. The read is bounded: a chunked
 * request has no content-length, so bytes are counted as they arrive and the
 * stream is cancelled once the cap is passed.
 */
async function readBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return null;
  if (!request.body) return null;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done: finished, value } = await reader.read();
    if (finished) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  // An unresolvable address shares one "unknown" bucket: skipping the limit would let a caller opt out of it.
  if (isRateLimited(ip)) return done();

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
