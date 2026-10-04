import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/*
  The lead form writes to the CRM's production table, so no request in this
  file may reach the server action. Every POST is answered here with a
  hand-built server-action payload (the same two-line flight format Next
  returns), or aborted to simulate a dropped connection.
*/
const BUILD_ID = readFileSync(".next/BUILD_ID", "utf8").trim();

type LeadResult =
  | { status: "success"; message: string }
  | { status: "error"; message?: string; fields?: Record<string, string> };

const actionPayload = (result: LeadResult) =>
  `0:${JSON.stringify({ a: "$@1", f: "", b: BUILD_ID })}\n1:${JSON.stringify(result)}\n`;

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

test.beforeEach(async ({ page }) => {
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
