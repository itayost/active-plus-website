import { describe, expect, it, vi } from "vitest";
import {
  checkoutSteps, clearCheckoutDraft, clearCheckoutEmail, onRestoredFromCache, isEmail, isFullName, isGrowHostedUrl, readCheckoutDraft, readCheckoutEmail,
  readPaymentGender, rememberCheckoutEmail, resumableDraft, saveCheckoutDraft, startPayment, toWebPlan, waitForAccess,
} from "@/lib/payment/checkout";

function memoryStorage(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  };
}

const invoker = (result: unknown) => ({ functions: { invoke: vi.fn().mockResolvedValue(result) } });
const httpError = (status: number) => ({ data: null, error: { name: "FunctionsHttpError", context: { status } } });
const INPUT = { plan: "ANNUAL" as const, installments: 6, fullName: "רחל כהן", email: "r@example.com", tokenConsent: false };
const HOSTED = "https://sandbox.meshulam.co.il/s/abc";

describe("checkout steps", () => {
  it("asks for everything when signed out", () => {
    expect(checkoutSteps(false, false)).toEqual(["name", "email", "phone", "summary"]);
  });
  it("asks a signed-in buyer only for what is missing", () => {
    expect(checkoutSteps(true, true)).toEqual(["email", "summary"]);
    expect(checkoutSteps(true, false)).toEqual(["name", "email", "summary"]);
  });
  it("maps site plans to edge-function plans", () => {
    expect([toWebPlan("annual"), toWebPlan("monthly")]).toEqual(["ANNUAL", "MONTHLY"]);
  });
});

describe("validation", () => {
  it("needs two words for a full name, as the edge function does", () => {
    expect(isFullName("רחל כהן")).toBe(true);
    expect(isFullName("ג'ורג'")).toBe(false);
    expect(isFullName("רחל")).toBe(false);
    expect(isFullName("רחל 2")).toBe(false);
  });
  it("checks email shape and length", () => {
    expect(isEmail(" r@example.com ")).toBe(true);
    expect(isEmail("a@b")).toBe(false);
    expect(isEmail(`${"a".repeat(250)}@b.co`)).toBe(false);
  });
  it("only Grow's https hosts count as a payment page", () => {
    expect(isGrowHostedUrl(HOSTED)).toBe(true);
    expect(isGrowHostedUrl("https://meshulam.co.il.evil.example/s")).toBe(false);
    expect(isGrowHostedUrl("http://secure.meshulam.co.il/s")).toBe(false);
  });
});

describe("startPayment", () => {
  it("sends the checkout body and returns the hosted url", async () => {
    const supabase = invoker({ data: { url: HOSTED, webPaymentId: "wp-1" }, error: null });
    expect(await startPayment(supabase as never, INPUT)).toEqual({ url: HOSTED, webPaymentId: "wp-1" });
    expect(supabase.functions.invoke).toHaveBeenCalledWith("createGrowPayment", { body: INPUT });
  });
  it.each([
    [400, "invalid_input"], [401, "signed_out"], [409, "already_subscribed"], [429, "rate_limited"],
    [500, "processor_error"], [502, "processor_error"], [503, "not_configured"], [504, "network"],
  ])("maps HTTP %i to %s", async (status, error) => {
    expect(await startPayment(invoker(httpError(status)) as never, INPUT)).toEqual({ error });
  });
  it("a 400 on the phone means the session has no usable phone: verify it again", async () => {
    const reply = (body: unknown) => ({
      data: null,
      error: { name: "FunctionsHttpError", context: { status: 400, json: async () => body } },
    });
    expect(await startPayment(invoker(reply({ code: "invalid_input", field: "phone" })) as never, INPUT)).toEqual({ error: "signed_out" });
    expect(await startPayment(invoker(reply({ code: "invalid_input", field: "email" })) as never, INPUT)).toEqual({ error: "invalid_input" });
    const unreadable = { data: null, error: { name: "FunctionsHttpError", context: { status: 400, json: async () => { throw new Error("x"); } } } };
    expect(await startPayment(invoker(unreadable) as never, INPUT)).toEqual({ error: "invalid_input" });
  });
  it("refuses a url that is not Grow's", async () => {
    const supabase = invoker({ data: { url: "https://evil.example/pay", webPaymentId: "wp-1" }, error: null });
    expect(await startPayment(supabase as never, INPUT)).toEqual({ error: "processor_error" });
  });
  it("a thrown invoke is a network error", async () => {
    const supabase = { functions: { invoke: vi.fn().mockRejectedValue(new Error("offline")) } };
    expect(await startPayment(supabase as never, INPUT)).toEqual({ error: "network" });
  });
});

describe("waitForAccess", () => {
  const clock = () => {
    let t = 0;
    return { now: () => t, sleep: async (ms: number) => void (t += ms) };
  };
  it("resolves as soon as the check passes", async () => {
    const check = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    expect(await waitForAccess(check, clock())).toBe("active");
    expect(check).toHaveBeenCalledTimes(2);
  });
  it("gives up after the window", async () => {
    const check = vi.fn().mockResolvedValue(false);
    expect(await waitForAccess(check, clock())).toBe("timeout");
    expect(check).toHaveBeenCalledTimes(16);
  });
  it("a failing check counts as not yet", async () => {
    const check = vi.fn().mockRejectedValueOnce(new Error("x")).mockResolvedValueOnce(true);
    expect(await waitForAccess(check, clock())).toBe("active");
  });
  it("stops when the page is gone", async () => {
    const check = vi.fn().mockResolvedValue(false);
    expect(await waitForAccess(check, { ...clock(), stopped: () => true })).toBe("timeout");
    expect(check).not.toHaveBeenCalled();
  });
});

describe("session storage", () => {
  it("reads the questionnaire's gender", () => {
    expect(readPaymentGender(memoryStorage({ "ap.funnel.gender": "female" }))).toBe("female");
    expect(readPaymentGender(memoryStorage({ "ap.funnel.gender": "other" }))).toBeUndefined();
    expect(readPaymentGender(undefined)).toBeUndefined();
  });
  it("round-trips the checkout draft and rejects junk", () => {
    const storage = memoryStorage();
    saveCheckoutDraft({ plan: "annual", name: "רחל כהן", email: "r@example.com", installments: 6 }, storage);
    expect(readCheckoutDraft(storage)).toEqual({ plan: "annual", name: "רחל כהן", email: "r@example.com", installments: 6 });
    clearCheckoutDraft(storage);
    expect(readCheckoutDraft(storage)).toBeNull();
    expect(readCheckoutDraft(memoryStorage({ "ap.checkout.draft": "{" }))).toBeNull();
    expect(readCheckoutDraft(memoryStorage({ "ap.checkout.draft": '{"plan":"weekly","name":"","email":"","installments":1}' }))).toBeNull();
    expect(readCheckoutDraft(memoryStorage({ "ap.checkout.draft": '{"plan":"annual","name":"","email":"","installments":13}' }))).toBeNull();
    expect(readCheckoutDraft(memoryStorage({ "ap.checkout.draft": '{"plan":"annual","name":"","email":"","installments":0}' }))).toBeNull();
  });
  it("remembers the invoice email for the success page", () => {
    const storage = memoryStorage();
    rememberCheckoutEmail("r@example.com", storage);
    expect(readCheckoutEmail(storage)).toBe("r@example.com");
    clearCheckoutEmail(storage);
    expect(readCheckoutEmail(storage)).toBeNull();
  });
});

describe("back/forward cache", () => {
  const pageshow = (persisted: boolean) => Object.assign(new Event("pageshow"), { persisted });
  it("calls back only when the page is restored from the cache, until stopped", () => {
    const target = new EventTarget();
    const restored = vi.fn();
    const stop = onRestoredFromCache(restored, target);
    target.dispatchEvent(pageshow(false));
    expect(restored).not.toHaveBeenCalled();
    target.dispatchEvent(pageshow(true));
    expect(restored).toHaveBeenCalledTimes(1);
    stop();
    target.dispatchEvent(pageshow(true));
    expect(restored).toHaveBeenCalledTimes(1);
  });
});

// /code-review: a stored draft overrode an explicit ?plan= link.
describe("resumableDraft", () => {
  const draft = { plan: "monthly" as const, name: "רחל כהן", email: "r@example.com", installments: 1 };
  it("a link without a plan (Otp's remount, Grow's cancel URL) resumes the draft", () => {
    expect(resumableDraft(draft, undefined)).toEqual(draft);
  });
  it("a link to the draft's own plan resumes it; a link to another plan wins", () => {
    expect(resumableDraft(draft, "monthly")).toEqual(draft);
    expect(resumableDraft(draft, "annual")).toBeNull();
  });
  it("no draft, nothing to resume", () => {
    expect(resumableDraft(null, "annual")).toBeNull();
    expect(resumableDraft(null, undefined)).toBeNull();
  });
});
