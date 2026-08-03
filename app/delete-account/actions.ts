"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase";

export type DeleteAccountResult = {
  success: boolean;
  message: string;
};

// In-memory rate limiting (per deployment instance)
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

  // Rate limiting by IP
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return {
      success: false,
      message: "נשלחו יותר מדי בקשות. נא לנסות שוב מאוחר יותר",
    };
  }

  try {
    const supabase = createServiceClient();

    // Check if user exists (don't reveal this to the client)
    // Paginate through users to find match — listUsers doesn't support email filtering
    let userExists = false;
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data } = await supabase.auth.admin.listUsers({ page, perPage });
      const users = data?.users ?? [];
      if (users.some((u) => u.email === email)) {
        userExists = true;
        break;
      }
      if (users.length < perPage) break;
      page++;
    }

    // Always show success to prevent email enumeration
    // But only insert a request if user actually exists
    if (userExists) {
      const { error } = await supabase
        .from("account_deletion_requests")
        .insert({
          email,
          ip_address: ip,
        });

      // Unique constraint violation = pending request already exists
      if (error?.code === "23505") {
        return {
          success: true,
          message:
            "בקשה למחיקת חשבון כבר קיימת במערכת. נטפל בה בהקדם האפשרי.",
        };
      }

      if (error) {
        console.error("Failed to insert deletion request:", error.message);
        return {
          success: false,
          message: "אירעה שגיאה. נא לנסות שוב מאוחר יותר",
        };
      }
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
