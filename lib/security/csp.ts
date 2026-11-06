/**
 * The site's Content-Security-Policy. Outside /payment everything the pages
 * load is first-party: next/font self-hosts the fonts, the hero video and
 * images are served from the site, and the only cross-origin calls go to
 * Supabase (auth, REST, edge functions), allowed by its exact origin. The monthly plan is a
 * full-page redirect to Grow's hosted page (D1): top-level navigation is
 * outside CSP, and the target is checked by isGrowHostedUrl on the server and
 * in the browser. The annual plan opens Grow's wallet SDK over /payment, so
 * that page alone (growWallet) also allows the hosts the SDK uses, its
 * fonts included. Once the site has a Google Tag Manager container, every
 * page (tags) also allows the hosts its tags use: TAG_SOURCES below.
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
 * Grow's Apple Pay script, which Grow requires in the head of the page where
 * payment starts. It relays Apple Pay for a Grow page inside an iframe; the
 * wallet (mp.min.js 1.4.1) opens its ApplePaySession itself and does not call
 * it.
 */
export const GROW_APPLE_PAY_SDK_URL = "https://meshulam.co.il/_media/js/apple_pay_sdk/sdk.min.js";

/**
 * What Grow's wallet SDK loads, read from its scripts (gs.min.js, the runtime
 * mp.min.js and its config/params.json), for both its DEV and PRODUCTION
 * environments: the loader, runtime, stylesheet and fonts on the CDN; its API
 * (sdk., or dev. in DEV), analytics (ga.) and PayBox (paybox.grow.security);
 * the card form, a frame from Grow; and Google Pay, which it offers, read
 * from pay.js: pay.google.com, and pay.sandbox.google.com in its TEST
 * environment. Chrome fetches Google Pay's method manifest at google.com/pay,
 * which redirects to www.google.com/pay, so connect-src needs both; when it
 * is blocked the wallet drops Google Pay, and with no method left it does
 * not open. The card form inside the wallet is a CreditGuard (Hyp) frame
 * whose host Grow's doPayment returns (ppsuat. in test); Hyp documents
 * https://*.creditguard.co.il for it, the policy's only wildcard.
 */
const GROW_CDN = "https://cdn.meshulam.co.il";
const GOOGLE_PAY = ["https://pay.google.com", "https://pay.sandbox.google.com"] as const;
const GOOGLE_PAY_MANIFEST = ["https://google.com/pay", "https://www.google.com/pay"] as const;
const CREDITGUARD_FRAME = "https://*.creditguard.co.il";
export const GROW_WALLET_SOURCES = {
  script: [GROW_CDN, GOOGLE_PAY[0], GROW_APPLE_PAY_SDK_URL],
  style: [GROW_CDN],
  font: [GROW_CDN],
  img: [GROW_CDN, "https://www.gstatic.com", ...GOOGLE_PAY],
  connect: [
    GROW_CDN, "https://sdk.meshulam.co.il", "https://dev.meshulam.co.il", "https://ga.meshulam.co.il",
    "https://paybox.grow.security", "https://devpaybox.grow.security", ...GOOGLE_PAY, ...GOOGLE_PAY_MANIFEST,
  ],
  frame: ["https://sdk.meshulam.co.il", "https://dev.meshulam.co.il", ...GROW_HOSTED_ORIGINS, ...GOOGLE_PAY, CREDITGUARD_FRAME],
} as const;

/**
 * What the Google Tag Manager container may load, allowed only when the site
 * has a container (NEXT_PUBLIC_GTM_ID, lib/analytics/gtm.ts); the container
 * itself loads only after the cookie notice is accepted. Every tag lives in
 * the container, so this list is what a tag there can reach; a tag from any
 * other vendor is blocked until its hosts are added here (docs/measurement-gtm.he.md).
 * From Google's and Meta's CSP guides:
 *
 * - Tag Manager, and its preview mode (Tag Assistant: tagmanager.google.com,
 *   its stylesheet and fonts, gstatic images).
 * - GA4: its collection hosts are regional (region1.google-analytics.com,
 *   region1.analytics.google.com), so Google documents them as wildcards, the
 *   policy's only ones besides CreditGuard's frame. stats.g.doubleclick.net is
 *   GA4 with Google signals.
 * - Google Ads conversions and remarketing: googleadservices, googleads and
 *   td/bid.doubleclick.net (frames), google.com and google.co.il (the country
 *   domain its beacons use here), pagead2.googlesyndication.com.
 * - The Meta Pixel: its script and config on connect.facebook.net, events to
 *   www.facebook.com.
 *
 * Not allowed: 'unsafe-eval', which GTM's "Custom JavaScript" variables need.
 * The container should not use them.
 */
const GTM = "https://www.googletagmanager.com";
const GTM_PREVIEW = "https://tagmanager.google.com";
const GA4_COLLECT = ["https://*.google-analytics.com", "https://*.analytics.google.com"] as const;
const GOOGLE_ADS = ["https://www.googleadservices.com", "https://googleads.g.doubleclick.net"] as const;
const GOOGLE_BEACONS = ["https://www.google.com", "https://www.google.co.il"] as const;
const META_SCRIPT = "https://connect.facebook.net";
const META_EVENTS = "https://www.facebook.com";
export const TAG_SOURCES = {
  script: [GTM, GTM_PREVIEW, META_SCRIPT, ...GOOGLE_ADS, GOOGLE_BEACONS[0]],
  style: [GTM_PREVIEW, "https://fonts.googleapis.com"],
  font: ["https://fonts.gstatic.com", "data:"],
  img: [GTM, "https://ssl.gstatic.com", "https://www.gstatic.com", GA4_COLLECT[0], META_EVENTS, ...GOOGLE_ADS, ...GOOGLE_BEACONS, "https://td.doubleclick.net"],
  connect: [
    GTM, ...GA4_COLLECT, "https://stats.g.doubleclick.net", META_EVENTS, META_SCRIPT, ...GOOGLE_ADS, ...GOOGLE_BEACONS,
    "https://pagead2.googlesyndication.com",
  ],
  frame: [GTM, "https://td.doubleclick.net", "https://bid.g.doubleclick.net"],
} as const;

type Sources = { readonly [K in "script" | "style" | "font" | "img" | "connect" | "frame"]: readonly string[] };

export function buildCsp(supabaseUrl: string | undefined, options: { growWallet?: boolean; tags?: boolean } = {}): string {
  const supabase = originOf(supabaseUrl);
  const extra = (key: keyof Sources): readonly string[] => {
    const all = [...(options.growWallet ? GROW_WALLET_SOURCES[key] : []), ...(options.tags ? TAG_SOURCES[key] : [])];
    // The checkout and the tags share a few hosts (www.gstatic.com): each is listed once.
    return [...new Set(all)];
  };
  const frames = extra("frame");
  const directives: readonly (readonly [string, readonly string[]])[] = [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'", "'unsafe-inline'", ...extra("script")]],
    ["style-src", ["'self'", "'unsafe-inline'", ...extra("style")]],
    ["img-src", ["'self'", "data:", "blob:", ...extra("img")]],
    ["font-src", ["'self'", ...extra("font")]],
    ["media-src", ["'self'"]],
    ["connect-src", ["'self'", ...(supabase ? [supabase] : []), ...extra("connect")]],
    ["frame-src", frames.length > 0 ? frames : ["'none'"]],
    ["frame-ancestors", ["'none'"]],
    ["form-action", ["'self'", ...GROW_HOSTED_ORIGINS]],
    ["base-uri", ["'self'"]],
    ["object-src", ["'none'"]],
  ];
  return directives.map(([name, values]) => [name, ...values].join(" ")).join("; ");
}
