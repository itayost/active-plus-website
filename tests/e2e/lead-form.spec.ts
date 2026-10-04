import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/*
  The lead form writes to the CRM's production table, so no request in this
  file may reach the server action. Every POST is answered here with a
  hand-built server-action payload (the same two-line flight format Next
  returns), or aborted to simulate a dropped connection.
*/
// Read when a stub first answers, not at import: on a fresh clone .next does
// not exist until Playwright's webServer has built the app.
let buildId: string | undefined;
const getBuildId = () => (buildId ??= readFileSync(".next/BUILD_ID", "utf8").trim());

type LeadResult =
  | { status: "success"; message: string }
  | { status: "error"; message?: string; fields?: Record<string, string> };

const actionPayload = (result: LeadResult) =>
  `0:${JSON.stringify({ a: "$@1", f: "", b: getBuildId() })}\n1:${JSON.stringify(result)}\n`;

const SUCCESS: LeadResult = { status: "success", message: "נחזור אליכם ל-050-1234567 בשעות הפעילות." };

async function stubAction(page: Page, respond: LeadResult | "abort", delayMs = 0) {
  const posts: string[] = [];
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.method() !== "POST") return route.continue();
    posts.push(request.headers()["next-action"] ?? "");
    if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    if (respond === "abort") return route.abort("internetdisconnected");
    return route.fulfill({ status: 200, contentType: "text/x-component", body: actionPayload(respond) });
  });
  return posts;
}

const form = (page: Page) => page.locator("#lead form");
const crashed = (page: Page) => page.getByRole("heading", { name: "משהו השתבש בטעינת הדף" });

/** The real path: focus, type, move on. fill() skips the blur sequence that crashed. */
async function typeNameAndPhone(page: Page, name = "ישראל ישראלי", phone = "0501234567") {
  await form(page).locator('input[name="fullName"]').click();
  await page.keyboard.type(name);
  await form(page).locator('input[name="phone"]').click();
  await page.keyboard.type(phone);
}

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.titlePath.includes("without JavaScript")) return;
  await page.goto("/");
  await form(page).scrollIntoViewIfNeeded();
});

test("a real blur sequence submits once and does not crash the page", async ({ page }) => {
  const posts = await stubAction(page, SUCCESS);
  await typeNameAndPhone(page);
  await form(page).getByRole("button", { name: "שליחה" }).click();

  await expect(page.getByText("תודה, קיבלנו את הפרטים")).toBeVisible();
  await expect(crashed(page)).toHaveCount(0);
  expect(posts).toHaveLength(1);
  expect(posts[0]).not.toBe("");
});

test("a double click on submit sends exactly one lead", async ({ page }) => {
  const posts = await stubAction(page, SUCCESS, 1200);
  await typeNameAndPhone(page);
  const submit = form(page).getByRole("button", { name: "שליחה" });
  await submit.dblclick();
  await expect(form(page).getByRole("button", { name: "שולח…" })).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByText("תודה, קיבלנו את הפרטים")).toBeVisible();
  expect(posts).toHaveLength(1);
});

test("a dropped connection keeps the form, the typed values and a way to retry", async ({ page }) => {
  await stubAction(page, "abort");
  await typeNameAndPhone(page, "שרה-לאה בן-אברהם 🌸 Sarah");
  await form(page).getByRole("button", { name: "שליחה" }).click();

  await expect(form(page).getByRole("alert")).toContainText("לא הצלחנו לשלוח את הפרטים");
  await expect(crashed(page)).toHaveCount(0);
  await expect(form(page).locator('input[name="fullName"]')).toHaveValue("שרה-לאה בן-אברהם 🌸 Sarah");
  await expect(form(page).locator('input[name="phone"]')).toHaveValue("0501234567");

  await page.unrouteAll({ behavior: "wait" });
  const posts = await stubAction(page, SUCCESS);
  await form(page).getByRole("button", { name: "שליחה" }).click();
  await expect(page.getByText("תודה, קיבלנו את הפרטים")).toBeVisible();
  expect(posts).toHaveLength(1);
});

test("offline submit says so without sending anything", async ({ page, context }) => {
  const posts = await stubAction(page, SUCCESS);
  await typeNameAndPhone(page);
  await context.setOffline(true);
  await form(page).getByRole("button", { name: "שליחה" }).click();
  await expect(form(page).getByRole("alert")).toContainText("אין כרגע חיבור לאינטרנט");
  await expect(form(page).locator('input[name="fullName"]')).toHaveValue("ישראל ישראלי");
  expect(posts).toHaveLength(0);
  await context.setOffline(false);
});

test("offline, then back online, a retry sends exactly one lead", async ({ page, context }) => {
  const posts = await stubAction(page, SUCCESS);
  await typeNameAndPhone(page);
  await context.setOffline(true);
  await form(page).getByRole("button", { name: "שליחה" }).click();
  await expect(form(page).getByRole("alert")).toContainText("אין כרגע חיבור לאינטרנט");
  await context.setOffline(false);
  await form(page).getByRole("button", { name: "שליחה" }).click();
  await expect(page.getByText("תודה, קיבלנו את הפרטים")).toBeVisible();
  expect(posts).toHaveLength(1);
});

test("an empty pass through a field keeps the server's required error", async ({ page }) => {
  await stubAction(page, { status: "error", fields: { fullName: "צריך שם מלא כדי שנדע למי לפנות." } });
  await form(page).locator('input[name="phone"]').click();
  await page.keyboard.type("0501234567");
  await form(page).getByRole("button", { name: "שליחה" }).click();
  const name = form(page).locator('input[name="fullName"]');
  await expect(name).toBeFocused();
  await form(page).locator('input[name="phone"]').click(); // blur the still-empty name
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(form(page).getByText("צריך שם מלא כדי שנדע למי לפנות.")).toBeVisible();
});

test("the rate-limit message is shown and the values survive it", async ({ page }) => {
  const message = "נשלחו כמה פניות מהכתובת הזו בשעה האחרונה. אפשר להתקשר אלינו ל-073-729-66-99.";
  await stubAction(page, { status: "error", message });
  await typeNameAndPhone(page);
  await form(page).getByRole("button", { name: "שליחה" }).click();
  await expect(form(page).getByRole("alert")).toHaveText(message);
  await expect(form(page).locator('input[name="phone"]')).toHaveValue("0501234567");
});

test("server field errors focus the first invalid field and keep its value", async ({ page }) => {
  await stubAction(page, { status: "error", fields: { phone: "מספר הטלפון לא נראה תקין. לדוגמה: 050-1234567" } });
  await typeNameAndPhone(page, "ישראל ישראלי", "0501234567");
  await form(page).getByRole("button", { name: "שליחה" }).click();
  const phone = form(page).locator('input[name="phone"]');
  await expect(phone).toBeFocused();
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  await expect(phone).toHaveValue("0501234567");
});

test("a 120-character Hebrew name does not widen the page", async ({ page }) => {
  await stubAction(page, SUCCESS);
  await form(page).locator('input[name="fullName"]').fill("אברהם ".repeat(20).trim());
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test.describe("without JavaScript", () => {
  // Reduced motion turns off html's smooth scrolling, which under parallel
  // load kept the submit button "not stable" for Playwright's click.
  test.use({ javaScriptEnabled: false, reducedMotion: "reduce" });

  test("a valid lead posts to the server action natively", async ({ page }) => {
    // Answered here, never forwarded: a valid lead would reach the CRM table.
    const bodies: string[] = [];
    await page.route("**/*", (route) => {
      const request = route.request();
      if (request.method() !== "POST") return route.continue();
      bodies.push(request.postDataBuffer()?.toString("utf8") ?? "");
      return route.fulfill({ status: 200, contentType: "text/html", body: "<p>stubbed</p>" });
    });
    await page.goto("/");
    await form(page).locator('input[name="fullName"]').fill("ישראל ישראלי");
    await form(page).locator('input[name="phone"]').fill("0501234567");
    await form(page).getByRole("button", { name: "שליחה" }).click();
    await expect(page.getByText("stubbed")).toBeVisible();
    expect(bodies).toHaveLength(1);
    // The native post carries the action's id, which is what lets Next run it.
    expect(bodies[0]).toContain("$ACTION_");
    expect(bodies[0]).toContain("ישראל ישראלי");
  });

  test("a rejected lead comes back as a page with the message and the values", async ({ page }) => {
    // Rejected by validation on the server, which returns before any database
    // code runs, so this request is allowed through to show the real page.
    await page.goto("/");
    await form(page).locator('input[name="fullName"]').fill("ישראל ישראלי");
    await form(page).locator('input[name="phone"]').fill("123");
    await form(page).getByRole("button", { name: "שליחה" }).click();
    await expect(form(page).getByText("מספר הטלפון לא נראה תקין. לדוגמה: 050-1234567")).toBeVisible();
    await expect(form(page).locator('input[name="fullName"]')).toHaveValue("ישראל ישראלי");
    await expect(form(page).locator('input[name="phone"]')).toHaveValue("123");
  });
});
