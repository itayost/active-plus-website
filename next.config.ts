import type { NextConfig } from "next";
import { LEGACY_REDIRECTS } from "./lib/redirects";
import { MEDIA_CACHE_RULES } from "./lib/cache-headers";

const nextConfig: NextConfig = {
  // The e2e build (playwright.config) writes to its own folder, so its stub
  // Supabase env never overwrites the local .next. Unset everywhere else,
  // including Vercel, so production builds keep the default.
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
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      ...MEDIA_CACHE_RULES,
    ];
  },
};

export default nextConfig;
