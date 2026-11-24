/**
 * Every new entry to the questionnaire starts at its first page (owner, 2026-11-21: "לא משנה
 * מאיפה נכנסת, אתה מגיע תמיד לדף הראשון"). The saved step is resumed only within the same
 * visit: a reload, the browser's back or forward, or a return in the same tab.
 */
export const VISIT_FLAG = "ap.funnel.visit";

type NavType = "navigate" | "reload" | "back_forward" | "prerender" | string;

/** Pure rule, for tests: resume only inside the same visit. */
export function mayResume(navType: NavType | null, sameTabVisit: boolean): boolean {
  return sameTabVisit || navType === "reload" || navType === "back_forward";
}

function navigationType(): NavType | null {
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return nav?.type ?? null;
  } catch {
    return null;
  }
}

function sameTabVisit(): boolean {
  try {
    return sessionStorage.getItem(VISIT_FLAG) === "1";
  } catch {
    return false;
  }
}

/** Read once when the questionnaire mounts, then marks this tab as inside a visit. */
export function canResumeHere(): boolean {
  const resume = mayResume(navigationType(), sameTabVisit());
  try {
    sessionStorage.setItem(VISIT_FLAG, "1");
  } catch {
    // Blocked storage: the next mount starts at the first page, which is the safe side.
  }
  return resume;
}

/**
 * Back to the payment page (owner, 2026-11-21) only on a fresh entry, never on the browser's back
 * (owner, 2026-11-24: a visitor pressing back on the payment page landed on the questionnaire,
 * was sent straight to the payment page again, and could not leave: 11 loads in 5 seconds). Also
 * at most once in 30 seconds in a tab, for in-app browsers that report a back as a new load.
 */
export const PAYMENT_JUMP_AT = "ap.funnel.payment_jump_at";
const JUMP_GAP_MS = 30_000;

/** Pure rule, for tests. */
export function mayJumpToPayment(navType: NavType | null, lastJumpAt: number | null, now: number): boolean {
  if (navType === "back_forward") return false;
  return lastJumpAt === null || now - lastJumpAt > JUMP_GAP_MS;
}

/** Whether this mount may send the visitor on to the payment page. */
export function canJumpToPayment(now = Date.now()): boolean {
  let last: number | null = null;
  try {
    const raw = Number(sessionStorage.getItem(PAYMENT_JUMP_AT));
    last = Number.isFinite(raw) && raw > 0 ? raw : null;
  } catch {
    last = null;
  }
  return mayJumpToPayment(navigationType(), last, now);
}

/** Called right before the jump, so the next mount in this tab within the gap stays. */
export function markJumpToPayment(now = Date.now()): void {
  try {
    sessionStorage.setItem(PAYMENT_JUMP_AT, String(now));
  } catch {
    // Blocked storage: the back-button rule still holds.
  }
}
