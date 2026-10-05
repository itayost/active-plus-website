import { expect, type Page, type Route } from "@playwright/test";
import { OTP_LENGTH } from "../../lib/funnel/constants";
import { COPY } from "../../lib/funnel/copy";
import { CHECKOUT_COPY as C } from "../../lib/payment/copy";
import { GOOD_CODE } from "./supabase-stub";

/*
  Shared by the checkout specs (checkout-*.spec.ts, payment-success.spec.ts):
  stubbed Supabase and a stubbed Grow page, so no request leaves the machine
  and nothing is charged. createGrowPayment and checkUserSubscription are
  answered here; the redirect to Grow lands on a local stub page. Alerts are
  matched by text: Next's route announcer is a second, empty role="alert" on
  every page.
*/

export const GROW_URL = "https://sandbox.meshulam.co.il/s/e2e-hosted-page";
const WP = "0f8b6c2e-9a41-4d3b-8e57-1c2d3e4f5a6b";
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "POST, OPTIONS",
};

export type Reply = { status: number; body: unknown };
export const OK: Reply = { status: 200, body: { url: GROW_URL, webPaymentId: WP } };

export const fulfil = (route: Route, reply: Reply) =>
  route.request().method() === "OPTIONS"
    ? route.fulfill({ status: 204, headers: CORS })
    : route.fulfill({ status: reply.status, headers: CORS, contentType: "application/json", body: JSON.stringify(reply.body) });

/** Registered after stubSupabase, so these run first. Returns the createGrowPayment bodies sent. */
export async function stubFunctions(page: Page, create: Reply = OK, access: Reply = { status: 200, body: { hasAccess: true } }) {
  const sent: unknown[] = [];
  await page.route(/\/functions\/v1\/createGrowPayment$/, (route) => {
    if (route.request().method() === "POST") sent.push(route.request().postDataJSON());
    return fulfil(route, create);
  });
  await page.route(/\/functions\/v1\/checkUserSubscription$/, (route) => fulfil(route, access));
  await page.route(`${new URL(GROW_URL).origin}/**`, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Grow</title><h1>Grow</h1>" }));
  return sent;
}

export async function openCheckout(page: Page, plan: "annual" | "monthly" = "annual") {
  await page.goto(`/payment?plan=${plan}`);
  await page.getByRole("button", { name: "המשך לרכישה" }).click();
  await expect(page.getByRole("heading", { name: C.heading })).toBeVisible();
}

export async function signUp(page: Page, name = "רחל כהן", email = "r@example.com") {
  await page.getByLabel(C.nameTitle).fill(name);
  await page.getByRole("button", { name: C.next }).click();
  await page.getByLabel(C.emailTitle).fill(email);
  await page.getByRole("button", { name: C.next }).click();
  await page.getByLabel(COPY.register.phoneLabel, { exact: true }).fill("0501234567");
  await page.getByRole("button", { name: COPY.register.phoneCta }).click();
  await page.getByLabel(COPY.otp.codeLabel.replace("{n}", String(OTP_LENGTH))).fill(GOOD_CODE);
  await expect(page.getByRole("heading", { name: C.summaryTitle })).toBeVisible();
}

export const SIGN_UP_STUB = { profileName: null, profileAfterMerge: "רחל כהן" };
