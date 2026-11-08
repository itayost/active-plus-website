import type { NextConfig } from "next";
import { LEGACY_REDIRECTS } from "./lib/redirects";
import { HOST_REDIRECTS } from "./lib/domains";
import { MEDIA_CACHE_RULES } from "./lib/cache-headers";
import { buildCsp, GROW_WALLET_SOURCES } from "./lib/security/csp";
import { gtmId } from "./lib/analytics/gtm";

// Production builds only (next build / next start, which is also what the e2e
// serves): next dev needs eval and a websocket the policy does not allow.
const PRODUCTION = process.env.NODE_ENV === "production";
// The tag hosts are allowed only when the site has a GTM container (lib/analytics/gtm.ts).
const tags = gtmId() !== null;
const csp = (growWallet: boolean) =>
  PRODUCTION ? [{ key: "Content-Security-Policy", value: buildCsp(process.env.NEXT_PUBLIC_SUPABASE_URL, { growWallet, tags }) }] : [];
const permissions = (payment: string) => ({
  key: "Permissions-Policy",
  value: `camera=(), microphone=(), geolocation=(), payment=${payment}`,
});

const nextConfig: NextConfig = {
  // The e2e builds (playwright configs) write to their own folders, so their
  // stub Supabase env never overwrites the local .next. Unset everywhere
  // else, including Vercel, so production builds keep the default.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async redirects() {
    // Host redirects first: on the old domain, a legacy path goes straight to
    // the new apex and is then mapped there, never resolved on the old host.
    return [...HOST_REDIRECTS, ...LEGACY_REDIRECTS.map((r) => ({ ...r, permanent: true }))];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          permissions("()"),
          ...csp(false),
        ],
      },
      // Checkout only: Grow's wallet SDK opens over this page (its CDN, API and
      // card frame, and Google Pay), and Grow's Apple Pay script loads here. The
      // Payment Request API is delegated to Google Pay and Grow's frames, which
      // may offer it. A later rule wins for the same header key. These apply
      // only when /payment is a document load (lib/funnel/constants.ts).
      {
        source: "/payment",
        headers: [permissions(`(self ${GROW_WALLET_SOURCES.frame.map((origin) => `"${origin}"`).join(" ")})`), ...csp(true)],
      },
      // Apple's domain file has no extension, so it would go out as
      // application/octet-stream and, with nosniff, browsers download it. Grow
      // checks it in a browser, so it is served as the text it is.
      {
        source: "/.well-known/apple-developer-merchantid-domain-association",
        headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
      },
      ...MEDIA_CACHE_RULES,
    ];
  },
};

export default nextConfig;
