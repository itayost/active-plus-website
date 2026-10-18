/**
 * Grow's server callbacks (the first-charge notify and the account webhooks)
 * arrive at GROW_NOTIFY_PATH. Grow signs nothing, so the middleware lets only
 * Grow's published IPs through and forwards them to the growWebhook function
 * with the proxy secret it requires; a call straight to the function's own
 * URL lacks the secret and is refused there.
 */

/**
 * https://developers.grow.business/reference/ip-address, one list for sandbox
 * and production. A Grow call from an address missing here is answered 403
 * and logged (ip_denied); Grow keeps retrying until the list is updated.
 */
export const GROW_IPS: ReadonlySet<string> = new Set([
  "3.123.194.128", "3.124.62.248", "18.198.97.252", "3.75.43.49", "18.156.94.176",
  "18.158.107.17", "3.121.149.170", "3.76.166.104", "3.69.160.29", "3.78.79.166",
  "3.71.221.153", "3.78.131.18", "3.67.110.47", "18.192.112.151", "52.59.95.229",
  "18.158.145.146", "3.75.128.58", "3.78.28.179", "3.122.21.187", "3.66.126.119",
  "35.158.249.118", "52.29.70.254", "52.59.159.234", "3.76.183.119", "18.157.106.67",
  "18.197.238.68", "3.66.129.154", "3.77.123.153", "3.70.40.72",
]);

/** growWebhook answers 401 to any call without this header carrying GROW_PROXY_SECRET. */
export const PROXY_SECRET_HEADER = "x-grow-proxy-secret";

export type GrowNotifyEnv = { supabaseUrl: string | undefined; proxySecret: string | undefined };

export type GrowNotifyDecision =
  | { kind: "forward"; destination: string; headers: Headers }
  | { kind: "denied"; ip: string }
  | { kind: "unconfigured" };

/**
 * The caller's address as Vercel saw it. Unlike clientIp (rate limiting),
 * x-forwarded-for is never read: off Vercel nothing here is trustworthy, so
 * the answer is "unknown" and the call is denied.
 */
function platformIp(headers: Headers): string {
  return headers.get("x-vercel-forwarded-for")?.trim() || headers.get("x-real-ip")?.trim() || "unknown";
}

export function growNotifyDecision(headers: Headers, env: GrowNotifyEnv): GrowNotifyDecision {
  const base = env.supabaseUrl?.trim().replace(/\/+$/, "");
  const secret = env.proxySecret?.trim();
  if (!base || !secret) return { kind: "unconfigured" };

  const ip = platformIp(headers);
  if (!GROW_IPS.has(ip)) return { kind: "denied", ip };

  const forwarded = new Headers(headers);
  forwarded.set(PROXY_SECRET_HEADER, secret);
  return { kind: "forward", destination: `${base}/functions/v1/growWebhook`, headers: forwarded };
}
