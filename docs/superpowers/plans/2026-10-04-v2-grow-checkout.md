# Active Plus v2: Grow Checkout + Subscriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A signed-in visitor buys the annual plan (one 708 ₪ charge, 1-12 installments, no auto-renew) or the monthly plan (99 ₪ recurring) on `/payment`, pays through Grow, and the app immediately recognises them as a subscriber.

**Architecture:** All Grow logic lives in the app's Supabase project, next to the existing Apple/Google purchase code, so `subscriptions` keeps one writer (`_shared/subscriptionUpsert.ts`). Two new edge functions: `createGrowPayment` (JWT-authenticated, creates the Grow payment process, returns the wallet `authCode`) and `growWebhook` (Grow's server-to-server notify, verified, idempotent, writes `web_payments` + `subscriptions`). The website holds no Grow secrets: it renders the 4-step checkout, invokes `createGrowPayment` with the user's session, and shows Grow's wallet (Growin SDK, which carries card, Bit, Apple Pay and Google Pay). Card data never touches either system. `checkUserSubscription` already decides access by `is_active` + `expires_at`, independent of platform.

**Tech Stack:** Supabase Edge Functions (Deno, `deno test`), Postgres migration, Grow Light API (`createPaymentProcess`, `approveTransaction`, `createTransactionWithToken` for future renewal), Growin wallet SDK (`https://cdn.meshulam.co.il/sdk/gs.min.js`), Next.js 15 client components.

**Spec:** `docs/superpowers/plans/2026-10-04-v2-roadmap.md` (pricing and renewal decisions) + `.impeccable/mocks/site/payment.html` (checkout UI). Grow docs: https://developers.grow.business (createPaymentProcess, Create payment & save token, Create Transaction With Token, Approve Transaction, Premium Recurring Payment, Growin Wallet SDK). Depends on plans 1 and 2 (`PaymentFlow`, `PlanSelector`, phone sign-in components, `lib/pricing.ts`).

## Global Constraints

- Prices: annual `sum = 708`, `paymentNum`/`maxPaymentNum` = buyer's choice 1-12, `saveCardToken = 1`; monthly `sum = 99` on the recurring (הוראת קבע) page code. No free trial.
- Annual renewal is OFF by default and controlled by one switch: edge-function env `GROW_ANNUAL_AUTO_RENEW` (`"false"` default). Each `subscriptions` row stores its own `auto_renew`, so flipping the switch affects new purchases only. The Grow card token is stored for every annual purchase regardless, so renewal can be enabled later.
- Card number, expiry, CVV and ID are entered only inside Grow's wallet/iframe. Never render our own inputs for them; never log or store them. The card token is the only card-derived value stored, server-side, readable by the service role only.
- Grow credentials (`GROW_USER_ID`, `GROW_PAGE_CODE_ONE_TIME`, `GROW_PAGE_CODE_RECURRING`, `GROW_API_URL`, `GROW_WEBHOOK_SECRET`) live only in Supabase function secrets. They are the client's (Active Plus) Grow account, NOT the Garden of Eden credentials.
- Sandbox (`https://sandbox.meshulam.co.il/api/light/server/1.0`) for preview and tests; production URL only after the live test in Task 8.
- `userId` always comes from the verified JWT, never from a request body (same rule as `checkUserSubscription`).
- App repo work happens on branch `feat/grow-web-checkout` in FitnessForSeniorsApp; website work on `feat/brief-v2`.

## Review Focus

1. **Grow sends the same notification twice, or out of order.** Expected: one `web_payments` row, one subscription, no double extension. Pinned by the idempotency test in Task 3.
2. **A buyer who already has an active subscription (bought in the app or earlier on the web) opens checkout.** Expected: no second charge; the page explains they are already subscribed. Pinned by Task 4's guard test.
3. **The buyer closes the tab after paying, before the success page.** Expected: the subscription still activates (the webhook, not the browser, is the source of truth). Pinned by Task 3 (webhook writes without any browser call) and Task 8's live test.
4. **A forged webhook.** Expected: rejected with 401 and nothing written. Pinned in Task 3.
5. **Monthly renewal months later.** Expected: each recurring charge extends `expires_at` by one month from the later of now and the current expiry; a failed charge does not extend it. Pinned in Task 2 (`nextExpiry` tests).

---

### Task 0: Prerequisites from the client (blocking)

- [ ] Ask the client for their Grow account: `userId`, a one-time card page code, a recurring (הוראת קבע) page code, a Growin wallet enabled for the site domain, Bit / Apple Pay / Google Pay enabled on the account, sandbox credentials, and the webhook signing secret (or confirm Grow's process-token verification method for their account).
- [ ] Confirm with Grow support: (a) how the recurring page reports each monthly charge (notify payload fields, and whether `transactionTypeId`/`paymentType` distinguish first vs renewal); (b) the API to stop a recurring payment (needed for cancellation, Task 6); (c) that `saveCardToken=1` returns `cardToken` in the notify payload.
- [x] Decide invoices (decided 2026-10-05): **Grow processes payments, Morning issues the invoices.** Turn off Grow's own invoice/receipt so a customer never gets two documents. On each approved charge (first charge and every monthly renewal), the app's Grow webhook issues a Morning חשבונית מס/קבלה (type 320) with a credit-card payment row (last 4 digits, number of installments) and emails it to the customer (the brief's "לאן לשלוח את החשבונית" is the checkout email). Idempotent per Grow transaction id. Build on FitnessForSeniorsApp `shared/supabase/functions/_shared/morning.ts` (token auth, error classification, `MORNING_DRY_RUN`, existing `MORNING_API_KEY`/`MORNING_API_SECRET` secrets; today it only does expenses via `syncSupplierInvoiceToMorning`), adding an income-document builder there; Garden of Eden's `src/lib/morning/payment-mapping.ts` + `documents.ts` show the POST /documents payment mapping. A task for this must be added to this plan before execution.
- [ ] Confirm with the client: the existing Morning API key is the business account the invoices should come from; the business is עוסק מורשה (type 320; an עוסק פטור would issue a receipt, type 400); the income item name on the invoice.
- [ ] Privacy policy update text (Grow as payment processor; email and phone collected at checkout; questionnaire answers stored in the profile) approved by the client. Task 7 publishes it.

---

### Task 1: Database: `web_payments` and the subscriptions platform (FitnessForSeniorsApp)

**Files:**
- Create: `shared/supabase/migrations/20261005090000_grow_web_payments.sql`

- [ ] **Step 1: Read the live schema first** (SQL editor, read-only), because the store columns on `subscriptions` are not in any migration file:

```sql
select column_name, data_type, is_nullable from information_schema.columns where table_name = 'subscriptions' order by ordinal_position;
select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.subscriptions'::regclass;
select indexname, indexdef from pg_indexes where tablename = 'subscriptions';
```

Record the output in the PR description. If `store_platform` has a CHECK constraint, the migration below extends it; if it is free text, skip that statement. If there is a `google_receipt`/`apple_receipt` pair, `grow` gets no receipt column (raw payloads go to `web_payments.raw`).

- [ ] **Step 2: Migration**

```sql
-- Web purchases through Grow (Meshulam). One row per payment process; the
-- notify webhook fills in the transaction. Service role only: no client reads
-- card tokens, and the website shows status through checkUserSubscription.
create table public.web_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_type text not null check (plan_type in ('MONTHLY', 'ANNUAL')),
  amount numeric(10,2) not null check (amount > 0),
  installments smallint not null default 1 check (installments between 1 and 12),
  environment text not null check (environment in ('sandbox', 'production')),
  status text not null default 'created' check (status in ('created', 'paid', 'failed', 'cancelled')),
  grow_process_id text,
  grow_process_token text,
  grow_transaction_id text,
  grow_asmachta text,
  card_token text,
  card_suffix text,
  subscription_id uuid references public.subscriptions(id),
  -- Morning invoice for this charge (Task 3b). One charge, one document.
  invoice_status text not null default 'pending' check (invoice_status in ('pending', 'issued', 'failed', 'dry_run')),
  morning_document_id text,
  morning_document_url text,
  invoice_error text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index uq_web_payments_transaction on public.web_payments (grow_transaction_id) where grow_transaction_id is not null;
create index idx_web_payments_user on public.web_payments (user_id, created_at desc);
create index idx_web_payments_process on public.web_payments (grow_process_id);

alter table public.web_payments enable row level security;
-- No policies: only the service role (edge functions) reads or writes.

-- Allow 'grow' as a subscription store, if the column is constrained (see Step 1).
alter table public.subscriptions drop constraint if exists subscriptions_store_platform_check;
alter table public.subscriptions add constraint subscriptions_store_platform_check
  check (store_platform is null or store_platform in ('apple', 'google', 'grow'));
```

Adjust the constraint name to what Step 1 found. If `/delete-account` processing deletes users, `on delete cascade` removes their payment rows: confirm that matches the office's retention needs for invoices (the invoices themselves live in Morning and are not deleted with the user).

Monthly renewals are separate charges with their own transaction id, so each one is its own `web_payments` row (Task 3 inserts a row per new transaction on the same subscription), and each gets its own invoice.

- [ ] **Step 3: Apply to a branch database** (`supabase db push` against a Supabase branch or local stack), run Step 1's queries again, and confirm the new constraint and table.

- [ ] **Step 4: Commit** `feat(db): web_payments table and grow store platform`

---

### Task 2: Pure Grow logic with tests (FitnessForSeniorsApp `_shared/grow.ts`)

**Files:**
- Create: `shared/supabase/functions/_shared/grow.ts`, `shared/supabase/functions/_shared/grow.test.ts`
- Modify: `shared/supabase/functions/_shared/subscriptionUpsert.ts` (`StorePlatform` gains `'grow'`; receipt column only for apple/google)

**Interfaces:**
- Produces:
  - `type WebPlan = "ANNUAL" | "MONTHLY"`
  - `PLAN_CONFIG: Record<WebPlan, { sum: number; months: number; recurring: boolean; maxInstallments: number }>`
  - `buildCreatePaymentForm(input: { plan: WebPlan; installments: number; fullName: string; phone: string; email: string; userId: string; webPaymentId: string; urls: { success: string; cancel: string; notify: string }; env: GrowEnv }): URLSearchParams`
  - `parseNotify(body: Record<string, string>): GrowNotify | null` (normalises Grow's form/JSON payload; null if required fields are missing)
  - `nextExpiry(plan: WebPlan, now: Date, currentExpiry: Date | null): Date`
  - `annualAutoRenew(env: Record<string, string | undefined>): boolean`

- [ ] **Step 1: Failing tests** `_shared/grow.test.ts`:

```ts
import { assertEquals, assertThrows } from "std/assert/mod.ts";
import { annualAutoRenew, buildCreatePaymentForm, nextExpiry, parseNotify, PLAN_CONFIG } from "./grow.ts";

const env = { userId: "u", pageCodeOneTime: "one", pageCodeRecurring: "rec" };
const base = { fullName: "רחל כהן", phone: "0501234567", email: "r@example.com", userId: "user-1", webPaymentId: "wp-1", urls: { success: "https://activeplus.co.il/payment/success", cancel: "https://activeplus.co.il/payment", notify: "https://x.supabase.co/functions/v1/growWebhook" }, env };

Deno.test("annual: 708 one-time page, installments, token saved", () => {
  const f = buildCreatePaymentForm({ ...base, plan: "ANNUAL", installments: 6 });
  assertEquals(f.get("pageCode"), "one");
  assertEquals(f.get("sum"), "708");
  assertEquals(f.get("paymentNum"), "6");
  assertEquals(f.get("saveCardToken"), "1");
  assertEquals(f.get("cField1"), "user-1");
  assertEquals(f.get("cField2"), "ANNUAL");
  assertEquals(f.get("cField3"), "wp-1");
  assertEquals(f.get("pageField[email]"), "r@example.com");
});

Deno.test("monthly: 99 on the recurring page, no installments", () => {
  const f = buildCreatePaymentForm({ ...base, plan: "MONTHLY", installments: 1 });
  assertEquals(f.get("pageCode"), "rec");
  assertEquals(f.get("sum"), "99");
  assertEquals(f.get("paymentNum"), null);
});

Deno.test("rejects installments outside the plan's range", () => {
  assertThrows(() => buildCreatePaymentForm({ ...base, plan: "ANNUAL", installments: 13 }));
  assertThrows(() => buildCreatePaymentForm({ ...base, plan: "MONTHLY", installments: 2 }));
});

Deno.test("annual expiry is 12 months from purchase", () => {
  assertEquals(nextExpiry("ANNUAL", new Date("2026-10-05T10:00:00Z"), null).toISOString(), "2027-10-05T10:00:00.000Z");
});

Deno.test("monthly renewal extends from the later of now and current expiry", () => {
  const now = new Date("2026-11-05T10:00:00Z");
  assertEquals(nextExpiry("MONTHLY", now, new Date("2026-11-07T10:00:00Z")).toISOString(), "2026-12-07T10:00:00.000Z");
  assertEquals(nextExpiry("MONTHLY", now, new Date("2026-10-01T10:00:00Z")).toISOString(), "2026-12-05T10:00:00.000Z");
});

Deno.test("parseNotify reads the fields we store and rejects incomplete payloads", () => {
  const n = parseNotify({ "data[transactionId]": "t1", "data[processId]": "p1", "data[sum]": "708", "data[paymentsNum]": "6", "data[asmachta]": "a1", "data[cardSuffix]": "4242", "data[customFields][cField1]": "user-1", "data[customFields][cField2]": "ANNUAL", "data[customFields][cField3]": "wp-1", "data[statusCode]": "2", "data[cardToken]": "tok" });
  assertEquals(n?.transactionId, "t1");
  assertEquals(n?.webPaymentId, "wp-1");
  assertEquals(n?.cardToken, "tok");
  assertEquals(parseNotify({ "data[processId]": "p1" }), null);
});

Deno.test("annual auto-renew is off unless explicitly enabled", () => {
  assertEquals(annualAutoRenew({}), false);
  assertEquals(annualAutoRenew({ GROW_ANNUAL_AUTO_RENEW: "true" }), true);
  assertEquals(annualAutoRenew({ GROW_ANNUAL_AUTO_RENEW: "yes" }), false);
});

Deno.test("plan config matches the website's prices", () => {
  assertEquals(PLAN_CONFIG.ANNUAL.sum, 708);
  assertEquals(PLAN_CONFIG.MONTHLY.sum, 99);
});
```

The `parseNotify` field names follow Garden of Eden's verified `WebhookPayload` (`src/lib/grow/client.ts` there) and Grow's notify docs. Before implementing, capture one real sandbox notify body (Task 3 Step 4) and adjust the test fixture to its exact shape (form-encoded `data[...]` keys vs JSON). The test must use the real shape.

- [ ] **Step 2: Run, expect FAIL:** `cd shared/supabase/functions && deno test _shared/grow.test.ts`

- [ ] **Step 3: Implement** `_shared/grow.ts`:

```ts
export type WebPlan = "ANNUAL" | "MONTHLY";
export type GrowEnv = { userId: string; pageCodeOneTime: string; pageCodeRecurring: string };

export const PLAN_CONFIG: Record<WebPlan, { sum: number; months: number; recurring: boolean; maxInstallments: number }> = {
  ANNUAL: { sum: 708, months: 12, recurring: false, maxInstallments: 12 },
  MONTHLY: { sum: 99, months: 1, recurring: true, maxInstallments: 1 },
};

export type GrowNotify = {
  transactionId: string; processId: string; sum: number; installments: number; asmachta: string | null;
  cardSuffix: string | null; cardToken: string | null; userId: string; plan: WebPlan; webPaymentId: string;
  statusCode: string; raw: Record<string, string>;
};

export function buildCreatePaymentForm(input: {
  plan: WebPlan; installments: number; fullName: string; phone: string; email: string;
  userId: string; webPaymentId: string; urls: { success: string; cancel: string; notify: string }; env: GrowEnv;
}): URLSearchParams {
  const cfg = PLAN_CONFIG[input.plan];
  if (!Number.isInteger(input.installments) || input.installments < 1 || input.installments > cfg.maxInstallments) {
    throw new RangeError(`Invalid installments ${input.installments} for ${input.plan}`);
  }
  const f = new URLSearchParams({
    userId: input.env.userId,
    pageCode: cfg.recurring ? input.env.pageCodeRecurring : input.env.pageCodeOneTime,
    sum: String(cfg.sum),
    description: input.plan === "ANNUAL" ? "פעילים+ מנוי שנתי" : "פעילים+ מנוי חודשי",
    successUrl: input.urls.success,
    cancelUrl: input.urls.cancel,
    notifyUrl: input.urls.notify,
    "pageField[fullName]": input.fullName,
    "pageField[phone]": input.phone,
    "pageField[email]": input.email,
    cField1: input.userId,
    cField2: input.plan,
    cField3: input.webPaymentId,
  });
  if (input.plan === "ANNUAL") {
    f.set("saveCardToken", "1");
    if (input.installments > 1) f.set("paymentNum", String(input.installments));
  }
  return f;
}

const pick = (b: Record<string, string>, k: string) => b[`data[${k}]`] ?? b[k] ?? null;
const pickCustom = (b: Record<string, string>, k: string) => b[`data[customFields][${k}]`] ?? null;

export function parseNotify(body: Record<string, string>): GrowNotify | null {
  const transactionId = pick(body, "transactionId");
  const processId = pick(body, "processId");
  const userId = pickCustom(body, "cField1");
  const plan = pickCustom(body, "cField2");
  const webPaymentId = pickCustom(body, "cField3");
  if (!transactionId || !processId || !userId || !webPaymentId || (plan !== "ANNUAL" && plan !== "MONTHLY")) return null;
  return {
    transactionId, processId, userId, plan, webPaymentId,
    sum: Number(pick(body, "sum") ?? 0),
    installments: Number(pick(body, "paymentsNum") ?? 1) || 1,
    asmachta: pick(body, "asmachta"),
    cardSuffix: pick(body, "cardSuffix"),
    cardToken: pick(body, "cardToken"),
    statusCode: pick(body, "statusCode") ?? "",
    raw: body,
  };
}

export function nextExpiry(plan: WebPlan, now: Date, currentExpiry: Date | null): Date {
  const from = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const next = new Date(from);
  next.setUTCMonth(next.getUTCMonth() + PLAN_CONFIG[plan].months);
  return next;
}

export const annualAutoRenew = (env: Record<string, string | undefined>) => env.GROW_ANNUAL_AUTO_RENEW === "true";
```

`subscriptionUpsert.ts`: `export type StorePlatform = 'apple' | 'google' | 'grow'`. Change `receiptColumn` so it is only set for apple/google: `const receiptColumn = sub.platform === 'apple' ? 'apple_receipt' : sub.platform === 'google' ? 'google_receipt' : null`, and only include `[receiptColumn]` in `row` when non-null.

- [ ] **Step 4: Run, expect PASS.** Also run the existing suite `deno test _shared/` to confirm nothing else broke.

- [ ] **Step 5: Commit** `feat(functions): grow payment form, notify parsing and expiry math`

---

### Task 3: `growWebhook` edge function

**Files:**
- Create: `shared/supabase/functions/growWebhook/index.ts`, `shared/supabase/functions/growWebhook/handle.ts`, `shared/supabase/functions/growWebhook/handle.test.ts`
- Modify: `shared/supabase/config.toml` (`[functions.growWebhook] verify_jwt = false`, like the store webhooks)

**Interfaces:**
- Produces: `handleNotify(deps: { db: Db; approve: (n: GrowNotify) => Promise<void>; now: () => Date; env: Record<string, string | undefined> }, notify: GrowNotify): Promise<"recorded" | "duplicate" | "ignored">`. `Db` is a narrow interface over the four queries the handler needs, so the test runs without Postgres.

- [ ] **Step 1: Failing tests** `handle.test.ts` using an in-memory `Db`:
  - first notify for `wp-1`, statusCode "2" (paid) -> `"recorded"`; `web_payments` row `status = 'paid'`, `card_token` stored; `subscriptions` upserted with `platform: 'grow'`, `storeTransactionId` = transactionId (annual) or the Grow recurring/process id (monthly; use whichever stays constant across renewals per Task 0's answer), `planType`, `expiresAt = nextExpiry(...)`, `autoRenew` = `annualAutoRenew(env)` for annual and `true` for monthly, `environment` from `GROW_ENV`.
  - same notify again -> `"duplicate"`, no second write (Review Focus 1)
  - notify whose `webPaymentId` does not exist or whose `userId` differs from the row's `user_id` -> `"ignored"` (a tampered cField)
  - non-success status -> `web_payments.status = 'failed'`, no subscription change
  - monthly second charge (new transactionId, same subscription key) -> `expiresAt` extended from the current expiry (Review Focus 5)
  - `approve` is called once per recorded notify, never for duplicates

- [ ] **Step 2: FAIL. Step 3: Implement** `handle.ts` (pure, depends on `Db`) and `index.ts`:
  - `index.ts`: read the raw body; verify authenticity before parsing: HMAC-SHA256 of the raw body with `GROW_WEBHOOK_SECRET` compared in constant time (port `verifyGrowWebhook` from Garden of Eden `src/lib/webhook-security.ts`), or, if the client's Grow account uses process tokens, check that `processToken` equals the `grow_process_token` stored on the `web_payments` row for that `processId`. Unverified -> 401, nothing written (Review Focus 4).
  - Parse form or JSON into a flat record; `parseNotify`; null -> 400.
  - `handleNotify` with a `Db` backed by `createServiceClient()`, and `approve` = POST `approveTransaction` (form fields from the notify, per Grow docs; port `approveTransaction` from Garden of Eden `src/lib/grow/client.ts`).
  - Always respond 200 to Grow once the row is recorded or recognised as a duplicate, so Grow stops retrying. Log `{processId, transactionId, result}` only, never card or personal fields.

- [ ] **Step 4: PASS**, then deploy to the branch project: `supabase functions deploy growWebhook --no-verify-jwt`.

- [ ] **Step 5: Capture a real sandbox notify:** run one sandbox payment by hand (Task 4 must exist; do this step after Task 4 if needed), copy the raw notify body from the function logs, redact names and phone numbers, and update `grow.test.ts`'s `parseNotify` fixture to that exact shape. Re-run the tests.

- [ ] **Step 6: Commit** `feat(functions): growWebhook records web purchases idempotently`

---

### Task 3b: Morning invoice for every approved charge

Grow takes the money; Morning issues the document (decided 2026-10-05, Task 0). Grow's own invoice must be turned off in the Grow dashboard so a buyer never gets two.

**Files:**
- Modify: `shared/supabase/functions/_shared/morning.ts` (add `buildIncomeDocument` and `createIncomeDocument` next to the existing expense operations), `shared/supabase/functions/_shared/morning.test.ts`
- Modify: `shared/supabase/functions/growWebhook/handle.ts`, `handle.test.ts`, `index.ts`

**Interfaces:**
- Consumes: `GrowNotify`, `PLAN_CONFIG`, `WebPlan` (Task 2); `handleNotify` and its `Db` (Task 3); `morningCredentials()`, `isMorningDryRun()`, `authedRequest`, `MorningResult` (existing `_shared/morning.ts`)
- Produces:
  - `MORNING_INCOME_DOC_TYPE = 320` (חשבונית מס/קבלה; 400 if the client turns out to be עוסק פטור, one constant)
  - `buildIncomeDocument(input: { plan: WebPlan; amount: number; installments: number; cardSuffix: string | null; paidOn: string; client: { name: string; phone: string; email: string } }): Record<string, unknown>` (pure)
  - `createIncomeDocument(creds: MorningCredentials, doc: Record<string, unknown>): Promise<MorningResult<{ id: string; url: string | null }>>`
  - `handleNotify` deps gain `invoice: (n: GrowNotify, row: { fullName: string; phone: string; email: string }) => Promise<{ status: "issued" | "failed" | "dry_run"; id?: string; url?: string | null; error?: string }>` and `Db.setInvoice(webPaymentId, result)`

- [ ] **Step 1: Failing tests** in `_shared/morning.test.ts`:

```ts
import { assertEquals } from "std/assert/mod.ts";
import { buildIncomeDocument, MORNING_INCOME_DOC_TYPE } from "./morning.ts";

const client = { name: "רחל כהן", phone: "0501234567", email: "r@example.com" };

Deno.test("annual in 6 installments: one 708 line, VAT included, card payment in installments", () => {
  const d = buildIncomeDocument({ plan: "ANNUAL", amount: 708, installments: 6, cardSuffix: "4242", paidOn: "2026-10-05", client });
  assertEquals(d.type, MORNING_INCOME_DOC_TYPE);
  assertEquals(d.lang, "he");
  assertEquals(d.currency, "ILS");
  assertEquals((d.client as { emails: string[] }).emails, ["r@example.com"]);
  assertEquals(d.income, [{ description: "פעילים+ מנוי שנתי", quantity: 1, price: 708, currency: "ILS", vatType: 1 }]);
  assertEquals(d.payment, [{ type: 3, price: 708, currency: "ILS", date: "2026-10-05", cardType: 0, cardNum: "4242", dealType: 2, numPayments: 6 }]);
});

Deno.test("monthly: one 99 line, a regular card deal", () => {
  const d = buildIncomeDocument({ plan: "MONTHLY", amount: 99, installments: 1, cardSuffix: null, paidOn: "2026-11-05", client });
  assertEquals((d.income as { description: string; price: number }[])[0].description, "פעילים+ מנוי חודשי");
  assertEquals((d.payment as { dealType: number; numPayments: number; cardNum?: string }[])[0].dealType, 1);
  assertEquals("cardNum" in (d.payment as Record<string, unknown>[])[0], false);
});

Deno.test("the amount on the document is what Grow charged, not the price list", () => {
  const d = buildIncomeDocument({ plan: "ANNUAL", amount: 700, installments: 1, cardSuffix: "1111", paidOn: "2026-10-05", client });
  assertEquals((d.income as { price: number }[])[0].price, 700);
});
```

The `vatType: 1` per line means "the price already includes VAT": without it Morning adds VAT on top, the total exceeds the payment and Morning rejects the document (errorCode 2422, learned in Garden of Eden). Card type 0 ("unknown") is used until Task 3 Step 5's real notify shows whether Grow reports the card brand; if it does, map it like Garden of Eden's `MORNING_CARD_TYPE` (isracard 1, visa 2, mastercard 3, amex 4, diners 5) and add a test.

`handle.test.ts` additions:
- a recorded notify calls `invoice` once and stores its result with `setInvoice` (`issued` + id + url)
- a duplicate notify never calls `invoice` (no second document; Review Focus 1)
- a failed or ignored notify never calls `invoice`
- `invoice` returning `failed` still yields `"recorded"`: the subscription is already written and Grow must get its 200; the row keeps `invoice_status = 'failed'` and `invoice_error`
- `invoice` throwing is caught and stored as `failed` (never a 500 to Grow)

- [ ] **Step 2: Run, expect FAIL:** `cd shared/supabase/functions && deno test _shared/morning.test.ts growWebhook/handle.test.ts`

- [ ] **Step 3: Implement** in `_shared/morning.ts`:

```ts
/** Customer documents (income). Expenses above use MORNING_DOC_TYPE; income uses POST /documents. */
export const MORNING_INCOME_DOC_TYPE = 320; // חשבונית מס/קבלה
const MORNING_PAYMENT_CARD = 3;
const MORNING_ITEM_VAT_INCLUDED = 1;
const INCOME_DESCRIPTION: Record<"ANNUAL" | "MONTHLY", string> = {
  ANNUAL: "פעילים+ מנוי שנתי",
  MONTHLY: "פעילים+ מנוי חודשי",
};

export function buildIncomeDocument(input: {
  plan: "ANNUAL" | "MONTHLY"; amount: number; installments: number; cardSuffix: string | null;
  paidOn: string; client: { name: string; phone: string; email: string };
}): Record<string, unknown> {
  const description = INCOME_DESCRIPTION[input.plan];
  return {
    type: MORNING_INCOME_DOC_TYPE,
    lang: "he",
    currency: "ILS",
    vatType: 0,
    description,
    client: { name: input.client.name, phone: input.client.phone, emails: [input.client.email], add: true },
    income: [{ description, quantity: 1, price: input.amount, currency: "ILS", vatType: MORNING_ITEM_VAT_INCLUDED }],
    payment: [{
      type: MORNING_PAYMENT_CARD,
      price: input.amount,
      currency: "ILS",
      date: input.paidOn,
      cardType: 0,
      ...(input.cardSuffix ? { cardNum: input.cardSuffix } : {}),
      dealType: input.installments > 1 ? 2 : 1,
      numPayments: input.installments,
    }],
  };
}

export async function createIncomeDocument(
  creds: MorningCredentials,
  doc: Record<string, unknown>,
): Promise<MorningResult<{ id: string; url: string | null }>> {
  const res = await authedRequest(creds, "/documents", "POST", doc);
  if (!res.ok) return res;
  const body = res.value as { id?: string; url?: { he?: string; origin?: string } } | null;
  if (!body?.id) return { ok: false, fault: "permanent", status: 200, error: "Morning document response had no id" };
  return { ok: true, value: { id: body.id, url: body.url?.he ?? body.url?.origin ?? null } };
}
```

The client name, phone and email on the document come from the `web_payments` row's user (`users.full_name`, `users.phone`) and the checkout email Task 4 stores; add `email text not null` to `web_payments` in Task 1 if Task 4 does not already persist it. `paidOn` is the charge date in Israel time (`Asia/Jerusalem`, `YYYY-MM-DD`).

In `growWebhook/index.ts`, `invoice` = if `isMorningDryRun()` return `{ status: "dry_run" }` and log the built document's shape (no personal fields); else `morningCredentials()` (null -> `failed`, "Morning not configured") then `createIncomeDocument`. Morning emails the document itself when the client has an email.

- [ ] **Step 4: PASS**, plus `deno test _shared/` for the expense code that shares the module.

- [ ] **Step 5: Sandbox check:** with `MORNING_DRY_RUN=true` on the branch project, run one sandbox purchase (Task 8 Step 1) and confirm `invoice_status = 'dry_run'` and the logged document shape. Issuing a real Morning document is part of Task 8 Step 2's live purchase only: set `MORNING_DRY_RUN=false` for that run, confirm the חשבונית מס/קבלה arrives at the buyer's email and appears in Morning, then cancel it in Morning (תעודת זיכוי) together with the Grow refund.

- [ ] **Step 6: Commit** `feat(functions): Morning invoice for every approved web charge`

---

### Task 4: `createGrowPayment` edge function

**Files:**
- Create: `shared/supabase/functions/createGrowPayment/index.ts`, `shared/supabase/functions/createGrowPayment/validate.ts`, `shared/supabase/functions/createGrowPayment/validate.test.ts`

**Interfaces:**
- Consumes: `buildCreatePaymentForm`, `PLAN_CONFIG`
- Produces: HTTP `POST /functions/v1/createGrowPayment` with `Authorization: Bearer <user JWT>`, body `{ plan: "ANNUAL" | "MONTHLY"; installments: number; email: string }`; response `{ authCode: string; processId: string; webPaymentId: string }`, or `409 { code: "already_subscribed" }`, `400 { code: "invalid_input", field }`, `401`.

- [ ] **Step 1: Failing tests** `validate.test.ts` for `parseRequest(body: unknown)`: valid annual 1..12; monthly with 1 only; bad email (`a@b`, empty, 255+ chars) rejected; unknown plan rejected; extra fields ignored.

- [ ] **Step 2: FAIL. Step 3: Implement.**
  - `validate.ts` with `parseRequest` (hand-written guards; the functions don't use zod today).
  - `index.ts`: CORS via `_shared/cors.ts` (allow `https://activeplus.co.il` and the Vercel preview pattern). Get the user from the JWT (`supabase.auth.getUser(token)`). Load `users.full_name` and `auth.users.phone` (E.164 -> Grow wants a local Israeli mobile: convert `+9725...` to `05...`).
  - Guard (Review Focus 2): if `subscriptions` has `is_active = true and expires_at > now()` for this user, return 409 `already_subscribed`. Run the same query `checkUserSubscription` uses.
  - Insert a `web_payments` row (`status 'created'`, amount from `PLAN_CONFIG`, installments, environment from `GROW_ENV`).
  - POST `createPaymentProcess` (form-encoded) with `buildCreatePaymentForm`. Success URL `https://<site>/payment/success?wp=<id>`, cancel URL `https://<site>/payment`, notify URL `<SUPABASE_URL>/functions/v1/growWebhook`.
  - Store `processId` and `processToken` on the row. Return `authCode` (the Growin wallet SDK's input) plus ids. On Grow error, mark the row `failed`, log Grow's error code, and return 502 `{ code: "processor_error" }`.
  - Rate limit with `_shared/ratelimit.ts` (`'payment'` identifier, e.g. 10/hour per user).

- [ ] **Step 4: PASS**, deploy (`supabase functions deploy createGrowPayment`), and set secrets: `supabase secrets set GROW_API_URL=... GROW_USER_ID=... GROW_PAGE_CODE_ONE_TIME=... GROW_PAGE_CODE_RECURRING=... GROW_WEBHOOK_SECRET=... GROW_ENV=sandbox GROW_ANNUAL_AUTO_RENEW=false SITE_URL=https://<preview-domain>`. Never commit these values.

- [ ] **Step 5: Commit** `feat(functions): createGrowPayment returns a wallet auth code for web checkout`

---

### Task 5: Website checkout (active-plus-website)

**Files:**
- Modify: `components/payment/PaymentFlow.tsx`, `app/payment/page.tsx`, `next.config.ts` (CSP)
- Create: `components/payment/Checkout.tsx`, `components/payment/GrowWallet.tsx`, `app/payment/success/page.tsx`, `lib/payment/checkout.ts`, `tests/unit/checkout.test.ts`, `tests/e2e/checkout.spec.ts`

**Interfaces:**
- Consumes: `getBrowserSupabase()`, `Register`/`Otp` components from plan 2, `PlanSelector`, `installmentAmount`, `formatShekel`
- Produces: `checkoutSteps(signedIn: boolean): ("name" | "email" | "phone" | "summary")[]`; `startPayment(supabase, input): Promise<{ authCode: string } | { error: "already_subscribed" | "invalid_input" | "processor_error" | "network" }>`

- [ ] **Step 1: Failing tests** `tests/unit/checkout.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { checkoutSteps, startPayment } from "@/lib/payment/checkout";

describe("checkout", () => {
  it("asks for everything when signed out, only email and summary when signed in", () => {
    expect(checkoutSteps(false)).toEqual(["name", "email", "phone", "summary"]);
    expect(checkoutSteps(true)).toEqual(["email", "summary"]);
  });
  it("maps a 409 to already_subscribed", async () => {
    const supabase = { functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: { context: { status: 409 } } }) } };
    expect(await startPayment(supabase as never, { plan: "ANNUAL", installments: 1, email: "a@b.co" })).toEqual({ error: "already_subscribed" });
  });
  it("returns the auth code on success", async () => {
    const supabase = { functions: { invoke: vi.fn().mockResolvedValue({ data: { authCode: "ac1" }, error: null }) } };
    expect(await startPayment(supabase as never, { plan: "MONTHLY", installments: 1, email: "a@b.co" })).toEqual({ authCode: "ac1" });
  });
});
```

- [ ] **Step 2: FAIL. Step 3: Implement** `lib/payment/checkout.ts` (`checkoutSteps`, and `startPayment` calling `supabase.functions.invoke("createGrowPayment", { body })` with status mapping 409/400/502, else `"network"`).

- [ ] **Step 4: UI** per `.impeccable/mocks/site/payment.html` (updated in plan 2 Task 0):
  - `PaymentFlow` replaces `StoreFallback` with `Checkout` when `WEB_CHECKOUT_ENABLED`.
  - `Checkout`: step indicator "שלב X מתוך N". Signed out: name -> email -> phone (reuses plan 2's `Register` phone sub-step + `Otp`, with `finishSignup` skipped because there are no questionnaire answers; the account is created by `verifyOtp`, and on the app side the trainee profile is completed by `merge_funnel_session` with `{ full_name }` only) -> summary. Signed in: confirmed rows for name and phone with "עריכה" (edit name only; changing the phone means signing out), then email -> summary.
  - Summary: plan, price, `סה״כ`, installments `<select>` 1-12 for annual only with `formatShekel(installmentAmount(708, n))` per installment, then "לתשלום" -> `startPayment` -> `GrowWallet`.
  - `GrowWallet` (client): loads `https://cdn.meshulam.co.il/sdk/gs.min.js` once (`next/script` `strategy="afterInteractive"`), calls `growPayment.init({ environment: process.env.NEXT_PUBLIC_GROW_ENV === "production" ? "PRODUCTION" : "DEV", version: 1, events: { onSuccess, onFailure, onPaymentCancel, onError } })`, then `growPayment.renderPaymentOptions(authCode)`. Check exact `init` keys against the Growin SDK docs before writing. `onSuccess` -> `router.push("/payment/success?wp=...")`; failure/cancel -> inline Hebrew message and a retry button.
  - `already_subscribed` -> "כבר יש לך מנוי פעיל. אפשר להמשיך להתאמן באפליקציה." + store buttons.
- [ ] **Step 5: Success page** `app/payment/success/page.tsx`: "ברוכים הבאים לפעילים+". Poll `checkUserSubscription` (invoke with the session) every 2s for up to 30s. When `hasAccess` is true: next steps (download the app, sign in with the same phone number) + App Store / Google Play buttons. On timeout: "התשלום התקבל ואנחנו מסיימים להפעיל את המנוי. זה יכול לקחת כמה דקות" + the same buttons (the webhook will finish it; Review Focus 3). `robots: { index: false }`.
- [ ] **Step 6: CSP** in `next.config.ts` `headers()` (the site has none today; global security rules require one). Build it from an array so it stays readable:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline' https://cdn.meshulam.co.il` (Next's inline bootstrap needs `'unsafe-inline'` until nonces are wired; a follow-up task may switch to a nonce via middleware)
  - `connect-src 'self' https://*.supabase.co https://*.meshulam.co.il`
  - `frame-src https://*.meshulam.co.il https://*.grow.business`
  - `img-src 'self' data: https:`
  - `style-src 'self' 'unsafe-inline'`
  - `font-src 'self'`
  - `media-src 'self'`
  - `object-src 'none'`
  - `base-uri 'self'`
  - `form-action 'self' https://*.meshulam.co.il`

  Keep the existing `X-Frame-Options: DENY`. Set `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self "https://*.meshulam.co.il")`, so Apple Pay / Google Pay in the wallet are not blocked. Confirm the exact Grow wallet origins in the browser network tab during the sandbox test and tighten the wildcards to them.
- [ ] **Step 7: e2e** `tests/e2e/checkout.spec.ts` with `NEXT_PUBLIC_WEB_CHECKOUT=true`, stubbing `**/functions/v1/createGrowPayment` and the SDK script (`page.route("https://cdn.meshulam.co.il/sdk/gs.min.js", ...)` serving a fake `growPayment` that calls `onSuccess` on render). Scenarios: signed-in annual with 6 installments shows `118 ₪` per installment and sends `{ plan: "ANNUAL", installments: 6 }`; monthly shows no installment select; 409 shows the already-subscribed message; success page shows the next steps once the stubbed `checkUserSubscription` returns `hasAccess: true`.
- [ ] **Step 8: Run** `npm test && npm run typecheck && npm run test:e2e`. Commit `feat: web checkout through the grow wallet`.

---

### Task 6: Cancellation for the monthly plan

Israeli consumer protection rules let a buyer cancel an ongoing subscription bought online in the same channel. "ניתן לבטל בכל עת" must be true on the web.

- [ ] **Step 1:** Using Grow's recurring-payment API identified in Task 0, add `cancelGrowSubscription` (JWT): find the user's active `grow` MONTHLY subscription, call Grow to stop future charges, set `auto_renew = false` and `cancelled_at = now()` (access continues until `expires_at`, which is the store behaviour too). Deno tests for the pure decision (`canCancel(subscription, now)`), and an idempotent second call.
- [ ] **Step 2:** Website `app/account/subscription/page.tsx` (signed-in, `robots: noindex`): shows plan, next charge date or end date, and "ביטול המנוי" with a confirmation step. Link it from the success page and from the footer under the legal links ("ניהול מנוי"). The `/delete-account` link stays exactly as it is.
- [ ] **Step 3:** Commit `feat: cancel a monthly web subscription`.

---

### Task 7: Legal and app-side visibility

- [ ] **Step 1:** Publish the client-approved privacy-policy changes in `app/privacy-policy/page.tsx` (payment processor Grow, data collected at checkout, questionnaire answers). Same URL; do not touch `/delete-account`.
- [ ] **Step 2:** Admin dashboard (FitnessForSeniorsApp `admin-dashboard`): make sure subscription views show `store_platform = 'grow'` with a readable label ("אתר (Grow)") wherever apple/google are labelled. `grep -rn "store_platform\|'apple'\|'google'" admin-dashboard/src` and add the label.
- [ ] **Step 3:** Account deletion: confirm the office's deletion process for a web buyer also cancels any Grow recurring charge (otherwise a deleted user keeps being billed). Add that step to `docs/RUNBOOKS.md` in the app repo next to the existing deletion runbook.
- [ ] **Step 4:** Commit in each repo.

---

### Task 8: Sandbox end-to-end, then one live purchase

- [ ] **Step 1 (sandbox, preview deploy):** with Grow sandbox cards, buy annual with 3 installments and monthly. Verify per purchase: a `web_payments` row `paid` with `card_token` set (annual), a `subscriptions` row `store_platform 'grow'` with the right `expires_at` and `auto_renew` (annual false, monthly true), `checkUserSubscription` returning `hasAccess: true`, and the iOS app opening without the paywall for that phone number. Close the tab right after paying on one run and confirm activation still happens (Review Focus 3). Replay one notify with curl and confirm `duplicate` (Review Focus 1). Send one notify with a wrong signature and confirm 401 (Review Focus 4).
- [ ] **Step 2 (production):** switch secrets to production (`GROW_ENV=production`, production API URL and page codes), set `NEXT_PUBLIC_GROW_ENV=production`, deploy. The client (or Itay) makes one real monthly purchase, verifies the invoice email from Grow, then cancels it through `/account/subscription` and refunds it in the Grow dashboard.
- [ ] **Step 3:** Set `NEXT_PUBLIC_WEB_CHECKOUT=true` in Vercel production and redeploy. Monitor `growWebhook` logs for the first day.
