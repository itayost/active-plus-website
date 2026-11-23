"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { cleanPath, fromMetaAd, linkTarget } from "@/lib/pageviews/parse";

const ENDPOINT = "/api/page-view";

/*
 * Anonymous page views for the office's report (lib/pageviews/parse.ts).
 * The visit id lives only in this module's memory: it survives moving between
 * pages inside the site and ends with the tab. Nothing is written to cookies
 * or storage. Time on page counts only while the page is on screen.
 */
let visitId: string | null = null;
let firstView = true;

function send(body: Record<string, unknown>): void {
  try {
    const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(ENDPOINT, blob)) return;
    void fetch(ENDPOINT, { method: "POST", body: blob, keepalive: true }).catch(() => {});
  } catch {
    // Measurement must never break a page.
  }
}

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : null);

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const path = cleanPath(pathname);
    const id = newId();
    if (!path || !id) return;
    visitId ??= newId();
    const visit = visitId;
    if (!visit) return;

    if (firstView) {
      firstView = false;
      const search = new URLSearchParams(window.location.search);
      let ref: string | null = null;
      try {
        const host = document.referrer ? new URL(document.referrer).hostname : "";
        ref = host && host !== window.location.hostname ? host : null;
      } catch {
        ref = null;
      }
      send({ t: "view", id, visit, path, ref, meta: fromMetaAd(search), ad: search.get("utm_content") });
    } else {
      send({ t: "view", id, visit, path });
    }

    let shownMs = 0;
    let shownSince = document.visibilityState === "visible" ? Date.now() : null;
    const seconds = () => (shownMs + (shownSince ? Date.now() - shownSince : 0)) / 1000;
    const report = () => send({ t: "end", id, visit, seconds: seconds() });

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (shownSince) shownMs += Date.now() - shownSince;
        shownSince = null;
        report();
      } else if (!shownSince) {
        shownSince = Date.now();
      }
    };
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("a[href], [data-track]");
      if (!el) return;
      const named = el.getAttribute("data-track");
      const target = named ?? linkTarget(el.getAttribute("href") ?? "", window.location.origin);
      if (target) send({ t: "click", id, visit, path, target });
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", report);
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", report);
      document.removeEventListener("click", onClick, { capture: true });
      if (document.visibilityState === "visible") report();
    };
  }, [pathname]);

  return null;
}
