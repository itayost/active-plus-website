/**
 * The site's hosts. It moved from activeplus.co.il to peilimplus.co.il on
 * 2026-10-07. Every other host the project answers on redirects permanently
 * to the same path on the new apex, so links already out there (search
 * results, WhatsApp messages, the App Store and Google Play listings, which
 * point at /privacy-policy and /delete-account) keep landing on the right page.
 * Keep the old domain registered while those links exist.
 */
export const CANONICAL_HOST = "peilimplus.co.il";

export const LEGACY_HOSTS = ["activeplus.co.il", "www.activeplus.co.il", "www.peilimplus.co.il"] as const;

export const HOST_REDIRECTS = LEGACY_HOSTS.map((host) => ({
  source: "/:path*",
  has: [{ type: "host" as const, value: host }],
  destination: `https://${CANONICAL_HOST}/:path*`,
  permanent: true,
}));

/**
 * The address Grow calls server to server after a charge (configured once, on
 * Grow's side, at the account level). It lives on our domain so a backend move
 * never needs a change at Grow; the request is forwarded to the function as is.
 */
export const GROW_NOTIFY_PATH = "/api/grow/notify";

export function buildRewrites(supabaseUrl: string | undefined): { source: string; destination: string }[] {
  const base = supabaseUrl?.trim().replace(/\/+$/, "");
  if (!base) return [];
  return [{ source: GROW_NOTIFY_PATH, destination: `${base}/functions/v1/growWebhook` }];
}
