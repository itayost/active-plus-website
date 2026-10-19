/**
 * The site's Content-Security-Policy. Everything the pages load is
 * first-party: next/font self-hosts the fonts, the hero video and images are
 * served from the site, and the only cross-origin calls go to Supabase (auth,
 * REST, edge functions), allowed by its exact origin. The monthly plan is a
 * full-page redirect to Grow's hosted page (D1): top-level navigation is
 * outside CSP, and the target is checked by isGrowHostedUrl on the server and
 * in the browser. The annual plan opens Grow's wallet SDK over /payment, so
 * that page alone (growWallet) also allows the hosts the SDK uses.
 *
 * script-src keeps 'unsafe-inline': the App Router writes inline
 * self.__next_f.push(...) bootstrap scripts that differ per page and per
 * build, so a hash list cannot cover them, and adding any hash would make
 * browsers ignore 'unsafe-inline' and break every page. The questionnaire's
 * resume script is covered by the same keyword. Moving to a per-request nonce
 * (middleware on every route) is the follow-up if 'unsafe-inline' must go.
 */
export const GROW_HOSTED_ORIGINS = ["https://secure.meshulam.co.il", "https://sandbox.meshulam.co.il"] as const;

function originOf(url: string | undefined): string | null {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
}

/**
 * What Grow's wallet SDK loads, read from its scripts (gs.min.js, the runtime
 * mp.min.js and its config/params.json), for both its DEV and PRODUCTION
 * environments: the loader, runtime and stylesheet on the CDN; its API
 * (sdk., or dev. in DEV), analytics (ga.) and PayBox (paybox.grow.security);
 * the card form, a frame from Grow; and Google Pay, which it offers.
 */
const GROW_CDN = "https://cdn.meshulam.co.il";
const GOOGLE_PAY = "https://pay.google.com";
export const GROW_WALLET_SOURCES = {
  script: [GROW_CDN, GOOGLE_PAY],
  style: [GROW_CDN],
  img: [GROW_CDN, "https://www.gstatic.com"],
  connect: [
    GROW_CDN, "https://sdk.meshulam.co.il", "https://dev.meshulam.co.il", "https://ga.meshulam.co.il",
    "https://paybox.grow.security", "https://devpaybox.grow.security", GOOGLE_PAY,
  ],
  frame: ["https://sdk.meshulam.co.il", "https://dev.meshulam.co.il", ...GROW_HOSTED_ORIGINS, GOOGLE_PAY],
} as const;

export function buildCsp(supabaseUrl: string | undefined, options: { growWallet?: boolean } = {}): string {
  const supabase = originOf(supabaseUrl);
  const wallet = (key: keyof typeof GROW_WALLET_SOURCES): readonly string[] => (options.growWallet ? GROW_WALLET_SOURCES[key] : []);
  const frames = wallet("frame");
  const directives: readonly (readonly [string, readonly string[]])[] = [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'", "'unsafe-inline'", ...wallet("script")]],
    ["style-src", ["'self'", "'unsafe-inline'", ...wallet("style")]],
    ["img-src", ["'self'", "data:", "blob:", ...wallet("img")]],
    ["font-src", ["'self'"]],
    ["media-src", ["'self'"]],
    ["connect-src", ["'self'", ...(supabase ? [supabase] : []), ...wallet("connect")]],
    ["frame-src", frames.length > 0 ? frames : ["'none'"]],
    ["frame-ancestors", ["'none'"]],
    ["form-action", ["'self'", ...GROW_HOSTED_ORIGINS]],
    ["base-uri", ["'self'"]],
    ["object-src", ["'none'"]],
  ];
  return directives.map(([name, values]) => [name, ...values].join(" ")).join("; ");
}
