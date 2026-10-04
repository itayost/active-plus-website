import { afterEach, describe, expect, it, vi } from "vitest";
import { finishSignup } from "@/lib/funnel/finish";

type Fake = {
  profileName?: string | null;
  rpcError?: unknown;
  selectError?: unknown;
  user?: { id: string } | null;
  rpcData?: unknown;
};

function fakeSupabase({ profileName = null, rpcError = null, selectError = null, user = { id: "u1" }, rpcData }: Fake = {}) {
  const rpc = vi.fn().mockResolvedValue({ data: rpcData ?? { success: !rpcError }, error: rpcError });
  const eq = vi.fn(() => ({
    maybeSingle: vi.fn().mockResolvedValue({
      data: selectError || profileName === null ? null : { full_name: profileName },
      error: selectError,
    }),
  }));
  return {
    rpc,
    eq,
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: user ? null : { status: 401 } }) },
    from: vi.fn(() => ({ select: () => ({ eq }) })),
  };
}

afterEach(() => vi.restoreAllMocks());

describe("finishSignup", () => {
  it("merges a new user's answers with the session id", async () => {
    const sb = fakeSupabase();
    const r = await finishSignup(sb as never, "s1", { gender: "female", full_name: "רחל" });
    expect(sb.rpc).toHaveBeenCalledWith("merge_funnel_session", { p_session_id: "s1", p_answers: { gender: "female", full_name: "רחל" } });
    expect(r).toEqual({ kind: "new" });
  });

  it("only fills missing answers for an existing user and keeps their name", async () => {
    const sb = fakeSupabase({ profileName: "דוד לוי" });
    const r = await finishSignup(sb as never, "s1", { gender: "male", full_name: "דוד" });
    expect(sb.rpc).toHaveBeenCalledWith("fill_missing_funnel_answers", { p_answers: { gender: "male" } });
    expect(r).toEqual({ kind: "existing", name: "דוד לוי" });
  });

  it("reports a merge failure instead of throwing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await finishSignup(fakeSupabase({ rpcError: { message: "boom" } }) as never, "s1", {});
    expect(r).toEqual({ kind: "error" });
  });

  it("reads the signed-in user's own row by id", async () => {
    const sb = fakeSupabase();
    await finishSignup(sb as never, "s1", {});
    expect(sb.from).toHaveBeenCalledWith("users");
    expect(sb.eq).toHaveBeenCalledWith("id", "u1");
  });

  it("stops on a profile read error instead of treating the user as new", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const sb = fakeSupabase({ selectError: { code: "42501", message: "permission denied" } });
    const r = await finishSignup(sb as never, "s1", { gender: "male" });
    expect(r).toEqual({ kind: "error" });
    expect(sb.rpc).not.toHaveBeenCalled();
  });

  it("never calls an RPC without a signed-in user", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const sb = fakeSupabase({ user: null });
    const r = await finishSignup(sb as never, "s1", { gender: "male" });
    expect(r).toEqual({ kind: "error" });
    expect(sb.rpc).not.toHaveBeenCalled();
  });

  it("treats a blank profile name as a new user", async () => {
    const sb = fakeSupabase({ profileName: "   " });
    const r = await finishSignup(sb as never, "s1", { gender: "male" });
    expect(sb.rpc).toHaveBeenCalledWith("merge_funnel_session", { p_session_id: "s1", p_answers: { gender: "male" } });
    expect(r).toEqual({ kind: "new" });
  });

  it("sends the cleaned payload: no off-branch answer, trimmed name", async () => {
    const sb = fakeSupabase();
    await finishSignup(sb as never, "s1", {
      chair_rise_capability: "alone",
      mobility_challenge: "stairs",
      standing_stability: "stable",
      full_name: "  רחל  ",
    });
    expect(sb.rpc).toHaveBeenCalledWith("merge_funnel_session", {
      p_session_id: "s1",
      p_answers: { chair_rise_capability: "alone", mobility_challenge: "stairs", full_name: "רחל" },
    });
  });

  it("treats an RPC that answers success: false as a failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await finishSignup(fakeSupabase({ rpcData: { success: false } }) as never, "s1", {});
    expect(r).toEqual({ kind: "error" });
  });

  it("reports a thrown network failure instead of throwing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const sb = fakeSupabase();
    sb.rpc.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await finishSignup(sb as never, "s1", {})).toEqual({ kind: "error" });
  });

  it("logs only the error code, never the answers or the name", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await finishSignup(fakeSupabase({ rpcError: { code: "P0001", message: "רחל 0501234567" } }) as never, "s1", { full_name: "רחל" });
    const logged = JSON.stringify(log.mock.calls);
    expect(logged).toContain("P0001");
    expect(logged).not.toContain("רחל");
    expect(logged).not.toContain("0501234567");
  });
});
