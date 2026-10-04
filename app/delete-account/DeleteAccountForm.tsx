"use client";

import { useState, useTransition } from "react";
import { submitDeletionRequest, type DeleteAccountResult } from "./actions";
import { CheckIcon } from "@/components/ui/icons";

export default function DeleteAccountForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<DeleteAccountResult | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await submitDeletionRequest(formData);
      setResult(res);
    });
  }

  if (result?.success) {
    return (
      <div
        role="status"
        className="rounded-card border-2 border-green bg-green-wash p-8 text-center"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-deep text-white">
          <CheckIcon className="h-8 w-8" />
        </span>
        <p className="mt-5 text-lead font-semibold text-green-deep">
          {result.message}
        </p>
        <p className="mt-3 text-ink-soft">
          לשאלות נוספות אפשר לפנות ל־
          <a
            href="mailto:office@improve-movement.co.il"
            className="underline hover:text-green-deep"
          >
            office@improve-movement.co.il
          </a>
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {result && !result.success && (
        <div className="rounded-[14px] border-2 border-burgundy bg-[var(--burgundy-wash)] px-4 py-3">
          <p className="font-semibold text-burgundy">{result.message}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-2 block font-display font-bold text-ink"
        >
          כתובת אימייל
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          dir="ltr"
          placeholder="your@email.com"
          className="w-full rounded-[14px] border-2 border-hairline bg-white px-4 py-3.5 text-lead text-ink transition-colors duration-[var(--dur-fast)] hover:border-ink/25 focus:border-burgundy focus:outline-none"
        />
        <p className="mt-2 text-ink-faint">
          הכניסו את כתובת האימייל שאיתה נרשמתם לאפליקציה
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmation"
          className="mb-2 block font-display font-bold text-ink"
        >
          אישור מחיקה
        </label>
        <input
          type="text"
          id="confirmation"
          name="confirmation"
          required
          dir="rtl"
          placeholder='הקלידו "מחיקת חשבון"'
          className="w-full rounded-[14px] border-2 border-hairline bg-white px-4 py-3.5 text-lead text-ink transition-colors duration-[var(--dur-fast)] hover:border-ink/25 focus:border-burgundy focus:outline-none"
        />
        <p className="mt-2 text-ink-faint">
          הקלידו &quot;מחיקת חשבון&quot; לאישור
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-[60px] w-full items-center justify-center rounded-pill bg-burgundy px-8 font-display text-lead font-bold text-white shadow-lift-1 transition-[background-color,box-shadow,transform] duration-[var(--dur-fast)] ease-out-expo hover:-translate-y-0.5 hover:bg-burgundy-deep hover:shadow-lift-2 disabled:pointer-events-none disabled:opacity-55"
      >
        {isPending ? "שולח בקשה..." : "שליחת בקשת מחיקה"}
      </button>
    </form>
  );
}
