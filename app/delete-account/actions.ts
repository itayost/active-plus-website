"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase";

export type DeleteAccountResult = {
  success: boolean;
  message: string;
};

// In-memory rate limiting. Note this is per serverless instance and resets on
// cold start, so it throttles casual abuse rather than a determined attacker.
// The real guarantee that one address cannot pile up requests is the partial
// unique index on (email) WHERE status='pending'.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3; // max 3 requests per IP per hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Clean up stale entries when map grows too large
  if (rateLimitMap.size > 100) {
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count++;
  return false;
}

export async function submitDeletionRequest(
  formData: FormData
): Promise<DeleteAccountResult> {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const confirmation = formData.get("confirmation")?.toString().trim();

  // Validate inputs
  if (!email || !confirmation) {
    return { success: false, message: "נא למלא את כל השדות" };
  }

  if (confirmation !== "מחיקת חשבון") {
    return {
      success: false,
      message: 'נא להקליד "מחיקת חשבון" בשדה האישור',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, message: "כתובת אימייל לא תקינה" };
  }

  // Rate limiting by IP.
  //
  // x-vercel-forwarded-for is set by the platform and cannot be spoofed by the
  // caller. The leftmost value of x-forwarded-for CAN be: a client that sends
  // its own header has its value preserved ahead of the real address, so
  // reading [0] let anyone reset their own rate-limit bucket at will.
  const headersList = await headers();
  const ip =
    headersList.get("x-vercel-forwarded-for")?.trim() ||
    headersList.get("x-real-ip")?.trim() ||
    // Last resort off-Vercel: take the RIGHTMOST entry, the one appended by the
    // closest proxy, rather than the client-controllable leftmost.
    headersList.get("x-forwarded-for")?.split(",").pop()?.trim() ||
    "unknown";

  if (isRateLimited(ip)) {
    return {
      success: false,
      message: "נשלחו יותר מדי בקשות. נא לנסות שוב מאוחר יותר",
    };
  }

  try {
    const supabase = createServiceClient();

    // The request is queued unconditionally, without checking whether the
    // address belongs to a real account. Deliberate, and it removes three
    // problems at once:
    //
    //  * Enumeration. The previous version only inserted for real users, so
    //    the work done — and the time it took — differed by whether the
    //    address existed. The uniform success message did not hide that.
    //  * Cost. Establishing existence meant listUsers() paging through the
    //    WHOLE auth table on every submission (551 users today), which is an
    //    amplification vector: cheap to send, expensive to serve.
    //  * Coverage. Most trainees authenticate by phone and have no email at
    //    all (207 of 551), so an email match could never have found them —
    //    their genuine requests were being silently dropped.
    //
    // A queued row is not a deletion; an admin reviews it. The partial unique
    // index on (email) WHERE status='pending' keeps duplicates out, and the
    // rate limit bounds volume.
    const { error } = await supabase
      .from("account_deletion_requests")
      .insert({ email, ip_address: ip });

    // Unique constraint violation = a pending request already exists
    if (error?.code === "23505") {
      return {
        success: true,
        message: "בקשה למחיקת חשבון כבר קיימת במערכת. נטפל בה בהקדם האפשרי.",
      };
    }

    if (error) {
      console.error("Failed to insert deletion request:", error.message);
      return {
        success: false,
        message: "אירעה שגיאה. נא לנסות שוב מאוחר יותר",
      };
    }

    return {
      success: true,
      message:
        "בקשתך התקבלה בהצלחה. אם קיים חשבון עם כתובת אימייל זו, נטפל במחיקתו תוך 7 ימי עסקים.",
    };
  } catch (error) {
    console.error("Deletion request error:", error);
    return {
      success: false,
      message: "אירעה שגיאה. נא לנסות שוב מאוחר יותר",
    };
  }
}
