/**
 * Client IP for rate limiting.
 *
 * x-vercel-forwarded-for is set by the platform and cannot be spoofed by the
 * caller. The leftmost value of x-forwarded-for CAN be: a client that sends
 * its own header has its value preserved ahead of the real address, so reading
 * [0] lets anyone reset their own rate-limit bucket at will.
 */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-vercel-forwarded-for")?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    // Last resort off-Vercel: take the RIGHTMOST entry, the one appended by the
    // closest proxy, rather than the client-controllable leftmost.
    headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
    "unknown"
  );
}
