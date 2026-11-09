import { describe, expect, it } from "vitest";
import { STORE_ANDROID, STORE_IOS } from "@/lib/constants";
import { platformOf, storeUrlFor } from "@/lib/store-link";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPHONE_FACEBOOK = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0]";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";
const ANDROID_INSTAGRAM = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0 Mobile Safari/537.36 Instagram 340.0";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

describe("platformOf", () => {
  it("sends iPhones to the App Store, in-app browsers included", () => {
    expect(platformOf(IPHONE)).toBe("ios");
    expect(platformOf(IPHONE_FACEBOOK)).toBe("ios");
  });
  it("sends Android phones to Google Play, in-app browsers included", () => {
    expect(platformOf(ANDROID)).toBe("android");
    expect(platformOf(ANDROID_INSTAGRAM)).toBe("android");
  });
  it("leaves computers and unknown agents on the page with both buttons", () => {
    expect(platformOf(MAC)).toBeNull();
    expect(platformOf(WINDOWS)).toBeNull();
    expect(platformOf("")).toBeNull();
    expect(platformOf(null)).toBeNull();
  });
});

describe("storeUrlFor", () => {
  it("gives the plain store pages without labels", () => {
    expect(storeUrlFor("ios")).toBe(STORE_IOS);
    expect(storeUrlFor("android")).toBe(STORE_ANDROID);
    expect(storeUrlFor("android", new URLSearchParams("fbclid=abc"))).toBe(STORE_ANDROID);
  });
  it("passes utm labels to Google Play as the install referrer, and keeps the iPhone page plain", () => {
    const params = new URLSearchParams("utm_source=facebook&utm_campaign=yuli&fbclid=abc");
    expect(storeUrlFor("android", params)).toBe(`${STORE_ANDROID}&referrer=${encodeURIComponent("utm_source=facebook&utm_campaign=yuli")}`);
    expect(storeUrlFor("ios", params)).toBe(STORE_IOS);
  });
  it("caps a label's length", () => {
    const url = storeUrlFor("android", new URLSearchParams(`utm_source=${"x".repeat(300)}`));
    expect(decodeURIComponent(url.split("referrer=")[1])).toBe(`utm_source=${"x".repeat(100)}`);
  });
});
