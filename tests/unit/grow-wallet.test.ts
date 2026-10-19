import { afterEach, describe, expect, it } from "vitest";
import { GROW_SDK_URL, openGrowWallet, prepareGrowWallet, resetGrowWallet, type WalletDeps, type WalletWindow } from "@/lib/payment/grow-wallet";

type Events = Record<string, (payload?: unknown) => void>;

/** A window whose script tag "loads" Grow's SDK; the SDK records init and render and exposes its events. */
function fakeGrow(options: { loads?: boolean; runtime?: boolean } = {}) {
  const { loads = true } = options;
  const state = { runtime: options.runtime ?? true };
  const appended: { src: string }[] = [];
  const inits: { environment: string; version: number }[] = [];
  const rendered: string[] = [];
  let events: Events = {};
  const win = {
    document: {
      createElement: () => ({ src: "", async: false, onload: null as null | (() => void), onerror: null as null | (() => void) }),
      head: {
        appendChild: (script: { src: string; onload: () => void; onerror: () => void }) => {
          appended.push(script);
          queueMicrotask(() => {
            if (!loads) return script.onerror();
            win.growPayment = {
              init: async (config: { environment: string; version: number; events: Events }) => {
                inits.push({ environment: config.environment, version: config.version });
                events = config.events;
                if (state.runtime) win.growRuntime = {};
              },
              renderPaymentOptions: (code: string) => void rendered.push(code),
            };
            script.onload();
          });
        },
      },
    },
  } as unknown as WalletWindow & { growPayment?: unknown; growRuntime?: unknown };
  let clock = 0;
  const deps: WalletDeps = {
    win,
    now: () => clock,
    // Time only moves when the code under test waits; the open timeout's wait never resolves here.
    sleep: (ms) => (ms >= 60_000 ? new Promise(() => {}) : Promise.resolve(void (clock += ms))),
  };
  return { deps, state, appended, inits, rendered, fire: (name: string, payload?: unknown) => events[name]?.(payload) };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => resetGrowWallet());

describe("prepareGrowWallet", () => {
  it("loads Grow's SDK once and initialises it once per environment, version 1", async () => {
    const grow = fakeGrow();
    expect(await prepareGrowWallet("DEV", grow.deps)).toBe(true);
    expect(await prepareGrowWallet("DEV", grow.deps)).toBe(true);
    expect(grow.appended.map((s) => s.src)).toEqual([GROW_SDK_URL]);
    expect(grow.inits).toEqual([{ environment: "DEV", version: 1 }]);
  });
  it("fails when the script does not load, and a later call tries again", async () => {
    const grow = fakeGrow({ loads: false });
    expect(await prepareGrowWallet("DEV", grow.deps)).toBe(false);
    expect(await prepareGrowWallet("DEV", grow.deps)).toBe(false);
    expect(grow.appended.length).toBe(2);
  });
  it("gives up when Grow's runtime never arrives, and the next call initialises again", async () => {
    const grow = fakeGrow({ runtime: false });
    expect(await prepareGrowWallet("PRODUCTION", grow.deps)).toBe(false);
    grow.state.runtime = true;
    expect(await prepareGrowWallet("PRODUCTION", grow.deps)).toBe(true);
    expect(grow.inits.length).toBe(2);
    expect(grow.appended.length).toBe(1);
  });
});

describe("openGrowWallet", () => {
  async function opened(grow = fakeGrow(), onOpen?: () => void) {
    const outcome = openGrowWallet("auth-1", "DEV", { onOpen }, grow.deps);
    await tick();
    return { grow, outcome };
  }

  it("renders the wallet with the authCode and settles on success", async () => {
    const { grow, outcome } = await opened();
    expect(grow.rendered).toEqual(["auth-1"]);
    grow.fire("onWalletChange", "open");
    grow.fire("onSuccess", { status: 1 });
    expect(await outcome).toBe("success");
  });
  it("closing the wallet without paying is closed", async () => {
    let opens = 0;
    const { grow, outcome } = await opened(fakeGrow(), () => void (opens += 1));
    grow.fire("onWalletChange", "open");
    grow.fire("onWalletChange", "close");
    expect([await outcome, opens]).toEqual(["closed", 1]);
  });
  it("a failure inside the open wallet waits for the buyer to close it, then reports it", async () => {
    const { grow, outcome } = await opened();
    grow.fire("onWalletChange", "open");
    grow.fire("onFailure", { status: 0, message: "declined" });
    let settled = false;
    void outcome.then(() => (settled = true));
    await tick();
    expect(settled).toBe(false);
    grow.fire("onWalletChange", "close");
    expect(await outcome).toBe("failed");
  });
  it("a retry inside the wallet that succeeds wins over the earlier failure", async () => {
    const { grow, outcome } = await opened();
    grow.fire("onWalletChange", "open");
    grow.fire("onFailure");
    grow.fire("onSuccess");
    expect(await outcome).toBe("success");
  });
  it.each([
    ["onFailure", "failed"],
    ["onError", "error"],
    ["onTimeout", "expired"],
  ])("%s before the wallet opens settles at once as %s", async (event, expected) => {
    const { grow, outcome } = await opened();
    grow.fire(event, { status: 0 });
    expect(await outcome).toBe(expected);
  });
  it("is an error when the SDK cannot be loaded, and nothing is rendered", async () => {
    const grow = fakeGrow({ loads: false });
    expect(await openGrowWallet("auth-1", "DEV", {}, grow.deps)).toBe("error");
    expect(grow.rendered).toEqual([]);
  });
  it("events after a wallet has settled reach no one", async () => {
    const { grow, outcome } = await opened();
    grow.fire("onSuccess");
    await outcome;
    expect(() => grow.fire("onWalletChange", "close")).not.toThrow();
  });
});
