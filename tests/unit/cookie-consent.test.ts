// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CookieConsent, { COOKIE_COPY, COOKIES_POLICY_HREF } from "@/components/consent/CookieConsent";
import { CONSENT_KEY, CONSENT_SCRIPT } from "@/lib/consent";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown }) => createElement("a", { href, ...rest }, children as never),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ID = "GTM-TEST123";
let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  document.head.innerHTML = "";
  delete document.documentElement.dataset.consent;
  delete (window as { dataLayer?: unknown[] }).dataLayer;
  localStorage.clear();
});

const notice = () => host.querySelector("[data-cookie-notice]");
const containerScript = () => document.head.querySelector("script[data-gtm-container]");

describe("CookieConsent", () => {
  it("is in the server's HTML, with the pre-paint script ahead of it", () => {
    const html = renderToString(createElement(CookieConsent, { gtmId: ID }));
    expect(html.indexOf(CONSENT_SCRIPT)).toBeGreaterThan(-1);
    expect(html.indexOf("<script")).toBeLessThan(html.indexOf("data-cookie-notice"));
    expect(html).toContain(COOKIE_COPY.text);
  });

  it("offers one button, accept, and a link to the cookies section of the policy", () => {
    act(() => root.render(createElement(CookieConsent, { gtmId: ID })));
    const buttons = notice()?.querySelectorAll("button") ?? [];
    expect(buttons).toHaveLength(1);
    expect(buttons[0].textContent).toBe(COOKIE_COPY.accept);
    expect(notice()?.querySelector("a")?.getAttribute("href")).toBe(COOKIES_POLICY_HREF);
    expect(notice()?.getAttribute("aria-label")).toBe(COOKIE_COPY.label);
  });

  it("loads no tag until accepted; accepting loads GTM, stores it and hides the notice", () => {
    act(() => root.render(createElement(CookieConsent, { gtmId: ID })));
    expect(containerScript()).toBeNull();
    act(() => notice()?.querySelector("button")?.click());
    expect(containerScript()?.getAttribute("src")).toBe(`https://www.googletagmanager.com/gtm.js?id=${ID}`);
    expect(Number(localStorage.getItem(CONSENT_KEY))).toBeGreaterThan(0);
    expect(document.documentElement.dataset.consent).toBe("accepted");
    expect(notice()).toBeNull();
  });

  it("a returning visitor who accepted gets GTM on mount and no notice", () => {
    localStorage.setItem(CONSENT_KEY, String(Date.now() - 1000));
    act(() => root.render(createElement(CookieConsent, { gtmId: ID })));
    expect(containerScript()).not.toBeNull();
    expect(notice()).toBeNull();
  });
});
