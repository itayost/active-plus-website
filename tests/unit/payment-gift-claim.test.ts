import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { claimGiftTrial } from "@/lib/payment/gift";

function fakeClient(answer: unknown, signedIn = true): SupabaseClient {
  return {
    auth: { getSession: async () => ({ data: { session: signedIn ? { access_token: "t" } : null } }) },
    rpc: async () => ({ data: answer, error: null }),
  } as unknown as SupabaseClient;
}

describe("claimGiftTrial", () => {
  it("is ok for a new person and for a second claim", async () => {
    expect(await claimGiftTrial(fakeClient({ ok: true }))).toEqual({ ok: true });
    expect(await claimGiftTrial(fakeClient({ ok: true, already: true }))).toEqual({ ok: true });
  });

  it("tells an account the gift is not for apart from the gift being off", async () => {
    expect(await claimGiftTrial(fakeClient({ ok: false, reason: "not_eligible" }))).toEqual({ ok: false, error: "not_eligible" });
    expect(await claimGiftTrial(fakeClient({ ok: false, reason: "off" }))).toEqual({ ok: false, error: "not_offered" });
  });

  it("asks for the phone when there is no sign-in", async () => {
    expect(await claimGiftTrial(fakeClient({ ok: true }, false))).toEqual({ ok: false, error: "signed_out" });
    expect(await claimGiftTrial(fakeClient({ ok: false, reason: "signed_out" }))).toEqual({ ok: false, error: "signed_out" });
  });
});
