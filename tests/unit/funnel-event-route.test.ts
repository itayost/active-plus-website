import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
const from = vi.fn(() => ({ insert }));
vi.mock("@/lib/supabase", () => ({ createServiceClient: () => ({ from }) }));

import { POST } from "@/app/api/funnel-event/route";

const SESSION = "3f2b8c1e-9d4a-4b7e-8a6f-1c2d3e4f5a6b";
let ipCounter = 0;
const nextIp = () => `10.0.0.${++ipCounter}`;

function post(payload: unknown, init: { ip?: string; type?: string; raw?: string } = {}) {
  return POST(
    new Request("http://localhost/api/funnel-event", {
      method: "POST",
      headers: { "content-type": init.type ?? "application/json", "x-vercel-forwarded-for": init.ip ?? nextIp() },
      body: init.raw ?? JSON.stringify(payload),
    }),
  );
}

const valid = { sessionId: SESSION, step: "otp_view", data: { gender: "male" } };

beforeEach(() => {
  vi.restoreAllMocks();
  insert.mockReset();
  insert.mockResolvedValue({ error: null });
  from.mockClear();
});

describe("POST /api/funnel-event", () => {
  it("inserts a valid event as a web event and answers 204", async () => {
    const res = await post(valid);
    expect(res.status).toBe(204);
    expect(from).toHaveBeenCalledWith("funnel_events");
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert.mock.calls[0][0]).toMatchObject({
      session_id: SESSION,
      step: "otp_view",
      data: { gender: "male", funnel_version: "v2-web" },
      client_platform: "web",
    });
    expect(typeof insert.mock.calls[0][0].client_version).toBe("string");
  });

  it("accepts the text/plain body sendBeacon may send", async () => {
    const res = await post(valid, { type: "text/plain;charset=UTF-8" });
    expect(res.status).toBe(204);
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("answers 204 without inserting for invalid input", async () => {
    for (const bad of [{ ...valid, sessionId: "x" }, { ...valid, step: "nope" }]) {
      expect((await post(bad)).status).toBe(204);
    }
    expect((await post(null, { raw: "{not json" })).status).toBe(204);
    expect(insert).not.toHaveBeenCalled();
  });

  it("answers 204 without inserting for a body over the cap", async () => {
    const res = await post(null, { raw: JSON.stringify({ ...valid, pad: "a".repeat(5000) }) });
    expect(res.status).toBe(204);
    expect(insert).not.toHaveBeenCalled();
  });

  function chunked(text: string, size: number) {
    const bytes = new TextEncoder().encode(text);
    let sent = 0;
    const state = { cancelled: false, pulled: 0 };
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (sent >= bytes.length) return controller.close();
        controller.enqueue(bytes.slice(sent, sent + size));
        sent += size;
        state.pulled = sent;
      },
      cancel() {
        state.cancelled = true;
      },
    });
    const response = POST(
      new Request("http://localhost/api/funnel-event", {
        method: "POST",
        headers: { "content-type": "text/plain", "x-vercel-forwarded-for": nextIp() },
        body: stream,
        duplex: "half",
      } as RequestInit),
    );
    return Object.assign(response, { state, total: bytes.length });
  }

  it("reads a chunked body with no content-length and inserts when under the cap", async () => {
    expect((await chunked(JSON.stringify(valid), 7)).status).toBe(204);
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("stops reading a chunked body over the cap and does not insert", async () => {
    const pending = chunked(JSON.stringify({ ...valid, pad: "a".repeat(100_000) }), 512);
    const res = await pending;
    expect(res.status).toBe(204);
    expect(pending.state.cancelled).toBe(true);
    expect(pending.state.pulled).toBeLessThan(pending.total);
    expect(insert).not.toHaveBeenCalled();
  });

  it("rate limits requests with no resolvable address under one shared key", async () => {
    const anon = () =>
      POST(new Request("http://localhost/api/funnel-event", { method: "POST", body: JSON.stringify(valid) }));
    for (let i = 0; i < 120; i++) await anon();
    expect(insert).toHaveBeenCalledTimes(120);
    expect((await anon()).status).toBe(204);
    expect(insert).toHaveBeenCalledTimes(120);
  });

  it("strips PII keys before the insert", async () => {
    await post({ ...valid, data: { phone: "0501234567", name: "x", step: 1 } });
    expect(insert.mock.calls[0][0].data).toEqual({ step: 1, funnel_version: "v2-web" });
  });

  it("answers 204 and logs only the error code when the insert fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    insert.mockResolvedValue({ error: { code: "23514", message: "secret detail" } });
    const ip = "192.0.2.77";
    const res = await post(valid, { ip });
    expect(res.status).toBe(204);
    const logged = JSON.stringify(log.mock.calls);
    expect(logged).toContain("23514");
    expect(logged).not.toContain("secret detail");
    expect(logged).not.toContain(ip);
    expect(logged).not.toContain(SESSION);
  });

  it("answers 204 when the client cannot be created", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    insert.mockRejectedValue(new Error("boom"));
    expect((await post(valid)).status).toBe(204);
  });

  it("stops inserting after 120 events a minute from one address", async () => {
    const ip = "198.51.100.9";
    for (let i = 0; i < 120; i++) await post(valid, { ip });
    expect(insert).toHaveBeenCalledTimes(120);
    const res = await post(valid, { ip });
    expect(res.status).toBe(204);
    expect(insert).toHaveBeenCalledTimes(120);
    await post(valid, { ip: "198.51.100.10" });
    expect(insert).toHaveBeenCalledTimes(121);
  });
});
