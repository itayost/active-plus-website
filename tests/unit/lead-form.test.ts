import { describe, expect, it, vi } from "vitest";
import type { LeadResult } from "@/lib/leads";
import {
  buildLeadRemark,
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

describe("buildLeadRemark", () => {
  it("starts with the site label and the originating surface", () => {
    const remark = buildLeadRemark({ source: "home", topic: "", message: "", marketingOptIn: false });
    expect(remark.split("\n")[0]).toBe("פעילים אתר · home");
  });
  it("keeps topic and message lines when given", () => {
    const remark = buildLeadRemark({
      source: "contact",
      topic: "שירות לקוחות",
      message: "שלום",
      marketingOptIn: true,
    });
    expect(remark).toContain("נושא: שירות לקוחות");
    expect(remark).toContain("פירוט: שלום");
    expect(remark).toContain("דיוור: אישר/ה");
  });
  it("omits topic and message lines when empty", () => {
    const remark = buildLeadRemark({ source: "home", topic: "", message: "", marketingOptIn: false });
    expect(remark).not.toContain("נושא:");
    expect(remark).not.toContain("פירוט:");
    expect(remark).toContain("דיוור: לא אישר/ה");
  });
});

describe("submitLead row shape", () => {
  it("writes source website whatever surface the lead came from", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    vi.resetModules();
    vi.doMock("@/lib/supabase", () => ({ createServiceClient: () => ({ from: () => ({ insert }) }) }));
    vi.doMock("next/headers", () => ({ headers: async () => new Headers() }));
    const { submitLead } = await import("@/lib/leads");
    const fd = new FormData();
    fd.set("fullName", "ישראל ישראלי");
    fd.set("phone", "0501234567");
    fd.set("source", "home");
    const result = await submitLead({ status: "idle" }, fd);
    expect(result.status).toBe("success");
    const row = insert.mock.calls[0][0];
    expect(row.source).toBe("website");
    expect(row.raw_remark.split("\n")[0]).toBe("פעילים אתר · home");
    vi.doUnmock("@/lib/supabase");
    vi.doUnmock("next/headers");
  });
});
