import type { Page } from "@playwright/test";

/**
 * Collects CSP violations: the console messages (they survive navigation) and
 * securitypolicyviolation events on the current document.
 */
export async function watchCsp(page: Page): Promise<() => Promise<string[]>> {
  const fromConsole: string[] = [];
  page.on("console", (message) => {
    if (/Content Security Policy/i.test(message.text())) fromConsole.push(message.text());
  });
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] };
    w.__csp = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      w.__csp.push(`${event.effectiveDirective} ${event.blockedURI}`);
    });
  });
  return async () => {
    const fromEvents = await page
      .evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? [])
      .catch(() => [] as string[]);
    return [...fromConsole, ...fromEvents];
  };
}
