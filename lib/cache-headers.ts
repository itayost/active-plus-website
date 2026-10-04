/**
 * Browser caching for the files in public/img and public/video.
 *
 * Next serves public files with `max-age=0`, so every repeat visit
 * revalidated the 1.4 MB hero video and every source image. These names are
 * not content-hashed, so they cannot be `immutable`: a client swapping a
 * photo under the same name must see it. A day of freshness plus a week of
 * stale-while-revalidate keeps repeat visits off the network while a replaced
 * file still shows up by the next day.
 *
 * The image optimizer (/_next/image) takes the larger of its own
 * minimumCacheTTL (60 s) and the source's max-age, so this also lifts the
 * optimised variants from one minute to one day.
 */
export const MEDIA_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

export const MEDIA_CACHE_RULES = ["/img/:path*", "/video/:path*"].map((source) => ({
  source,
  headers: [{ key: "Cache-Control", value: MEDIA_CACHE_CONTROL }],
}));
