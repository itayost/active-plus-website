/**
 * The site's Content-Security-Policy. Everything the pages load is
 * first-party: next/font self-hosts the fonts, the hero video and images are
 * served from the site, and the only cross-origin calls go to Supabase (auth,
 * REST, edge functions), allowed by its exact origin. Payment is a full-page
 * redirect to Grow's hosted page (D1), so no Grow script or frame loads here;
 * top-level navigation is outside CSP, and the target is checked by
 * isGrowHostedUrl on the server and in the browser.
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

export function buildCsp(supabaseUrl: string | undefined): string {
  const supabase = originOf(supabaseUrl);
  const directives: readonly (readonly [string, readonly string[]])[] = [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'", "'unsafe-inline'"]],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", "data:", "blob:"]],
    ["font-src", ["'self'"]],
    ["media-src", ["'self'"]],
    ["connect-src", ["'self'", ...(supabase ? [supabase] : [])]],
    ["frame-src", ["'none'"]],
    ["frame-ancestors", ["'none'"]],
    ["form-action", ["'self'", ...GROW_HOSTED_ORIGINS]],
    ["base-uri", ["'self'"]],
    ["object-src", ["'none'"]],
  ];
  return directives.map(([name, values]) => [name, ...values].join(" ")).join("; ");
}
