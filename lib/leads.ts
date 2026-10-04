"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase";

export type LeadField = "fullName" | "phone" | "email" | "message";

export type FieldErrors = Partial<Record<LeadField, string>>;

export type LeadResult =
  | { status: "idle" }
  | { status: "success"; message: string }
  /** `fields` carries every invalid field, not just the first one found. */
  | { status: "error"; message?: string; fields?: FieldErrors };

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  if (rateLimit.size > 200) {
    for (const [key, entry] of rateLimit) {
      if (now > entry.resetAt) rateLimit.delete(key);
    }
  }

  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;

  entry.count += 1;
  return false;
}

/** Israeli mobile and landline numbers, with or without separators. */
const PHONE_PATTERN = /^0(5\d|7\d|[2-4]|[8-9])\d{7}$/;

/**
 * public.leads stores every existing row in E.164 (`+972…`), which is what the
 * Meta Lead Ads funnel writes and what lead matching keys on. A website lead
 * saved as "050-1234567" would be a third format in the same column and would
 * never match. Validation happens on the local form; storage is canonical.
 */
const toE164 = (localNumber: string) => `+972${localNumber.slice(1)}`;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function submitLead(
  _previous: LeadResult,
  formData: FormData,
): Promise<LeadResult> {
  // Honeypot: a real visitor never fills a field they cannot see.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { status: "success", message: "הפרטים נשלחו. נחזור אליכם בקרוב." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const phone = phoneRaw.replace(/[\s-]/g, "");
  const email = String(formData.get("email") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const marketingOptIn = formData.get("marketingOptIn") === "on";
  const source = String(formData.get("source") ?? "website").trim();

  // Collect every problem before returning, so one round trip surfaces all
  // of them rather than making the reader discover fields one at a time.
  const fields: FieldErrors = {};

  if (fullName.length < 2) {
    fields.fullName = "צריך שם מלא כדי שנדע למי לפנות.";
  } else if (fullName.length > 120) {
    fields.fullName = "השם ארוך מדי. אפשר לקצר עד 120 תווים.";
  }

  if (!phone) {
    fields.phone = "צריך מספר טלפון כדי שנוכל לחזור אליכם.";
  } else if (!PHONE_PATTERN.test(phone)) {
    fields.phone = "מספר הטלפון לא נראה תקין. לדוגמה: 050-1234567";
  }

  if (email && (email.length > 254 || !EMAIL_PATTERN.test(email))) {
    fields.email = "כתובת המייל לא נראית תקינה. לדוגמה: israel@gmail.com";
  }

  if (message.length > 2000) {
    fields.message = "הפירוט ארוך מדי. אפשר לקצר עד 2000 תווים.";
  }

  if (Object.keys(fields).length > 0) {
    return { status: "error", fields };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "unknown";

  // An unresolvable IP must not put every such request in one shared bucket,
  // where a single visitor's third submission would block everyone else's.
  if (ip !== "unknown" && isRateLimited(ip)) {
    return {
      status: "error",
      message:
        "נשלחו כמה פניות מהכתובת הזו בשעה האחרונה. אפשר להתקשר אלינו ל-073-729-66-99.",
    };
  }

  // public.leads is the CRM's production table and has no columns for a
  // subject, a message or a marketing opt-in, so they travel in raw_remark
  // where the team already reads free-text context. `source` stays inside the
  // CRM's own small vocabulary; the originating page goes in the remark.
  const remark = [
    `נשלח מהאתר · ${source}`,
    topic ? `נושא: ${topic}` : null,
    message ? `פירוט: ${message}` : null,
    `דיוור: ${marketingOptIn ? "אישר/ה" : "לא אישר/ה"}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("leads").insert({
      full_name: fullName,
      phone: toE164(phone),
      email: email || null,
      source: "website",
      customer_status: "new",
      process_status: "new_lead",
      raw_remark: remark,
    });

    if (error) {
      console.error("[leads] insert failed", {
        code: error.code,
        message: error.message,
      });
      return {
        status: "error",
        message: "השליחה נכשלה. אפשר לנסות שוב או להתקשר ל-073-729-66-99.",
      };
    }
  } catch (caught) {
    console.error("[leads] unexpected failure", caught);
    return {
      status: "error",
      message: "השליחה נכשלה. אפשר לנסות שוב או להתקשר ל-073-729-66-99.",
    };
  }

  return {
    status: "success",
    message: `נחזור אליכם ל-${phoneRaw} בשעות הפעילות, א׳–ה׳ 10:00–17:00.`,
  };
}
