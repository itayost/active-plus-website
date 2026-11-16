import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import fixtures from "../fixtures/tv-link-protocol.fixtures.json";
import { buildTvCsp, renderTvPage } from "@/lib/tv/page";

// The TV script is plain ES5 for old TV browsers; it exports its pure protocol
// under CommonJS so the shared fixtures (FitnessForSeniorsApp
// shared/tv-link/protocol.fixtures.json, byte-identical copy) run here as they
// do in TvLinkProtocolTest.kt and TvLinkProtocolTests.swift.
const require = createRequire(import.meta.url);
const tv = require("../../public/tv/tv.js") as {
  joinFrame: (topic: string, token: string, ref: string) => unknown;
  heartbeatFrame: (ref: string) => unknown;
  broadcastFrame: (topic: string, message: unknown, ref: string, joinRef: string) => unknown;
  parseFrame: (frame: unknown, topic: string, joinRef: string) => unknown;
  normalizeCode: (input: string) => string | null;
  websocketUrl: (supabaseUrl: string, anonKey: string) => string;
};

describe("tv link protocol (shared fixtures)", () => {
  it("joins the private channel", () => {
    expect(tv.joinFrame(fixtures.topic, fixtures.join.accessToken, fixtures.join.ref)).toEqual(fixtures.join.frame);
  });

  it("beats the heart", () => {
    expect(tv.heartbeatFrame(fixtures.heartbeat.ref)).toEqual(fixtures.heartbeat.frame);
  });

  it.each(fixtures.send)("sends $name", (c) => {
    expect(tv.broadcastFrame(fixtures.topic, c.message, c.ref, c.joinRef)).toEqual(c.frame);
  });

  it.each(fixtures.receive)("reads $name", (c) => {
    expect(tv.parseFrame(c.frame, fixtures.topic, c.joinRef)).toEqual(c.result);
  });

  it.each(fixtures.codes)("code '$input'", (c) => {
    expect(tv.normalizeCode(c.input)).toBe(c.code);
  });

  it.each(fixtures.websocketUrl)("websocket for $supabaseUrl", (c) => {
    expect(tv.websocketUrl(c.supabaseUrl, c.anonKey)).toBe(c.url);
  });
});

describe("tv script stays ES5", () => {
  const source = readFileSync(join(process.cwd(), "public/tv/tv.js"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  it.each([
    ["const", /\bconst\s/],
    ["let", /\blet\s/],
    ["arrow function", /=>/],
    ["template string", /`/],
    ["class", /\bclass\s+[A-Z]/],
    ["fetch", /\bfetch\(/],
    ["spread", /\.\.\.[a-zA-Z]/],
    ["async", /\basync\s/],
    ["optional chaining", /\?\./],
  ])("has no %s", (_name, pattern) => {
    expect(source).not.toMatch(pattern);
  });
});

describe("tv page", () => {
  const html = renderTvPage({ supabaseUrl: "https://abc.supabase.co", anonKey: "a</script>b" });

  it("is Hebrew, right to left, and never indexed", () => {
    expect(html).toContain('<html lang="he" dir="rtl">');
    expect(html).toContain('<meta name="robots" content="noindex">');
  });

  it("cannot be broken out of by its config", () => {
    expect(html).not.toContain("a</script>b");
    expect(html).toContain("a\\u003c/script\\u003eb");
  });

  it("has a screen for every state the script shows", () => {
    for (const id of ["screen-code", "screen-paired", "screen-play", "screen-done", "screen-error", "code-digits", "video", "forget", "sound-hint", "paused-badge"]) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it("lets the page reach Realtime and the videos, and nothing else outside", () => {
    const csp = buildTvCsp("https://abc.supabase.co");
    expect(csp).toContain("connect-src 'self' https://abc.supabase.co wss://abc.supabase.co");
    expect(csp).toContain("media-src 'self' https://abc.supabase.co");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(buildTvCsp(undefined)).toContain("connect-src 'self'");
  });
});
