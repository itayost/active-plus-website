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
