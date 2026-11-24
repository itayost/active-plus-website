import { describe, expect, it, vi } from "vitest";
import { isNurtureToken, recordNurtureClick } from "@/lib/nurture/click";

const token = "1b4e28ba-2fa1-11d2-883f-0016d3cca427";

describe("nurture click link", () => {
  it("accepts only a uuid token", () => {
    expect(isNurtureToken(token)).toBe(true);
    expect(isNurtureToken("abc")).toBe(false);
  });

  it("counts the click once through the public function", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("true"));
    await recordNurtureClick(token, { url: "https://x.supabase.co", anonKey: "anon" }, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe("https://x.supabase.co/rest/v1/rpc/record_app_nurture_click");
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ p_token: token });
  });

  it("never calls out for a bad token and never throws", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("down"));
    await recordNurtureClick("bad", { url: "u", anonKey: "k" }, fetcher);
    expect(fetcher).not.toHaveBeenCalled();
    await expect(recordNurtureClick(token, { url: "u", anonKey: "k" }, fetcher)).resolves.toBeUndefined();
  });
});
