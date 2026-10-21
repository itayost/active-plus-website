import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PaymentFlow from "@/components/payment/PaymentFlow";
import { CHECKOUT_COPY as C } from "@/lib/payment/copy";

describe("PaymentFlow without prices", () => {
  it("still tells a buyer back from Grow's cancel page that nothing was charged, then that prices are unavailable", () => {
    const html = renderToStaticMarkup(createElement(PaymentFlow, { prices: null, cancelled: true }));
    expect(html).toContain(C.cancelled);
    expect(html).toContain(C.pricesUnavailable);
    expect(html.indexOf(C.cancelled)).toBeLessThan(html.indexOf(C.pricesUnavailable));
  });
  it("shows no cancelled notice on a plain visit", () => {
    const html = renderToStaticMarkup(createElement(PaymentFlow, { prices: null }));
    expect(html).not.toContain(C.cancelled);
    expect(html).toContain(C.pricesUnavailable);
  });
});
