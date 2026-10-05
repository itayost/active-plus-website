import { describe, expect, it, vi } from "vitest";
import { cancelWebSubscription, chargeLine, formatIsraelDate, loadSubscription, manageAction } from "@/lib/payment/account";
import { ACCOUNT_COPY, CHECKOUT_COPY } from "@/lib/payment/copy";

const SUB = {
  planType: "MONTHLY", expiresAt: "2026-11-07T10:00:00.000Z", autoRenew: true, platform: "grow", nextChargeAt: "2026-11-05",
};
/** checkUserSubscription's subscription (no next charge day there) and its top-level webMonthly. */
const RESPONSE_SUB = { planType: SUB.planType, expiresAt: SUB.expiresAt, autoRenew: SUB.autoRenew, platform: SUB.platform };
const WEB_MONTHLY = { renewing: true, nextChargeAt: "2026-11-05", expiresAt: SUB.expiresAt };
const invoker = (result: unknown) => ({ functions: { invoke: vi.fn().mockResolvedValue(result) } });
const httpError = (status: number) => ({ data: null, error: { context: { status } } });

describe("manageAction", () => {
  it("offers cancel only for an active monthly web subscription", () => {
    expect(manageAction(SUB)).toBe("cancel");
    expect(manageAction({ ...SUB, autoRenew: false })).toBe("cancelled");
    expect(manageAction({ ...SUB, planType: "ANNUAL" })).toBe("annual");
  });
  it("sends store buyers to their store, and manual ones to the office", () => {
    expect(manageAction({ ...SUB, platform: "apple" })).toBe("apple");
    expect(manageAction({ ...SUB, platform: "google" })).toBe("google");
    expect(manageAction({ ...SUB, platform: null })).toBe("manual");
  });
  it("an annual web plan is never offered a cancel, renewing or not", () => {
    expect(manageAction({ ...SUB, planType: "ANNUAL", autoRenew: false })).toBe("annual");
  });
});

describe("loadSubscription", () => {
  it("reads the active subscription with its platform", async () => {
    const supabase = invoker({ data: { hasAccess: true, subscription: { ...RESPONSE_SUB, id: "s1", daysRemaining: 5 }, webMonthly: WEB_MONTHLY }, error: null });
    expect(await loadSubscription(supabase as never)).toEqual(SUB);
  });
  it("no access is null; a failed call is an error", async () => {
    expect(await loadSubscription(invoker({ data: { hasAccess: false }, error: null }) as never)).toBeNull();
    expect(await loadSubscription(invoker(httpError(500)) as never)).toBe("error");
  });
  it("an older function without platform, or a non-string one, reads as no platform", async () => {
    const withoutPlatform = { planType: SUB.planType, expiresAt: SUB.expiresAt, autoRenew: SUB.autoRenew };
    expect(await loadSubscription(invoker({ data: { hasAccess: true, subscription: withoutPlatform }, error: null }) as never))
      .toEqual({ ...SUB, platform: null, nextChargeAt: null });
    expect(await loadSubscription(invoker({ data: { hasAccess: true, subscription: { ...RESPONSE_SUB, platform: 7 } }, error: null }) as never))
      .toEqual({ ...SUB, platform: null, nextChargeAt: null });
  });
  it("a throwing client is an error, never an exception", async () => {
    const supabase = { functions: { invoke: vi.fn().mockRejectedValue(new Error("offline")) } };
    expect(await loadSubscription(supabase as never)).toBe("error");
  });
  it("asks checkUserSubscription with an empty body (the user is the session)", async () => {
    const supabase = invoker({ data: { hasAccess: false }, error: null });
    await loadSubscription(supabase as never);
    expect(supabase.functions.invoke).toHaveBeenCalledWith("checkUserSubscription", { body: {} });
  });
});

describe("cancelWebSubscription", () => {
  it("maps the function's answers", async () => {
    expect(await cancelWebSubscription(invoker({ data: { status: "cancelled", expiresAt: SUB.expiresAt }, error: null }) as never)).toBe("cancelled");
    expect(await cancelWebSubscription(invoker({ data: { status: "already_cancelled", expiresAt: SUB.expiresAt }, error: null }) as never)).toBe("already_cancelled");
    expect(await cancelWebSubscription(invoker(httpError(404)) as never)).toBe("not_found");
    expect(await cancelWebSubscription(invoker(httpError(409)) as never)).toBe("not_cancelable");
    expect(await cancelWebSubscription(invoker(httpError(502)) as never)).toBe("error");
  });
  it("a network failure, a throw or an unknown body is an error", async () => {
    expect(await cancelWebSubscription(invoker({ data: null, error: { message: "Failed to fetch" } }) as never)).toBe("error");
    expect(await cancelWebSubscription({ functions: { invoke: vi.fn().mockRejectedValue(new Error("x")) } } as never)).toBe("error");
    expect(await cancelWebSubscription(invoker({ data: { status: "ok" }, error: null }) as never)).toBe("error");
  });
  it("sends no user id: the function reads it from the session", async () => {
    const supabase = invoker({ data: { status: "cancelled" }, error: null });
    await cancelWebSubscription(supabase as never);
    expect(supabase.functions.invoke).toHaveBeenCalledWith("cancelGrowSubscription", { body: {} });
  });
});

it("formats dates on the Israel calendar (23:30 UTC is already the next day there)", () => {
  expect(formatIsraelDate("2026-11-06T23:30:00.000Z")).toBe("7 בנובמבר 2026");
});

it("formats summer dates on Israel daylight time too", () => {
  expect(formatIsraelDate("2026-07-31T21:30:00.000Z")).toBe("1 באוגוסט 2026");
});

it("formats a charge day (an Israeli date with no time) as that same day", () => {
  expect(formatIsraelDate("2026-12-05")).toBe("5 בדצמבר 2026");
  expect(formatIsraelDate("2026-07-01")).toBe("1 ביולי 2026");
});

// ---- final review --------------------------------------------------------------

describe("webMonthly", () => {
  const load = async (data: unknown) => await loadSubscription(invoker({ data, error: null }) as never);

  it("the next charge day comes from webMonthly, null when the function does not send one", async () => {
    expect(await load({ hasAccess: true, subscription: RESPONSE_SUB, webMonthly: WEB_MONTHLY })).toMatchObject({ nextChargeAt: "2026-11-05" });
    expect(await load({ hasAccess: true, subscription: RESPONSE_SUB, webMonthly: { ...WEB_MONTHLY, nextChargeAt: 5 } }))
      .toMatchObject({ nextChargeAt: null });
    expect(await load({ hasAccess: true, subscription: RESPONSE_SUB })).toMatchObject({ nextChargeAt: null });
  });

  // /code-review: the response's subscription is the latest-expiring row; a longer manual or store row hid the web monthly.
  it("a renewing web monthly behind a longer manual or store row is what the page shows, with its cancel", async () => {
    for (const platform of [null, "apple"]) {
      const longer = { planType: "ANNUAL", expiresAt: "2027-06-01T10:00:00.000Z", autoRenew: false, platform };
      const sub = await load({ hasAccess: true, subscription: longer, webMonthly: WEB_MONTHLY });
      expect(sub).toEqual(SUB);
      expect(manageAction(sub as never)).toBe("cancel");
    }
  });

  it("a web monthly whose access lapsed while Grow still retries can still be cancelled", async () => {
    expect(await load({ hasAccess: false, requiresPayment: true, webMonthly: WEB_MONTHLY })).toEqual(SUB);
  });

  it("a webMonthly that is not renewing or not readable is ignored", async () => {
    for (const webMonthly of [null, { ...WEB_MONTHLY, renewing: false }, { ...WEB_MONTHLY, expiresAt: 7 }, "x"]) {
      expect(await load({ hasAccess: false, webMonthly })).toBeNull();
    }
  });
});

describe("chargeLine", () => {
  it("a renewing web monthly shows the real charge day", () => {
    expect(chargeLine(SUB)).toEqual({ text: "nextCharge", date: "2026-11-05" });
  });
  it("without a charge day (an older function, or nothing renewing) it shows how long access lasts", () => {
    expect(chargeLine({ ...SUB, nextChargeAt: null })).toEqual({ text: "activeUntil", date: SUB.expiresAt });
    expect(chargeLine({ ...SUB, platform: "apple" })).toEqual({ text: "activeUntil", date: SUB.expiresAt });
    expect(chargeLine({ ...SUB, planType: "ANNUAL", nextChargeAt: null })).toEqual({ text: "activeUntil", date: SUB.expiresAt });
  });
  it("a cancelled monthly says it was cancelled, with the day access ends", () => {
    expect(chargeLine({ ...SUB, autoRenew: false, nextChargeAt: null })).toEqual({ text: "cancelled", date: SUB.expiresAt });
  });
});

describe("copy the client approves", () => {
  it("the annual note covers installment buyers: monthly charges until the last installment, then none", () => {
    expect(ACCOUNT_COPY.annualNote).toContain("בתשלומים");
    expect(ACCOUNT_COPY.annualNote).toContain("עד התשלום האחרון");
    expect(ACCOUNT_COPY.annualNote).toContain("לא יהיה חיוב נוסף");
  });
  it("the success page never claims the invoice was already sent", () => {
    for (const text of [CHECKOUT_COPY.success.received, CHECKOUT_COPY.success.receivedNoEmail]) {
      expect(text).toContain("תישלח");
      expect(text).not.toMatch(/נשלחה|נשלחת/);
    }
    expect(CHECKOUT_COPY.success.received).toContain("{email}");
  });
  // /code-review: the same words whether or not the number has an account.
  it("the code screen's hint never says whether the number has an account, and gives the office phone", () => {
    expect(ACCOUNT_COPY.codeHint).toContain("073-729-66-99");
    expect(ACCOUNT_COPY.codeHint).toContain("אם המספר רשום אצלנו");
    expect("noAccount" in ACCOUNT_COPY).toBe(false);
  });
  it("no em or en dashes in the new strings", () => {
    const texts = [ACCOUNT_COPY.annualNote, ACCOUNT_COPY.codeHint, CHECKOUT_COPY.success.received, CHECKOUT_COPY.success.receivedNoEmail];
    expect(texts.filter((t) => /[\u2013\u2014]/.test(t))).toEqual([]);
  });
});
