/**
 * Anonymous page views for the admin dashboard (owner, 2026-11-23): which pages
 * people see, for how long, on which kind of phone, and which links they tap.
 * No cookie, nothing in browser storage, no IP or user agent kept: the device
 * kind is worked out here from the user agent, which is then dropped.
 */

export const MAX_PAGE_VIEW_BODY_BYTES = 1024;
/** A page left open longer than this counts as this long. */
export const MAX_SECONDS = 1800;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const AD_ID = /^\d{6,30}$/;
const TARGET = /^[a-z0-9_:./\-]{1,80}$/i;

export type Device = "phone" | "tablet" | "desktop";
export type Os = "ios" | "android" | "windows" | "mac" | "other";

export type PageViewMessage =
  | {
      t: "view";
      id: string;
      visit: string;
      path: string;
      referrerHost: string | null;
      fromMeta: boolean;
      metaAdId: string | null;
    }
  | { t: "end"; id: string; visit: string; seconds: number }
  | { t: "click"; id: string; visit: string; path: string; target: string };

const str = (v: unknown) => (typeof v === "string" ? v : null);

/** A page path as we store it: no query, no hash, at most 200 characters, starts with "/". */
export function cleanPath(v: unknown): string | null {
  const s = str(v);
  if (!s || !s.startsWith("/") || s.startsWith("//")) return null;
  const path = s.split(/[?#]/)[0].slice(0, 200);
  return /^[\w\-./%~]*$/.test(path) ? path : null;
}

function cleanHost(v: unknown): string | null {
  const s = str(v)?.toLowerCase().trim() ?? "";
  return /^[a-z0-9.-]{1,100}$/.test(s) ? s : null;
}

export function parsePageView(raw: unknown): PageViewMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = str(o.id);
  const visit = str(o.visit);
  if (!id || !visit || !UUID.test(id) || !UUID.test(visit)) return null;

  if (o.t === "view") {
    const path = cleanPath(o.path);
    if (!path) return null;
    const ad = str(o.ad);
    return {
      t: "view",
      id,
      visit,
      path,
      referrerHost: cleanHost(o.ref),
      fromMeta: o.meta === true,
      metaAdId: ad && AD_ID.test(ad) ? ad : null,
    };
  }
  if (o.t === "end") {
    const n = Number(o.seconds);
    if (!Number.isFinite(n) || n < 0) return null;
    return { t: "end", id, visit, seconds: Math.min(MAX_SECONDS, Math.round(n)) };
  }
  if (o.t === "click") {
    const path = cleanPath(o.path);
    const target = str(o.target);
    if (!path || !target || !TARGET.test(target)) return null;
    return { t: "click", id, visit, path, target };
  }
  return null;
}

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|pingdom|vercel/i;

export function isBot(ua: string): boolean {
  return ua.length === 0 || BOT.test(ua);
}

export function deviceOf(ua: string): { device: Device; os: Os } {
  const ipad = /iPad/.test(ua) || (/Macintosh/.test(ua) && /Mobile\//.test(ua));
  const ios = ipad || /iPhone|iPod/.test(ua);
  const android = /Android/.test(ua);
  const os: Os = ios ? "ios" : android ? "android" : /Windows/.test(ua) ? "windows" : /Mac OS X|Macintosh/.test(ua) ? "mac" : "other";
  const tablet = ipad || (android && !/Mobile/.test(ua)) || /Tablet/.test(ua);
  const phone = !tablet && (ios || (android && /Mobile/.test(ua)) || /Mobi/.test(ua));
  return { device: tablet ? "tablet" : phone ? "phone" : "desktop", os };
}

/** What a tapped link points at, never a number or a query: a path, a store, or a host. */
export function linkTarget(href: string, siteOrigin: string): string | null {
  if (href.startsWith("tel:")) return "tel";
  if (href.startsWith("mailto:")) return "mail";
  let url: URL;
  try {
    url = new URL(href, siteOrigin);
  } catch {
    return null;
  }
  if (url.origin === siteOrigin) return cleanPath(url.pathname) ?? null;
  const host = url.hostname.toLowerCase();
  if (host === "apps.apple.com") return "store:app_store";
  if (host === "play.google.com") return "store:google_play";
  if (host === "wa.me" || host.endsWith("whatsapp.com")) return "whatsapp";
  return cleanHost(host)?.slice(0, 80) ?? null;
}

/** The visit came from a Meta ad: Meta's click id or a Facebook/Instagram utm_source. */
export function fromMetaAd(search: URLSearchParams): boolean {
  if (search.has("fbclid")) return true;
  return /^(facebook|fb|instagram|ig|meta)$/i.test(search.get("utm_source") ?? "");
}
