import type { Metadata } from "next";
import DeleteAccountForm from "./DeleteAccountForm";

export const metadata: Metadata = {
  title: "מחיקת חשבון | פעילים פלוס",
  description: "בקשה למחיקת חשבון באפליקציית פעילים פלוס",
};

export default function DeleteAccountPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">מחיקת חשבון</h1>
      <p className="text-gray-500 mb-10">עדכון אחרון: פברואר 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          כיצד למחוק את החשבון שלך
        </h2>
        <div className="text-gray-700 privacy-content">
          <p className="mb-4">
            ניתן למחוק את החשבון שלך בשתי דרכים:
          </p>
          <ul>
            <li>
              <strong>מתוך האפליקציה</strong> — פרופיל → גללו למטה → &quot;מחיקת
              חשבון&quot;
            </li>
            <li>
              <strong>דרך טופס זה</strong> — למי שכבר הסיר את האפליקציה מהמכשיר
            </li>
          </ul>
        </div>
      </section>

      <section className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          בקשת מחיקת חשבון
        </h2>

        <div className="bg-white rounded-lg p-6 mb-6">
          <DeleteAccountForm />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          אילו נתונים יימחקו
        </h2>
        <div className="text-gray-700 privacy-content">
          <p className="mb-3">
            עם מחיקת החשבון, כל הנתונים הבאים יימחקו לצמיתות:
          </p>
          <ul>
            <li>פרטים אישיים (שם, אימייל, טלפון, תאריך לידה)</li>
            <li>מידע בריאותי (גובה, משקל, מגבלות רפואיות)</li>
            <li>היסטוריית אימונים ונתוני התקדמות</li>
            <li>שאלוני בריאות</li>
            <li>הגדרות והעדפות אישיות</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          מידע חשוב
        </h2>
        <div className="text-gray-700 privacy-content">
          <ul>
            <li>
              מחיקת החשבון היא בלתי הפיכה — לא ניתן לשחזר את הנתונים לאחר
              המחיקה
            </li>
            <li>הבקשה תטופל תוך 7 ימי עסקים</li>
            <li>
              אם יש לכם מנוי פעיל, יש לבטל אותו בנפרד דרך הגדרות החנות (App
              Store / Google Play) לפני מחיקת החשבון
            </li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          שאלות נוספות
        </h2>
        <div className="text-gray-700 privacy-content">
          <p>
            לשאלות בנוגע למחיקת חשבון, ניתן לפנות אלינו:
            <br />
            <a
              href="mailto:office@improve-movement.co.il"
              className="text-primary-600 hover:underline"
            >
              office@improve-movement.co.il
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
