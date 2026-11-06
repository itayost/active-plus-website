/**
 * The cookie notice (components/consent/CookieConsent). The site loads no
 * measurement or advertising tag until the visitor presses "אישור"; the press
 * is kept on this browser for a year, then the notice shows again. Only an
 * acceptance is ever stored: the notice offers nothing else (the owner's
 * call, 2026-11-06).
 */
export const CONSENT_KEY = "ap.consent.accepted_at";
export const CONSENT_TTL_MS = 365 * 86_400_000;

type Store = Pick<Storage, "getItem" | "setItem">;

function browserStore(): Store | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

/** True when this browser accepted within the last year. Blocked storage reads as not accepted. */
export function hasConsent(now = Date.now(), store: Store | undefined = browserStore()): boolean {
  try {
    const at = Number(store?.getItem(CONSENT_KEY) ?? 0);
    return Number.isFinite(at) && at > 0 && at <= now && now - at < CONSENT_TTL_MS;
  } catch {
    return false;
  }
}

/** Stores the acceptance. With storage blocked it holds for this page only (the caller's state). */
export function saveConsent(now = Date.now(), store: Store | undefined = browserStore()): void {
  try {
    store?.setItem(CONSENT_KEY, String(now));
  } catch {
    // Private mode or blocked storage: the notice shows again on the next page.
  }
}

/** The <html> flag the stylesheet hides the notice by (globals.css). */
export const CONSENT_FLAG = "consent";

/**
 * Inline script placed right before the notice, run while the HTML is still
 * parsing. The notice is in the server's HTML for everyone (so it never pops
 * in and pushes the page down); for a visitor who already accepted this flags
 * <html> before the first paint, and CSS hides the notice. Static text only:
 * no stored value is ever written into the page.
 */
export const CONSENT_SCRIPT =
  `try{var t=Number(localStorage.getItem(${JSON.stringify(CONSENT_KEY)})||0),n=Date.now();` +
  `if(t>0&&t<=n&&n-t<${CONSENT_TTL_MS})document.documentElement.dataset.${CONSENT_FLAG}="accepted"}catch(e){}`;
