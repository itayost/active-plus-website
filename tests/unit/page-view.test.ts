import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
const or = vi.fn();
const eq2 = vi.fn(() => ({ or }));
const eq1 = vi.fn(() => ({ eq: eq2 }));
const update = vi.fn(() => ({ eq: eq1 }));
const from = vi.fn(() => ({ insert, update }));
vi.mock("@/lib/supabase", () => ({ createServiceClient: () => ({ from }) }));

import { POST } from "@/app/api/page-view/route";
import { cleanPath, deviceOf, fromMetaAd, linkTarget, parsePageView } from "@/lib/pageviews/parse";

const ID = "3f2b8c1e-9d4a-4b7e-8a6f-1c2d3e4f5a6b";
const VISIT = "9a2b8c1e-9d4a-4b7e-8a6f-1c2d3e4f5a6c";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36";
let ip = 0;

const post = (body: unknown, ua = IPHONE) =>
  POST(
    new Request("http://localhost/api/page-view", {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": ua, "x-vercel-forwarded-for": `10.1.0.${++ip}` },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  insert.mockReset().mockResolvedValue({ error: null });
  or.mockReset().mockResolvedValue({ error: null });
  from.mockClear();
});

describe("parse", () => {
  it("keeps only the path of a page", () => {
    expect(cleanPath("/questionnaire?utm_content=1#x")).toBe("/questionnaire");
    expect(cleanPath("//evil.com")).toBeNull();
    expect(cleanPath("questionnaire")).toBeNull();
  });

  it("tells phones, tablets and computers apart", () => {
    expect(deviceOf(IPHONE)).toEqual({ device: "phone", os: "ios" });
    expect(deviceOf(ANDROID)).toEqual({ device: "phone", os: "android" });
    expect(deviceOf("Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 Chrome/131.0 Safari/537.36")).toEqual({ device: "tablet", os: "android" });
    expect(deviceOf("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0")).toEqual({ device: "desktop", os: "windows" });
  });

  it("names a tapped link without numbers or queries", () => {
    const o = "https://peilimplus.co.il";
    expect(linkTarget("tel:0501234567", o)).toBe("tel");
    expect(linkTarget("/payment?plan=year", o)).toBe("/payment");
    expect(linkTarget("https://apps.apple.com/il/app/id1", o)).toBe("store:app_store");
    expect(linkTarget("https://wa.me/972501234567", o)).toBe("whatsapp");
  });

  it("knows a visit from a Meta ad", () => {
    expect(fromMetaAd(new URLSearchParams("fbclid=abc"))).toBe(true);
    expect(fromMetaAd(new URLSearchParams("utm_source=facebook"))).toBe(true);
    expect(fromMetaAd(new URLSearchParams("utm_source=google"))).toBe(false);
  });

  it("keeps utm_content only when it is an ad id, and caps time on page", () => {
    const v = parsePageView({ t: "view", id: ID, visit: VISIT, path: "/", ad: "Gal ad" });
    expect(v).toMatchObject({ metaAdId: null });
    expect(parsePageView({ t: "end", id: ID, visit: VISIT, seconds: 99999 })).toMatchObject({ seconds: 1800 });
    expect(parsePageView({ t: "view", id: "x", visit: VISIT, path: "/" })).toBeNull();
  });
});

describe("POST /api/page-view", () => {
  it("stores a view with the device worked out on the server, never the user agent", async () => {
    const res = await post({ t: "view", id: ID, visit: VISIT, path: "/", meta: true, ad: "120212345678901234" }, ANDROID);
    expect(res.status).toBe(204);
    expect(from).toHaveBeenCalledWith("web_page_views");
    const row = insert.mock.calls[0][0];
    expect(row).toMatchObject({ id: ID, visit_id: VISIT, path: "/", device: "phone", os: "android", from_meta: true, meta_ad_id: "120212345678901234" });
    expect(JSON.stringify(row)).not.toContain("Mozilla");
  });

  it("ignores bots", async () => {
    await post({ t: "view", id: ID, visit: VISIT, path: "/" }, "facebookexternalhit/1.1");
    expect(insert).not.toHaveBeenCalled();
  });

  it("records time on page, keeping the longest report", async () => {
    await post({ t: "end", id: ID, visit: VISIT, seconds: 42.4 });
    expect(update).toHaveBeenCalledWith({ seconds: 42 });
    expect(or).toHaveBeenCalledWith("seconds.is.null,seconds.lt.42");
  });

  it("records a click", async () => {
    await post({ t: "click", id: ID, visit: VISIT, path: "/payment", target: "store:google_play" });
    expect(from).toHaveBeenCalledWith("web_link_clicks");
    expect(insert.mock.calls[0][0]).toMatchObject({ target: "store:google_play", path: "/payment" });
  });
});

import { answerEventData } from "@/lib/funnel/events";

describe("answerEventData", () => {
  it("sends answer codes only, never the name or the birth date", () => {
    expect(answerEventData("goals", { training_goals: ["strength", "cognition"] })).toEqual({ screen: "goals", training_goals: "strength,cognition" });
    expect(answerEventData("register", { full_name: "Dana Levi" })).toEqual({ screen: "register" });
    expect(answerEventData("dob", { age_group: "60_69", date_of_birth: "1960-01-01" })).toEqual({ screen: "dob", age_group: "60_69" });
    expect(answerEventData("time", { training_time_of_day: "09:30" })).toEqual({ screen: "time", training_time_of_day: "09:30" });
  });
});

import { modelOf } from "@/lib/pageviews/parse";

describe("modelOf", () => {
  it("names an iPhone by its screen and keeps Android's own model", () => {
    expect(modelOf("ios", "phone", null, { w: 390, h: 844 })).toBe("iPhone 12 / 13 / 14");
    expect(modelOf("ios", "phone", null, { w: 844, h: 390 })).toBe("iPhone 12 / 13 / 14");
    expect(modelOf("ios", "phone", null, { w: 1, h: 2 })).toBe("iPhone");
    expect(modelOf("android", "phone", "SM-A546E", null)).toBe("SM-A546E");
    expect(modelOf("android", "phone", "K", null)).toBeNull();
    expect(modelOf("windows", "desktop", null, null)).toBeNull();
  });
});
