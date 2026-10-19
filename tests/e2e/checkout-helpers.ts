import { expect, type Page, type Route } from "@playwright/test";
import { OTP_LENGTH } from "../../lib/funnel/constants";
import { COPY } from "../../lib/funnel/copy";
import { CHECKOUT_COPY as C } from "../../lib/payment/copy";
import { GOOD_CODE } from "./supabase-stub";

/*
  Shared by the checkout specs (checkout-*.spec.ts, payment-success.spec.ts):
  stubbed Supabase and a stubbed Grow page, so no request leaves the machine
  and nothing is charged. createGrowPayment and checkUserSubscription are
  answered here; the redirect to Grow lands on a local stub page, and Grow's
  wallet SDK is a stub served at its real CDN address (so the page's CSP
  still applies) that the test drives through window.__grow. Alerts are
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
export const WALLET_OK: Reply = { status: 200, body: { authCode: "e2e-auth-code", walletEnvironment: "DEV", webPaymentId: WP } };
const GROW_SDK = "https://cdn.meshulam.co.il/sdk/gs.min.js";

/** Grow's SDK, stubbed: records init and render, opens at once, and leaves the outcome to the test. */
const FAKE_SDK = `window.growPayment = {
  init: async (config) => {
    window.__grow = { environment: config.environment, version: config.version, events: config.events, rendered: [] };
    window.growRuntime = {};
  },
  renderPaymentOptions: (code) => {
    window.__grow.rendered.push(code);
    window.__grow.events.onWalletChange("open");
  },
};`;

type GrowStub = { environment: string; version: number; rendered: string[]; events: Record<string, (payload?: unknown) => void> };

/** What the stub SDK was given: [environment, version, authCodes rendered]. */
export const walletSeen = (page: Page) =>
  page.evaluate(() => {
    const grow = (window as unknown as { __grow?: GrowStub }).__grow;
    return grow ? [grow.environment, grow.version, grow.rendered] : null;
  });

/** Fires one of the SDK's events, as Grow's wallet would. */
export const walletEvent = (page: Page, name: string, payload?: unknown) =>
  page.evaluate(([event, data]) => (window as unknown as { __grow: GrowStub }).__grow.events[event as string](data), [name, payload] as const);

export const fulfil = (route: Route, reply: Reply) =>
  route.request().method() === "OPTIONS"
    ? route.fulfill({ status: 204, headers: CORS })
    : route.fulfill({ status: reply.status, headers: CORS, contentType: "application/json", body: JSON.stringify(reply.body) });

/**
 * Registered after stubSupabase, so these run first. Returns the
 * createGrowPayment bodies sent. Without a create reply, each plan gets what
 * the function answers it: annual the wallet's authCode, monthly the hosted page.
 */
export async function stubFunctions(page: Page, create?: Reply, access: Reply = { status: 200, body: { hasAccess: true } }) {
  const sent: unknown[] = [];
  await page.route(/\/functions\/v1\/createGrowPayment$/, (route) => {
    const body = route.request().method() === "POST" ? route.request().postDataJSON() : null;
    if (body) sent.push(body);
    return fulfil(route, create ?? ((body as { plan?: string } | null)?.plan === "MONTHLY" ? OK : WALLET_OK));
  });
  await page.route(GROW_SDK, (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: FAKE_SDK }));
  await page.route(/\/functions\/v1\/checkUserSubscription$/, (route) => fulfil(route, access));
  await page.route(`${new URL(GROW_URL).origin}/**`, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Grow</title><h1>Grow</h1>" }));
  return sent;
}

/** The plan cards' own buttons: they choose the plan and open the checkout. */
export const PLAN_CTA = { annual: "לבחירת המנוי השנתי", monthly: "לבחירה" } as const;

export async function openCheckout(page: Page, plan: "annual" | "monthly" = "annual") {
  await page.goto(`/payment?plan=${plan}`);
  await page.getByRole("button", { name: PLAN_CTA[plan], exact: true }).click();
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
