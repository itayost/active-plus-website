import { expect, test } from "@playwright/test";
import { LEGACY_REDIRECTS, PROTECTED_PATHS } from "../../lib/redirects";

for (const { source, destination } of LEGACY_REDIRECTS) {
  test(`${source} -> ${destination} (301)`, async ({ request }) => {
    const res = await request.get(source, { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(res.headers()["location"]).toContain(destination);
  });
}

for (const path of PROTECTED_PATHS) {
  test(`${path} serves 200 with no redirect`, async ({ request }) => {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });
}

test("delete-account form is usable", async ({ page }) => {
  await page.goto("/delete-account");
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="confirmation"]')).toBeVisible();
});
