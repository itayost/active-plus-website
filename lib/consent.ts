/**
 * The cookie notice (components/consent/CookieConsent). The site loads no
 * measurement or advertising tag until the visitor presses "אישור". The
 * notice also offers "לא, תודה" (the owner's call, 2026-11-07, replacing the
 * single button of 2026-11-06): a decline loads nothing and keeps the site as
 * it is. Either choice is kept on this browser for a year, then the notice
 * shows again. Each choice has its own key, so an acceptance stored before
 * the decline existed still counts.
 */
export const CONSENT_KEY = "ap.consent.accepted_at";
export const DECLINE_KEY = "ap.consent.declined_at";
export const CONSENT_TTL_MS = 365 * 86_400_000;

type Store = Pick<Storage, "getItem" | "setItem">;

function browserStore(): Store | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

/** True when `key` holds a time within the last year. Blocked storage reads as no. */
function chosenWithinYear(key: string, now: number, store: Store | undefined): boolean {
  try {
    const at = Number(store?.getItem(key) ?? 0);
    return Number.isFinite(at) && at > 0 && at <= now && now - at < CONSENT_TTL_MS;
  } catch {
    return false;
  }
}

function save(key: string, now: number, store: Store | undefined): void {
  try {
    store?.setItem(key, String(now));
  } catch {
    // Private mode or blocked storage: the notice shows again on the next page.
  }
}

/** True when this browser accepted within the last year: the only state that loads tags. */
export function hasConsent(now = Date.now(), store: Store | undefined = browserStore()): boolean {
  return chosenWithinYear(CONSENT_KEY, now, store);
}

/** True when this browser declined within the last year. */
export function hasDeclined(now = Date.now(), store: Store | undefined = browserStore()): boolean {
  return chosenWithinYear(DECLINE_KEY, now, store);
}

/** Stores the acceptance. With storage blocked it holds for this page only (the caller's state). */
export function saveConsent(now = Date.now(), store: Store | undefined = browserStore()): void {
  save(CONSENT_KEY, now, store);
}

/** Stores the decline, the same way. */
export function saveDecline(now = Date.now(), store: Store | undefined = browserStore()): void {
  save(DECLINE_KEY, now, store);
}

/** The <html> flag the stylesheet hides the notice by (globals.css): "accepted" or "declined". */
export const CONSENT_FLAG = "consent";

/**
 * Inline script placed right before the notice, run while the HTML is still
 * parsing. The notice is in the server's HTML for everyone (so it never pops
 * in); for a visitor who already chose, this flags <html> before the first
 * paint, and CSS hides the notice. An acceptance wins over a decline. Static
 * text only: no stored value is ever written into the page.
 */
export const CONSENT_SCRIPT =
  `try{var n=Date.now(),k=function(x){var t=Number(localStorage.getItem(x)||0);return t>0&&t<=n&&n-t<${CONSENT_TTL_MS}};` +
  `if(k(${JSON.stringify(CONSENT_KEY)}))document.documentElement.dataset.${CONSENT_FLAG}="accepted";` +
  `else if(k(${JSON.stringify(DECLINE_KEY)}))document.documentElement.dataset.${CONSENT_FLAG}="declined"}catch(e){}`;
