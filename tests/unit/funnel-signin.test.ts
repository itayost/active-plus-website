import { afterEach, describe, expect, it, vi } from "vitest";
import { sendCode, verifyCode } from "@/lib/funnel/signin";

function fakeAuth(result: { error: unknown } | Error) {
  const call = result instanceof Error ? vi.fn().mockRejectedValue(result) : vi.fn().mockResolvedValue({ data: {}, ...result });
  return { client: { auth: { signInWithOtp: call, verifyOtp: call } }, call };
}

afterEach(() => vi.restoreAllMocks());

describe("sendCode", () => {
  it("asks Supabase for an SMS code to the E.164 number", async () => {
    const { client, call } = fakeAuth({ error: null });
    expect(await sendCode(client as never, "+972501234567")).toBe("ok");
    expect(call).toHaveBeenCalledWith({ phone: "+972501234567" });
  });

  it("reports a refusal and logs the status only, never the number", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = fakeAuth({ error: { status: 422, code: "sms_send_failed", message: "bad +972501234567" } });
    expect(await sendCode(client as never, "+972501234567")).toBe("error");
    const logged = JSON.stringify(log.mock.calls);
    expect(logged).toContain("422");
    expect(logged).not.toContain("501234567");
  });

  it("reports a network failure instead of throwing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = fakeAuth(new TypeError("Failed to fetch"));
    expect(await sendCode(client as never, "+972501234567")).toBe("error");
  });

  it("tells rate limiting apart, so a resend can say to wait instead of 'check the number'", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = fakeAuth({ error: { status: 429, code: "over_sms_send_rate_limit" } });
    expect(await sendCode(client as never, "+972501234567")).toBe("rateLimited");
  });
});

describe("verifyCode", () => {
  it("verifies an SMS code for the number", async () => {
    const { client, call } = fakeAuth({ error: null });
    expect(await verifyCode(client as never, "+972501234567", "123456")).toBe("ok");
    expect(call).toHaveBeenCalledWith({ phone: "+972501234567", token: "123456", type: "sms" });
  });

  it("calls a wrong or expired code invalid", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = fakeAuth({ error: { status: 403, code: "otp_expired" } });
    expect(await verifyCode(client as never, "+972501234567", "000000")).toBe("invalid");
  });

  it("tells rate limiting apart", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = fakeAuth({ error: { status: 429, code: "over_request_rate_limit" } });
    expect(await verifyCode(client as never, "+972501234567", "000000")).toBe("rateLimited");
  });

  it("calls a server or network failure an error, not a wrong code", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await verifyCode(fakeAuth({ error: { status: 500 } }).client as never, "+972501234567", "123456")).toBe("error");
    expect(await verifyCode(fakeAuth(new TypeError("Failed to fetch")).client as never, "+972501234567", "123456")).toBe("error");
    expect(JSON.stringify(log.mock.calls)).not.toContain("123456");
  });
});
