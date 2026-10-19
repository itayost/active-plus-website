/**
 * Grow's wallet SDK, the annual plan's payment: createGrowPayment returns an
 * authCode and the wallet opens over /payment (monthly still goes to Grow's
 * hosted page). Card details are typed into Grow's own frame, never into this
 * site. The wallet's onSuccess only moves the buyer on: the subscription is
 * activated by Grow's server notify (the webhook), exactly as for the hosted
 * page. The CSP for /payment allows the hosts this SDK uses (lib/security/csp).
 */

export const GROW_SDK_URL = "https://cdn.meshulam.co.il/sdk/gs.min.js";
/** The SDK's major version; Grow maps it to the current release on its CDN. */
const SDK_VERSION = 1;
const READY_POLL_MS = 100;
const READY_TIMEOUT_MS = 15_000;
/**
 * The wallet calls Grow before it shows; past this it is treated as not
 * opening. Longer than the authCode lives (4 minutes), so by then Grow has
 * answered with onError or onTimeout itself and no wallet can still open
 * after the page has given up on it.
 */
const OPEN_TIMEOUT_MS = 5 * 60_000;

export type WalletEnvironment = "DEV" | "PRODUCTION";
export const isWalletEnvironment = (value: unknown): value is WalletEnvironment => value === "DEV" || value === "PRODUCTION";

/** success: Grow took the payment. failed / expired / error: it did not. closed: the buyer closed the wallet first. */
export type WalletOutcome = "success" | "failed" | "expired" | "error" | "closed";

type WalletEvent = "success" | "failure" | "error" | "timeout" | "open" | "close";
type SdkEvents = Record<string, (payload?: unknown) => void>;
type GrowPayment = {
  init: (config: { environment: WalletEnvironment; version: number; events: SdkEvents }) => unknown;
  renderPaymentOptions: (authCode: string) => void;
};
export type WalletWindow = Window & { growPayment?: GrowPayment; growRuntime?: unknown };

export type WalletDeps = {
  win: WalletWindow;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
};

const browserDeps = (): WalletDeps => ({
  win: window as WalletWindow,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => Date.now(),
});

// One SDK per page: the script, its init and the wallet now on screen.
let scriptLoad: Promise<boolean> | null = null;
let initialized: WalletEnvironment | null = null;
let listener: ((event: WalletEvent) => void) | null = null;

/** Test hook: forget the loaded script and the init. */
export function resetGrowWallet(): void {
  scriptLoad = null;
  initialized = null;
  listener = null;
}

function loadScript(win: WalletWindow): Promise<boolean> {
  if (win.growPayment) return Promise.resolve(true);
  scriptLoad ??= new Promise<boolean>((resolve) => {
    const script = win.document.createElement("script");
    script.src = GROW_SDK_URL;
    script.async = true;
    script.onload = () => resolve(Boolean(win.growPayment));
    script.onerror = () => {
      // A later click may try again.
      scriptLoad = null;
      resolve(false);
    };
    win.document.head.appendChild(script);
  });
  return scriptLoad;
}

const EVENTS: Record<string, WalletEvent> = {
  onSuccess: "success",
  onFailure: "failure",
  onError: "error",
  onTimeout: "timeout",
};

/** The events go to whichever wallet is on screen; init is called once, since a second call drops them. */
function sdkEvents(): SdkEvents {
  const events: SdkEvents = Object.fromEntries(
    Object.entries(EVENTS).map(([name, event]) => [name, () => listener?.(event)]),
  );
  events.onWalletChange = (state) => listener?.(state === "open" ? "open" : "close");
  return events;
}

/** Loads and initialises the SDK. Grow's runtime arrives by a second script, so this waits for it. */
export async function prepareGrowWallet(environment: WalletEnvironment, deps: WalletDeps = browserDeps()): Promise<boolean> {
  const { win, sleep, now } = deps;
  if (!(await loadScript(win)) || !win.growPayment) return false;
  if (initialized !== environment) {
    try {
      await win.growPayment.init({ environment, version: SDK_VERSION, events: sdkEvents() });
    } catch {
      return false;
    }
    initialized = environment;
  }
  const deadline = now() + READY_TIMEOUT_MS;
  while (!win.growRuntime) {
    if (now() >= deadline) {
      // The runtime never came: the next click initialises again rather than waiting on nothing.
      initialized = null;
      return false;
    }
    await sleep(READY_POLL_MS);
  }
  return true;
}

/**
 * Opens the wallet and settles once: on success; on the buyer closing it
 * (after a failure inside it, that failure); or at once when it fails before
 * opening.
 */
export async function openGrowWallet(
  authCode: string,
  environment: WalletEnvironment,
  options: { onOpen?: () => void } = {},
  deps: WalletDeps = browserDeps(),
): Promise<WalletOutcome> {
  if (!(await prepareGrowWallet(environment, deps))) return "error";
  const sdk = deps.win.growPayment;
  if (!sdk) return "error";
  return new Promise<WalletOutcome>((resolve) => {
    let open = false;
    let last: WalletOutcome | null = null;
    let done = false;
    const settle = (outcome: WalletOutcome) => {
      if (done) return;
      done = true;
      if (listener === onEvent) listener = null;
      resolve(outcome);
    };
    const onEvent = (event: WalletEvent) => {
      if (event === "success") return settle("success");
      if (event === "open") {
        open = true;
        options.onOpen?.();
        return;
      }
      if (event === "close") return settle(last ?? "closed");
      const outcome: WalletOutcome = event === "failure" ? "failed" : event === "timeout" ? "expired" : "error";
      // Inside an open wallet Grow shows the failure and may let the buyer retry; it ends when the wallet closes.
      if (open) last = outcome;
      else settle(outcome);
    };
    listener = onEvent;
    void deps.sleep(OPEN_TIMEOUT_MS).then(() => {
      if (!open) settle("error");
    });
    try {
      sdk.renderPaymentOptions(authCode);
    } catch {
      settle("error");
    }
  });
}
