import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { methodsFor, PAYMENT_METHODS } from "@/lib/payment/methods";

describe("payment methods", () => {
  it("lists only what Grow was seen offering: no Apple Pay or Google Pay yet", () => {
    expect(PAYMENT_METHODS.map((m) => m.id)).toEqual(["visa", "mastercard", "bit", "paybox"]);
  });

  it("the monthly standing order takes cards only; the annual wallet adds Bit and PayBox", () => {
    expect(methodsFor("monthly").map((m) => m.id)).toEqual(["visa", "mastercard"]);
    expect(methodsFor("annual").map((m) => m.id)).toEqual(["visa", "mastercard", "bit", "paybox"]);
    expect(methodsFor()).toHaveLength(4);
  });

  it("every mark is a file in public/", () => {
    for (const m of PAYMENT_METHODS) expect(existsSync(join(process.cwd(), "public", m.src))).toBe(true);
  });
});
