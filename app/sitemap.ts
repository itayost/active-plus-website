import type { MetadataRoute } from "next";
import { SITE_ROUTES } from "@/lib/routes";
import { SITE_URL } from "@/lib/constants";

/** Marked noindex on the page itself, so it must not appear here. */
const EXCLUDED = new Set(["/questionnaire"]);

const MAIN_PAGES = new Set(["/about", "/how-it-works", "/payment", "/articles"]);

const LEGAL_PAGES = new Set(["/privacy-policy", "/delete-account"]);

function priorityFor(path: string): number {
  if (path === "/") return 1;
  if (MAIN_PAGES.has(path)) return 0.8;
  if (LEGAL_PAGES.has(path)) return 0.3;
  return 0.6; // the explainers and each article
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return SITE_ROUTES.filter((path) => !EXCLUDED.has(path)).map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: now,
    priority: priorityFor(path),
  }));
}
