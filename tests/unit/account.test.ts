import { describe, expect, it, vi } from "vitest";
import { cancelWebSubscription, formatIsraelDate, loadSubscription, manageAction } from "@/lib/payment/account";

const SUB = { planType: "MONTHLY", expiresAt: "2026-11-07T10:00:00.000Z", autoRenew: true, platform: "grow" };
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
    const supabase = invoker({ data: { hasAccess: true, subscription: { ...SUB, id: "s1", daysRemaining: 5 } }, error: null });
    expect(await loadSubscription(supabase as never)).toEqual(SUB);
  });
  it("no access is null; a failed call is an error", async () => {
    expect(await loadSubscription(invoker({ data: { hasAccess: false }, error: null }) as never)).toBeNull();
    expect(await loadSubscription(invoker(httpError(500)) as never)).toBe("error");
  });
  it("an older function without platform, or a non-string one, reads as no platform", async () => {
    const withoutPlatform = { planType: SUB.planType, expiresAt: SUB.expiresAt, autoRenew: SUB.autoRenew };
    expect(await loadSubscription(invoker({ data: { hasAccess: true, subscription: withoutPlatform }, error: null }) as never))
      .toEqual({ ...SUB, platform: null });
    expect(await loadSubscription(invoker({ data: { hasAccess: true, subscription: { ...SUB, platform: 7 } }, error: null }) as never))
      .toEqual({ ...SUB, platform: null });
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
