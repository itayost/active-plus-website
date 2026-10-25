/**
 * Pages that run full screen, like an app: the questionnaire and the purchase
 * that follows it. They draw their own top row; the site header and footer
 * are left out (components/layout/SiteChrome).
 */
export const FULLSCREEN_PATHS = ["/questionnaire", "/payment", "/payment/success"] as const;

export function isFullscreenPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return (FULLSCREEN_PATHS as readonly string[]).includes(path);
}
