// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { readSmsCode, webOtpSupported } from "@/lib/funnel/web-otp";

function withWebOtp(get: (options: unknown) => Promise<unknown>) {
  vi.stubGlobal("OTPCredential", function OTPCredential() {});
  vi.stubGlobal("navigator", { credentials: { get } });
}

describe("readSmsCode", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is not offered without WebOTP (iPhone Safari, Samsung Internet, desktop)", async () => {
    expect(webOtpSupported()).toBe(false);
    expect(await readSmsCode(new AbortController().signal)).toBeNull();
  });

  it("asks for an SMS code with the screen's abort signal", async () => {
    const get = vi.fn(async () => ({ code: "123456" }));
    withWebOtp(get);
    const controller = new AbortController();
    expect(await readSmsCode(controller.signal)).toBe("123456");
    expect(get).toHaveBeenCalledWith({ otp: { transport: ["sms"] }, signal: controller.signal });
  });

  it("keeps the code's digits only, at most six", async () => {
    withWebOtp(async () => ({ code: " 12-34567 " }));
    expect(await readSmsCode(new AbortController().signal)).toBe("123456");
  });

  it("gives null when the visitor refuses or the screen is left", async () => {
    withWebOtp(async () => {
      throw new DOMException("aborted", "AbortError");
    });
    expect(await readSmsCode(new AbortController().signal)).toBeNull();
  });

  it("gives null for an empty answer", async () => {
    withWebOtp(async () => null);
    expect(await readSmsCode(new AbortController().signal)).toBeNull();
  });
});
