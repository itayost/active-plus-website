/**
 * Google Tag Manager. Every measurement and advertising tag on the site (GA4,
 * the Meta Pixel, Google Ads) is managed inside the GTM container, not in this
 * code; the code only loads the container after the cookie notice is accepted
 * and pushes the funnel's events into the dataLayer (lib/analytics/tags.ts).
 *
 * The container id comes from NEXT_PUBLIC_GTM_ID on Vercel. Without a valid id
 * the site has no notice, no container and no third-party hosts in its CSP.
 */
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]{4,12}$/;

/** The container id, or null when it is missing or not a GTM id. */
export function gtmId(raw: string | undefined = process.env.NEXT_PUBLIC_GTM_ID): string | null {
  const value = raw?.trim().toUpperCase();
  return value && GTM_ID_PATTERN.test(value) ? value : null;
}

export const GTM_SCRIPT_ORIGIN = "https://www.googletagmanager.com";

type DataLayerWindow = Window & { dataLayer?: unknown[] };

const SCRIPT_ATTRIBUTE = "data-gtm-container";

/**
 * Loads the container once per page. Events already in the dataLayer (pushed
 * before the visitor accepted) are read by GTM when it starts, so a visitor who
 * accepts on the fifth question still counts the four before it.
 */
export function loadGtm(id: string, target?: { doc: Document; win: DataLayerWindow }): void {
  try {
    const doc = target?.doc ?? document;
    const win = target?.win ?? (window as DataLayerWindow);
    if (doc.querySelector(`script[${SCRIPT_ATTRIBUTE}]`)) return;
    const dataLayer = (win.dataLayer = win.dataLayer ?? []);
    dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const script = doc.createElement("script");
    script.async = true;
    script.src = `${GTM_SCRIPT_ORIGIN}/gtm.js?id=${encodeURIComponent(id)}`;
    script.setAttribute(SCRIPT_ATTRIBUTE, id);
    doc.head.appendChild(script);
  } catch {
    // Measurement must never break the page.
  }
}
