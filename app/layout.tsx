import type { Metadata, Viewport } from "next";
import { Heebo, Rubik } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SITE_NAME_FULL, SITE_URL } from "@/lib/constants";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  weight: ["500", "700", "900"],
  variable: "--font-rubik",
  display: "swap",
});

/**
 * The design direction this build is held to. Emitted as a real HTML comment
 * (a JSX comment is compiled away) so the contract is auditable in the shipped
 * markup. Constant string, no interpolation — nothing here is user input.
 */
const DIRECTION_CONTRACT = `<!--
THESIS: this surface owns the connection, never one half of it — every primary
element shows movement and thinking happening at once. It refuses the health
category hero of pastel gradient, smiling stock couple and three identical
feature cards.
OWN-WORLD: the client-pinned Effectivate system rebuilt in Active Plus material —
four page-scale colour fields (blue movement, green progress, purple cognition,
burgundy daily practice), white pill actions, an 18px body floor, Rubik display
over Heebo text, soft-offset depth, no orange.
STORY: a 55+ reader understands that body and mind train together, tries it in
the Dual Task demo, trusts the Lancet evidence and the named clinicians, and
leaves their details.
FIRST VIEWPORT: one full-width rounded card holding the intro video, with the
display headline, its supporting line and both actions centred inside it; the
lead-form action leads and the play-marked tour sits beside it.
FORM: brief-pinned direction — effectivate.co.il, supplied by the client; the
direction roll (seed 08d0d56e) is superseded per the pinned-brief rule.
FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, and DESIGN.md.
-->`;

/**
 * `viewport-fit: cover` lets the page paint into the display cutout area, which
 * is the only way `env(safe-area-inset-*)` reports anything but 0. Without it a
 * notched phone held sideways letterboxes the whole document in black bars; with
 * it the fields run edge to edge and the insets (applied in globals.css) keep
 * text and controls clear of the notch and the home indicator.
 *
 * `maximumScale` and `userScalable` are deliberately left at their defaults —
 * pinch-zoom is this audience's most-used accessibility tool and must not be
 * capped.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME_FULL} | אימון גוף ומוח בו־זמנית לגילאי 55+`,
    template: `%s | ${SITE_NAME_FULL}`,
  },
  description:
    "מערכת לאימון הגוף ולחדות המחשבה. 10 דקות ביום של תנועה יחד עם משימות זיכרון, קשב ותגובה — מהבית, בהתאמה אישית.",
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: SITE_NAME_FULL,
  },
  /*
   * The brief names a second audience who arrives by being sent a link, which
   * makes the share card part of the product rather than an SEO afterthought.
   * `app/opengraph-image.jpg` supplies the picture through the file convention;
   * declaring the card type here is what makes X render it large instead of as
   * a thumbnail, and lets crawlers without their own image fall back to the
   * Open Graph one.
   */
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} ${rubik.variable} font-sans`}>
        <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-50 focus:rounded-pill focus:bg-ink focus:px-6 focus:py-3 focus:text-white"
        >
          דילוג לתוכן הראשי
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
