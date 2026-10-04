/**
 * In-memory fixed-window rate limiter, one bucket per key. Per server
 * instance, which is enough to blunt abuse without a shared store.
 */
const SWEEP_ABOVE = 200;

export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }) {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return function isRateLimited(key: string): boolean {
    const now = Date.now();

    if (buckets.size > SWEEP_ABOVE) {
      for (const [k, entry] of buckets) {
        if (now > entry.resetAt) buckets.delete(k);
      }
    }

    const entry = buckets.get(key);
    if (!entry || now > entry.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }
    if (entry.count >= max) return true;

    entry.count += 1;
    return false;
  };
}
