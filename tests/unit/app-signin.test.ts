import { describe, expect, it } from "vitest";
import { downloadHref, openAppHref, parseAppSignin } from "@/lib/payment/app-signin";
import { storeUrlFor } from "@/lib/store-link";

const CODE = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJ_-12345";

describe("app sign-in after paying", () => {
  it("keeps a code still in time and drops anything else", () => {
    const now = 1_000_000;
    expect(parseAppSignin(JSON.stringify({ code: CODE, expiresAt: now + 1 }), now)).toEqual({ code: CODE, expiresAt: now + 1 });
    expect(parseAppSignin(JSON.stringify({ code: CODE, expiresAt: now }), now)).toBeNull();
    expect(parseAppSignin(JSON.stringify({ code: "short", expiresAt: now + 1 }), now)).toBeNull();
    expect(parseAppSignin("nope", now)).toBeNull();
  });

  it("puts the code on the download link and in the app link", () => {
    expect(downloadHref(CODE)).toBe(`/download?utm_source=website&utm_medium=payment_success&signin=${CODE}`);
    expect(downloadHref(null)).toBe("/download?utm_source=website&utm_medium=payment_success");
    expect(openAppHref(CODE)).toBe(`activeplus://signin?code=${CODE}`);
  });

  it("carries a valid code to Google Play's referrer, never to the App Store", () => {
    const params = new URLSearchParams(`utm_source=website&signin=${CODE}`);
    expect(decodeURIComponent(storeUrlFor("android", params).split("referrer=")[1])).toBe(`utm_source=website&signin=${CODE}`);
    expect(storeUrlFor("ios", params)).not.toContain(CODE);
    expect(storeUrlFor("android", new URLSearchParams("signin=bad"))).not.toContain("signin");
  });
});
