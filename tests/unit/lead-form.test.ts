import { describe, expect, it, vi } from "vitest";
import type { LeadResult } from "@/lib/leads";
import {
  checkField,
  NETWORK_MESSAGE,
  OFFLINE_MESSAGE,
  submitWithFallback,
} from "@/lib/lead-form";

const IDLE: LeadResult = { status: "idle" };
const form = () => {
  const fd = new FormData();
  fd.set("fullName", "ישראל ישראלי");
  fd.set("phone", "050-1234567");
  return fd;
};

describe("checkField", () => {
  it("accepts an empty name on blur so the reader is not scolded before typing", () => {
    expect(checkField("fullName", "   ")).toBeUndefined();
  });
  it("rejects a one-letter name", () => {
    expect(checkField("fullName", "א")).toMatch(/שם מלא/);
  });
  it("rejects a name over 120 characters", () => {
    expect(checkField("fullName", "א".repeat(121))).toMatch(/ארוך מדי/);
  });
  it("accepts a long Hebrew name with emoji and Latin inside the limit", () => {
    expect(checkField("fullName", "שרה-לאה בן-אברהם 🌸 Sarah")).toBeUndefined();
  });
  it("accepts a mobile number with dashes and spaces", () => {
    expect(checkField("phone", "050 123-4567")).toBeUndefined();
  });
  it("rejects a phone number that is too short", () => {
    expect(checkField("phone", "050123")).toMatch(/לא נראה תקין/);
  });
  it("rejects a malformed email", () => {
    expect(checkField("email", "israel@gmail")).toMatch(/לא נראית תקינה/);
  });
  it("accepts an empty optional email", () => {
    expect(checkField("email", "")).toBeUndefined();
  });
});

describe("submitWithFallback", () => {
  it("does not call the server when the device is offline", async () => {
    const submit = vi.fn();
    const result = await submitWithFallback(submit, IDLE, form(), () => false);
    expect(submit).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "error", message: OFFLINE_MESSAGE });
  });

  it("returns the server's own result when the call succeeds", async () => {
    const ok: LeadResult = { status: "success", message: "תודה" };
    const submit = vi.fn().mockResolvedValue(ok);
    const result = await submitWithFallback(submit, IDLE, form(), () => true);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(result).toBe(ok);
  });

  it("turns a thrown network failure into a Hebrew error instead of crashing the page", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const submit = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const result = await submitWithFallback(submit, IDLE, form(), () => true);
    expect(result).toEqual({ status: "error", message: NETWORK_MESSAGE });
    expect(log).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });

  it("names the recovery in both fallback messages", () => {
    for (const message of [OFFLINE_MESSAGE, NETWORK_MESSAGE]) {
      expect(message).toMatch(/073-729-66-99/);
      expect(message).toMatch(/נשמרו/);
    }
  });
});
