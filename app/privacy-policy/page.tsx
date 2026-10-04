import type { Metadata } from "next";

import PageHero from "@/components/layout/PageHero";
import { Shell } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description:
    "כיצד פעילים+ אוספת, משתמשת ומגנה על המידע האישי שלך באפליקציה ובאתר.",
};

interface PrivacySectionProps {
  title: string;
  children: React.ReactNode;
}

function PrivacySection({ title, children }: PrivacySectionProps) {
  return (
    <section className="legal-section">
      <h2 className="mb-4 font-display text-h3 font-bold text-ink">
        {title}
      </h2>
      <div className="text-ink-soft">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero title="מדיניות פרטיות" lede="עדכון אחרון: ינואר 2025" tone="blue" />
      <div className="bg-surface py-[var(--section-y)]">
        <Shell width="narrow">

      <PrivacySection title="1. מבוא">
        <p>
          אנו מחויבים להגן על פרטיותך. מדיניות זו מסבירה כיצד אנו אוספים,
          משתמשים ומגנים על המידע האישי שלך באפליקציה &quot;פעילים פלוס&quot;.
        </p>
      </PrivacySection>

      <PrivacySection title="2. מידע שאנו אוספים">
        <ul>
          <li>פרטים אישיים: שם, כתובת אימייל, מספר טלפון, תאריך לידה</li>
          <li>מידע בריאותי: גובה, משקל, מגבלות רפואיות (בהסכמתך)</li>
          <li>נתוני שימוש: היסטוריית אימונים, התקדמות, העדפות</li>
          <li>מידע טכני: סוג המכשיר, גרסת מערכת ההפעלה</li>
        </ul>
      </PrivacySection>

      <PrivacySection title="3. כיצד אנו משתמשים במידע">
        <ul>
          <li>התאמה אישית של תוכניות אימון</li>
          <li>שיפור השירות והחוויה באפליקציה</li>
          <li>שליחת תזכורות והתראות (בהסכמתך)</li>
          <li>תמיכה טכנית ושירות לקוחות</li>
          <li>מחקר ופיתוח לשיפור השירות</li>
        </ul>
      </PrivacySection>

      <PrivacySection title="4. שיתוף מידע">
        <p>
          איננו מוכרים או משתפים את המידע האישי שלך עם צדדים שלישיים למטרות
          שיווקיות. המידע עשוי להיות משותף עם ספקי שירות הפועלים בשמנו (כגון
          שירותי אחסון ענן) תחת הסכמי סודיות.
        </p>
      </PrivacySection>

      <PrivacySection title="5. אבטחת מידע">
        <p>
          אנו מיישמים אמצעי אבטחה מתקדמים להגנה על המידע שלך, כולל הצפנת נתונים,
          גישה מוגבלת ומעקב אחר פעילות חשודה. עם זאת, אין שיטת אבטחה מושלמת
          ב-100%.
        </p>
      </PrivacySection>

      <PrivacySection title="6. הזכויות שלך">
        <p className="mb-2">יש לך זכות:</p>
        <ul>
          <li>לגשת למידע האישי שלך</li>
          <li>לתקן מידע שגוי</li>
          <li>למחוק את המידע שלך (&quot;הזכות להישכח&quot;)</li>
          <li>להתנגד לעיבוד מסוים של המידע</li>
          <li>להעביר את המידע לשירות אחר</li>
        </ul>
      </PrivacySection>

      <PrivacySection title="7. שמירת מידע">
        <p>
          אנו שומרים את המידע שלך כל עוד החשבון שלך פעיל או כנדרש לספק לך
          שירותים. לאחר מחיקת החשבון, המידע יימחק תוך 30 יום, למעט מידע שנדרש
          לשמור על פי חוק.
        </p>
      </PrivacySection>

      <PrivacySection title="8. עוגיות (Cookies)">
        <p>
          האפליקציה משתמשת בעוגיות וטכנולוגיות דומות לשיפור חווית המשתמש ולאיסוף
          נתונים סטטיסטיים. ניתן לשלוט בהגדרות אלו דרך הגדרות המכשיר.
        </p>
      </PrivacySection>

      <PrivacySection title="9. שינויים במדיניות">
        <p>
          אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו באפליקציה
          ותישלח הודעה למשתמשים.
        </p>
      </PrivacySection>

      <PrivacySection title="10. יצירת קשר">
        <p>
          לשאלות בנוגע לפרטיות, ניתן לפנות אלינו:
          <br />
          <a
            href="mailto:office@improve-movement.co.il"
            className="text-blue-deep underline hover:text-blue"
          >
            office@improve-movement.co.il
          </a>
        </p>
      </PrivacySection>
        </Shell>
      </div>
    </>
  );
}
