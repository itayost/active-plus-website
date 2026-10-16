/**
 * Old URLs mapped to where their content now lives (v1 pages, and the
 * how-it-works page the handoff redesign folded into /research).
 * Permanent: these URLs are in search results and in links people sent each
 * other on WhatsApp.
 *
 * PROTECTED_PATHS are registered in the App Store and Google Play listings
 * (account deletion is a store requirement). They must never appear as a
 * redirect source; tests/unit/redirects.test.ts enforces it.
 */
export const PROTECTED_PATHS = ["/delete-account", "/privacy-policy"] as const;

export const LEGACY_REDIRECTS: readonly { source: string; destination: string }[] = [
  { source: "/how-it-works", destination: "/research" },
  { source: "/dual-tasking", destination: "/research" },
  { source: "/faq", destination: "/#faq" },
  { source: "/pricing", destination: "/payment" },
  { source: "/articles/improve-memory-after-50", destination: "/articles/memory-after-50" },
  { source: "/articles/balance-after-50", destination: "/articles/body-after-50" },
  { source: "/articles/brain-plasticity-dual-tasking", destination: "/articles/brain-and-movement" },
];
