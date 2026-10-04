import { ARTICLES } from "@/content/articles";

/** Every page the site serves. Tests, the sitemap and the 404 page read it. */
export const SITE_ROUTES: readonly string[] = [
  "/",
  "/about",
  "/how-it-works",
  "/questionnaire",
  "/payment",
  "/articles",
  ...ARTICLES.map((a) => `/articles/${a.slug}`),
  "/personal-plan",
  "/motion-detection",
  "/progress",
  "/privacy-policy",
  "/delete-account",
];
