"use client";

import { useState, useTransition } from "react";
import { submitDeletionRequest, type DeleteAccountResult } from "./actions";

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
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-3xl mb-3">&#10003;</div>
        <p className="text-green-800 text-lg font-medium">{result.message}</p>
        <p className="text-green-600 mt-3 text-sm">
          לשאלות נוספות ניתן לפנות ל-office@improve-movement.co.il
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {result && !result.success && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{result.message}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-gray-900 font-medium mb-2"
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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-gray-900 text-lg"
        />
        <p className="text-gray-500 text-sm mt-1">
          הכניסו את כתובת האימייל שאיתה נרשמתם לאפליקציה
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmation"
          className="block text-gray-900 font-medium mb-2"
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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-gray-900 text-lg"
        />
        <p className="text-gray-500 text-sm mt-1">
          הקלידו &quot;מחיקת חשבון&quot; לאישור
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-red-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
      >
        {isPending ? "שולח בקשה..." : "שליחת בקשת מחיקה"}
      </button>
    </form>
  );
}
