import { STORE_ANDROID, STORE_IOS } from "./constants";

/** The phones the download link sends straight to a store; anything else gets the page with both buttons. */
export type Platform = "ios" | "android";

/**
 * Which store a visitor's phone uses, from its User-Agent. iPadOS 13+ Safari reports a Mac, so an iPad
 * lands on the page with both buttons, which still works. In-app browsers (Facebook, Instagram, WhatsApp)
 * keep the phone's own tokens, so they are recognised too.
 */
export function platformOf(userAgent: string | null | undefined): Platform | null {
  if (!userAgent) return null;
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  return null;
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/**
 * The store address for a platform. On Android the link's utm_* labels travel to the app as the Play
 * install referrer, which the app already reads for ad attribution; the App Store has no equivalent
 * without an Apple provider token, so the iPhone gets the plain store page.
 */
export function storeUrlFor(platform: Platform, params?: URLSearchParams): string {
  if (platform === "ios") return STORE_IOS;
  const utm = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const value = params?.get(key);
    if (value) utm.set(key, value.slice(0, 100));
  }
  // The one-time code that signs the new app in (owner, 2026-11-21), read from the install referrer.
  const signin = params?.get("signin");
  if (signin && /^[A-Za-z0-9_-]{43}$/.test(signin)) utm.set("signin", signin);
  const referrer = utm.toString();
  return referrer ? `${STORE_ANDROID}&referrer=${encodeURIComponent(referrer)}` : STORE_ANDROID;
}
