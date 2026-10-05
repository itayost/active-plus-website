import type { NextConfig } from "next";
import { LEGACY_REDIRECTS } from "./lib/redirects";
import { MEDIA_CACHE_RULES } from "./lib/cache-headers";
import { buildCsp } from "./lib/security/csp";

// Production builds only (next build / next start, which is also what the e2e
// serves): next dev needs eval and a websocket the policy does not allow.
const CSP = process.env.NODE_ENV === "production"
  ? [{ key: "Content-Security-Policy", value: buildCsp(process.env.NEXT_PUBLIC_SUPABASE_URL) }]
  : [];

const nextConfig: NextConfig = {
  // The e2e builds (playwright configs) write to their own folders, so their
  // stub Supabase env never overwrites the local .next. Unset everywhere
  // else, including Vercel, so production builds keep the default.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async redirects() {
    return LEGACY_REDIRECTS.map((r) => ({ ...r, permanent: true }));
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          ...CSP,
        ],
      },
      ...MEDIA_CACHE_RULES,
    ];
  },
};

export default nextConfig;
