import type { Metadata } from "next";
import DeleteAccountForm from "./DeleteAccountForm";

import PageHero from "@/components/layout/PageHero";
import { Shell } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "מחיקת חשבון",
  description: "בקשה למחיקת חשבון באפליקציית פעילים+ ומה קורה לנתונים שלך.",
};

export default function DeleteAccountPage() {
  return (
    <>
      <PageHero
        title="מחיקת חשבון"
        lede="עדכון אחרון: פברואר 2026"
        tone="burgundy"
      />
      <div className="bg-surface py-[var(--section-y)]">
        <Shell width="narrow">

      <section className="legal-section">
        <h2 className="mb-4 font-display text-h3 font-bold text-ink">
          כיצד למחוק את החשבון שלך
        </h2>
        <div className="text-ink-soft">
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

      <section className="my-12 rounded-card border-2 border-burgundy/25 bg-[var(--burgundy-wash)] p-[clamp(min(1.5rem,7.5vw),3vw,2.5rem)]">
        <h2 className="mb-6 font-display text-h3 font-bold text-burgundy">
          בקשת מחיקת חשבון
        </h2>

        <div className="rounded-[20px] bg-surface p-[clamp(min(1.25rem,6.25vw),2.5vw,2rem)]">
          <DeleteAccountForm />
        </div>
      </section>

      <section className="legal-section">
        <h2 className="mb-4 font-display text-h3 font-bold text-ink">
          אילו נתונים יימחקו
        </h2>
        <div className="text-ink-soft">
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

      <section className="legal-section">
        <h2 className="mb-4 font-display text-h3 font-bold text-ink">
          מידע חשוב
        </h2>
        <div className="text-ink-soft">
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

      <section className="legal-section">
        <h2 className="mb-4 font-display text-h3 font-bold text-ink">
          שאלות נוספות
        </h2>
        <div className="text-ink-soft">
          <p>
            לשאלות בנוגע למחיקת חשבון, ניתן לפנות אלינו:
            <br />
            <a
              href="mailto:office@improve-movement.co.il"
              className="text-blue-deep underline hover:text-blue"
            >
              office@improve-movement.co.il
            </a>
          </p>
        </div>
      </section>
        </Shell>
      </div>
    </>
  );
}
