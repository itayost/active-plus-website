import { afterEach, describe, expect, it, vi } from "vitest";
import { PROGRAM_CARDS, FIT_CHECK, NAV } from "@/lib/constants";
import { SITE_ROUTES } from "@/lib/routes";
import { ARTICLES } from "@/content/articles";
import sitemap from "@/app/sitemap";
import { generateMetadata as paymentMetadata } from "@/app/payment/page";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("routes", () => {
  it("contains the main pages, three explainers and the legal pages", () => {
    expect(SITE_ROUTES).toEqual(expect.arrayContaining([
      "/", "/about", "/research", "/team", "/contact", "/questionnaire", "/payment", "/articles",
      "/personal-plan", "/motion-detection", "/progress",
      "/delete-account", "/privacy-policy", "/terms",
    ]));
  });
  it("no longer serves /how-it-works", () => {
    expect(SITE_ROUTES).not.toContain("/how-it-works");
  });
  it("every nav link, card link and the fit check point at real routes", () => {
    const targets = [...NAV.map((n) => n.href.split("#")[0] || "/"), ...PROGRAM_CARDS.map((c) => c.href), FIT_CHECK.href];
    for (const href of targets) expect(SITE_ROUTES).toContain(href);
  });
  it("the menu does not list the pricing page", () => {
    expect(NAV.map((n) => n.href)).toEqual(["/about", "/research", "/team", "/#faq", "/contact"]);
  });
  it("the pricing page stays served for the questionnaire's hand-off, unlisted and noindex", async () => {
    expect(SITE_ROUTES).toContain("/payment");
    expect(sitemap().map((entry) => new URL(entry.url).pathname)).not.toContain("/payment");
    // Never a live Supabase here, even with NEXT_PUBLIC_SUPABASE_URL exported: the read fails, so the description
    // names no price.
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://stub.supabase.invalid");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    const fetcher = vi.fn().mockRejectedValue(new TypeError("offline"));
    vi.stubGlobal("fetch", fetcher);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const metadata = await paymentMetadata();
    expect(metadata.robots).toMatchObject({ index: false });
    expect(metadata.description).not.toMatch(/\d/);
    expect(fetcher.mock.calls.every(([url]) => String(url).startsWith("https://stub.supabase.invalid/"))).toBe(true);
  });
  it("article slugs are unique", () => {
    const slugs = ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("program cards are the three explainers, each with the 'show me more' label", () => {
    expect(PROGRAM_CARDS.map((c) => c.href)).toEqual(["/personal-plan", "/motion-detection", "/progress"]);
    for (const card of PROGRAM_CARDS) expect(card.cta).toBe("תראו לי עוד");
  });
  it("every card image is a v2 client photo", () => {
    for (const card of PROGRAM_CARDS) expect(card.image).toMatch(/^\/img\/v2\//);
  });
});
