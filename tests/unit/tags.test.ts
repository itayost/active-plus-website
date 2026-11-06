import { describe, expect, it, vi } from "vitest";
import { FUNNEL_STEP_TOTAL, purchaseEvent, pushTag, pushTagThen, tagEventFor } from "@/lib/analytics/tags";
import { FUNNEL_STEPS } from "@/lib/funnel/contract.generated";
import { ACTION_EVENTS, VIEW_EVENT } from "@/lib/funnel/events";

describe("tagEventFor", () => {
  it("numbers every funnel screen but payment, in the funnel's order", () => {
    expect(FUNNEL_STEP_TOTAL).toBe(FUNNEL_STEPS.length - 1);
    FUNNEL_STEPS.filter((step) => step !== "payment").forEach((step, index) => {
      expect(tagEventFor(VIEW_EVENT[step])).toEqual({ event: "funnel_step", step_number: index + 1, step_total: FUNNEL_STEP_TOTAL });
    });
    expect(tagEventFor(VIEW_EVENT.welcome2)).toMatchObject({ step_number: 1 });
    expect(tagEventFor(VIEW_EVENT.otp)).toMatchObject({ step_number: FUNNEL_STEP_TOTAL });
  });
  it("makes the payment page begin_checkout, and the start and plan screens their own events", () => {
    expect(tagEventFor(VIEW_EVENT.payment)).toEqual({ event: "begin_checkout" });
    expect(tagEventFor("welcome2_continue")).toEqual({ event: "funnel_start" });
    expect(tagEventFor("plan_build_complete")).toEqual({ event: "questionnaire_complete" });
  });
  it("sends nothing for taps that are not funnel milestones", () => {
    for (const event of ["register_name_submit", "register_submit", "otp_resend_tap", "otp_edit_phone_tap", "otp_verified", "social_proof_continue"] as const) {
      expect(tagEventFor(event)).toBeNull();
    }
  });
  it("never names a screen: the questionnaire asks about balance, memory and pain", () => {
    const sent = JSON.stringify([...Object.values(VIEW_EVENT), ...ACTION_EVENTS].map((event) => tagEventFor(event)));
    for (const step of FUNNEL_STEPS) expect(sent).not.toContain(step);
    for (const name of Object.values(VIEW_EVENT)) expect(sent).not.toContain(name);
    expect(sent).not.toMatch(/memory|chair|pain|balance|standing|sedentary/i);
  });
});

describe("purchaseEvent", () => {
  it("is GA4's ecommerce purchase, in shekels, keyed by the payment id", () => {
    expect(purchaseEvent({ webPaymentId: "wp_123", plan: "annual", value: 709 })).toEqual({
      event: "purchase",
      ecommerce: {
        transaction_id: "wp_123",
        value: 709,
        currency: "ILS",
        items: [{ item_id: "annual", item_name: "מנוי שנתי", price: 709, quantity: 1 }],
      },
    });
  });
});

describe("pushTag", () => {
  it("creates the dataLayer and pushes the event", () => {
    const win: { dataLayer?: unknown[] } = {};
    pushTag({ event: "sign_up", method: "phone" }, win);
    expect(win.dataLayer).toEqual([{ event: "sign_up", method: "phone" }]);
  });
  it("clears the previous ecommerce object before a purchase", () => {
    const win: { dataLayer?: unknown[] } = { dataLayer: [{ event: "begin_checkout" }] };
    const purchase = purchaseEvent({ webPaymentId: "wp_1", plan: "monthly", value: 59.9 });
    pushTag(purchase, win);
    expect(win.dataLayer).toEqual([{ event: "begin_checkout" }, { ecommerce: null }, purchase]);
  });
  it("ignores null and never throws, also with no window", () => {
    const win: { dataLayer?: unknown[] } = {};
    pushTag(null, win);
    expect(win.dataLayer).toBeUndefined();
    expect(() => pushTag({ event: "begin_checkout" })).not.toThrow();
    const frozen = Object.freeze({ dataLayer: Object.freeze([]) as unknown as unknown[] });
    expect(() => pushTag({ event: "begin_checkout" }, frozen)).not.toThrow();
  });
});

describe("pushTagThen", () => {
  it("without GTM on the page, pushes and moves on at once", () => {
    const win: { dataLayer?: unknown[] } = {};
    const next = vi.fn();
    pushTagThen({ event: "sign_up", method: "phone" }, next, win);
    expect(next).toHaveBeenCalledTimes(1);
    expect(win.dataLayer).toEqual([{ event: "sign_up", method: "phone" }]);
  });
  it("with GTM, waits for its eventCallback, and runs next only once", () => {
    vi.useFakeTimers();
    const win: { dataLayer?: unknown[]; google_tag_manager?: unknown } = { google_tag_manager: {} };
    const next = vi.fn();
    pushTagThen({ event: "sign_up", method: "phone" }, next, win, 500);
    expect(next).not.toHaveBeenCalled();
    const pushed = (win.dataLayer ?? [])[0] as { event: string; eventTimeout: number; eventCallback: () => void };
    expect(pushed).toMatchObject({ event: "sign_up", method: "phone", eventTimeout: 500 });
    pushed.eventCallback();
    pushed.eventCallback();
    vi.advanceTimersByTime(2000);
    expect(next).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
  it("moves on by its own timer when GTM never calls back", () => {
    vi.useFakeTimers();
    const next = vi.fn();
    pushTagThen({ event: "sign_up", method: "phone" }, next, { google_tag_manager: {} }, 500);
    vi.advanceTimersByTime(699);
    expect(next).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(next).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
