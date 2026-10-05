# Active Plus v2: Grow Checkout + Subscriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A visitor on `/payment` buys the annual plan (one 708 ₪ charge, 1-12 installments, no auto-renew) or the monthly plan (99 ₪ standing order, cancellable on the website), pays on Grow's hosted secure page, and the app recognises them as a subscriber as soon as Grow's server-to-server notify arrives. Morning issues the invoice for every charge, first and renewal. Everything ships dormant: until the client's Grow keys exist, nothing can charge, and production keeps the store fallback.

**Architecture:** All Grow logic lives in the app's Supabase project, next to the Apple/Google purchase code, so `subscriptions` keeps one writer (`_shared/subscriptionUpsert.ts`). `createGrowPayment` (user JWT) validates the checkout, inserts a `web_payments` row, calls Grow `createPaymentProcess` on a regular page code (one-time page for annual, recurring/הוראת קבע page for monthly) and returns Grow's hosted `url`; the website does a full-page redirect there (D1) and Grow sends the buyer back to `/payment/success`. `growWebhook` (no JWT) receives two shapes (D2): the per-payment first-charge notify, verified by the stored processId + processToken AND a `getTransactionInfo` confirmation of status and sum, then approved with `approveTransaction` (D3, D5); and the account-level recurring-renewal webhook, verified by `webhookKey` + a known `directDebitId` + the plan's sum. Each charge gets its own `web_payments` row, extends the subscription, books `subscription_income`, and gets a Morning invoice. `cancelGrowSubscription` stops a standing order with `updateDirectDebit changeStatus=2` (D9). No Grow script, iframe or card field ever loads on our pages. `checkUserSubscription` already decides access by `is_active` + `expires_at`, independent of platform.

**Tech Stack:** Supabase Edge Functions (Deno 2, `deno test`), a Postgres migration tested on the local Supabase stack (Docker), Grow Light API (`createPaymentProcess`, `getTransactionInfo`, `approveTransaction`, `updateDirectDebit`, multipart FormData), Grow account-level Webhooks (recurring payment, failed recurring payment), Morning `POST /documents`, Next.js 15 client components, Vitest, Playwright.

**Spec and research:** `docs/superpowers/plans/2026-10-04-v2-roadmap.md` (pricing, renewal), `.impeccable/mocks/site/payment.html` (checkout UI), `.superpowers/sdd/2026-10-04-v2-grow-checkout/grow-reference.md` (Grow API facts with confidence labels; source of truth is developers.grow.business), `.superpowers/sdd/2026-10-04-v2-grow-checkout/progress.md` (live facts and rulings D1-D11, which override anything older). Depends on plans 1 and 2 (`PaymentFlow`, `PlanSelector`, `Register`, `Otp`, `lib/pricing.ts`).

## Global Constraints

- **Prices:** annual `sum = 708` with `paymentNum` = the buyer's chosen installments (1-12, fixed by us, never `maxPaymentNum`); monthly `sum = 99` on the recurring page code with `paymentNum = GROW_MONTHLY_MAX_CHARGES` (default 120, D7). No free trial.
- **Hosted page only (D1):** the browser leaves our site for Grow's hosted page with `window.location.assign(url)` after both sides check the url is `https://` on `meshulam.co.il` or a subdomain. No Growin wallet SDK, no iframe, no Grow script. Card number, expiry, CVV and ID are typed only on Grow's page; never render inputs for them, never log or store them.
- **No special characters in any Grow parameter (D6):** descriptions are `מנוי שנתי פעילים פלוס` / `מנוי חודשי פעילים פלוס`; the only custom field is `cField1` = the `web_payments` id as 32 lowercase hex characters (hyphens stripped, restored on parse); `pageField[fullName]` keeps only letters, digits and single spaces and must have at least two words; `pageField[phone]` is a local mobile `05XXXXXXXX`; `pageField[email]` is sent only when it matches `[A-Za-z0-9._-]+@domain`; URLs carry at most `?wp=<hex>` or `?cancelled=1`. Requests are multipart `FormData` with `chargeType=1`.
- **Card token (D4):** `card_token` is nullable. Annual sends `saveCardToken=1` only when the buyer ticks the consent checkbox ("שמירת פרטי הכרטיס לחידוש עתידי", unticked by default); the webhook drops any token Grow returns without that consent. Monthly never saves a token. Annual auto-renew stays off (`GROW_ANNUAL_AUTO_RENEW`, default `"false"`); each `subscriptions` row stores its own `auto_renew`, so flipping the switch affects new purchases only.
- **Verification without HMAC (D3):** Grow signs nothing. First charge: stored processId + processToken match (constant time) AND `getTransactionInfo` confirms `statusCode "2"` and the stored sum. Renewal: `webhookKey` equals `GROW_RENEWAL_WEBHOOK_KEY` (constant time) AND the `directDebitId` belongs to a paid monthly first charge AND the sum equals it. Unverified -> 401, nothing written. Confirmation call unreachable -> 503 so Grow retries.
- **approveTransaction (D5):** only after a verified, recorded first charge, with all 23 notify fields and the process's own page code. Never for renewals. Recorded and duplicate both answer HTTP 200.
- **Secrets, all Supabase function secrets, never in git, never pasted into chat or logs:** `GROW_API_URL`, `GROW_USER_ID`, `GROW_PAGE_CODE_ONE_TIME`, `GROW_PAGE_CODE_RECURRING`, `GROW_RENEWAL_WEBHOOK_KEY`, `GROW_ENV` (`sandbox` default | `production`), `GROW_ANNUAL_AUTO_RENEW` (`"false"` default), `GROW_MONTHLY_MAX_CHARGES` (`120` default), `SITE_URL` (`https://www.activeplus.co.il` default), and the existing `MORNING_API_KEY`, `MORNING_API_SECRET`, `MORNING_DRY_RUN` (dry run unless exactly `"false"`). They are the client's (Active Plus) Grow account, NOT Garden of Eden's. Website env: `NEXT_PUBLIC_WEB_CHECKOUT` (off in production until Task 9), existing `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Dormant by configuration:** `growConfig()` returns null unless the five required Grow secrets are set and `GROW_ENV` agrees with the API URL (sandbox URL only with `sandbox`). Then `createGrowPayment`, `growWebhook` and `cancelGrowSubscription` answer `503 {"code":"not_configured"}`. Invoices are dry runs when `MORNING_DRY_RUN` is not `"false"` OR `GROW_ENV` is `sandbox`, so a sandbox payment can never produce a real tax document.
- `userId` always comes from the verified JWT, never from a request body (same rule as `checkUserSubscription`).
- **Branches:** app repo `/Users/itayostraich/Documents/GitHub/FitnessForSeniorsApp` on `feat/grow-web-checkout`; website `/Users/itayostraich/Documents/GitHub/active-plus-website` on `feat/grow-checkout`. The app repo has the user's uncommitted `shared/supabase/functions/deno.lock`: run every deno command with `--no-lock`, stage files by explicit path, never `git add -A` or `git add .` there.
- **Deno** is `~/.deno/bin/deno`, run from `shared/supabase/functions`.
- **Logs** carry ids and outcomes only (`webPaymentId`, `processId`, `transactionId`, `directDebitId`, result). Never names, phones, emails, tokens or raw payloads.

## Review Focus

1. **Grow delivers the same notify twice, or a renewal twice.** Expected: one `web_payments` row per charge, one subscription write, one income row, one Morning invoice, no double extension. Pinned in Task 3 (duplicate and resume tests) and Task 3b (invoice once).
2. **A forged notify or renewal.** Expected: 401, nothing written, Grow never asked to approve. Pinned in Task 3 (wrong processToken, unknown payment, tampered cField1, wrong sum, wrong webhookKey, unknown standing order).
3. **Monthly renewal months later.** Expected: a new `web_payments` row, `expires_at` extended one month from the later of now and the current expiry (the first charge carries two grace days so a late run never cuts access); a failed renewal extends nothing. Pinned in Task 2 (`nextExpiry`, `firstPeriodEnd`) and Task 3 (renewal tests).
4. **The buyer closes the tab after paying, before the success page.** Expected: activation still happens, because the webhook, not the browser, is the source of truth. Pinned by Task 3 (no browser input anywhere in the handler) and Task 9's sandbox run.
5. **A buyer who already has an active subscription (app store or web) opens checkout.** Expected: `409 already_subscribed` before any `web_payments` row or Grow call; the page says they are already subscribed. Pinned in Task 4.
6. **Consent unticked.** Expected: no `saveCardToken` sent, and no `card_token` stored even if Grow returns one. Pinned in Task 2 (form) and Task 3 (webhook).
7. **Keys missing.** Expected: every Grow function answers 503 `not_configured`; production website shows the store fallback. Pinned in Task 2 (`growConfig`), Task 4 and Task 8's curl checks.

---

### Task 0: After-keys checklist (owned by Itay, the client and Grow support)

**Execution does NOT wait for Task 0.** Tasks 1-8 build and release everything dormant now. Task 9 starts when these are done. Nothing here is code.

- [ ] **Credentials (client's Grow account, sandbox and production):** `userId`; a one-time **hosted payment page** code (not a wallet/SDK page code); a recurring (הוראת קבע) hosted page code; ask whether this account also needs an `apiKey` on Light API calls (if yes, Task 9 adds it as a secret and a form field).
- [ ] **Grow support questions** (answers go into `progress.md`; Task 9 adjusts code where they differ from the plan's assumptions):
  1. Recurring page: is `paymentNum` the number of monthly charges, and what range is allowed (the docs say 2-12 in one place and up to 180 in another)? We send `GROW_MONTHLY_MAX_CHARGES` (default 120).
  2. Is `chargeType=1` correct for both the one-time and the recurring page codes?
  3. Does `saveCardToken=1` work on the one-time hosted page for this account, and is token permission enabled ("working with tokens requires permission from Grow")?
  4. Is the notify to `notifyUrl` sent as multipart, urlencoded or JSON for these page codes? (Our parser accepts all three.)
  5. Does the first charge's notify include `directDebitId` on the recurring page? Is the first charge ALSO sent to the account webhook, and do first-charge `transactionId` and renewal `transactionCode` share one id space?
  6. What does `getTransactionInfo` return (field names for status and sum)? We assume `data.statusCode` and `data.sum`, or the first element when `data` is a list.
  7. Does Grow sign webhooks for this account, or is `webhookKey` in the body the only secret? Is the outbound IP list on the docs page stable?
  8. Which methods (card, Bit, Apple Pay, Google Pay) appear on each hosted page, and on which host is the hosted page URL (we accept `meshulam.co.il` and its subdomains)?
- [ ] **Enable account webhooks** (Grow support or dashboard): "Recurring payment" (from the second charge) and "Failure recurring payments", both to `https://<project-ref>.supabase.co/functions/v1/growWebhook`. Record the webhook key Grow shows; it becomes `GROW_RENEWAL_WEBHOOK_KEY`. Repeat separately for production.
- [ ] **Turn off Grow's own invoices/receipts** for the account (D8), so a buyer never gets two documents. Morning issues every document.
- [ ] **Morning:** the client confirms the existing `MORNING_API_KEY` is the business account the invoices should come from; that the business is עוסק מורשה (document type 320; an עוסק פטור issues a receipt, type 400, one constant in Task 3b); and the income item names on the invoice.
- [ ] **Privacy policy:** the client approves the draft Task 7 writes. Nothing is published before approval.
- [ ] **Grow integration review for production** (several business days; Grow checks the HTTP 200 reply, approveTransaction, and the token-consent checkbox). Production identifiers are issued after it.

---

### Task 1: Database: `web_payments`, the grow store platform, and income linkage (FitnessForSeniorsApp)

**Files:**
- Create: `shared/supabase/migrations/20261005090000_grow_web_payments.sql`
- Create: `shared/supabase/tests/web-payments/probe.sql`

**Interfaces:**
- Consumes: live `subscriptions` (CHECK `subscriptions_store_platform_check` (apple, google), unique `uq_subscriptions_store_txn` on (store_platform, store_transaction_id), columns `price_nis`, `is_manual NOT NULL`, `recurring_income NOT NULL`, `income_day_of_month`, `last_income_month`, `store_product_id`, `store_environment` CHECK (sandbox|production)); `subscription_income`; `public.update_updated_at_column()`.
- Produces: table `public.web_payments` (columns below; Tasks 3, 3b, 4, 6 read and write them by these exact names); `subscriptions.store_platform` accepts `'grow'`; `subscription_income.web_payment_id uuid unique`.

- [ ] **Step 1: Read the live schema (read-only, Supabase SQL editor).** The store columns on `subscriptions` were added outside migrations, so the local stack does not have them; the migration below backfills them with `if not exists` (a no-op in production).

```sql
select column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema = 'public' and table_name = 'subscriptions' order by ordinal_position;
select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.subscriptions'::regclass;
select indexname, indexdef from pg_indexes where schemaname = 'public' and tablename = 'subscriptions';
```

Compare with the drift block in Step 2: the column types and the `uq_subscriptions_store_txn` definition there must match production (adjust the drift block's types and index predicate to the output if they differ; the drift block only matters locally). Paste the output into the PR description.

- [ ] **Step 2: Migration** `shared/supabase/migrations/20261005090000_grow_web_payments.sql`:

```sql
-- Web purchases through Grow (Meshulam), plan v2 grow-checkout.
--
-- One web_payments row per charge: the first charge is created by
-- createGrowPayment before the buyer is sent to Grow's hosted page, and every
-- monthly renewal gets its own row (kind 'renewal', parent_id = first charge).
-- Service role only: card tokens and Grow tokens never reach a client, and the
-- website reads status through checkUserSubscription.

-- Drift: these subscriptions columns exist in production but were added
-- outside migrations. IF NOT EXISTS makes this a no-op there and gives the
-- local stack the same shape (Step 1 confirms the types).
alter table public.subscriptions
  add column if not exists store_platform text,
  add column if not exists store_product_id text,
  add column if not exists store_transaction_id text,
  add column if not exists store_environment text,
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz;
create unique index if not exists uq_subscriptions_store_txn
  on public.subscriptions (store_platform, store_transaction_id)
  where store_transaction_id is not null;

-- 'grow' joins the stores. NULL (manual subscriptions) still passes a CHECK.
alter table public.subscriptions drop constraint if exists subscriptions_store_platform_check;
alter table public.subscriptions add constraint subscriptions_store_platform_check
  check (store_platform in ('apple', 'google', 'grow'));

create table public.web_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null default 'first' check (kind in ('first', 'renewal')),
  parent_id uuid references public.web_payments(id) on delete cascade,
  plan_type text not null check (plan_type in ('MONTHLY', 'ANNUAL')),
  amount numeric(10,2) not null check (amount > 0),
  installments smallint not null default 1 check (installments between 1 and 12),
  environment text not null check (environment in ('sandbox', 'production')),
  status text not null default 'created' check (status in ('created', 'processing', 'paid', 'failed')),
  -- Checkout snapshot: the invoice goes to these, not to whatever the profile says later.
  full_name text not null,
  phone text not null,
  email text not null,
  token_consent boolean not null default false,
  grow_process_id text,
  grow_process_token text,
  grow_transaction_id text,
  -- updateDirectDebit (cancel) needs transaction id + token + asmachta of the first charge.
  grow_transaction_token text,
  grow_asmachta text,
  -- The standing order's id: set on the monthly first charge only; renewals name it.
  grow_direct_debit_id text,
  card_token text,
  card_suffix text,
  card_brand text,
  -- The period this charge pays for, fixed when the charge is claimed so a
  -- redelivered webhook never extends twice.
  period_end timestamptz,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  approved_at timestamptz,
  -- Morning invoice for this charge (Task 3b). One charge, one document.
  invoice_status text not null default 'pending' check (invoice_status in ('pending', 'issued', 'failed', 'dry_run')),
  morning_document_id text,
  morning_document_url text,
  invoice_error text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint web_payments_renewal_has_parent check ((kind = 'renewal') = (parent_id is not null))
);

-- Idempotency: one row per Grow transaction.
create unique index uq_web_payments_transaction on public.web_payments (grow_transaction_id)
  where grow_transaction_id is not null;
-- Renewal lookup: each renewal webhook names the standing order by directDebitId.
create unique index uq_web_payments_direct_debit on public.web_payments (grow_direct_debit_id)
  where grow_direct_debit_id is not null;
create index idx_web_payments_user on public.web_payments (user_id, created_at desc);
create index idx_web_payments_process on public.web_payments (grow_process_id) where grow_process_id is not null;
create index idx_web_payments_parent on public.web_payments (parent_id) where parent_id is not null;
create index idx_web_payments_subscription on public.web_payments (subscription_id) where subscription_id is not null;

create trigger set_web_payments_updated_at before update on public.web_payments
  for each row execute function public.update_updated_at_column();

alter table public.web_payments enable row level security;
-- No policies: only the service role (edge functions) reads or writes.
revoke all on public.web_payments from anon, authenticated;

-- Each Grow charge books one income row for the digital P&L, exactly like a
-- manual subscription's charge. The unique link makes the webhook's insert
-- idempotent across redeliveries.
alter table public.subscription_income
  add column if not exists web_payment_id uuid unique references public.web_payments(id) on delete set null;
```

Account deletion cascades `web_payments` (and with it the tokens needed to cancel a standing order); Task 7's runbook cancels the standing order first. Invoices live in Morning and are not deleted with the user.

- [ ] **Step 3: Probe** `shared/supabase/tests/web-payments/probe.sql`:

```sql
-- Schema probe for 20261005090000_grow_web_payments.sql. One transaction,
-- rolled back. Replica role turns FK triggers off, so the rows need no real
-- users or subscriptions; CHECK and UNIQUE constraints still apply.
begin;
set local session_replication_role = replica;

do $$
declare
  u uuid := '00000000-0000-4000-8000-0000000000b1';
  first_id uuid := '00000000-0000-4000-8000-0000000000c1';
begin
  insert into public.subscriptions (user_id, plan_type, expires_at, store_platform, store_transaction_id, store_environment)
  values (u, 'MONTHLY', now() + interval '1 month', 'grow', 'probe-key', 'sandbox');

  begin
    insert into public.subscriptions (user_id, plan_type, expires_at, store_platform) values (u, 'MONTHLY', now(), 'stripe');
    raise exception 'store_platform accepted stripe';
  exception when check_violation then null;
  end;

  insert into public.web_payments (id, user_id, plan_type, amount, environment, full_name, phone, email, grow_transaction_id, grow_direct_debit_id)
  values (first_id, u, 'MONTHLY', 99, 'sandbox', 'רחל כהן', '0501234567', 'r@example.com', 't1', 'dd1');

  if (select card_token from public.web_payments where id = first_id) is not null then
    raise exception 'card_token should default to null';
  end if;

  begin
    insert into public.web_payments (user_id, plan_type, amount, environment, full_name, phone, email)
    values (u, 'ANNUAL', 708, 'sandbox', 'רחל כהן', '0501234567', null);
    raise exception 'email accepted null';
  exception when not_null_violation then null;
  end;

  begin
    insert into public.web_payments (user_id, plan_type, amount, environment, full_name, phone, email, grow_transaction_id)
    values (u, 'MONTHLY', 99, 'sandbox', 'a b', '0501234567', 'r@example.com', 't1');
    raise exception 'duplicate transaction id accepted';
  exception when unique_violation then null;
  end;

  begin
    insert into public.web_payments (user_id, plan_type, amount, environment, full_name, phone, email, grow_direct_debit_id)
    values (u, 'MONTHLY', 99, 'sandbox', 'a b', '0501234567', 'r@example.com', 'dd1');
    raise exception 'duplicate direct debit id accepted';
  exception when unique_violation then null;
  end;

  begin
    insert into public.web_payments (user_id, kind, plan_type, amount, environment, full_name, phone, email)
    values (u, 'renewal', 'MONTHLY', 99, 'sandbox', 'a b', '0501234567', 'r@example.com');
    raise exception 'renewal without parent accepted';
  exception when check_violation then null;
  end;

  insert into public.web_payments (user_id, kind, parent_id, plan_type, amount, environment, status, full_name, phone, email, grow_transaction_id)
  values (u, 'renewal', first_id, 'MONTHLY', 99, 'sandbox', 'processing', 'a b', '0501234567', 'r@example.com', 't2');

  begin
    insert into public.web_payments (user_id, plan_type, amount, environment, status, full_name, phone, email)
    values (u, 'MONTHLY', 99, 'sandbox', 'cancelled', 'a b', '0501234567', 'r@example.com');
    raise exception 'unknown status accepted';
  exception when check_violation then null;
  end;

  insert into public.subscription_income (user_id, amount, income_date, web_payment_id) values (u, 99, current_date, first_id);
  begin
    insert into public.subscription_income (user_id, amount, income_date, web_payment_id) values (u, 99, current_date, first_id);
    raise exception 'second income row for one charge accepted';
  exception when unique_violation then null;
  end;

  if not (select relrowsecurity from pg_class where oid = 'public.web_payments'::regclass) then
    raise exception 'RLS is off on web_payments';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'web_payments') then
    raise exception 'web_payments must have no policies';
  end if;
  if has_table_privilege('anon', 'public.web_payments', 'select') or has_table_privilege('authenticated', 'public.web_payments', 'select') then
    raise exception 'clients can read web_payments';
  end if;

  raise notice 'web_payments probe passed';
end $$;

rollback;
```

- [ ] **Step 4: Run on the local stack (Docker is running).**

```bash
cd /Users/itayostraich/Documents/GitHub/FitnessForSeniorsApp/shared
supabase start
supabase db reset
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/web-payments/probe.sql
```

Expected: `NOTICE: web_payments probe passed`. If `supabase db reset` fails on a migration OLDER than ours, stop and report the failing file and error to the controller (do not edit older migrations). Production is NOT touched in this task; Task 8 applies the migration. Finish with `supabase stop`.

- [ ] **Step 5: Commit** (app repo, explicit paths):

```bash
git add shared/supabase/migrations/20261005090000_grow_web_payments.sql shared/supabase/tests/web-payments/probe.sql
git commit -m "feat(db): web_payments for grow web checkout"
```

---

### Task 2: Pure Grow logic, the HTTP client, and the grow row in `subscriptionUpsert` (FitnessForSeniorsApp)

**Files:**
- Create: `shared/supabase/functions/_shared/grow.ts`, `shared/supabase/functions/_shared/grow.test.ts`
- Create: `shared/supabase/functions/_shared/growClient.ts`, `shared/supabase/functions/_shared/growClient.test.ts`
- Modify: `shared/supabase/functions/_shared/subscriptionUpsert.ts`
- Create: `shared/supabase/functions/_shared/subscriptionUpsert.test.ts`

**Interfaces:**
- Consumes: `PlanType` (`_shared/iapProducts.ts`), `createServiceClient` (`_shared/supabaseClient.ts`).
- Produces (`_shared/grow.ts`):
  - `type WebPlan = "ANNUAL" | "MONTHLY"`; `type GrowEnvironment = "sandbox" | "production"`; `type FlatBody = Record<string, string>`
  - `PLAN_CONFIG: Record<WebPlan, { sum: number; months: number; recurring: boolean; maxInstallments: number; description: string }>`
  - `GROW_PRODUCT_ID: Record<WebPlan, string>`; `GROW_SUCCESS_STATUS = "2"`; `APPROVE_FIELDS: readonly string[]` (23 names)
  - `type GrowConfig = { apiUrl: string; userId: string; pageCodeOneTime: string; pageCodeRecurring: string; renewalWebhookKey: string; environment: GrowEnvironment; annualAutoRenew: boolean; monthlyMaxCharges: number; siteUrl: string }`
  - `growConfig(env: Record<string, string | undefined>): GrowConfig | null`; `annualAutoRenew(env): boolean`; `pageCodeFor(config: GrowConfig, plan: WebPlan): string`
  - `toHexId(uuid: string): string`; `fromHexId(hex: string | null | undefined): string | null`
  - `growSafeText(value: string): string`; `isFullName(value: string): boolean`; `toLocalMobile(phone: string | null | undefined): string | null`; `isGrowSafeEmail(email: string): boolean`
  - `type CreatePaymentInput = { plan: WebPlan; installments: number; saveCardToken: boolean; fullName: string; phone: string; email: string; webPaymentId: string; notifyUrl: string; config: GrowConfig }`; `buildCreatePaymentForm(input: CreatePaymentInput): FormData`
  - `parseBody(contentType: string | null, raw: string): Promise<FlatBody>`; `classifyCallback(body: FlatBody): "first" | "renewal" | "renewal_failed" | null`
  - `type GrowFirstNotify = { webPaymentId: string; processId: string; processToken: string; transactionId: string; transactionToken: string; statusCode: string; sum: number; installments: number; asmachta: string | null; cardSuffix: string | null; cardBrand: string | null; cardToken: string | null; directDebitId: string | null; paidOn: string | null; raw: FlatBody }`; `parseFirstNotify(body: FlatBody): GrowFirstNotify | null`
  - `type GrowRenewal = { webhookKey: string; transactionId: string; directDebitId: string; sum: number; asmachta: string | null; cardSuffix: string | null; cardBrand: string | null; paidOn: string | null; raw: FlatBody }`; `parseRenewal(body: FlatBody): GrowRenewal | null`
  - `type GrowRenewalFailure = { webhookKey: string; directDebitId: string; error: string | null; attempts: number }`; `parseRenewalFailure(body: FlatBody): GrowRenewalFailure | null`
  - `parseGrowDate(value: string | null): string | null` (`d/m/yy` -> `YYYY-MM-DD`)
  - `nextExpiry(plan: WebPlan, now: Date, currentExpiry: Date | null): Date`; `firstPeriodEnd(plan: WebPlan, now: Date): Date`
  - `sameAmount(a: number, b: number): boolean`; `safeEqual(a: string, b: string): boolean`; `isGrowHostedUrl(value: string): boolean`
  - `buildApproveForm(raw: FlatBody, pageCode: string): FormData`; `buildCancelDirectDebitForm(config: GrowConfig, charge: { transactionId: string; transactionToken: string; asmachta: string }): FormData`
  - `type TransactionCheck = { ok: true; statusCode: string; sum: number } | { ok: false; transient: boolean; error: string }`; `readTransactionInfo(data: unknown): { statusCode: string; sum: number } | null`
- Produces (`_shared/growClient.ts`):
  - `type GrowCall = { ok: true; data: unknown } | { ok: false; transient: boolean; error: string }`; `interpretGrowResponse(httpStatus: number, text: string): GrowCall`
  - `type CreatedProcess = { ok: true; processId: string; processToken: string; url: string } | { ok: false; error: string }`; `createPaymentProcess(config: GrowConfig, form: FormData): Promise<CreatedProcess>`
  - `getTransactionInfo(config: GrowConfig, pageCode: string, transactionId: string, transactionToken: string): Promise<TransactionCheck>`
  - `approveTransaction(config: GrowConfig, pageCode: string, raw: FlatBody): Promise<boolean>`
  - `cancelDirectDebit(config: GrowConfig, charge: { transactionId: string; transactionToken: string; asmachta: string }): Promise<GrowCall>`
- Produces (`_shared/subscriptionUpsert.ts`): `StorePlatform = 'apple' | 'google' | 'grow'`; `NormalizedSubscription.priceNis?: number | null`; `buildSubscriptionRow(sub: NormalizedSubscription, nowIso: string): Record<string, unknown>`; `upsertSubscription` (signature unchanged); `markSubscriptionCancelled(id: string, at: Date): Promise<void>`

Where Grow's real behaviour is unconfirmed (notify encoding, `getTransactionInfo` shape, `directDebitId` on the first notify), the code accepts every documented variant and the fixtures follow the docs; Task 9 replaces the fixtures with captured sandbox payloads.

- [ ] **Step 1: Failing tests** `_shared/grow.test.ts`:

```ts
import { assert, assertEquals, assertThrows } from "std/assert/mod.ts";
import {
  annualAutoRenew, APPROVE_FIELDS, buildApproveForm, buildCancelDirectDebitForm, buildCreatePaymentForm,
  classifyCallback, firstPeriodEnd, fromHexId, growConfig, growSafeText, isFullName, isGrowHostedUrl,
  isGrowSafeEmail, nextExpiry, parseBody, parseFirstNotify, parseGrowDate, parseRenewal, parseRenewalFailure,
  PLAN_CONFIG, readTransactionInfo, safeEqual, sameAmount, toHexId, toLocalMobile,
} from "./grow.ts";

const ENV = {
  GROW_API_URL: "https://sandbox.meshulam.co.il/api/light/server/1.0/",
  GROW_USER_ID: "user",
  GROW_PAGE_CODE_ONE_TIME: "one",
  GROW_PAGE_CODE_RECURRING: "rec",
  GROW_RENEWAL_WEBHOOK_KEY: "hook",
};
const PROD_URL = "https://secure.meshulam.co.il/api/light/server/1.0";
const config = growConfig(ENV)!;
const WP = "0f8b6c2e-9a41-4d3b-8e57-1c2d3e4f5a6b";
const HEX = "0f8b6c2e9a414d3b8e571c2d3e4f5a6b";
const base = {
  fullName: "רחל כהן", phone: "+972501234567", email: "r@example.com", webPaymentId: WP,
  notifyUrl: "https://x.supabase.co/functions/v1/growWebhook", config, saveCardToken: false,
};

Deno.test("growConfig: null until every Grow secret is set", () => {
  assertEquals(growConfig({}), null);
  assertEquals(growConfig({ ...ENV, GROW_RENEWAL_WEBHOOK_KEY: " " }), null);
});

Deno.test("growConfig: dormant-safe defaults", () => {
  assertEquals(config.apiUrl, "https://sandbox.meshulam.co.il/api/light/server/1.0");
  assertEquals(config.environment, "sandbox");
  assertEquals(config.annualAutoRenew, false);
  assertEquals(config.monthlyMaxCharges, 120);
  assertEquals(config.siteUrl, "https://www.activeplus.co.il");
});

Deno.test("growConfig: GROW_ENV and the API URL must agree", () => {
  assertEquals(growConfig({ ...ENV, GROW_ENV: "production" }), null);
  assertEquals(growConfig({ ...ENV, GROW_API_URL: PROD_URL }), null);
  assertEquals(growConfig({ ...ENV, GROW_ENV: "production", GROW_API_URL: PROD_URL })?.environment, "production");
});

Deno.test("growConfig: switches", () => {
  assertEquals(annualAutoRenew({}), false);
  assertEquals(annualAutoRenew({ GROW_ANNUAL_AUTO_RENEW: "true" }), true);
  assertEquals(annualAutoRenew({ GROW_ANNUAL_AUTO_RENEW: "yes" }), false);
  assertEquals(growConfig({ ...ENV, GROW_MONTHLY_MAX_CHARGES: "36" })?.monthlyMaxCharges, 36);
  assertEquals(growConfig({ ...ENV, GROW_MONTHLY_MAX_CHARGES: "500" })?.monthlyMaxCharges, 120);
  assertEquals(growConfig({ ...ENV, GROW_MONTHLY_MAX_CHARGES: "abc" })?.monthlyMaxCharges, 120);
  assertEquals(growConfig({ ...ENV, SITE_URL: "https://preview.vercel.app/" })?.siteUrl, "https://preview.vercel.app");
});

Deno.test("hex ids round-trip and reject anything else", () => {
  assertEquals(toHexId(WP), HEX);
  assertEquals(fromHexId(HEX), WP);
  assertEquals(fromHexId(HEX.toUpperCase()), WP);
  assertEquals(fromHexId("user-1"), null);
  assertEquals(fromHexId(WP), null);
  assertEquals(fromHexId(undefined), null);
  assertThrows(() => toHexId("not-a-uuid"));
});

Deno.test("names keep letters, digits and single spaces; two words make a full name", () => {
  assertEquals(growSafeText("  ג'ורג'   כהן-לוי "), "גורג כהן לוי");
  assertEquals(growSafeText("רָחֵל כהן"), "רחל כהן");
  assertEquals(isFullName("רחל כהן"), true);
  assertEquals(isFullName("Rachel Cohen"), true);
  assertEquals(isFullName("ג'ורג'"), false);
  assertEquals(isFullName("רחל"), false);
  assertEquals(isFullName("רחל 2"), false);
  assertEquals(isFullName(" - "), false);
});

Deno.test("phones become local Israeli mobiles", () => {
  assertEquals(toLocalMobile("+972501234567"), "0501234567");
  assertEquals(toLocalMobile("972501234567"), "0501234567");
  assertEquals(toLocalMobile("050-123-4567"), "0501234567");
  assertEquals(toLocalMobile("0312345678"), null);
  assertEquals(toLocalMobile(null), null);
});

Deno.test("annual form: one-time page, fixed installments, plain description, hex cField1, no token without consent", () => {
  const f = buildCreatePaymentForm({ ...base, plan: "ANNUAL", installments: 6 });
  assertEquals(f.get("userId"), "user");
  assertEquals(f.get("pageCode"), "one");
  assertEquals(f.get("chargeType"), "1");
  assertEquals(f.get("sum"), "708");
  assertEquals(f.get("description"), "מנוי שנתי פעילים פלוס");
  assertEquals(f.get("paymentNum"), "6");
  assertEquals(f.get("maxPaymentNum"), null);
  assertEquals(f.get("cField1"), HEX);
  assertEquals(f.get("cField2"), null);
  assertEquals(f.get("successUrl"), `https://www.activeplus.co.il/payment/success?wp=${HEX}`);
  assertEquals(f.get("cancelUrl"), "https://www.activeplus.co.il/payment?cancelled=1");
  assertEquals(f.get("notifyUrl"), "https://x.supabase.co/functions/v1/growWebhook");
  assertEquals(f.get("pageField[fullName]"), "רחל כהן");
  assertEquals(f.get("pageField[phone]"), "0501234567");
  assertEquals(f.get("pageField[email]"), "r@example.com");
  assertEquals(f.get("saveCardToken"), null);
});

Deno.test("annual form with consent asks Grow to save the card token", () => {
  assertEquals(buildCreatePaymentForm({ ...base, plan: "ANNUAL", installments: 1, saveCardToken: true }).get("saveCardToken"), "1");
});

Deno.test("monthly form: recurring page, standing-order charge count, never a token", () => {
  const f = buildCreatePaymentForm({ ...base, plan: "MONTHLY", installments: 1, saveCardToken: true });
  assertEquals(f.get("pageCode"), "rec");
  assertEquals(f.get("sum"), "99");
  assertEquals(f.get("description"), "מנוי חודשי פעילים פלוס");
  assertEquals(f.get("paymentNum"), "120");
  assertEquals(f.get("saveCardToken"), null);
});

Deno.test("no Grow parameter carries a special character (D6)", () => {
  const URL_RE = /^https:\/\/[A-Za-z0-9.\/-]+(\?[a-z]+=[0-9a-z]+)?$/;
  for (const plan of ["ANNUAL", "MONTHLY"] as const) {
    const f = buildCreatePaymentForm({ ...base, fullName: "ג'ורג' כהן-לוי", plan, installments: 1 });
    for (const [key, value] of f.entries()) {
      const text = String(value);
      if (key.endsWith("Url")) assert(URL_RE.test(text), `${key}=${text}`);
      else if (key === "pageField[email]") assert(isGrowSafeEmail(text), text);
      else assert(/^[\p{L}\p{N} ]*$/u.test(text), `${key}=${text}`);
    }
  }
});

Deno.test("an email outside the safe set is not sent to Grow", () => {
  assertEquals(buildCreatePaymentForm({ ...base, email: "r+1@example.com", plan: "ANNUAL", installments: 1 }).get("pageField[email]"), null);
});

Deno.test("rejects bad installments, one-word names and non-mobile phones", () => {
  assertThrows(() => buildCreatePaymentForm({ ...base, plan: "ANNUAL", installments: 13 }));
  assertThrows(() => buildCreatePaymentForm({ ...base, plan: "ANNUAL", installments: 0 }));
  assertThrows(() => buildCreatePaymentForm({ ...base, plan: "MONTHLY", installments: 2 }));
  assertThrows(() => buildCreatePaymentForm({ ...base, plan: "ANNUAL", installments: 1, fullName: "רחל" }));
  assertThrows(() => buildCreatePaymentForm({ ...base, plan: "ANNUAL", installments: 1, phone: "031234567" }));
});

Deno.test("parseBody reads urlencoded, multipart and JSON into the same flat keys", async () => {
  const urlencoded = await parseBody(
    "application/x-www-form-urlencoded",
    `data%5BprocessId%5D=p1&data%5BcustomFields%5D%5BcField1%5D=${HEX}`,
  );
  assertEquals(urlencoded["data[processId]"], "p1");
  assertEquals(urlencoded["data[customFields][cField1]"], HEX);

  const form = new FormData();
  form.append("data[processId]", "p1");
  const req = new Request("https://x", { method: "POST", body: form });
  const multipart = await parseBody(req.headers.get("content-type"), await req.text());
  assertEquals(multipart["data[processId]"], "p1");

  const json = await parseBody("application/json", JSON.stringify({ data: { processId: "p1", customFields: { cField1: HEX } } }));
  assertEquals(json["data[processId]"], "p1");
  assertEquals(json["data[customFields][cField1]"], HEX);

  assertEquals(await parseBody("application/json", "{not json"), {});
});

const FIRST: Record<string, string> = {
  "err": "", "status": "1",
  "data[processId]": "p1", "data[processToken]": "ptok",
  "data[transactionId]": "t1", "data[transactionToken]": "ttok",
  "data[sum]": "708", "data[paymentsNum]": "0", "data[allPaymentsNum]": "6",
  "data[paymentDate]": "5/10/26", "data[asmachta]": "a1", "data[cardSuffix]": "4242",
  "data[cardBrand]": "Visa", "data[statusCode]": "2", "data[cardToken]": "tok",
  "data[directDebitId]": "dd1", "data[customFields][cField1]": HEX,
};

const RENEWAL: Record<string, string> = {
  webhookKey: "hook", transactionCode: "t2", transactionType: "1", paymentSum: "99",
  paymentsNum: "2", allPaymentNum: "120", paymentType: "הוראת קבע", paymentDate: "5/11/26",
  asmachta: "a2", fullName: "רחל כהן", payerEmail: "r@example.com", cardSuffix: "4242",
  cardBrand: "Visa", paymentSource: "ריצת הוראת קבע", directDebitId: "dd1",
};

const FAILURE: Record<string, string> = {
  regular_payment_id: "dd1", payer_name: "רחל כהן", phone: "0501234567", email: "r@example.com",
  transaction_type: "1", card_suffix: "4242", sum: "99", description: "מנוי חודשי פעילים פלוס",
  business_title: "x", error_message: "כרטיס חסום", charges_attempts: "2", webhook_key: "hook",
};

Deno.test("classifyCallback routes the three shapes", () => {
  assertEquals(classifyCallback(FIRST), "first");
  assertEquals(classifyCallback(RENEWAL), "renewal");
  assertEquals(classifyCallback(FAILURE), "renewal_failed");
  assertEquals(classifyCallback({ hello: "world" }), null);
});

Deno.test("parseFirstNotify: installments from allPaymentsNum, our uuid from the hex cField1", () => {
  const n = parseFirstNotify(FIRST)!;
  assertEquals(n.webPaymentId, WP);
  assertEquals(n.processId, "p1");
  assertEquals(n.processToken, "ptok");
  assertEquals(n.transactionId, "t1");
  assertEquals(n.transactionToken, "ttok");
  assertEquals(n.statusCode, "2");
  assertEquals(n.sum, 708);
  assertEquals(n.installments, 6);
  assertEquals(n.cardToken, "tok");
  assertEquals(n.cardBrand, "Visa");
  assertEquals(n.directDebitId, "dd1");
  assertEquals(n.paidOn, "2026-10-05");
});

Deno.test("parseFirstNotify: a single payment reports paymentsNum 0", () => {
  const { ["data[allPaymentsNum]"]: _all, ...single } = FIRST;
  assertEquals(parseFirstNotify(single)?.installments, 1);
});

Deno.test("parseFirstNotify rejects incomplete or tampered payloads", () => {
  const { ["data[processToken]"]: _token, ...noToken } = FIRST;
  assertEquals(parseFirstNotify(noToken), null);
  assertEquals(parseFirstNotify({ ...FIRST, "data[customFields][cField1]": "user-1" }), null);
  assertEquals(parseFirstNotify({ ...FIRST, "data[sum]": "abc" }), null);
});

Deno.test("parseRenewal reads the account webhook", () => {
  assertEquals(parseRenewal(RENEWAL), {
    webhookKey: "hook", transactionId: "t2", directDebitId: "dd1", sum: 99, asmachta: "a2",
    cardSuffix: "4242", cardBrand: "Visa", paidOn: "2026-11-05", raw: RENEWAL,
  });
  assertEquals(parseRenewal({ ...RENEWAL, paymentSum: "0" }), null);
  assertEquals(parseRenewal({ ...RENEWAL, webhookKey: "" }), null);
});

Deno.test("parseRenewalFailure reads the failed-charge webhook", () => {
  assertEquals(parseRenewalFailure(FAILURE), { webhookKey: "hook", directDebitId: "dd1", error: "כרטיס חסום", attempts: 2 });
  assertEquals(parseRenewalFailure({ ...FAILURE, regular_payment_id: "" }), null);
});

Deno.test("parseGrowDate", () => {
  assertEquals(parseGrowDate("5/11/26"), "2026-11-05");
  assertEquals(parseGrowDate("05/11/2026"), "2026-11-05");
  assertEquals(parseGrowDate("31/13/26"), null);
  assertEquals(parseGrowDate("2026-11-05"), null);
  assertEquals(parseGrowDate(null), null);
});

Deno.test("annual expiry is 12 months from purchase", () => {
  assertEquals(nextExpiry("ANNUAL", new Date("2026-10-05T10:00:00Z"), null).toISOString(), "2027-10-05T10:00:00.000Z");
});

Deno.test("monthly renewal extends from the later of now and the current expiry", () => {
  const now = new Date("2026-11-05T10:00:00Z");
  assertEquals(nextExpiry("MONTHLY", now, new Date("2026-11-07T10:00:00Z")).toISOString(), "2026-12-07T10:00:00.000Z");
  assertEquals(nextExpiry("MONTHLY", now, new Date("2026-10-01T10:00:00Z")).toISOString(), "2026-12-05T10:00:00.000Z");
});

Deno.test("a month after the 31st ends on the last day of the next month", () => {
  assertEquals(nextExpiry("MONTHLY", new Date("2027-01-31T10:00:00Z"), null).toISOString(), "2027-02-28T10:00:00.000Z");
});

Deno.test("the first monthly period carries two grace days; annual none", () => {
  const now = new Date("2026-10-05T10:00:00Z");
  assertEquals(firstPeriodEnd("MONTHLY", now).toISOString(), "2026-11-07T10:00:00.000Z");
  assertEquals(firstPeriodEnd("ANNUAL", now).toISOString(), "2027-10-05T10:00:00.000Z");
});

Deno.test("amounts compare to the agora, strings in constant time", () => {
  assertEquals(sameAmount(708, 708.004), true);
  assertEquals(sameAmount(708, 707.99), false);
  assertEquals(sameAmount(Number.NaN, 708), false);
  assertEquals(safeEqual("ptok", "ptok"), true);
  assertEquals(safeEqual("ptok", "ptoK"), false);
  assertEquals(safeEqual("ptok", "ptok2"), false);
});

Deno.test("only Grow's https hosts count as a payment page", () => {
  assertEquals(isGrowHostedUrl("https://sandbox.meshulam.co.il/s/abc"), true);
  assertEquals(isGrowHostedUrl("https://meshulam.co.il/purchase?x=1"), true);
  assertEquals(isGrowHostedUrl("http://secure.meshulam.co.il/s/abc"), false);
  assertEquals(isGrowHostedUrl("https://meshulam.co.il.evil.example/s"), false);
  assertEquals(isGrowHostedUrl("not a url"), false);
});

Deno.test("approve form carries the page code and all 23 notify fields", () => {
  const f = buildApproveForm(FIRST, "one");
  assertEquals(APPROVE_FIELDS.length, 23);
  assertEquals(f.get("pageCode"), "one");
  assertEquals(f.get("transactionId"), "t1");
  assertEquals(f.get("processToken"), "ptok");
  assertEquals(f.get("cardExp"), "");
  assertEquals([...f.keys()].length, 24);
});

Deno.test("cancel form stops the standing order (changeStatus 2)", () => {
  const f = buildCancelDirectDebitForm(config, { transactionId: "t1", transactionToken: "ttok", asmachta: "a1" });
  assertEquals([...f.entries()].map(([k, v]) => `${k}=${v}`), ["userId=user", "transactionId=t1", "transactionToken=ttok", "asmachta=a1", "changeStatus=2"]);
});

Deno.test("readTransactionInfo accepts an object or a list, and nothing else", () => {
  assertEquals(readTransactionInfo({ statusCode: "2", sum: "708" }), { statusCode: "2", sum: 708 });
  assertEquals(readTransactionInfo([{ statusCode: 2, sum: 99 }]), { statusCode: "2", sum: 99 });
  assertEquals(readTransactionInfo({ sum: "708" }), null);
  assertEquals(readTransactionInfo(null), null);
});

Deno.test("plan config matches the website's prices", () => {
  assertEquals(PLAN_CONFIG.ANNUAL.sum, 708);
  assertEquals(PLAN_CONFIG.MONTHLY.sum, 99);
});
```

`_shared/growClient.test.ts`:

```ts
import { assertEquals } from "std/assert/mod.ts";
import { interpretGrowResponse } from "./growClient.ts";

Deno.test("status 1 is success, with or without data", () => {
  assertEquals(interpretGrowResponse(200, '{"status":1,"err":"","data":{"processId":5}}'), { ok: true, data: { processId: 5 } });
  assertEquals(interpretGrowResponse(200, '{"status":"1","err":"","data":""}'), { ok: true, data: "" });
});

Deno.test("status 0 carries Grow's error id and message, and is not retried", () => {
  assertEquals(interpretGrowResponse(200, '{"status":0,"err":{"id":617,"message":"bad sum"},"data":""}'), { ok: false, transient: false, error: "617 bad sum" });
});

Deno.test("5xx and 429 are transient; non-JSON is not", () => {
  assertEquals(interpretGrowResponse(502, "bad gateway"), { ok: false, transient: true, error: "HTTP 502" });
  assertEquals(interpretGrowResponse(429, ""), { ok: false, transient: true, error: "HTTP 429" });
  assertEquals(interpretGrowResponse(200, "<html>"), { ok: false, transient: false, error: "HTTP 200: not JSON" });
});
```

`_shared/subscriptionUpsert.test.ts`:

```ts
import { assertEquals } from 'std/assert/mod.ts'
import { buildSubscriptionRow, type NormalizedSubscription } from './subscriptionUpsert.ts'

const NOW = '2026-10-05T10:00:00.000Z'
const base: NormalizedSubscription = {
  platform: 'apple',
  storeTransactionId: 'orig-1',
  productId: 'activeplus_annual',
  planType: 'ANNUAL',
  expiresAt: new Date('2027-10-05T10:00:00Z'),
  isActive: true,
  autoRenew: true,
  environment: 'production',
  rawReceipt: 'signed',
}

Deno.test('store rows keep their receipt column and leave the manual-income columns alone', () => {
  const row = buildSubscriptionRow(base, NOW)
  assertEquals(row.apple_receipt, 'signed')
  assertEquals('google_receipt' in row, false)
  assertEquals('is_manual' in row, false)
  assertEquals('recurring_income' in row, false)
  assertEquals('price_nis' in row, false)
  assertEquals(row.updated_at, NOW)
})

Deno.test('grow rows have no receipt column, are never manual, never cron income, and carry the price', () => {
  const row = buildSubscriptionRow({ ...base, platform: 'grow', storeTransactionId: 'wp-1', productId: 'grow_annual', rawReceipt: null, priceNis: 708 }, NOW)
  assertEquals(row.store_platform, 'grow')
  assertEquals('apple_receipt' in row, false)
  assertEquals('google_receipt' in row, false)
  assertEquals(row.is_manual, false)
  assertEquals(row.recurring_income, false)
  assertEquals(row.price_nis, 708)
})

Deno.test('omitting priceNis leaves price_nis untouched', () => {
  const row = buildSubscriptionRow({ ...base, platform: 'grow', rawReceipt: null }, NOW)
  assertEquals('price_nis' in row, false)
})
```

- [ ] **Step 2: Run, expect FAIL** (modules missing):

```bash
cd /Users/itayostraich/Documents/GitHub/FitnessForSeniorsApp/shared/supabase/functions
~/.deno/bin/deno test --no-lock _shared/grow.test.ts _shared/growClient.test.ts _shared/subscriptionUpsert.test.ts
```

- [ ] **Step 3: Implement** `_shared/grow.ts`:

```ts
// Grow (Meshulam) Light API, the pure half: config, the createPaymentProcess
// form, Grow's two callback shapes, and the expiry math. No network and no
// Deno.env here, so every function is unit-tested. Field names follow
// developers.grow.business. Where Grow's real behaviour is unconfirmed, the
// parsers accept every documented variant; the web-checkout plan's Task 9
// replaces the test fixtures with captured sandbox payloads.

export type WebPlan = "ANNUAL" | "MONTHLY";
export type GrowEnvironment = "sandbox" | "production";
export type FlatBody = Record<string, string>;

type PlanConfig = { sum: number; months: number; recurring: boolean; maxInstallments: number; description: string };

/** Descriptions are letters and spaces only: Grow forbids special characters in every parameter (D6). */
export const PLAN_CONFIG: Record<WebPlan, PlanConfig> = {
  ANNUAL: { sum: 708, months: 12, recurring: false, maxInstallments: 12, description: "מנוי שנתי פעילים פלוס" },
  MONTHLY: { sum: 99, months: 1, recurring: true, maxInstallments: 1, description: "מנוי חודשי פעילים פלוס" },
};

/** store_product_id for web purchases. */
export const GROW_PRODUCT_ID: Record<WebPlan, string> = { ANNUAL: "grow_annual", MONTHLY: "grow_monthly" };

/** data.statusCode of a paid transaction ("שולם"). */
export const GROW_SUCCESS_STATUS = "2";

const DEFAULT_MONTHLY_MAX_CHARGES = 120;
const MIN_MONTHLY_CHARGES = 2;
const MAX_MONTHLY_CHARGES = 180;
const DEFAULT_SITE_URL = "https://www.activeplus.co.il";
const MONTHLY_GRACE_DAYS = 2;
const DAY_MS = 86_400_000;

export type GrowConfig = {
  apiUrl: string;
  userId: string;
  pageCodeOneTime: string;
  pageCodeRecurring: string;
  renewalWebhookKey: string;
  environment: GrowEnvironment;
  annualAutoRenew: boolean;
  monthlyMaxCharges: number;
  siteUrl: string;
};

type Env = Record<string, string | undefined>;

const trimmed = (value: string | undefined): string | null => value?.trim() || null;

export const annualAutoRenew = (env: Env): boolean => env.GROW_ANNUAL_AUTO_RENEW === "true";

function monthlyMaxCharges(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= MIN_MONTHLY_CHARGES && n <= MAX_MONTHLY_CHARGES ? n : DEFAULT_MONTHLY_MAX_CHARGES;
}

/**
 * Null until every Grow secret is set: the functions then answer 503
 * not_configured, which is how the release ships dormant. A sandbox API URL
 * with GROW_ENV=production (or the reverse) also counts as not configured, so
 * a half-switched environment can never charge real cards against sandbox
 * records or the reverse.
 */
export function growConfig(env: Env): GrowConfig | null {
  const apiUrl = trimmed(env.GROW_API_URL);
  const userId = trimmed(env.GROW_USER_ID);
  const pageCodeOneTime = trimmed(env.GROW_PAGE_CODE_ONE_TIME);
  const pageCodeRecurring = trimmed(env.GROW_PAGE_CODE_RECURRING);
  const renewalWebhookKey = trimmed(env.GROW_RENEWAL_WEBHOOK_KEY);
  if (!apiUrl || !userId || !pageCodeOneTime || !pageCodeRecurring || !renewalWebhookKey) return null;
  const environment: GrowEnvironment = env.GROW_ENV === "production" ? "production" : "sandbox";
  if (apiUrl.includes("sandbox.") !== (environment === "sandbox")) return null;
  return {
    apiUrl: apiUrl.replace(/\/+$/, ""),
    userId,
    pageCodeOneTime,
    pageCodeRecurring,
    renewalWebhookKey,
    environment,
    annualAutoRenew: annualAutoRenew(env),
    monthlyMaxCharges: monthlyMaxCharges(env.GROW_MONTHLY_MAX_CHARGES),
    siteUrl: (trimmed(env.SITE_URL) ?? DEFAULT_SITE_URL).replace(/\/+$/, ""),
  };
}

export const pageCodeFor = (config: GrowConfig, plan: WebPlan): string =>
  PLAN_CONFIG[plan].recurring ? config.pageCodeRecurring : config.pageCodeOneTime;

// ---------------------------------------------------------------------------
// Values Grow accepts (D6)
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_ID_RE = /^[0-9a-f]{32}$/;

/** Our uuid as cField1: 32 hex characters, because "-" is a special character to Grow. */
export function toHexId(uuid: string): string {
  if (!UUID_RE.test(uuid)) throw new RangeError("Not a uuid");
  return uuid.replace(/-/g, "").toLowerCase();
}

export function fromHexId(hex: string | null | undefined): string | null {
  const h = hex?.trim().toLowerCase() ?? "";
  if (!HEX_ID_RE.test(h)) return null;
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Letters, digits and single spaces. Apostrophes and niqqud vanish; any other mark becomes a space. */
export function growSafeText(value: string): string {
  return value
    .normalize("NFC")
    .replace(/\p{M}/gu, "")
    .replace(/['"`׳״]/g, "")
    .replace(/[^\p{L}\p{N} ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Grow: pageField[fullName] "must consist of at least two names". */
export function isFullName(value: string): boolean {
  return growSafeText(value).split(" ").filter((word) => /\p{L}/u.test(word)).length >= 2;
}

export function toLocalMobile(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  const local = digits.startsWith("972") ? `0${digits.slice(3)}` : digits;
  return /^05\d{8}$/.test(local) ? local : null;
}

const GROW_SAFE_EMAIL_RE = /^[A-Za-z0-9._-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
export const isGrowSafeEmail = (email: string): boolean => GROW_SAFE_EMAIL_RE.test(email);

// ---------------------------------------------------------------------------
// createPaymentProcess
// ---------------------------------------------------------------------------

export type CreatePaymentInput = {
  plan: WebPlan;
  installments: number;
  saveCardToken: boolean;
  fullName: string;
  phone: string;
  email: string;
  webPaymentId: string;
  notifyUrl: string;
  config: GrowConfig;
};

type Field = readonly [string, string];

export function buildCreatePaymentForm(input: CreatePaymentInput): FormData {
  const plan = PLAN_CONFIG[input.plan];
  const { config } = input;
  if (!Number.isInteger(input.installments) || input.installments < 1 || input.installments > plan.maxInstallments) {
    throw new RangeError(`Invalid installments ${input.installments} for ${input.plan}`);
  }
  const fullName = growSafeText(input.fullName);
  if (!isFullName(fullName)) throw new RangeError("fullName needs at least two words");
  const phone = toLocalMobile(input.phone);
  if (!phone) throw new RangeError("phone must be an Israeli mobile");
  const hexId = toHexId(input.webPaymentId);

  const fields: Field[] = [
    ["userId", config.userId],
    ["pageCode", pageCodeFor(config, input.plan)],
    ["chargeType", "1"],
    ["sum", String(plan.sum)],
    ["description", plan.description],
    ["successUrl", `${config.siteUrl}/payment/success?wp=${hexId}`],
    ["cancelUrl", `${config.siteUrl}/payment?cancelled=1`],
    ["notifyUrl", input.notifyUrl],
    ["pageField[fullName]", fullName],
    ["pageField[phone]", phone],
    ["cField1", hexId],
    // Annual: the count the buyer chose on our page, fixed (paymentNum, not
    // maxPaymentNum). Monthly: the standing order's number of charges (D7).
    ["paymentNum", String(plan.recurring ? config.monthlyMaxCharges : input.installments)],
    ...(isGrowSafeEmail(input.email) ? [["pageField[email]", input.email] as Field] : []),
    ...(input.plan === "ANNUAL" && input.saveCardToken ? [["saveCardToken", "1"] as Field] : []),
  ];
  const form = new FormData();
  fields.forEach(([key, value]) => form.append(key, value));
  return form;
}

// ---------------------------------------------------------------------------
// Callbacks: the first-charge notify and the account-level renewal webhooks
// ---------------------------------------------------------------------------

function flatten(value: unknown, prefix: string): [string, string][] {
  if (value === null || value === undefined) return [];
  if (typeof value !== "object") return prefix ? [[prefix, String(value)]] : [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}[${key}]` : key)
  );
}

/**
 * Grow documents the notify as form fields "the same way as you send to
 * createPaymentProcess" (multipart), draws it as nested JSON, and sends the
 * renewal webhook as JSON. All three land as the same flat keys:
 * data[processId], data[customFields][cField1], webhookKey.
 */
export async function parseBody(contentType: string | null, raw: string): Promise<FlatBody> {
  const type = (contentType ?? "").toLowerCase();
  const start = raw.trimStart();
  try {
    if (type.includes("json") || start.startsWith("{") || start.startsWith("[")) {
      return Object.fromEntries(flatten(JSON.parse(raw), ""));
    }
    if (type.includes("multipart/form-data")) {
      const form = await new Response(raw, { headers: { "content-type": contentType ?? "" } }).formData();
      return Object.fromEntries([...form.entries()].map(([key, value]) => [key, typeof value === "string" ? value : ""]));
    }
    return Object.fromEntries(new URLSearchParams(raw));
  } catch {
    return {};
  }
}

const pick = (body: FlatBody, key: string): string | null => {
  const value = body[`data[${key}]`] ?? body[key];
  return value === undefined || value === "" ? null : value;
};

const pickCustom = (body: FlatBody, key: string): string | null =>
  body[`data[customFields][${key}]`] ?? body[`customFields[${key}]`] ?? body[key] ?? null;

const amount = (value: string | null): number => (value === null ? Number.NaN : Number(value));

export type GrowCallbackKind = "first" | "renewal" | "renewal_failed";

export function classifyCallback(body: FlatBody): GrowCallbackKind | null {
  if (pick(body, "webhookKey") && pick(body, "directDebitId")) return "renewal";
  if (pick(body, "webhook_key") && pick(body, "regular_payment_id")) return "renewal_failed";
  if (pick(body, "processId")) return "first";
  return null;
}

/** Grow's paymentDate is d/m/yy (sometimes dd/mm/yyyy). */
export function parseGrowDate(value: string | null): string | null {
  const m = value?.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export type GrowFirstNotify = {
  webPaymentId: string;
  processId: string;
  processToken: string;
  transactionId: string;
  transactionToken: string;
  statusCode: string;
  sum: number;
  /** allPaymentsNum: the total. paymentsNum is the CURRENT payment number ("0" for a single payment). */
  installments: number;
  asmachta: string | null;
  cardSuffix: string | null;
  cardBrand: string | null;
  cardToken: string | null;
  directDebitId: string | null;
  /** paymentDate as YYYY-MM-DD, when Grow sent one we can read. */
  paidOn: string | null;
  raw: FlatBody;
};

export function parseFirstNotify(body: FlatBody): GrowFirstNotify | null {
  const webPaymentId = fromHexId(pickCustom(body, "cField1"));
  const processId = pick(body, "processId");
  const processToken = pick(body, "processToken");
  const transactionId = pick(body, "transactionId");
  const transactionToken = pick(body, "transactionToken");
  const sum = amount(pick(body, "sum"));
  if (!webPaymentId || !processId || !processToken || !transactionId || !transactionToken || !Number.isFinite(sum)) {
    return null;
  }
  const total = Number(pick(body, "allPaymentsNum") ?? pick(body, "paymentsNum") ?? 1);
  return {
    webPaymentId,
    processId,
    processToken,
    transactionId,
    transactionToken,
    sum,
    statusCode: pick(body, "statusCode") ?? "",
    installments: Number.isInteger(total) && total >= 1 ? total : 1,
    asmachta: pick(body, "asmachta"),
    cardSuffix: pick(body, "cardSuffix"),
    cardBrand: pick(body, "cardBrand"),
    cardToken: pick(body, "cardToken"),
    directDebitId: pick(body, "directDebitId"),
    paidOn: parseGrowDate(pick(body, "paymentDate")),
    raw: body,
  };
}

export type GrowRenewal = {
  webhookKey: string;
  /** transactionCode in the webhook. */
  transactionId: string;
  directDebitId: string;
  sum: number;
  asmachta: string | null;
  cardSuffix: string | null;
  cardBrand: string | null;
  paidOn: string | null;
  raw: FlatBody;
};

export function parseRenewal(body: FlatBody): GrowRenewal | null {
  const webhookKey = pick(body, "webhookKey");
  const transactionId = pick(body, "transactionCode");
  const directDebitId = pick(body, "directDebitId");
  const sum = amount(pick(body, "paymentSum"));
  if (!webhookKey || !transactionId || !directDebitId || !Number.isFinite(sum) || sum <= 0) return null;
  return {
    webhookKey,
    transactionId,
    directDebitId,
    sum,
    asmachta: pick(body, "asmachta"),
    cardSuffix: pick(body, "cardSuffix"),
    cardBrand: pick(body, "cardBrand"),
    paidOn: parseGrowDate(pick(body, "paymentDate")),
    raw: body,
  };
}

export type GrowRenewalFailure = { webhookKey: string; directDebitId: string; error: string | null; attempts: number };

export function parseRenewalFailure(body: FlatBody): GrowRenewalFailure | null {
  const webhookKey = pick(body, "webhook_key");
  const directDebitId = pick(body, "regular_payment_id");
  if (!webhookKey || !directDebitId) return null;
  return {
    webhookKey,
    directDebitId,
    error: pick(body, "error_message"),
    attempts: Number(pick(body, "charges_attempts") ?? 0) || 0,
  };
}

// ---------------------------------------------------------------------------
// Periods, comparisons, follow-up calls
// ---------------------------------------------------------------------------

/** One period from the later of now and the current expiry; the 31st clamps to the month's last day. */
export function nextExpiry(plan: WebPlan, now: Date, currentExpiry: Date | null): Date {
  const from = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const day = from.getUTCDate();
  const target = new Date(from);
  target.setUTCDate(1);
  target.setUTCMonth(target.getUTCMonth() + PLAN_CONFIG[plan].months);
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

/**
 * The first charge's period end. Monthly gets two grace days, so a standing
 * order that runs later in the day (or on one of Grow's retries) never cuts
 * access before its webhook lands. Renewals extend from this end, so the grace
 * never compounds.
 */
export function firstPeriodEnd(plan: WebPlan, now: Date): Date {
  const end = nextExpiry(plan, now, null);
  return PLAN_CONFIG[plan].recurring ? new Date(end.getTime() + MONTHLY_GRACE_DAYS * DAY_MS) : end;
}

export const sameAmount = (a: number, b: number): boolean =>
  Number.isFinite(a) && Number.isFinite(b) && Math.round(a * 100) === Math.round(b * 100);

/** Constant-time comparison for processToken and webhookKey. */
export function safeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  const length = Math.max(x.length, y.length);
  let diff = x.length ^ y.length;
  for (let i = 0; i < length; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

const GROW_HOST_RE = /^(?:[a-z0-9-]+\.)*meshulam\.co\.il$/;

/** The hosted page the browser is sent to must be Grow's, over https. */
export function isGrowHostedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && GROW_HOST_RE.test(url.hostname);
  } catch {
    return false;
  }
}

/** approveTransaction marks every one of these "required"; missing ones are sent empty. */
export const APPROVE_FIELDS = [
  "transactionId", "transactionToken", "transactionTypeId", "paymentType", "sum", "firstPaymentSum",
  "periodicalPaymentSum", "paymentsNum", "allPaymentsNum", "paymentDate", "asmachta", "description",
  "fullName", "payerPhone", "payerEmail", "cardSuffix", "cardType", "cardTypeCode", "cardBrand",
  "cardBrandCode", "cardExp", "processId", "processToken",
] as const;

export function buildApproveForm(raw: FlatBody, pageCode: string): FormData {
  const form = new FormData();
  form.append("pageCode", pageCode);
  APPROVE_FIELDS.forEach((key) => form.append(key, pick(raw, key) ?? ""));
  return form;
}

/** updateDirectDebit with changeStatus=2 cancels the standing order (D9). */
export function buildCancelDirectDebitForm(
  config: GrowConfig,
  charge: { transactionId: string; transactionToken: string; asmachta: string },
): FormData {
  const form = new FormData();
  const fields: Field[] = [
    ["userId", config.userId],
    ["transactionId", charge.transactionId],
    ["transactionToken", charge.transactionToken],
    ["asmachta", charge.asmachta],
    ["changeStatus", "2"],
  ];
  fields.forEach(([key, value]) => form.append(key, value));
  return form;
}

export type TransactionCheck =
  | { ok: true; statusCode: string; sum: number }
  | { ok: false; transient: boolean; error: string };

/** getTransactionInfo's data: assumed { statusCode, sum } or a list of them (verified in Task 9). */
export function readTransactionInfo(data: unknown): { statusCode: string; sum: number } | null {
  const first = Array.isArray(data) ? data[0] : data;
  if (!first || typeof first !== "object") return null;
  const record = first as Record<string, unknown>;
  const sum = Number(record.sum);
  if (record.statusCode === undefined || record.statusCode === null || !Number.isFinite(sum)) return null;
  return { statusCode: String(record.statusCode), sum };
}
```

`_shared/growClient.ts`:

```ts
// Grow Light API over HTTP: multipart FormData in, {status, err, data} out.
// Server-side only (Grow blocks browser calls). Never log request bodies:
// they carry tokens and the buyer's name and phone.

import {
  buildApproveForm,
  buildCancelDirectDebitForm,
  readTransactionInfo,
  type FlatBody,
  type GrowConfig,
  type TransactionCheck,
} from "./grow.ts";

const TIMEOUT_MS = 15_000;

export type GrowCall = { ok: true; data: unknown } | { ok: false; transient: boolean; error: string };

export function interpretGrowResponse(httpStatus: number, text: string): GrowCall {
  if (httpStatus >= 500 || httpStatus === 429) return { ok: false, transient: true, error: `HTTP ${httpStatus}` };
  let body: { status?: unknown; err?: unknown; data?: unknown } | null;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, transient: false, error: `HTTP ${httpStatus}: not JSON` };
  }
  if (String(body?.status) === "1") return { ok: true, data: body?.data ?? null };
  const err = body?.err;
  const message = err && typeof err === "object"
    ? [(err as { id?: unknown }).id, (err as { message?: unknown }).message]
      .filter((part) => part !== undefined && part !== "")
      .join(" ")
    : String(err ?? "");
  return { ok: false, transient: false, error: message || `HTTP ${httpStatus}: status ${String(body?.status)}` };
}

async function post(config: GrowConfig, method: string, form: FormData): Promise<GrowCall> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${config.apiUrl}/${method}`, { method: "POST", body: form, signal: controller.signal });
    return interpretGrowResponse(res.status, await res.text());
  } catch (error) {
    return { ok: false, transient: true, error: error instanceof Error ? error.message : "fetch failed" };
  } finally {
    clearTimeout(timer);
  }
}

export type CreatedProcess =
  | { ok: true; processId: string; processToken: string; url: string }
  | { ok: false; error: string };

export async function createPaymentProcess(config: GrowConfig, form: FormData): Promise<CreatedProcess> {
  const res = await post(config, "createPaymentProcess", form);
  if (!res.ok) return { ok: false, error: res.error };
  const data = (res.data ?? {}) as { processId?: unknown; processToken?: unknown; url?: unknown };
  if (data.processId === undefined || typeof data.processToken !== "string" || typeof data.url !== "string") {
    return { ok: false, error: "createPaymentProcess response had no processId, processToken or url" };
  }
  return { ok: true, processId: String(data.processId), processToken: data.processToken, url: data.url };
}

export async function getTransactionInfo(
  config: GrowConfig,
  pageCode: string,
  transactionId: string,
  transactionToken: string,
): Promise<TransactionCheck> {
  const form = new FormData();
  form.append("pageCode", pageCode);
  form.append("transactionId", transactionId);
  form.append("transactionToken", transactionToken);
  const res = await post(config, "getTransactionInfo", form);
  if (!res.ok) return res;
  const info = readTransactionInfo(res.data);
  return info ? { ok: true, ...info } : { ok: false, transient: false, error: "getTransactionInfo had no statusCode or sum" };
}

/** Grow processes the charge either way; approving stops its notify retries. */
export async function approveTransaction(config: GrowConfig, pageCode: string, raw: FlatBody): Promise<boolean> {
  return (await post(config, "approveTransaction", buildApproveForm(raw, pageCode))).ok;
}

export function cancelDirectDebit(
  config: GrowConfig,
  charge: { transactionId: string; transactionToken: string; asmachta: string },
): Promise<GrowCall> {
  return post(config, "updateDirectDebit", buildCancelDirectDebitForm(config, charge));
}
```

`_shared/subscriptionUpsert.ts` (full file; `upsertSubscription` behaviour is unchanged for apple/google):

```ts
// Single writer for the `subscriptions` table. The record-purchase functions
// (client-initiated), the store webhooks (server-initiated) and growWebhook
// (web purchases) all funnel through here so the row shape and idempotency
// stay consistent.
//
// Idempotency key: (store_platform, store_transaction_id): Apple
// originalTransactionId / Google purchaseToken / the first web_payments id
// for Grow. Backed by the partial unique index uq_subscriptions_store_txn. We
// do select-then-update/insert (rather than PostgREST upsert) to avoid ON
// CONFLICT ambiguity with the partial index, and to resolve the user_id on
// first insert only.

import { createServiceClient } from './supabaseClient.ts'
import type { PlanType } from './iapProducts.ts'

export type StorePlatform = 'apple' | 'google' | 'grow'
export type StoreEnvironment = 'sandbox' | 'production'

export interface NormalizedSubscription {
  platform: StorePlatform
  storeTransactionId: string
  productId: string
  planType: PlanType
  /** Absolute period end from the store. */
  expiresAt: Date
  isActive: boolean
  autoRenew: boolean
  environment: StoreEnvironment
  /** Trial window, when the purchase is in/through its intro free-trial. */
  trialStartedAt?: Date | null
  trialEndsAt?: Date | null
  /** Cancellation/expiry signal from webhooks. */
  cancelledAt?: Date | null
  /** Raw store token/receipt for audit (purchaseToken / signed transaction). Unused for grow. */
  rawReceipt?: string | null
  /** Web (grow) purchases: the price charged. Omit to leave price_nis untouched. */
  priceNis?: number | null
}

export interface UpsertResult {
  id: string
  inserted: boolean
}

const RECEIPT_COLUMN: Partial<Record<StorePlatform, string>> = {
  apple: 'apple_receipt',
  google: 'google_receipt',
}

/** The columns every writer sets. Pure, so the per-platform differences are unit-tested. */
export function buildSubscriptionRow(sub: NormalizedSubscription, nowIso: string): Record<string, unknown> {
  const receiptColumn = RECEIPT_COLUMN[sub.platform]
  return {
    plan_type: sub.planType,
    expires_at: sub.expiresAt.toISOString(),
    is_active: sub.isActive,
    auto_renew: sub.autoRenew,
    cancelled_at: sub.cancelledAt ? sub.cancelledAt.toISOString() : null,
    store_platform: sub.platform,
    store_product_id: sub.productId,
    store_transaction_id: sub.storeTransactionId,
    store_environment: sub.environment,
    trial_started_at: sub.trialStartedAt ? sub.trialStartedAt.toISOString() : null,
    trial_ends_at: sub.trialEndsAt ? sub.trialEndsAt.toISOString() : null,
    ...(receiptColumn ? { [receiptColumn]: sub.rawReceipt ?? null } : {}),
    // Web purchases are never manual and never use the daily cron's recurring
    // income: each Grow charge books its own subscription_income row and
    // extends expires_at itself (growWebhook). Store rows keep the defaults.
    ...(sub.platform === 'grow' ? { is_manual: false, recurring_income: false } : {}),
    ...(sub.priceNis !== undefined ? { price_nis: sub.priceNis } : {}),
    updated_at: nowIso,
  }
}

/**
 * Write a validated subscription state for `userId` (required only when the
 * row may not exist yet, i.e. the first record call). Webhooks pass
 * userId=null and rely on the existing row found by the idempotency key.
 */
export async function upsertSubscription(
  sub: NormalizedSubscription,
  userId: string | null,
): Promise<UpsertResult> {
  const supabase = createServiceClient()

  const { data: existing, error: findErr } = await supabase
    .from('subscriptions')
    .select('id, user_id')
    .eq('store_platform', sub.platform)
    .eq('store_transaction_id', sub.storeTransactionId)
    .maybeSingle()

  if (findErr) {
    throw new Error(`subscriptions lookup failed: ${findErr.message}`)
  }

  const nowIso = new Date().toISOString()
  const row = buildSubscriptionRow(sub, nowIso)

  if (existing) {
    const { error: updErr } = await supabase
      .from('subscriptions')
      .update(row)
      .eq('id', existing.id)
    if (updErr) throw new Error(`subscriptions update failed: ${updErr.message}`)
    return { id: existing.id, inserted: false }
  }

  if (!userId) {
    // Webhook for a transaction we never recorded: nothing to attach it to.
    throw new Error(`No existing subscription for ${sub.platform}:${sub.storeTransactionId} and no userId to create one`)
  }

  const { data: created, error: insErr } = await supabase
    .from('subscriptions')
    .insert({ ...row, user_id: userId, started_at: nowIso })
    .select('id')
    .single()
  if (insErr) throw new Error(`subscriptions insert failed: ${insErr.message}`)
  return { id: created.id, inserted: true }
}

/** Web cancellation: stop renewing, keep access until expires_at (the store behaviour). */
export async function markSubscriptionCancelled(id: string, at: Date): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('subscriptions')
    .update({ auto_renew: false, cancelled_at: at.toISOString(), updated_at: at.toISOString() })
    .eq('id', id)
  if (error) throw new Error(`subscriptions cancel failed: ${error.message}`)
}
```

- [ ] **Step 4: Run, expect PASS**, then the whole shared suite and a type check of the existing callers:

```bash
cd /Users/itayostraich/Documents/GitHub/FitnessForSeniorsApp/shared/supabase/functions
~/.deno/bin/deno test --no-lock _shared/
~/.deno/bin/deno check --no-lock recordApplePurchase/index.ts recordGooglePurchase/index.ts appleStoreNotifications/index.ts googleStoreNotifications/index.ts
```

- [ ] **Step 5: Commit**

```bash
git add shared/supabase/functions/_shared/grow.ts shared/supabase/functions/_shared/grow.test.ts shared/supabase/functions/_shared/growClient.ts shared/supabase/functions/_shared/growClient.test.ts shared/supabase/functions/_shared/subscriptionUpsert.ts shared/supabase/functions/_shared/subscriptionUpsert.test.ts
git commit -m "feat(functions): grow form, callback parsing and expiry math"
```

---

### Task 3: `growWebhook` edge function (FitnessForSeniorsApp)

**Files:**
- Create: `shared/supabase/functions/growWebhook/handle.ts`, `shared/supabase/functions/growWebhook/handle.test.ts`, `shared/supabase/functions/growWebhook/db.ts`, `shared/supabase/functions/growWebhook/index.ts`
- Modify: `shared/supabase/config.toml` (add `[functions.growWebhook] verify_jwt = false` under the store webhooks)

**Interfaces:**
- Consumes: everything Task 2 produced from `_shared/grow.ts` and `_shared/growClient.ts`; `NormalizedSubscription`, `upsertSubscription` (`_shared/subscriptionUpsert.ts`); `israelDateString` (`_shared/israelDate.ts`); `createServiceClient`; Task 1 columns.
- Produces (`growWebhook/handle.ts`):
  - `type PaymentStatus = "created" | "processing" | "paid" | "failed"`; `type InvoiceStatus = "pending" | "issued" | "failed" | "dry_run"`
  - `type WebPaymentRow = { id: string; userId: string; kind: "first" | "renewal"; parentId: string | null; plan: WebPlan; amount: number; installments: number; status: PaymentStatus; tokenConsent: boolean; fullName: string; phone: string; email: string; growProcessId: string | null; growProcessToken: string | null; growTransactionId: string | null; growDirectDebitId: string | null; periodEnd: string | null; subscriptionId: string | null; approvedAt: string | null; invoiceStatus: InvoiceStatus }`
  - `type SubscriptionRow = { id: string; userId: string; expiresAt: string; autoRenew: boolean; cancelledAt: string | null }`
  - `type ChargeFields = { transactionId: string; transactionToken: string | null; asmachta: string | null; cardSuffix: string | null; cardBrand: string | null; cardToken: string | null; directDebitId: string | null; periodEnd: string; raw: FlatBody }`; `type NewRenewal = ChargeFields & { amount: number; environment: GrowEnvironment }`
  - `type IncomeInput = { webPaymentId: string; subscriptionId: string; userId: string; amount: number; incomeDate: string }`
  - `interface Db { getPayment; getPaymentByTransaction; getFirstChargeByDirectDebit; claimFirstCharge; insertRenewal; markFailed; markPaid; setApproved; getSubscription; upsertSubscription; recordIncome }` (exact signatures in the code below)
  - `type WebhookDeps = { db: Db; config: GrowConfig; now: () => Date; confirm: (n: GrowFirstNotify, pageCode: string) => Promise<TransactionCheck>; approve: (n: GrowFirstNotify, pageCode: string) => Promise<boolean> }`
  - `type WebhookResult = "recorded" | "duplicate" | "failed" | "failed_renewal" | "unverified" | "retry"`
  - `handleFirstCharge(deps: WebhookDeps, n: GrowFirstNotify): Promise<WebhookResult>`; `handleRenewal(deps: WebhookDeps, r: GrowRenewal): Promise<WebhookResult>`; `handleRenewalFailure(deps: WebhookDeps, f: GrowRenewalFailure): Promise<WebhookResult>`
- Produces (`growWebhook/db.ts`): `createDb(supabase: ReturnType<typeof createServiceClient>): Db`
- Produces (HTTP): `POST /functions/v1/growWebhook` -> 200 `{result}` for recorded / duplicate / failed / failed_renewal; 401 unverified; 503 retry or `{code:"not_configured"}`; 400 `{code:"malformed"}`; 500 on an unexpected error (Grow retries).

Order of writes for every charge: claim the row with its fixed `period_end` -> upsert the subscription (key: the first charge's `web_payments.id`) -> book `subscription_income` (unique per charge) -> mark paid. Every step is idempotent, so a redelivery of a half-finished charge resumes it with the same period end, and a redelivery of a finished one is a duplicate.

- [ ] **Step 1: Failing tests** `growWebhook/handle.test.ts`:

```ts
import { assertEquals } from "std/assert/mod.ts";
import { growConfig, type GrowFirstNotify, type GrowRenewal, type TransactionCheck } from "../_shared/grow.ts";
import type { NormalizedSubscription } from "../_shared/subscriptionUpsert.ts";
import {
  handleFirstCharge, handleRenewal, handleRenewalFailure,
  type ChargeFields, type Db, type IncomeInput, type SubscriptionRow, type WebhookDeps, type WebPaymentRow,
} from "./handle.ts";

const ENV = {
  GROW_API_URL: "https://sandbox.meshulam.co.il/api/light/server/1.0",
  GROW_USER_ID: "u", GROW_PAGE_CODE_ONE_TIME: "one", GROW_PAGE_CODE_RECURRING: "rec", GROW_RENEWAL_WEBHOOK_KEY: "hook-key",
};
const config = growConfig(ENV)!;
const NOW = new Date("2026-10-05T10:00:00Z");
const WP = "11111111-1111-4111-8111-111111111111";
const OTHER = "33333333-3333-4333-8333-333333333333";
const USER = "22222222-2222-4222-8222-222222222222";

function firstRow(overrides: Partial<WebPaymentRow> = {}): WebPaymentRow {
  return {
    id: WP, userId: USER, kind: "first", parentId: null, plan: "ANNUAL", amount: 708, installments: 6,
    status: "created", tokenConsent: true, fullName: "רחל כהן", phone: "0501234567", email: "r@example.com",
    growProcessId: "p1", growProcessToken: "ptok", growTransactionId: null, growDirectDebitId: null,
    periodEnd: null, subscriptionId: null, approvedAt: null, invoiceStatus: "pending", ...overrides,
  };
}

function notify(overrides: Partial<GrowFirstNotify> = {}): GrowFirstNotify {
  return {
    webPaymentId: WP, processId: "p1", processToken: "ptok", transactionId: "t1", transactionToken: "ttok",
    statusCode: "2", sum: 708, installments: 6, asmachta: "a1", cardSuffix: "4242", cardBrand: "Visa",
    cardToken: "card-tok", directDebitId: null, paidOn: "2026-10-05", raw: {}, ...overrides,
  };
}

function renewal(overrides: Partial<GrowRenewal> = {}): GrowRenewal {
  return {
    webhookKey: "hook-key", transactionId: "t2", directDebitId: "dd1", sum: 99, asmachta: "a2",
    cardSuffix: "4242", cardBrand: "Visa", paidOn: "2026-11-05", raw: {}, ...overrides,
  };
}

type Memory = {
  payments: Map<string, WebPaymentRow>;
  charges: Map<string, ChargeFields>;
  subscriptions: Map<string, SubscriptionRow>;
  subscriptionKeys: Map<string, string>;
  upserts: NormalizedSubscription[];
  income: IncomeInput[];
};

type SeedSubscription = SubscriptionRow & { storeKey: string };

function memoryDb(seed: { payments?: WebPaymentRow[]; subscriptions?: SeedSubscription[] } = {}): { db: Db; mem: Memory } {
  const mem: Memory = {
    payments: new Map((seed.payments ?? []).map((p) => [p.id, p])),
    charges: new Map(),
    subscriptions: new Map((seed.subscriptions ?? []).map(({ storeKey: _key, ...s }) => [s.id, s])),
    subscriptionKeys: new Map((seed.subscriptions ?? []).map((s) => [s.storeKey, s.id])),
    upserts: [],
    income: [],
  };
  const patch = (id: string, change: Partial<WebPaymentRow>) => {
    const row = mem.payments.get(id);
    if (row) mem.payments.set(id, { ...row, ...change });
  };
  const all = () => [...mem.payments.values()];
  const db: Db = {
    getPayment: async (id) => mem.payments.get(id) ?? null,
    getPaymentByTransaction: async (t) => all().find((p) => p.growTransactionId === t) ?? null,
    getFirstChargeByDirectDebit: async (d) => all().find((p) => p.kind === "first" && p.growDirectDebitId === d) ?? null,
    claimFirstCharge: async (id, f) => {
      const row = mem.payments.get(id);
      if (!row || (row.status !== "created" && row.status !== "failed")) return false;
      mem.charges.set(id, f);
      patch(id, { status: "processing", growTransactionId: f.transactionId, growDirectDebitId: f.directDebitId, periodEnd: f.periodEnd });
      return true;
    },
    insertRenewal: async (parent, f) => {
      if (all().some((p) => p.growTransactionId === f.transactionId)) return null;
      const row: WebPaymentRow = {
        ...parent, id: `renewal-${f.transactionId}`, kind: "renewal", parentId: parent.id, amount: f.amount,
        installments: 1, status: "processing", tokenConsent: false, growProcessId: null, growProcessToken: null,
        growTransactionId: f.transactionId, growDirectDebitId: null, periodEnd: f.periodEnd, subscriptionId: null,
        approvedAt: null, invoiceStatus: "pending",
      };
      mem.payments.set(row.id, row);
      mem.charges.set(row.id, f);
      return row;
    },
    markFailed: async (id) => patch(id, { status: "failed" }),
    markPaid: async (id, subscriptionId) => patch(id, { status: "paid", subscriptionId }),
    setApproved: async (id, at) => patch(id, { approvedAt: at.toISOString() }),
    getSubscription: async (id) => mem.subscriptions.get(id) ?? null,
    upsertSubscription: async (sub, userId) => {
      mem.upserts.push(sub);
      const id = mem.subscriptionKeys.get(sub.storeTransactionId) ?? `sub-${mem.subscriptionKeys.size + 1}`;
      mem.subscriptionKeys.set(sub.storeTransactionId, id);
      mem.subscriptions.set(id, {
        id, userId, expiresAt: sub.expiresAt.toISOString(), autoRenew: sub.autoRenew,
        cancelledAt: sub.cancelledAt ? sub.cancelledAt.toISOString() : null,
      });
      return { id };
    },
    recordIncome: async (input) => {
      if (!mem.income.some((i) => i.webPaymentId === input.webPaymentId)) mem.income.push(input);
    },
  };
  return { db, mem };
}

type Calls = { confirm: number; approve: number };

function deps(db: Db, overrides: Partial<WebhookDeps> = {}, now = NOW): { deps: WebhookDeps; calls: Calls } {
  const calls: Calls = { confirm: 0, approve: 0 };
  return {
    calls,
    deps: {
      db, config, now: () => now,
      confirm: async (n): Promise<TransactionCheck> => {
        calls.confirm += 1;
        return { ok: true, statusCode: "2", sum: n.sum };
      },
      approve: async () => {
        calls.approve += 1;
        return true;
      },
      ...overrides,
    },
  };
}

// ---- first charge ----------------------------------------------------------

Deno.test("annual first charge: verified, recorded once, 12 months, token kept with consent, approved", async () => {
  const { db, mem } = memoryDb({ payments: [firstRow()] });
  const { deps: d, calls } = deps(db);
  assertEquals(await handleFirstCharge(d, notify()), "recorded");
  const row = mem.payments.get(WP)!;
  assertEquals(row.status, "paid");
  assertEquals(row.subscriptionId, "sub-1");
  assertEquals(row.approvedAt, NOW.toISOString());
  assertEquals(mem.charges.get(WP)?.cardToken, "card-tok");
  assertEquals(mem.upserts.length, 1);
  const sub = mem.upserts[0];
  assertEquals(
    { platform: sub.platform, key: sub.storeTransactionId, product: sub.productId, plan: sub.planType, active: sub.isActive, autoRenew: sub.autoRenew, env: sub.environment, price: sub.priceNis, expires: sub.expiresAt.toISOString() },
    { platform: "grow", key: WP, product: "grow_annual", plan: "ANNUAL", active: true, autoRenew: false, env: "sandbox", price: 708, expires: "2027-10-05T10:00:00.000Z" },
  );
  assertEquals(mem.income, [{ webPaymentId: WP, subscriptionId: "sub-1", userId: USER, amount: 708, incomeDate: "2026-10-05" }]);
  assertEquals(calls, { confirm: 1, approve: 1 });
});

Deno.test("consent unticked: no card token stored, whatever Grow sends", async () => {
  const { db, mem } = memoryDb({ payments: [firstRow({ tokenConsent: false })] });
  assertEquals(await handleFirstCharge(deps(db).deps, notify()), "recorded");
  assertEquals(mem.charges.get(WP)?.cardToken, null);
});

Deno.test("the same notify again is a duplicate: no second write, income or approve", async () => {
  const { db, mem } = memoryDb({ payments: [firstRow()] });
  const { deps: d, calls } = deps(db);
  await handleFirstCharge(d, notify());
  assertEquals(await handleFirstCharge(d, notify()), "duplicate");
  assertEquals(mem.upserts.length, 1);
  assertEquals(mem.income.length, 1);
  assertEquals(calls, { confirm: 1, approve: 1 });
});

Deno.test("a duplicate re-approves only when the first approve failed", async () => {
  const { db, mem } = memoryDb({ payments: [firstRow()] });
  let approvals = 0;
  const { deps: d } = deps(db, { approve: async () => (approvals += 1) > 1 });
  assertEquals(await handleFirstCharge(d, notify()), "recorded");
  assertEquals(mem.payments.get(WP)?.approvedAt, null);
  assertEquals(await handleFirstCharge(d, notify()), "duplicate");
  assertEquals(mem.payments.get(WP)?.approvedAt, NOW.toISOString());
  assertEquals(await handleFirstCharge(d, notify()), "duplicate");
  assertEquals(approvals, 2);
  assertEquals(mem.upserts.length, 1);
});

Deno.test("forged notifies are unverified and write nothing", async () => {
  for (const forged of [notify({ processToken: "guess" }), notify({ processId: "p9" }), notify({ webPaymentId: OTHER })]) {
    const { db, mem } = memoryDb({ payments: [firstRow()] });
    const { deps: d, calls } = deps(db);
    assertEquals(await handleFirstCharge(d, forged), "unverified");
    assertEquals(mem.payments.get(WP)?.status, "created");
    assertEquals(mem.upserts.length, 0);
    assertEquals(calls, { confirm: 0, approve: 0 });
  }
});

Deno.test("a sum other than what we asked is unverified, and Grow is never asked", async () => {
  const { db, mem } = memoryDb({ payments: [firstRow()] });
  const { deps: d, calls } = deps(db);
  assertEquals(await handleFirstCharge(d, notify({ sum: 1 })), "unverified");
  assertEquals(mem.upserts.length, 0);
  assertEquals(calls.confirm, 0);
});

Deno.test("Grow's confirmation decides: unreachable -> retry, not paid or another sum -> unverified", async () => {
  const cases: [TransactionCheck, string][] = [
    [{ ok: false, transient: true, error: "timeout" }, "retry"],
    [{ ok: false, transient: false, error: "617" }, "unverified"],
    [{ ok: true, statusCode: "11", sum: 708 }, "unverified"],
    [{ ok: true, statusCode: "2", sum: 1 }, "unverified"],
  ];
  for (const [check, expected] of cases) {
    const { db, mem } = memoryDb({ payments: [firstRow()] });
    const { deps: d } = deps(db, { confirm: async () => check });
    assertEquals(await handleFirstCharge(d, notify()), expected);
    assertEquals(mem.payments.get(WP)?.status, "created");
    assertEquals(mem.upserts.length, 0);
  }
});

Deno.test("a declined charge marks the row failed and touches nothing else", async () => {
  const { db, mem } = memoryDb({ payments: [firstRow()] });
  const { deps: d, calls } = deps(db);
  assertEquals(await handleFirstCharge(d, notify({ statusCode: "3" })), "failed");
  assertEquals(mem.payments.get(WP)?.status, "failed");
  assertEquals(mem.upserts.length, 0);
  assertEquals(calls, { confirm: 0, approve: 0 });
});

Deno.test("a success after a declined attempt on the same page is recorded", async () => {
  const { db, mem } = memoryDb({ payments: [firstRow({ status: "failed" })] });
  assertEquals(await handleFirstCharge(deps(db).deps, notify()), "recorded");
  assertEquals(mem.payments.get(WP)?.status, "paid");
});

Deno.test("monthly first charge: standing order kept, auto-renew on, a month plus two grace days", async () => {
  const { db, mem } = memoryDb({ payments: [firstRow({ plan: "MONTHLY", amount: 99, installments: 1, tokenConsent: false })] });
  assertEquals(await handleFirstCharge(deps(db).deps, notify({ sum: 99, installments: 120, directDebitId: "dd1" })), "recorded");
  assertEquals(mem.payments.get(WP)?.growDirectDebitId, "dd1");
  assertEquals(mem.charges.get(WP)?.cardToken, null);
  const sub = mem.upserts[0];
  assertEquals([sub.planType, sub.productId, sub.autoRenew, sub.priceNis, sub.expiresAt.toISOString()], ["MONTHLY", "grow_monthly", true, 99, "2026-11-07T10:00:00.000Z"]);
});

Deno.test("annual auto-renew follows GROW_ANNUAL_AUTO_RENEW", async () => {
  const { db, mem } = memoryDb({ payments: [firstRow()] });
  const on = growConfig({ ...ENV, GROW_ANNUAL_AUTO_RENEW: "true" })!;
  await handleFirstCharge(deps(db, { config: on }).deps, notify());
  assertEquals(mem.upserts[0].autoRenew, true);
});

Deno.test("a delivery that finds the charge mid-processing finishes it with the stored period end", async () => {
  const stored = "2027-10-05T10:00:00.000Z";
  const { db, mem } = memoryDb({ payments: [firstRow({ status: "processing", growTransactionId: "t1", periodEnd: stored })] });
  const later = new Date("2026-10-05T10:30:00Z");
  assertEquals(await handleFirstCharge(deps(db, {}, later).deps, notify()), "recorded");
  assertEquals(mem.upserts[0].expiresAt.toISOString(), stored);
  assertEquals(mem.payments.get(WP)?.status, "paid");
});

// ---- renewals ----------------------------------------------------------------

const RENEW_NOW = new Date("2026-11-05T06:00:00Z");

function renewalSeed(subOverrides: Partial<SeedSubscription> = {}, parentOverrides: Partial<WebPaymentRow> = {}) {
  return memoryDb({
    payments: [firstRow({
      plan: "MONTHLY", amount: 99, installments: 1, tokenConsent: false, status: "paid",
      growTransactionId: "t1", growDirectDebitId: "dd1", subscriptionId: "sub-1",
      periodEnd: "2026-11-07T10:00:00.000Z", approvedAt: NOW.toISOString(), ...parentOverrides,
    })],
    subscriptions: [{ id: "sub-1", userId: USER, expiresAt: "2026-11-07T10:00:00.000Z", autoRenew: true, cancelledAt: null, storeKey: WP, ...subOverrides }],
  });
}

Deno.test("renewal: its own row, extended from the current expiry, income booked, never approved", async () => {
  const { db, mem } = renewalSeed();
  const { deps: d, calls } = deps(db, {}, RENEW_NOW);
  assertEquals(await handleRenewal(d, renewal()), "recorded");
  const row = mem.payments.get("renewal-t2")!;
  assertEquals([row.kind, row.parentId, row.status, row.amount, row.subscriptionId], ["renewal", WP, "paid", 99, "sub-1"]);
  assertEquals(mem.upserts[0].storeTransactionId, WP);
  assertEquals(mem.upserts[0].expiresAt.toISOString(), "2026-12-07T10:00:00.000Z");
  assertEquals(mem.income, [{ webPaymentId: "renewal-t2", subscriptionId: "sub-1", userId: USER, amount: 99, incomeDate: "2026-11-05" }]);
  assertEquals(calls, { confirm: 0, approve: 0 });
});

Deno.test("renewal after a lapse extends from now", async () => {
  const { db, mem } = renewalSeed({ expiresAt: "2026-11-01T10:00:00.000Z" });
  await handleRenewal(deps(db, {}, RENEW_NOW).deps, renewal());
  assertEquals(mem.upserts[0].expiresAt.toISOString(), "2026-12-05T06:00:00.000Z");
});

Deno.test("renewal redelivered: duplicate, no second extension", async () => {
  const { db, mem } = renewalSeed();
  const { deps: d } = deps(db, {}, RENEW_NOW);
  await handleRenewal(d, renewal());
  assertEquals(await handleRenewal(d, renewal()), "duplicate");
  assertEquals(mem.upserts.length, 1);
  assertEquals(mem.income.length, 1);
});

Deno.test("renewal resumed mid-processing uses its stored period end", async () => {
  const { db, mem } = renewalSeed();
  await db.insertRenewal((await db.getPayment(WP))!, {
    amount: 99, environment: "sandbox", transactionId: "t2", transactionToken: null, asmachta: "a2", cardSuffix: "4242",
    cardBrand: "Visa", cardToken: null, directDebitId: null, periodEnd: "2026-12-07T10:00:00.000Z", raw: {},
  });
  assertEquals(await handleRenewal(deps(db, {}, new Date("2026-11-20T10:00:00Z")).deps, renewal()), "recorded");
  assertEquals(mem.upserts[0].expiresAt.toISOString(), "2026-12-07T10:00:00.000Z");
});

Deno.test("renewal verification: wrong key, unknown standing order, wrong sum -> unverified, nothing written", async () => {
  for (const forged of [renewal({ webhookKey: "guess" }), renewal({ directDebitId: "dd9" }), renewal({ sum: 708 })]) {
    const { db, mem } = renewalSeed();
    assertEquals(await handleRenewal(deps(db, {}, RENEW_NOW).deps, forged), "unverified");
    assertEquals(mem.payments.size, 1);
    assertEquals(mem.upserts.length, 0);
  }
});

Deno.test("a renewal carrying the first charge's transaction id is a duplicate", async () => {
  const { db, mem } = renewalSeed();
  assertEquals(await handleRenewal(deps(db, {}, RENEW_NOW).deps, renewal({ transactionId: "t1" })), "duplicate");
  assertEquals(mem.upserts.length, 0);
});

Deno.test("a renewal before the first charge finished is retried later", async () => {
  const { db } = renewalSeed({}, { status: "processing", subscriptionId: null });
  assertEquals(await handleRenewal(deps(db, {}, RENEW_NOW).deps, renewal()), "retry");
});

Deno.test("a cancelled standing order that still charges keeps auto-renew off and cancelled_at", async () => {
  const { db, mem } = renewalSeed({ autoRenew: false, cancelledAt: "2026-10-20T08:00:00.000Z" });
  await handleRenewal(deps(db, {}, RENEW_NOW).deps, renewal());
  assertEquals(mem.upserts[0].autoRenew, false);
  assertEquals(mem.upserts[0].cancelledAt?.toISOString(), "2026-10-20T08:00:00.000Z");
});

Deno.test("failed renewal webhook: recognised, nothing written; wrong key unverified", async () => {
  const { db, mem } = renewalSeed();
  const { deps: d } = deps(db, {}, RENEW_NOW);
  assertEquals(await handleRenewalFailure(d, { webhookKey: "hook-key", directDebitId: "dd1", error: "x", attempts: 1 }), "failed_renewal");
  assertEquals(await handleRenewalFailure(d, { webhookKey: "guess", directDebitId: "dd1", error: "x", attempts: 1 }), "unverified");
  assertEquals(await handleRenewalFailure(d, { webhookKey: "hook-key", directDebitId: "dd9", error: "x", attempts: 1 }), "unverified");
  assertEquals(mem.upserts.length, 0);
  assertEquals(mem.payments.size, 1);
});
```

- [ ] **Step 2: Run, expect FAIL:** `~/.deno/bin/deno test --no-lock growWebhook/handle.test.ts` (from `shared/supabase/functions`).

- [ ] **Step 3: Implement** `growWebhook/handle.ts`:

```ts
// growWebhook core: decides what a Grow callback means and writes it through
// a narrow Db, so every path is tested without Postgres or the network.
//
// Two shapes (D2). Grow signs neither (D3):
// - First charge (per-payment notify): trusted only when the stored processId
//   + processToken match AND Grow's own getTransactionInfo confirms status and
//   sum. Approved afterwards (D5).
// - Renewal (account-level webhook): trusted only when webhookKey matches, the
//   standing order is ours and the sum is the plan's. Never approved.
//
// Every charge: claim the row with a fixed period_end, upsert the
// subscription, book income, mark paid. Each step is idempotent, so a
// redelivery resumes a half-finished charge and never extends twice.

import {
  firstPeriodEnd,
  GROW_PRODUCT_ID,
  GROW_SUCCESS_STATUS,
  nextExpiry,
  pageCodeFor,
  safeEqual,
  sameAmount,
  type FlatBody,
  type GrowConfig,
  type GrowEnvironment,
  type GrowFirstNotify,
  type GrowRenewal,
  type GrowRenewalFailure,
  type TransactionCheck,
  type WebPlan,
} from "../_shared/grow.ts";
import { israelDateString } from "../_shared/israelDate.ts";
import type { NormalizedSubscription } from "../_shared/subscriptionUpsert.ts";

export type PaymentStatus = "created" | "processing" | "paid" | "failed";
export type InvoiceStatus = "pending" | "issued" | "failed" | "dry_run";

export type WebPaymentRow = {
  id: string;
  userId: string;
  kind: "first" | "renewal";
  parentId: string | null;
  plan: WebPlan;
  amount: number;
  installments: number;
  status: PaymentStatus;
  tokenConsent: boolean;
  fullName: string;
  phone: string;
  email: string;
  growProcessId: string | null;
  growProcessToken: string | null;
  growTransactionId: string | null;
  growDirectDebitId: string | null;
  periodEnd: string | null;
  subscriptionId: string | null;
  approvedAt: string | null;
  invoiceStatus: InvoiceStatus;
};

export type SubscriptionRow = { id: string; userId: string; expiresAt: string; autoRenew: boolean; cancelledAt: string | null };

export type ChargeFields = {
  transactionId: string;
  transactionToken: string | null;
  asmachta: string | null;
  cardSuffix: string | null;
  cardBrand: string | null;
  cardToken: string | null;
  directDebitId: string | null;
  periodEnd: string;
  raw: FlatBody;
};

export type NewRenewal = ChargeFields & { amount: number; environment: GrowEnvironment };

export type IncomeInput = { webPaymentId: string; subscriptionId: string; userId: string; amount: number; incomeDate: string };

export interface Db {
  getPayment(id: string): Promise<WebPaymentRow | null>;
  getPaymentByTransaction(transactionId: string): Promise<WebPaymentRow | null>;
  getFirstChargeByDirectDebit(directDebitId: string): Promise<WebPaymentRow | null>;
  /** 'created' or 'failed' -> 'processing' with the charge's fields. False when another delivery got there first. */
  claimFirstCharge(id: string, fields: ChargeFields): Promise<boolean>;
  /** A renewal row in 'processing'. Null when that transaction id already has a row. */
  insertRenewal(parent: WebPaymentRow, fields: NewRenewal): Promise<WebPaymentRow | null>;
  markFailed(id: string, raw: FlatBody): Promise<void>;
  markPaid(id: string, subscriptionId: string): Promise<void>;
  setApproved(id: string, at: Date): Promise<void>;
  getSubscription(id: string): Promise<SubscriptionRow | null>;
  upsertSubscription(sub: NormalizedSubscription, userId: string): Promise<{ id: string }>;
  /** Idempotent per webPaymentId. */
  recordIncome(input: IncomeInput): Promise<void>;
}

export type WebhookDeps = {
  db: Db;
  config: GrowConfig;
  now: () => Date;
  confirm: (n: GrowFirstNotify, pageCode: string) => Promise<TransactionCheck>;
  approve: (n: GrowFirstNotify, pageCode: string) => Promise<boolean>;
};

export type WebhookResult = "recorded" | "duplicate" | "failed" | "failed_renewal" | "unverified" | "retry";

type Completion = {
  payment: WebPaymentRow;
  periodEnd: string;
  /** The first charge's web_payments id: the subscription's store key for its whole life. */
  storeKey: string;
  autoRenew: boolean;
  cancelledAt: Date | null;
  paidOn: string;
};

async function completeCharge(deps: WebhookDeps, c: Completion): Promise<void> {
  const { payment } = c;
  const sub = await deps.db.upsertSubscription({
    platform: "grow",
    storeTransactionId: c.storeKey,
    productId: GROW_PRODUCT_ID[payment.plan],
    planType: payment.plan,
    expiresAt: new Date(c.periodEnd),
    isActive: true,
    autoRenew: c.autoRenew,
    environment: deps.config.environment,
    cancelledAt: c.cancelledAt,
    priceNis: payment.amount,
    rawReceipt: null,
  }, payment.userId);
  await deps.db.recordIncome({
    webPaymentId: payment.id,
    subscriptionId: sub.id,
    userId: payment.userId,
    amount: payment.amount,
    incomeDate: c.paidOn,
  });
  // Task 3b issues the Morning invoice here, before the row is marked paid.
  await deps.db.markPaid(payment.id, sub.id);
}

async function approveOnce(deps: WebhookDeps, payment: WebPaymentRow, n: GrowFirstNotify, pageCode: string): Promise<void> {
  let approved = false;
  try {
    approved = await deps.approve(n, pageCode);
  } catch {
    approved = false;
  }
  if (approved) await deps.db.setApproved(payment.id, deps.now());
}

function firstChargeFields(n: GrowFirstNotify, payment: WebPaymentRow, periodEnd: string): ChargeFields {
  return {
    transactionId: n.transactionId,
    transactionToken: n.transactionToken,
    asmachta: n.asmachta,
    cardSuffix: n.cardSuffix,
    cardBrand: n.cardBrand,
    // D4: a token is kept only for an annual buyer who ticked consent, whatever Grow sent.
    cardToken: payment.plan === "ANNUAL" && payment.tokenConsent ? n.cardToken : null,
    directDebitId: payment.plan === "MONTHLY" ? n.directDebitId : null,
    periodEnd,
    raw: n.raw,
  };
}

/** The period this charge pays for, fixed once; "paid" when another delivery already finished it. */
async function claimFirst(deps: WebhookDeps, payment: WebPaymentRow, n: GrowFirstNotify): Promise<string | "paid" | null> {
  if (payment.status === "processing") return payment.periodEnd;
  const periodEnd = firstPeriodEnd(payment.plan, deps.now()).toISOString();
  if (await deps.db.claimFirstCharge(payment.id, firstChargeFields(n, payment, periodEnd))) return periodEnd;
  const fresh = await deps.db.getPayment(payment.id);
  if (fresh?.status === "paid") return "paid";
  return fresh?.status === "processing" ? fresh.periodEnd : null;
}

export async function handleFirstCharge(deps: WebhookDeps, n: GrowFirstNotify): Promise<WebhookResult> {
  const payment = await deps.db.getPayment(n.webPaymentId);
  if (!payment || payment.kind !== "first" || !payment.growProcessId || !payment.growProcessToken) return "unverified";
  if (!safeEqual(payment.growProcessId, n.processId) || !safeEqual(payment.growProcessToken, n.processToken)) {
    return "unverified";
  }
  const pageCode = pageCodeFor(deps.config, payment.plan);

  if (payment.status === "paid") {
    if (!payment.approvedAt) await approveOnce(deps, payment, n, pageCode);
    return "duplicate";
  }
  if (n.statusCode !== GROW_SUCCESS_STATUS) {
    if (payment.status !== "processing") await deps.db.markFailed(payment.id, n.raw);
    return "failed";
  }
  if (!sameAmount(n.sum, payment.amount)) return "unverified";
  const confirmed = await deps.confirm(n, pageCode);
  if (!confirmed.ok) return confirmed.transient ? "retry" : "unverified";
  if (confirmed.statusCode !== GROW_SUCCESS_STATUS || !sameAmount(confirmed.sum, payment.amount)) return "unverified";

  const periodEnd = await claimFirst(deps, payment, n);
  if (periodEnd === "paid") return "duplicate";
  if (!periodEnd) return "retry";

  await completeCharge(deps, {
    payment,
    periodEnd,
    storeKey: payment.id,
    autoRenew: payment.plan === "ANNUAL" ? deps.config.annualAutoRenew : true,
    cancelledAt: null,
    paidOn: n.paidOn ?? israelDateString(deps.now()),
  });
  await approveOnce(deps, payment, n, pageCode);
  return "recorded";
}

async function renewalRow(
  deps: WebhookDeps,
  parent: WebPaymentRow,
  r: GrowRenewal,
  sub: SubscriptionRow,
): Promise<WebPaymentRow | null> {
  const periodEnd = nextExpiry("MONTHLY", deps.now(), new Date(sub.expiresAt)).toISOString();
  const inserted = await deps.db.insertRenewal(parent, {
    amount: r.sum,
    environment: deps.config.environment,
    transactionId: r.transactionId,
    transactionToken: null,
    asmachta: r.asmachta,
    cardSuffix: r.cardSuffix,
    cardBrand: r.cardBrand,
    cardToken: null,
    directDebitId: null,
    periodEnd,
    raw: r.raw,
  });
  // Null: a concurrent delivery inserted it first; continue with that row.
  return inserted ?? await deps.db.getPaymentByTransaction(r.transactionId);
}

export async function handleRenewal(deps: WebhookDeps, r: GrowRenewal): Promise<WebhookResult> {
  if (!safeEqual(r.webhookKey, deps.config.renewalWebhookKey)) return "unverified";
  const parent = await deps.db.getFirstChargeByDirectDebit(r.directDebitId);
  if (!parent || parent.plan !== "MONTHLY" || !sameAmount(r.sum, parent.amount)) return "unverified";
  if (parent.status !== "paid" || !parent.subscriptionId) return "retry";

  const existing = await deps.db.getPaymentByTransaction(r.transactionId);
  // The first charge itself arriving on the account webhook is not a renewal.
  if (existing && (existing.kind === "first" || existing.status === "paid")) return "duplicate";
  if (existing && existing.parentId !== parent.id) return "unverified";

  const sub = await deps.db.getSubscription(parent.subscriptionId);
  if (!sub) return "retry";
  const payment = existing ?? await renewalRow(deps, parent, r, sub);
  if (!payment || !payment.periodEnd) return "retry";
  if (payment.status === "paid") return "duplicate";

  await completeCharge(deps, {
    payment,
    periodEnd: payment.periodEnd,
    storeKey: parent.id,
    autoRenew: sub.autoRenew,
    cancelledAt: sub.cancelledAt ? new Date(sub.cancelledAt) : null,
    paidOn: r.paidOn ?? israelDateString(deps.now()),
  });
  return "recorded";
}

/**
 * A monthly charge failed (Grow retries it for up to 10 days). Nothing is
 * written: access simply runs to expires_at. index.ts logs it for the office.
 */
export async function handleRenewalFailure(deps: WebhookDeps, f: GrowRenewalFailure): Promise<WebhookResult> {
  if (!safeEqual(f.webhookKey, deps.config.renewalWebhookKey)) return "unverified";
  const parent = await deps.db.getFirstChargeByDirectDebit(f.directDebitId);
  return parent ? "failed_renewal" : "unverified";
}
```

`growWebhook/db.ts`:

```ts
// The Db that growWebhook's handlers write through, backed by the service
// client. web_payments has no RLS policies; only this role can touch it.

import type { FlatBody } from "../_shared/grow.ts";
import { upsertSubscription } from "../_shared/subscriptionUpsert.ts";
import type { createServiceClient } from "../_shared/supabaseClient.ts";
import type { ChargeFields, Db, WebPaymentRow } from "./handle.ts";

type Supa = ReturnType<typeof createServiceClient>;

const COLUMNS =
  "id, user_id, kind, parent_id, plan_type, amount, installments, status, token_consent, full_name, phone, email, " +
  "grow_process_id, grow_process_token, grow_transaction_id, grow_direct_debit_id, period_end, subscription_id, " +
  "approved_at, invoice_status";

type RawPayment = {
  id: string; user_id: string; kind: WebPaymentRow["kind"]; parent_id: string | null; plan_type: WebPaymentRow["plan"];
  amount: number | string; installments: number; status: WebPaymentRow["status"]; token_consent: boolean;
  full_name: string; phone: string; email: string; grow_process_id: string | null; grow_process_token: string | null;
  grow_transaction_id: string | null; grow_direct_debit_id: string | null; period_end: string | null;
  subscription_id: string | null; approved_at: string | null; invoice_status: WebPaymentRow["invoiceStatus"];
};

export function toPayment(r: RawPayment): WebPaymentRow {
  return {
    id: r.id, userId: r.user_id, kind: r.kind, parentId: r.parent_id, plan: r.plan_type, amount: Number(r.amount),
    installments: r.installments, status: r.status, tokenConsent: r.token_consent, fullName: r.full_name,
    phone: r.phone, email: r.email, growProcessId: r.grow_process_id, growProcessToken: r.grow_process_token,
    growTransactionId: r.grow_transaction_id, growDirectDebitId: r.grow_direct_debit_id, periodEnd: r.period_end,
    subscriptionId: r.subscription_id, approvedAt: r.approved_at, invoiceStatus: r.invoice_status,
  };
}

const chargeColumns = (f: ChargeFields) => ({
  grow_transaction_id: f.transactionId,
  grow_transaction_token: f.transactionToken,
  grow_asmachta: f.asmachta,
  card_suffix: f.cardSuffix,
  card_brand: f.cardBrand,
  card_token: f.cardToken,
  grow_direct_debit_id: f.directDebitId,
  period_end: f.periodEnd,
  raw: f.raw,
});

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`${what} failed: ${error?.message ?? "no row"}`);
}

export function createDb(supabase: Supa): Db {
  const payments = () => supabase.from("web_payments");

  async function onePayment(column: string, value: string, extra?: [string, string]): Promise<WebPaymentRow | null> {
    let query = payments().select(COLUMNS).eq(column, value);
    if (extra) query = query.eq(extra[0], extra[1]);
    const { data, error } = await query.maybeSingle();
    if (error) fail(`web_payments read by ${column}`, error);
    return data ? toPayment(data as unknown as RawPayment) : null;
  }

  return {
    getPayment: (id) => onePayment("id", id),
    getPaymentByTransaction: (transactionId) => onePayment("grow_transaction_id", transactionId),
    getFirstChargeByDirectDebit: (directDebitId) => onePayment("grow_direct_debit_id", directDebitId, ["kind", "first"]),

    async claimFirstCharge(id, fields) {
      const { data, error } = await payments()
        .update({ ...chargeColumns(fields), status: "processing" })
        .eq("id", id)
        .in("status", ["created", "failed"])
        .select("id");
      if (error) fail("web_payments claim", error);
      return (data ?? []).length === 1;
    },

    async insertRenewal(parent, f) {
      const { data, error } = await payments()
        .insert({
          user_id: parent.userId, kind: "renewal", parent_id: parent.id, plan_type: parent.plan, amount: f.amount,
          installments: 1, environment: f.environment, status: "processing", full_name: parent.fullName,
          phone: parent.phone, email: parent.email, ...chargeColumns(f),
        })
        .select(COLUMNS)
        .single();
      if (error?.code === "23505") return null;
      if (error || !data) fail("web_payments renewal insert", error);
      return toPayment(data as unknown as RawPayment);
    },

    async markFailed(id, raw: FlatBody) {
      const { error } = await payments().update({ status: "failed", raw }).eq("id", id).in("status", ["created", "failed"]);
      if (error) fail("web_payments mark failed", error);
    },

    async markPaid(id, subscriptionId) {
      const { error } = await payments().update({ status: "paid", subscription_id: subscriptionId }).eq("id", id);
      if (error) fail("web_payments mark paid", error);
    },

    async setApproved(id, at) {
      const { error } = await payments().update({ approved_at: at.toISOString() }).eq("id", id);
      if (error) fail("web_payments approve stamp", error);
    },

    async getSubscription(id) {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id, user_id, expires_at, auto_renew, cancelled_at")
        .eq("id", id)
        .maybeSingle();
      if (error) fail("subscriptions read", error);
      if (!data) return null;
      return { id: data.id, userId: data.user_id, expiresAt: data.expires_at, autoRenew: data.auto_renew ?? false, cancelledAt: data.cancelled_at };
    },

    upsertSubscription: (sub, userId) => upsertSubscription(sub, userId),

    async recordIncome(input) {
      const { error } = await supabase.from("subscription_income").upsert(
        {
          web_payment_id: input.webPaymentId,
          subscription_id: input.subscriptionId,
          user_id: input.userId,
          amount: input.amount,
          income_date: input.incomeDate,
          is_recurring_generated: false,
          notes: "Grow",
        },
        { onConflict: "web_payment_id", ignoreDuplicates: true },
      );
      if (error) fail("subscription_income insert", error);
    },
  };
}
```

`growWebhook/index.ts`:

```ts
// growWebhook: Grow's server-to-server callbacks (the first-charge notify and
// the account-level recurring webhooks). Deploy with --no-verify-jwt. Grow
// retries anything that is not HTTP 200, so recorded, duplicate and failed
// all answer 200; unverified answers 401 and writes nothing.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  classifyCallback, growConfig, parseBody, parseFirstNotify, parseRenewal, parseRenewalFailure, type FlatBody,
} from "../_shared/grow.ts";
import { approveTransaction, getTransactionInfo } from "../_shared/growClient.ts";
import { createServiceClient } from "../_shared/supabaseClient.ts";
import { createDb } from "./db.ts";
import { handleFirstCharge, handleRenewal, handleRenewalFailure, type WebhookDeps, type WebhookResult } from "./handle.ts";

const STATUS: Record<WebhookResult, number> = {
  recorded: 200, duplicate: 200, failed: 200, failed_renewal: 200, unverified: 401, retry: 503,
};

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const log = (fields: Record<string, unknown>) => console.log(JSON.stringify({ fn: "growWebhook", ...fields }));

/** Key names only: values carry names, phones and tokens. Task 9 uses these to fit the parsers. */
const malformed = (kind: string | null, body: FlatBody) => {
  log({ kind, result: "malformed", keys: Object.keys(body).sort() });
  return reply(400, { code: "malformed" });
};

serve(async (req) => {
  if (req.method !== "POST") return reply(405, { code: "method_not_allowed" });
  const config = growConfig(Deno.env.toObject());
  if (!config) return reply(503, { code: "not_configured" });

  const body = await parseBody(req.headers.get("content-type"), await req.text());
  const kind = classifyCallback(body);
  const deps: WebhookDeps = {
    db: createDb(createServiceClient()),
    config,
    now: () => new Date(),
    confirm: (n, pageCode) => getTransactionInfo(config, pageCode, n.transactionId, n.transactionToken),
    approve: (n, pageCode) => approveTransaction(config, pageCode, n.raw),
  };

  try {
    if (kind === "first") {
      const n = parseFirstNotify(body);
      if (!n) return malformed(kind, body);
      const result = await handleFirstCharge(deps, n);
      log({ kind, webPaymentId: n.webPaymentId, processId: n.processId, transactionId: n.transactionId, result });
      return reply(STATUS[result], { result });
    }
    if (kind === "renewal") {
      const r = parseRenewal(body);
      if (!r) return malformed(kind, body);
      const result = await handleRenewal(deps, r);
      log({ kind, directDebitId: r.directDebitId, transactionId: r.transactionId, result });
      return reply(STATUS[result], { result });
    }
    if (kind === "renewal_failed") {
      const f = parseRenewalFailure(body);
      if (!f) return malformed(kind, body);
      const result = await handleRenewalFailure(deps, f);
      log({ kind, directDebitId: f.directDebitId, attempts: f.attempts, result });
      return reply(STATUS[result], { result });
    }
    return malformed(kind, body);
  } catch (error) {
    console.error(JSON.stringify({ fn: "growWebhook", kind, error: error instanceof Error ? error.message : String(error) }));
    return reply(500, { code: "internal_error" });
  }
});
```

`config.toml`, directly under the `[functions.googleStoreNotifications]` block:

```toml
# Grow (Meshulam) server-to-server callbacks: verified inside the function
# (stored processToken + getTransactionInfo, or the renewal webhookKey).
[functions.growWebhook]
verify_jwt = false
```

- [ ] **Step 4: Run, expect PASS**, then type-check the HTTP glue:

```bash
cd /Users/itayostraich/Documents/GitHub/FitnessForSeniorsApp/shared/supabase/functions
~/.deno/bin/deno test --no-lock growWebhook/ _shared/
~/.deno/bin/deno check --no-lock growWebhook/index.ts
```

No deploy here; Task 8 deploys. Capturing real payloads is Task 9.

- [ ] **Step 5: Commit**

```bash
git add shared/supabase/functions/growWebhook/handle.ts shared/supabase/functions/growWebhook/handle.test.ts shared/supabase/functions/growWebhook/db.ts shared/supabase/functions/growWebhook/index.ts shared/supabase/config.toml
git commit -m "feat(functions): growWebhook records first charges and renewals idempotently"
```

---

### Task 3b: Morning invoice for every approved charge, first and renewal (FitnessForSeniorsApp)

Grow takes the money; Morning issues the document (decided 2026-10-05). Grow's own invoices are turned off in Task 0 so a buyer never gets two.

**Files:**
- Modify: `shared/supabase/functions/_shared/morning.ts` (add `MORNING_INCOME_DOC_TYPE`, `buildIncomeDocument`, `createIncomeDocument` next to the expense operations), `shared/supabase/functions/_shared/morning.test.ts`
- Create: `shared/supabase/functions/growWebhook/invoice.ts`
- Modify: `shared/supabase/functions/growWebhook/handle.ts`, `handle.test.ts`, `db.ts`, `index.ts`

**Interfaces:**
- Consumes: `WebPlan`, `GrowEnvironment` (Task 2); `WebhookDeps`, `Db`, `WebPaymentRow`, `completeCharge` (Task 3); existing `morningCredentials()`, `isMorningDryRun()`, `authedRequest` (module-private, reachable because the new code lives in `morning.ts`), `MorningCredentials`, `MorningResult`.
- Produces:
  - `MORNING_INCOME_DOC_TYPE = 320` (חשבונית מס/קבלה; 400 if the client turns out to be עוסק פטור)
  - `type IncomeDocumentInput = { plan: "ANNUAL" | "MONTHLY"; amount: number; installments: number; cardSuffix: string | null; paidOn: string; client: { name: string; phone: string; email: string } }`
  - `buildIncomeDocument(input: IncomeDocumentInput): Record<string, unknown>` (pure)
  - `createIncomeDocument(creds: MorningCredentials, doc: Record<string, unknown>): Promise<MorningResult<{ id: string; url: string | null }>>`
  - `handle.ts`: `type InvoiceInput = IncomeDocumentInput`; `type InvoiceResult = { status: "issued" | "failed" | "dry_run"; id?: string; url?: string | null; error?: string }`; `WebhookDeps.invoice: (input: InvoiceInput) => Promise<InvoiceResult>`; `Db.setInvoice(id: string, result: InvoiceResult): Promise<void>`
  - `growWebhook/invoice.ts`: `issueInvoice(environment: GrowEnvironment, input: InvoiceInput): Promise<InvoiceResult>`

Card type stays 0 ("unknown"): Grow's `cardBrand` values are not documented. Task 9 maps them from captured payloads (isracard 1, visa 2, mastercard 3, amex 4, diners 5, as Garden of Eden's `MORNING_CARD_TYPE`) and adds a test.

- [ ] **Step 1: Failing tests.** Append to `_shared/morning.test.ts` (add the new names to its import list from `./morning.ts`):

```ts
import { buildIncomeDocument, MORNING_INCOME_DOC_TYPE } from './morning.ts'

const incomeClient = { name: 'רחל כהן', phone: '0501234567', email: 'r@example.com' }

Deno.test('income: annual in 6 installments is one 708 line, VAT included, a card payment in installments', () => {
  const d = buildIncomeDocument({ plan: 'ANNUAL', amount: 708, installments: 6, cardSuffix: '4242', paidOn: '2026-10-05', client: incomeClient })
  assertEquals(d.type, MORNING_INCOME_DOC_TYPE)
  assertEquals(d.lang, 'he')
  assertEquals(d.currency, 'ILS')
  assertEquals((d.client as { emails: string[] }).emails, ['r@example.com'])
  assertEquals(d.income, [{ description: 'פעילים+ מנוי שנתי', quantity: 1, price: 708, currency: 'ILS', vatType: 1 }])
  assertEquals(d.payment, [{ type: 3, price: 708, currency: 'ILS', date: '2026-10-05', cardType: 0, cardNum: '4242', dealType: 2, numPayments: 6 }])
})

Deno.test('income: monthly is one 99 line and a regular card deal', () => {
  const d = buildIncomeDocument({ plan: 'MONTHLY', amount: 99, installments: 1, cardSuffix: null, paidOn: '2026-11-05', client: incomeClient })
  assertEquals((d.income as { description: string }[])[0].description, 'פעילים+ מנוי חודשי')
  assertEquals((d.payment as { dealType: number }[])[0].dealType, 1)
  assertEquals('cardNum' in (d.payment as Record<string, unknown>[])[0], false)
})

Deno.test('income: the document amount is what Grow charged, not the price list', () => {
  const d = buildIncomeDocument({ plan: 'ANNUAL', amount: 700, installments: 1, cardSuffix: '1111', paidOn: '2026-10-05', client: incomeClient })
  assertEquals((d.income as { price: number }[])[0].price, 700)
})
```

`vatType: 1` per line means "the price already includes VAT": without it Morning adds VAT on top, the total exceeds the payment and Morning rejects the document (errorCode 2422, learned in Garden of Eden).

In `growWebhook/handle.test.ts`:

1. Extend the imports: add `type InvoiceInput, type InvoiceResult` from `./handle.ts`.
2. Add `invoices: Map<string, InvoiceResult>` to `Memory`, initialise it with `invoices: new Map()`, and add to `memoryDb`'s `db`:

```ts
    setInvoice: async (id, result) => {
      mem.invoices.set(id, result);
      patch(id, { invoiceStatus: result.status });
    },
```

3. Replace `Calls` and `deps` with:

```ts
type Calls = { confirm: number; approve: number; invoices: InvoiceInput[] };

function deps(db: Db, overrides: Partial<WebhookDeps> = {}, now = NOW): { deps: WebhookDeps; calls: Calls } {
  const calls: Calls = { confirm: 0, approve: 0, invoices: [] };
  return {
    calls,
    deps: {
      db, config, now: () => now,
      confirm: async (n): Promise<TransactionCheck> => {
        calls.confirm += 1;
        return { ok: true, statusCode: "2", sum: n.sum };
      },
      approve: async () => {
        calls.approve += 1;
        return true;
      },
      invoice: async (input): Promise<InvoiceResult> => {
        calls.invoices.push(input);
        return { status: "issued", id: "doc-1", url: "https://morning.example/doc-1" };
      },
      ...overrides,
    },
  };
}
```

4. In the existing tests, every `assertEquals(calls, { confirm: X, approve: Y })` becomes `assertEquals({ confirm: calls.confirm, approve: calls.approve }, { confirm: X, approve: Y })`.
5. Append:

```ts
Deno.test("invoice: a recorded annual charge gets one document for what was charged, to the checkout details", async () => {
  const { db, mem } = memoryDb({ payments: [firstRow()] });
  const { deps: d, calls } = deps(db);
  await handleFirstCharge(d, notify());
  assertEquals(calls.invoices, [{
    plan: "ANNUAL", amount: 708, installments: 6, cardSuffix: "4242", paidOn: "2026-10-05",
    client: { name: "רחל כהן", phone: "0501234567", email: "r@example.com" },
  }]);
  assertEquals(mem.invoices.get(WP), { status: "issued", id: "doc-1", url: "https://morning.example/doc-1" });
  assertEquals(mem.payments.get(WP)?.invoiceStatus, "issued");
});

Deno.test("invoice: a renewal gets its own single-payment document", async () => {
  const { db } = renewalSeed();
  const { deps: d, calls } = deps(db, {}, RENEW_NOW);
  await handleRenewal(d, renewal());
  assertEquals(calls.invoices.map((i) => [i.plan, i.amount, i.installments, i.paidOn]), [["MONTHLY", 99, 1, "2026-11-05"]]);
});

Deno.test("invoice: never for duplicates, declines or forgeries", async () => {
  const { db } = memoryDb({ payments: [firstRow()] });
  const { deps: d, calls } = deps(db);
  await handleFirstCharge(d, notify());
  await handleFirstCharge(d, notify());
  await handleFirstCharge(d, notify({ processToken: "guess" }));
  const declined = memoryDb({ payments: [firstRow()] });
  const second = deps(declined.db);
  await handleFirstCharge(second.deps, notify({ statusCode: "3" }));
  assertEquals(calls.invoices.length, 1);
  assertEquals(second.calls.invoices.length, 0);
});

Deno.test("invoice: a failed or throwing Morning call still records the charge", async () => {
  for (const invoice of [
    async (): Promise<InvoiceResult> => ({ status: "failed", error: "Morning 2422" }),
    async (): Promise<InvoiceResult> => {
      throw new Error("boom");
    },
  ]) {
    const { db, mem } = memoryDb({ payments: [firstRow()] });
    assertEquals(await handleFirstCharge(deps(db, { invoice }).deps, notify()), "recorded");
    assertEquals(mem.payments.get(WP)?.status, "paid");
    assertEquals(mem.payments.get(WP)?.invoiceStatus, "failed");
    assertEquals(typeof mem.invoices.get(WP)?.error, "string");
  }
});

Deno.test("invoice: a resumed charge whose document was already issued is not invoiced again", async () => {
  const { db } = memoryDb({ payments: [firstRow({ status: "processing", growTransactionId: "t1", periodEnd: "2027-10-05T10:00:00.000Z", invoiceStatus: "issued" })] });
  const { deps: d, calls } = deps(db);
  assertEquals(await handleFirstCharge(d, notify()), "recorded");
  assertEquals(calls.invoices.length, 0);
});
```

- [ ] **Step 2: Run, expect FAIL:** `~/.deno/bin/deno test --no-lock _shared/morning.test.ts growWebhook/handle.test.ts`

- [ ] **Step 3: Implement.** In `_shared/morning.ts`, after the existing operations:

```ts
// ---------------------------------------------------------------------------
// Customer documents (income). Expenses above use MORNING_DOC_TYPE; income
// uses POST /documents. One document per Grow charge (growWebhook).
// ---------------------------------------------------------------------------

/** חשבונית מס/קבלה. An עוסק פטור would issue a receipt (400) instead. */
export const MORNING_INCOME_DOC_TYPE = 320
const MORNING_PAYMENT_CARD = 3
const MORNING_ITEM_VAT_INCLUDED = 1
const MORNING_CARD_UNKNOWN = 0
const MORNING_DEAL_REGULAR = 1
const MORNING_DEAL_INSTALLMENTS = 2
const INCOME_DESCRIPTION: Record<'ANNUAL' | 'MONTHLY', string> = {
  ANNUAL: 'פעילים+ מנוי שנתי',
  MONTHLY: 'פעילים+ מנוי חודשי',
}

export interface IncomeDocumentInput {
  plan: 'ANNUAL' | 'MONTHLY'
  amount: number
  installments: number
  cardSuffix: string | null
  /** Charge date, YYYY-MM-DD, Israel calendar. */
  paidOn: string
  client: { name: string; phone: string; email: string }
}

export function buildIncomeDocument(input: IncomeDocumentInput): Record<string, unknown> {
  const description = INCOME_DESCRIPTION[input.plan]
  return {
    type: MORNING_INCOME_DOC_TYPE,
    lang: 'he',
    currency: 'ILS',
    vatType: 0,
    description,
    client: { name: input.client.name, phone: input.client.phone, emails: [input.client.email], add: true },
    income: [{ description, quantity: 1, price: input.amount, currency: 'ILS', vatType: MORNING_ITEM_VAT_INCLUDED }],
    payment: [{
      type: MORNING_PAYMENT_CARD,
      price: input.amount,
      currency: 'ILS',
      date: input.paidOn,
      cardType: MORNING_CARD_UNKNOWN,
      ...(input.cardSuffix ? { cardNum: input.cardSuffix } : {}),
      dealType: input.installments > 1 ? MORNING_DEAL_INSTALLMENTS : MORNING_DEAL_REGULAR,
      numPayments: input.installments,
    }],
  }
}

export async function createIncomeDocument(
  creds: MorningCredentials,
  doc: Record<string, unknown>,
): Promise<MorningResult<{ id: string; url: string | null }>> {
  const res = await authedRequest(creds, '/documents', 'POST', doc)
  if (!res.ok) return res
  const body = res.value as { id?: string; url?: { he?: string; origin?: string } } | null
  if (!body?.id) return { ok: false, fault: 'permanent', status: 200, error: 'Morning document response had no id' }
  return { ok: true, value: { id: body.id, url: body.url?.he ?? body.url?.origin ?? null } }
}
```

`growWebhook/invoice.ts`:

```ts
// Morning document for one Grow charge. Dry run unless MORNING_DRY_RUN is
// exactly "false" AND Grow is in production: a sandbox payment must never
// produce a real tax document, even though the Morning secrets are shared
// with the live expense sync.

import type { GrowEnvironment } from "../_shared/grow.ts";
import { buildIncomeDocument, createIncomeDocument, isMorningDryRun, morningCredentials } from "../_shared/morning.ts";
import type { InvoiceInput, InvoiceResult } from "./handle.ts";

export async function issueInvoice(environment: GrowEnvironment, input: InvoiceInput): Promise<InvoiceResult> {
  const doc = buildIncomeDocument(input);
  if (environment === "sandbox" || isMorningDryRun()) {
    console.log(JSON.stringify({ fn: "growWebhook", invoice: "dry_run", type: doc.type, keys: Object.keys(doc).sort() }));
    return { status: "dry_run" };
  }
  const creds = morningCredentials();
  if (!creds) return { status: "failed", error: "Morning not configured" };
  const res = await createIncomeDocument(creds, doc);
  return res.ok ? { status: "issued", id: res.value.id, url: res.value.url } : { status: "failed", error: res.error };
}
```

`growWebhook/handle.ts` changes:

```ts
// add to the imports
import type { IncomeDocumentInput } from "../_shared/morning.ts";

// new types, next to IncomeInput
export type InvoiceInput = IncomeDocumentInput;
export type InvoiceResult = { status: "issued" | "failed" | "dry_run"; id?: string; url?: string | null; error?: string };

// Db gains
  setInvoice(id: string, result: InvoiceResult): Promise<void>;

// WebhookDeps gains
  invoice: (input: InvoiceInput) => Promise<InvoiceResult>;

// Completion gains
  installments: number;
  cardSuffix: string | null;
```

Replace `completeCharge` with:

```ts
async function issueSafely(deps: WebhookDeps, input: InvoiceInput): Promise<InvoiceResult> {
  try {
    return await deps.invoice(input);
  } catch (error) {
    return { status: "failed", error: error instanceof Error ? error.message : String(error) };
  }
}

async function completeCharge(deps: WebhookDeps, c: Completion): Promise<void> {
  const { payment } = c;
  const sub = await deps.db.upsertSubscription({
    platform: "grow",
    storeTransactionId: c.storeKey,
    productId: GROW_PRODUCT_ID[payment.plan],
    planType: payment.plan,
    expiresAt: new Date(c.periodEnd),
    isActive: true,
    autoRenew: c.autoRenew,
    environment: deps.config.environment,
    cancelledAt: c.cancelledAt,
    priceNis: payment.amount,
    rawReceipt: null,
  }, payment.userId);
  await deps.db.recordIncome({
    webPaymentId: payment.id,
    subscriptionId: sub.id,
    userId: payment.userId,
    amount: payment.amount,
    incomeDate: c.paidOn,
  });
  // Before markPaid, so a crash here is resumed by Grow's redelivery; the
  // pending check keeps a resumed charge from getting a second document.
  if (payment.invoiceStatus === "pending") {
    const result = await issueSafely(deps, {
      plan: payment.plan,
      amount: payment.amount,
      installments: c.installments,
      cardSuffix: c.cardSuffix,
      paidOn: c.paidOn,
      client: { name: payment.fullName, phone: payment.phone, email: payment.email },
    });
    await deps.db.setInvoice(payment.id, result);
  }
  await deps.db.markPaid(payment.id, sub.id);
}
```

In `handleFirstCharge`'s `completeCharge` call add `installments: payment.plan === "ANNUAL" ? n.installments : 1, cardSuffix: n.cardSuffix,` (the annual count is what Grow actually charged; a monthly notify's `allPaymentsNum` is the standing order's length, not installments). In `handleRenewal`'s call add `installments: 1, cardSuffix: r.cardSuffix,`.

`growWebhook/db.ts`, add to the returned object:

```ts
    async setInvoice(id, result) {
      const { error } = await payments()
        .update({
          invoice_status: result.status,
          morning_document_id: result.id ?? null,
          morning_document_url: result.url ?? null,
          invoice_error: result.error ?? null,
        })
        .eq("id", id);
      if (error) fail("web_payments invoice", error);
    },
```

`growWebhook/index.ts`: `import { issueInvoice } from "./invoice.ts";` and add to `deps`: `invoice: (input) => issueInvoice(config.environment, input),`.

- [ ] **Step 4: Run, expect PASS**, including the expense code that shares the module:

```bash
cd /Users/itayostraich/Documents/GitHub/FitnessForSeniorsApp/shared/supabase/functions
~/.deno/bin/deno test --no-lock _shared/ growWebhook/
~/.deno/bin/deno check --no-lock growWebhook/index.ts syncSupplierInvoiceToMorning/index.ts
```

- [ ] **Step 5: Commit**

```bash
git add shared/supabase/functions/_shared/morning.ts shared/supabase/functions/_shared/morning.test.ts shared/supabase/functions/growWebhook/invoice.ts shared/supabase/functions/growWebhook/handle.ts shared/supabase/functions/growWebhook/handle.test.ts shared/supabase/functions/growWebhook/db.ts shared/supabase/functions/growWebhook/index.ts
git commit -m "feat(functions): Morning invoice for every approved web charge"
```

---

### Task 4: `createGrowPayment` edge function (FitnessForSeniorsApp)

**Files:**
- Create: `shared/supabase/functions/createGrowPayment/validate.ts`, `validate.test.ts`, `handle.ts`, `handle.test.ts`, `index.ts`
- Modify: `shared/supabase/functions/_shared/cors.ts` (website origins), `shared/supabase/functions/_shared/ratelimit.ts` (`payment` limit)
- Create: `shared/supabase/functions/_shared/cors.test.ts`

**Interfaces:**
- Consumes: `buildCreatePaymentForm`, `growConfig`, `isFullName`, `isGrowHostedUrl`, `PLAN_CONFIG`, `toLocalMobile`, `GrowConfig`, `WebPlan` (Task 2); `createPaymentProcess`, `CreatedProcess` (Task 2); `checkRateLimit`, `getRateLimitIdentifier`, `rateLimitExceededResponse`; `getCorsHeaders`; Task 1 columns.
- Produces:
  - `validate.ts`: `type CheckoutRequest = { plan: WebPlan; installments: number; fullName: string; email: string; tokenConsent: boolean }`; `type InvalidField = "body" | "plan" | "installments" | "fullName" | "email" | "tokenConsent"`; `parseRequest(body: unknown): { ok: true; value: CheckoutRequest } | { ok: false; field: InvalidField }`
  - `handle.ts`: `type NewPayment`; `type CreateDeps`; `type CreateOutcome`; `createPayment(deps: CreateDeps, user: { id: string; phone: string | null }, body: unknown): Promise<CreateOutcome>`
  - HTTP: `POST /functions/v1/createGrowPayment`, `Authorization: Bearer <user JWT>`, body `{ plan: "ANNUAL" | "MONTHLY"; installments: number; fullName: string; email: string; tokenConsent?: boolean }` -> `200 { url: string; webPaymentId: string }` | `400 { code: "invalid_input"; field }` | `401 { code: "unauthorized" }` | `409 { code: "already_subscribed" }` | `429` (existing limiter body) | `502 { code: "processor_error" }` | `503 { code: "not_configured" }`. No `authCode`; `processToken` never leaves the server.
  - CORS: `https://www.activeplus.co.il`, `https://activeplus.co.il`, and `^https://active-plus-website-[a-z0-9-]+-itay-ostraichs-projects\.vercel\.app$` (Vercel previews of project `active-plus-website` under team `itay-ostraichs-projects`, both `-<hash>-` and `-git-<branch>-` forms).

- [ ] **Step 1: Failing tests.** `createGrowPayment/validate.test.ts`:

```ts
import { assertEquals } from "std/assert/mod.ts";
import { parseRequest } from "./validate.ts";

const ok = { plan: "ANNUAL", installments: 6, fullName: " רחל   כהן ", email: " r@example.com ", tokenConsent: true };

Deno.test("a valid annual request is normalised", () => {
  assertEquals(parseRequest(ok), { ok: true, value: { plan: "ANNUAL", installments: 6, fullName: "רחל כהן", email: "r@example.com", tokenConsent: true } });
});

Deno.test("annual takes 1-12 whole installments", () => {
  for (const n of [1, 12]) assertEquals(parseRequest({ ...ok, installments: n }).ok, true);
  for (const n of [0, 13, 2.5, "6"]) assertEquals(parseRequest({ ...ok, installments: n }), { ok: false, field: "installments" });
});

Deno.test("monthly takes exactly one installment and never a token", () => {
  assertEquals(parseRequest({ ...ok, plan: "MONTHLY", installments: 2 }), { ok: false, field: "installments" });
  const monthly = parseRequest({ ...ok, plan: "MONTHLY", installments: 1 });
  assertEquals(monthly.ok && monthly.value.tokenConsent, false);
});

Deno.test("consent is off unless explicitly true", () => {
  const { tokenConsent: _drop, ...noConsent } = ok;
  const parsed = parseRequest(noConsent);
  assertEquals(parsed.ok && parsed.value.tokenConsent, false);
  assertEquals(parseRequest({ ...ok, tokenConsent: "yes" }), { ok: false, field: "tokenConsent" });
});

Deno.test("rejects unknown plans, one-word or long names, and bad emails", () => {
  assertEquals(parseRequest({ ...ok, plan: "WEEKLY" }), { ok: false, field: "plan" });
  assertEquals(parseRequest({ ...ok, fullName: "רחל" }), { ok: false, field: "fullName" });
  assertEquals(parseRequest({ ...ok, fullName: `רחל ${"כ".repeat(80)}` }), { ok: false, field: "fullName" });
  for (const email of ["a@b", "", `${"a".repeat(250)}@b.co`, "r @example.com"]) {
    assertEquals(parseRequest({ ...ok, email }), { ok: false, field: "email" });
  }
});

Deno.test("rejects a non-object body and ignores extra fields", () => {
  assertEquals(parseRequest(null), { ok: false, field: "body" });
  assertEquals(parseRequest([ok]), { ok: false, field: "body" });
  assertEquals(parseRequest({ ...ok, userId: "someone-else" }).ok, true);
});
```

`createGrowPayment/handle.test.ts`:

```ts
import { assertEquals } from "std/assert/mod.ts";
import { growConfig, type GrowConfig } from "../_shared/grow.ts";
import type { CreatedProcess } from "../_shared/growClient.ts";
import { createPayment, type CreateDeps, type NewPayment } from "./handle.ts";

const config = growConfig({
  GROW_API_URL: "https://sandbox.meshulam.co.il/api/light/server/1.0", GROW_USER_ID: "u",
  GROW_PAGE_CODE_ONE_TIME: "one", GROW_PAGE_CODE_RECURRING: "rec", GROW_RENEWAL_WEBHOOK_KEY: "k",
})!;
const WP = "0f8b6c2e-9a41-4d3b-8e57-1c2d3e4f5a6b";
const USER = { id: "user-1", phone: "972501234567" };
const BODY = { plan: "ANNUAL", installments: 6, fullName: "רחל כהן", email: "r@example.com", tokenConsent: false };
const HOSTED = "https://sandbox.meshulam.co.il/s/abc";

type Log = { inserted: NewPayment[]; forms: FormData[]; process: unknown[]; failed: string[] };

function deps(overrides: Partial<CreateDeps> = {}, process: CreatedProcess = { ok: true, processId: "p1", processToken: "ptok", url: HOSTED }) {
  const log: Log = { inserted: [], forms: [], process: [], failed: [] };
  const d: CreateDeps = {
    config,
    notifyUrl: "https://x.supabase.co/functions/v1/growWebhook",
    hasActiveSubscription: async () => false,
    insertPayment: async (row) => {
      log.inserted.push(row);
      return { id: WP };
    },
    setProcess: async (_id, p) => void log.process.push(p),
    markFailed: async (_id, error) => void log.failed.push(error),
    createProcess: async (_config: GrowConfig, form: FormData) => {
      log.forms.push(form);
      return process;
    },
    ...overrides,
  };
  return { d, log };
}

Deno.test("not configured: 503 before anything else", async () => {
  const { d, log } = deps({ config: null });
  assertEquals(await createPayment(d, USER, BODY), { status: 503, body: { code: "not_configured" } });
  assertEquals(log.inserted.length, 0);
});

Deno.test("invalid input and a user without a mobile number are 400", async () => {
  const { d } = deps();
  assertEquals(await createPayment(d, USER, { ...BODY, fullName: "רחל" }), { status: 400, body: { code: "invalid_input", field: "fullName" } });
  assertEquals(await createPayment(d, { id: "user-1", phone: null }, BODY), { status: 400, body: { code: "invalid_input", field: "phone" } });
});

Deno.test("already subscribed: 409, no row and no Grow call", async () => {
  const { d, log } = deps({ hasActiveSubscription: async () => true });
  assertEquals(await createPayment(d, USER, BODY), { status: 409, body: { code: "already_subscribed" } });
  assertEquals([log.inserted.length, log.forms.length], [0, 0]);
});

Deno.test("success: a created row, Grow's hosted url back, process id and token kept server-side", async () => {
  const { d, log } = deps();
  assertEquals(await createPayment(d, USER, BODY), { status: 200, body: { url: HOSTED, webPaymentId: WP } });
  assertEquals(log.inserted, [{ userId: "user-1", plan: "ANNUAL", amount: 708, installments: 6, environment: "sandbox", fullName: "רחל כהן", phone: "0501234567", email: "r@example.com", tokenConsent: false }]);
  assertEquals(log.process, [{ processId: "p1", processToken: "ptok" }]);
  assertEquals(log.forms[0].get("paymentNum"), "6");
  assertEquals(log.forms[0].get("saveCardToken"), null);
});

Deno.test("annual consent asks Grow for a token; monthly goes to the recurring page", async () => {
  const consent = deps();
  await createPayment(consent.d, USER, { ...BODY, tokenConsent: true });
  assertEquals(consent.log.forms[0].get("saveCardToken"), "1");
  const monthly = deps();
  await createPayment(monthly.d, USER, { ...BODY, plan: "MONTHLY", installments: 1, tokenConsent: true });
  assertEquals([monthly.log.forms[0].get("pageCode"), monthly.log.forms[0].get("paymentNum"), monthly.log.forms[0].get("saveCardToken")], ["rec", "120", null]);
  assertEquals(monthly.log.inserted[0].amount, 99);
});

Deno.test("Grow errors and non-Grow urls mark the row failed and answer 502", async () => {
  for (const process of [
    { ok: false, error: "617 bad sum" } as CreatedProcess,
    { ok: true, processId: "p1", processToken: "ptok", url: "https://evil.example/pay" } as CreatedProcess,
  ]) {
    const { d, log } = deps({}, process);
    assertEquals(await createPayment(d, USER, BODY), { status: 502, body: { code: "processor_error" } });
    assertEquals(log.failed.length, 1);
    assertEquals(log.process.length, 0);
  }
});
```

`_shared/cors.test.ts`:

```ts
import { assertEquals } from "std/assert/mod.ts";
import { getCorsHeaders } from "./cors.ts";

const allowed = (origin: string) =>
  getCorsHeaders(new Request("https://x", { headers: { Origin: origin } }))["Access-Control-Allow-Origin"] === origin;

Deno.test("the website's production origins are allowed", () => {
  assertEquals(allowed("https://www.activeplus.co.il"), true);
  assertEquals(allowed("https://activeplus.co.il"), true);
});

Deno.test("only this project's Vercel previews are allowed", () => {
  assertEquals(allowed("https://active-plus-website-abc123-itay-ostraichs-projects.vercel.app"), true);
  assertEquals(allowed("https://active-plus-website-git-feat-grow-checkout-itay-ostraichs-projects.vercel.app"), true);
  assertEquals(allowed("https://active-plus-website-abc123-someone-else.vercel.app"), false);
  assertEquals(allowed("https://evil-active-plus-website-x-itay-ostraichs-projects.vercel.app"), false);
});

Deno.test("existing admin origins still work", () => {
  assertEquals(allowed("https://fitness-for-seniors.vercel.app"), true);
});
```

- [ ] **Step 2: Run, expect FAIL:** `~/.deno/bin/deno test --no-lock createGrowPayment/ _shared/cors.test.ts`

- [ ] **Step 3: Implement.** `createGrowPayment/validate.ts`:

```ts
// Hand-written guards (the functions do not use zod). The phone is NOT in the
// body: it comes from the verified JWT, like the user id.

import { isFullName, PLAN_CONFIG, type WebPlan } from "../_shared/grow.ts";

export type CheckoutRequest = { plan: WebPlan; installments: number; fullName: string; email: string; tokenConsent: boolean };
export type InvalidField = "body" | "plan" | "installments" | "fullName" | "email" | "tokenConsent";
export type ParsedRequest = { ok: true; value: CheckoutRequest } | { ok: false; field: InvalidField };

const NAME_MAX = 80;
const EMAIL_MAX = 254;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const isPlan = (value: unknown): value is WebPlan => value === "ANNUAL" || value === "MONTHLY";

export function parseRequest(body: unknown): ParsedRequest {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, field: "body" };
  const b = body as Record<string, unknown>;
  if (!isPlan(b.plan)) return { ok: false, field: "plan" };
  const installments = b.installments;
  if (typeof installments !== "number" || !Number.isInteger(installments) || installments < 1 || installments > PLAN_CONFIG[b.plan].maxInstallments) {
    return { ok: false, field: "installments" };
  }
  const fullName = typeof b.fullName === "string" ? b.fullName.trim().replace(/\s+/g, " ") : "";
  if (fullName.length > NAME_MAX || !isFullName(fullName)) return { ok: false, field: "fullName" };
  const email = typeof b.email === "string" ? b.email.trim() : "";
  if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) return { ok: false, field: "email" };
  if (b.tokenConsent !== undefined && typeof b.tokenConsent !== "boolean") return { ok: false, field: "tokenConsent" };
  return {
    ok: true,
    value: { plan: b.plan, installments, fullName, email, tokenConsent: b.plan === "ANNUAL" && b.tokenConsent === true },
  };
}
```

`createGrowPayment/handle.ts`:

```ts
// createGrowPayment core. Order matters: config, input, phone, the
// already-subscribed guard, THEN the row and the Grow call, so a refused
// request leaves nothing behind.

import { buildCreatePaymentForm, isGrowHostedUrl, PLAN_CONFIG, toLocalMobile, type GrowConfig, type WebPlan } from "../_shared/grow.ts";
import type { CreatedProcess } from "../_shared/growClient.ts";
import { parseRequest, type InvalidField } from "./validate.ts";

export type NewPayment = {
  userId: string;
  plan: WebPlan;
  amount: number;
  installments: number;
  environment: GrowConfig["environment"];
  fullName: string;
  phone: string;
  email: string;
  tokenConsent: boolean;
};

export type CreateDeps = {
  config: GrowConfig | null;
  notifyUrl: string;
  hasActiveSubscription: (userId: string) => Promise<boolean>;
  insertPayment: (row: NewPayment) => Promise<{ id: string }>;
  setProcess: (id: string, process: { processId: string; processToken: string }) => Promise<void>;
  markFailed: (id: string, error: string) => Promise<void>;
  createProcess: (config: GrowConfig, form: FormData) => Promise<CreatedProcess>;
};

export type CreateOutcome =
  | { status: 200; body: { url: string; webPaymentId: string } }
  | { status: 400; body: { code: "invalid_input"; field: InvalidField | "phone" } }
  | { status: 409; body: { code: "already_subscribed" } }
  | { status: 502; body: { code: "processor_error" } }
  | { status: 503; body: { code: "not_configured" } };

export async function createPayment(
  deps: CreateDeps,
  user: { id: string; phone: string | null },
  body: unknown,
): Promise<CreateOutcome> {
  const { config } = deps;
  if (!config) return { status: 503, body: { code: "not_configured" } };
  const parsed = parseRequest(body);
  if (!parsed.ok) return { status: 400, body: { code: "invalid_input", field: parsed.field } };
  const phone = toLocalMobile(user.phone);
  if (!phone) return { status: 400, body: { code: "invalid_input", field: "phone" } };
  if (await deps.hasActiveSubscription(user.id)) return { status: 409, body: { code: "already_subscribed" } };

  const req = parsed.value;
  const { id } = await deps.insertPayment({
    userId: user.id,
    plan: req.plan,
    amount: PLAN_CONFIG[req.plan].sum,
    installments: req.installments,
    environment: config.environment,
    fullName: req.fullName,
    phone,
    email: req.email,
    tokenConsent: req.tokenConsent,
  });
  const form = buildCreatePaymentForm({
    plan: req.plan,
    installments: req.installments,
    saveCardToken: req.tokenConsent,
    fullName: req.fullName,
    phone,
    email: req.email,
    webPaymentId: id,
    notifyUrl: deps.notifyUrl,
    config,
  });
  const process = await deps.createProcess(config, form);
  if (!process.ok || !isGrowHostedUrl(process.url)) {
    await deps.markFailed(id, process.ok ? "payment page is not on a Grow host" : process.error);
    return { status: 502, body: { code: "processor_error" } };
  }
  await deps.setProcess(id, { processId: process.processId, processToken: process.processToken });
  return { status: 200, body: { url: process.url, webPaymentId: id } };
}
```

`createGrowPayment/index.ts`:

```ts
// createGrowPayment: the website's checkout calls this with the visitor's
// session. Returns Grow's hosted payment page url; the browser redirects
// there (D1). userId and phone come from the verified JWT, never the body.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { growConfig } from "../_shared/grow.ts";
import { createPaymentProcess } from "../_shared/growClient.ts";
import { checkRateLimit, getRateLimitIdentifier, rateLimitExceededResponse } from "../_shared/ratelimit.ts";
import { createServiceClient } from "../_shared/supabaseClient.ts";
import { createPayment, type CreateDeps } from "./handle.ts";

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method !== "POST") return json(405, { code: "method_not_allowed" });

  const config = growConfig(Deno.env.toObject());
  if (!config) return json(503, { code: "not_configured" });

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json(401, { code: "unauthorized" });
  const supabase = createServiceClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return json(401, { code: "unauthorized" });

  const limit = await checkRateLimit(getRateLimitIdentifier(req, user.id), "payment");
  if (!limit.success) return rateLimitExceededResponse(cors, limit);

  const payments = () => supabase.from("web_payments");
  const deps: CreateDeps = {
    config,
    notifyUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/growWebhook`,
    // The same test checkUserSubscription uses for access.
    hasActiveSubscription: async (userId) => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .gte("expires_at", new Date().toISOString())
        .limit(1);
      if (error) throw new Error(`subscriptions lookup failed: ${error.message}`);
      return (data ?? []).length > 0;
    },
    insertPayment: async (row) => {
      const { data, error } = await payments()
        .insert({
          user_id: row.userId, kind: "first", plan_type: row.plan, amount: row.amount, installments: row.installments,
          environment: row.environment, full_name: row.fullName, phone: row.phone, email: row.email,
          token_consent: row.tokenConsent,
        })
        .select("id")
        .single();
      if (error || !data) throw new Error(`web_payments insert failed: ${error?.message ?? "no row"}`);
      return { id: data.id as string };
    },
    setProcess: async (id, p) => {
      const { error } = await payments().update({ grow_process_id: p.processId, grow_process_token: p.processToken }).eq("id", id);
      if (error) throw new Error(`web_payments process update failed: ${error.message}`);
    },
    markFailed: async (id, reason) => {
      const { error } = await payments().update({ status: "failed", raw: { createError: reason } }).eq("id", id);
      if (error) console.error(JSON.stringify({ fn: "createGrowPayment", webPaymentId: id, error: error.message }));
    },
    createProcess: createPaymentProcess,
  };

  try {
    const outcome = await createPayment(deps, { id: user.id, phone: user.phone ?? null }, await req.json().catch(() => null));
    const webPaymentId = outcome.status === 200 ? outcome.body.webPaymentId : undefined;
    console.log(JSON.stringify({ fn: "createGrowPayment", userId: user.id, status: outcome.status, webPaymentId }));
    return json(outcome.status, outcome.body);
  } catch (error) {
    console.error(JSON.stringify({ fn: "createGrowPayment", userId: user.id, error: error instanceof Error ? error.message : String(error) }));
    return json(500, { code: "internal_error" });
  }
});
```

`_shared/cors.ts`: add to `ALLOWED_ORIGINS`:

```ts
  // Active Plus website (web checkout, success page, subscription page)
  'https://www.activeplus.co.il',
  'https://activeplus.co.il',
```

and below `VERCEL_PREVIEW_REGEX`:

```ts
// Website previews: https://active-plus-website-<hash>-itay-ostraichs-projects.vercel.app
// and https://active-plus-website-git-<branch>-itay-ostraichs-projects.vercel.app
const WEBSITE_PREVIEW_REGEX = /^https:\/\/active-plus-website-[a-z0-9-]+-itay-ostraichs-projects\.vercel\.app$/
```

and change the check to `const isAllowedOrigin = ALLOWED_ORIGINS.has(origin) || VERCEL_PREVIEW_REGEX.test(origin) || WEBSITE_PREVIEW_REGEX.test(origin)`.

`_shared/ratelimit.ts`: add to `RATE_LIMIT_CONFIGS`:

```ts
  // Web checkout: each call opens a Grow payment process
  payment: { requests: 10, window: "1h" as const },
```

- [ ] **Step 4: Run, expect PASS**, plus the type check:

```bash
cd /Users/itayostraich/Documents/GitHub/FitnessForSeniorsApp/shared/supabase/functions
~/.deno/bin/deno test --no-lock createGrowPayment/ growWebhook/ _shared/
~/.deno/bin/deno check --no-lock createGrowPayment/index.ts checkUserSubscription/index.ts
```

No deploy and no secrets here (Task 8 deploys dormant; Task 9 sets secrets).

- [ ] **Step 5: Commit**

```bash
git add shared/supabase/functions/createGrowPayment/validate.ts shared/supabase/functions/createGrowPayment/validate.test.ts shared/supabase/functions/createGrowPayment/handle.ts shared/supabase/functions/createGrowPayment/handle.test.ts shared/supabase/functions/createGrowPayment/index.ts shared/supabase/functions/_shared/cors.ts shared/supabase/functions/_shared/cors.test.ts shared/supabase/functions/_shared/ratelimit.ts
git commit -m "feat(functions): createGrowPayment returns grow's hosted payment page"
```

---

### Task 5: Website checkout, success page and CSP (active-plus-website)

**Files:**
- Create: `lib/payment/checkout.ts`, `lib/payment/copy.ts`, `lib/security/csp.ts`, `tests/unit/checkout.test.ts`, `tests/unit/csp.test.ts`
- Create: `components/payment/Checkout.tsx`, `components/payment/CheckoutFields.tsx`, `components/payment/CheckoutSummary.tsx`, `components/payment/PaymentSuccess.tsx`, `app/payment/success/page.tsx`
- Modify: `components/payment/PaymentFlow.tsx`, `components/payment/PlanSelector.tsx`, `app/payment/page.tsx`, `next.config.ts`, `playwright.config.ts`, `package.json`, `.gitignore`
- Create: `tests/e2e/csp-helpers.ts`, `tests/e2e/csp.spec.ts`, `tests/e2e/checkout.spec.ts`, `playwright.checkout.config.ts`

**Interfaces:**
- Consumes: `POST createGrowPayment` (Task 4: body and status codes exactly as produced there); `checkUserSubscription` (`{ hasAccess: boolean }`); plan 2's `Register` (props `view: { sub: "name" | "phone"; phone: string }, gender, name, onNameChange, onName, onCodeSent, onBusy`) and `Otp` (props `phone, answers, sessionId, onEditPhone, onComplete, onBusy`) unchanged; `loadSession`, `GENDER_FOR_PAYMENT` (`lib/funnel/storage.ts`); `g` (`lib/funnel/copy.ts`); `loadBrowserSupabase` (`lib/supabase/lazy.ts`); `PLANS`, `PlanId`, `STORE_IOS`, `STORE_ANDROID` (`lib/constants.ts`); `installmentAmount`, `formatShekel` (`lib/pricing.ts`); `formatLocal` (`lib/phone.ts`); funnel `parts` (`ContinueButton`, `FieldError`, `fieldClass`).
- Produces (`lib/payment/checkout.ts`):
  - `type WebPlan = "ANNUAL" | "MONTHLY"`; `toWebPlan(plan: PlanId): WebPlan`
  - `type CheckoutStep = "name" | "email" | "phone" | "summary"`; `checkoutSteps(signedIn: boolean, hasFullName: boolean): CheckoutStep[]`
  - `isFullName(value: string): boolean` (same rule as the edge function); `isEmail(value: string): boolean`; `isGrowHostedUrl(value: string): boolean`
  - `type StartInput = { plan: WebPlan; installments: number; fullName: string; email: string; tokenConsent: boolean }`; `type StartError = "already_subscribed" | "invalid_input" | "signed_out" | "rate_limited" | "not_configured" | "processor_error" | "network"`; `type StartResult = { url: string; webPaymentId: string } | { error: StartError }`; `startPayment(supabase: Pick<SupabaseClient, "functions">, input: StartInput): Promise<StartResult>`
  - `waitForAccess(check: () => Promise<boolean>, options?: { intervalMs?: number; timeoutMs?: number; sleep?: (ms: number) => Promise<void>; now?: () => number; stopped?: () => boolean }): Promise<"active" | "timeout">`
  - `readPaymentGender(storage?): Answers["gender"]`; `type CheckoutDraft = { plan: PlanId; name: string; email: string; installments: number }`; `saveCheckoutDraft(draft, storage?)`, `readCheckoutDraft(storage?): CheckoutDraft | null`, `clearCheckoutDraft(storage?)`; `rememberCheckoutEmail(email, storage?)`, `readCheckoutEmail(storage?): string | null`
- Produces (`lib/payment/copy.ts`): `CHECKOUT_COPY`, `ACCOUNT_COPY` (Task 6 fills it), `gendered(gender, { fem, masc }): string`
- Produces (`lib/security/csp.ts`): `GROW_HOSTED_ORIGINS`, `buildCsp(supabaseUrl: string | undefined): string`
- Produces (components): `Checkout({ plan: PlanId; onChangePlan: () => void })`; `PaymentFlow({ initialPlan?: PlanId; cancelled?: boolean })`; `PaymentSuccess()`

The checkout lives on `/payment`, below the plan selector, and follows the mockup's steps: signed out "שם -> אימייל -> טלפון + קוד -> סיכום"; signed in with a two-word profile name "אימייל -> סיכום" (name and phone shown as confirmed rows; name editable, phone not). Reusing `Otp` as it is has one consequence: after a NEW user verifies, `Otp` calls `router.push("/payment")`, which can remount the page. The checkout therefore keeps a draft (plan, name, email, installments) in `sessionStorage` and resumes at the summary when it finds one with a signed-in session; the same draft brings the buyer back to the summary from Grow's cancel URL (`/payment?cancelled=1`). Gendered copy reads `ap.funnel.gender` (written by the questionnaire's `handOffToPayment`), through `g()` (unknown gender gets the masculine form, as in the funnel), except the success heading, which is neutral when the gender is unknown.

CSP: the site loads only first-party resources plus Supabase (exact origin from `NEXT_PUBLIC_SUPABASE_URL`). Inventory: fonts via `next/font` (self-hosted), hero video and images from the site, `/api/funnel-event` (self), Supabase auth/REST/functions, the questionnaire's inline resume script, and Next's own inline `self.__next_f.push(...)` bootstrap scripts. No Vercel Analytics or Speed Insights (not in `package.json`), no third-party script, no iframe. `script-src` keeps `'unsafe-inline'`: Next's inline bootstrap scripts differ per page and per build, so a sha256 list cannot cover them, and adding any hash makes browsers ignore `'unsafe-inline'` and break every page (computing the resume script's hash would protect nothing). A nonce via middleware is the follow-up if `'unsafe-inline'` must go. Grow is a top-level navigation, which CSP does not govern (`navigate-to` never shipped); `form-action` lists Grow's hosted origins in case a form ever posts there, and the redirect target is checked by `isGrowHostedUrl` on both server and client. The policy is enforced (not report-only) because every route is verified by an e2e that fails on any violation; if production shows a violation after release, Task 8 switches the header key to `Content-Security-Policy-Report-Only` in one line and records why.

- [ ] **Step 1: Failing unit tests.** `tests/unit/checkout.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import {
  checkoutSteps, clearCheckoutDraft, isEmail, isFullName, isGrowHostedUrl, readCheckoutDraft, readCheckoutEmail,
  readPaymentGender, rememberCheckoutEmail, saveCheckoutDraft, startPayment, toWebPlan, waitForAccess,
} from "@/lib/payment/checkout";

function memoryStorage(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  };
}

const invoker = (result: unknown) => ({ functions: { invoke: vi.fn().mockResolvedValue(result) } });
const httpError = (status: number) => ({ data: null, error: { name: "FunctionsHttpError", context: { status } } });
const INPUT = { plan: "ANNUAL" as const, installments: 6, fullName: "רחל כהן", email: "r@example.com", tokenConsent: false };
const HOSTED = "https://sandbox.meshulam.co.il/s/abc";

describe("checkout steps", () => {
  it("asks for everything when signed out", () => {
    expect(checkoutSteps(false, false)).toEqual(["name", "email", "phone", "summary"]);
  });
  it("asks a signed-in buyer only for what is missing", () => {
    expect(checkoutSteps(true, true)).toEqual(["email", "summary"]);
    expect(checkoutSteps(true, false)).toEqual(["name", "email", "summary"]);
  });
  it("maps site plans to edge-function plans", () => {
    expect([toWebPlan("annual"), toWebPlan("monthly")]).toEqual(["ANNUAL", "MONTHLY"]);
  });
});

describe("validation", () => {
  it("needs two words for a full name, as the edge function does", () => {
    expect(isFullName("רחל כהן")).toBe(true);
    expect(isFullName("ג'ורג'")).toBe(false);
    expect(isFullName("רחל")).toBe(false);
    expect(isFullName("רחל 2")).toBe(false);
  });
  it("checks email shape and length", () => {
    expect(isEmail(" r@example.com ")).toBe(true);
    expect(isEmail("a@b")).toBe(false);
    expect(isEmail(`${"a".repeat(250)}@b.co`)).toBe(false);
  });
  it("only Grow's https hosts count as a payment page", () => {
    expect(isGrowHostedUrl(HOSTED)).toBe(true);
    expect(isGrowHostedUrl("https://meshulam.co.il.evil.example/s")).toBe(false);
    expect(isGrowHostedUrl("http://secure.meshulam.co.il/s")).toBe(false);
  });
});

describe("startPayment", () => {
  it("sends the checkout body and returns the hosted url", async () => {
    const supabase = invoker({ data: { url: HOSTED, webPaymentId: "wp-1" }, error: null });
    expect(await startPayment(supabase as never, INPUT)).toEqual({ url: HOSTED, webPaymentId: "wp-1" });
    expect(supabase.functions.invoke).toHaveBeenCalledWith("createGrowPayment", { body: INPUT });
  });
  it.each([
    [400, "invalid_input"], [401, "signed_out"], [409, "already_subscribed"], [429, "rate_limited"],
    [502, "processor_error"], [503, "not_configured"], [500, "network"],
  ])("maps HTTP %i to %s", async (status, error) => {
    expect(await startPayment(invoker(httpError(status)) as never, INPUT)).toEqual({ error });
  });
  it("refuses a url that is not Grow's", async () => {
    const supabase = invoker({ data: { url: "https://evil.example/pay", webPaymentId: "wp-1" }, error: null });
    expect(await startPayment(supabase as never, INPUT)).toEqual({ error: "processor_error" });
  });
  it("a thrown invoke is a network error", async () => {
    const supabase = { functions: { invoke: vi.fn().mockRejectedValue(new Error("offline")) } };
    expect(await startPayment(supabase as never, INPUT)).toEqual({ error: "network" });
  });
});

describe("waitForAccess", () => {
  const clock = () => {
    let t = 0;
    return { now: () => t, sleep: async (ms: number) => void (t += ms) };
  };
  it("resolves as soon as the check passes", async () => {
    const check = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    expect(await waitForAccess(check, clock())).toBe("active");
    expect(check).toHaveBeenCalledTimes(2);
  });
  it("gives up after the window", async () => {
    const check = vi.fn().mockResolvedValue(false);
    expect(await waitForAccess(check, clock())).toBe("timeout");
    expect(check).toHaveBeenCalledTimes(16);
  });
  it("a failing check counts as not yet", async () => {
    const check = vi.fn().mockRejectedValueOnce(new Error("x")).mockResolvedValueOnce(true);
    expect(await waitForAccess(check, clock())).toBe("active");
  });
  it("stops when the page is gone", async () => {
    const check = vi.fn().mockResolvedValue(false);
    expect(await waitForAccess(check, { ...clock(), stopped: () => true })).toBe("timeout");
    expect(check).not.toHaveBeenCalled();
  });
});

describe("session storage", () => {
  it("reads the questionnaire's gender", () => {
    expect(readPaymentGender(memoryStorage({ "ap.funnel.gender": "female" }))).toBe("female");
    expect(readPaymentGender(memoryStorage({ "ap.funnel.gender": "other" }))).toBeUndefined();
    expect(readPaymentGender(undefined)).toBeUndefined();
  });
  it("round-trips the checkout draft and rejects junk", () => {
    const storage = memoryStorage();
    saveCheckoutDraft({ plan: "annual", name: "רחל כהן", email: "r@example.com", installments: 6 }, storage);
    expect(readCheckoutDraft(storage)).toEqual({ plan: "annual", name: "רחל כהן", email: "r@example.com", installments: 6 });
    clearCheckoutDraft(storage);
    expect(readCheckoutDraft(storage)).toBeNull();
    expect(readCheckoutDraft(memoryStorage({ "ap.checkout.draft": "{" }))).toBeNull();
    expect(readCheckoutDraft(memoryStorage({ "ap.checkout.draft": '{"plan":"weekly","name":"","email":"","installments":1}' }))).toBeNull();
  });
  it("remembers the invoice email for the success page", () => {
    const storage = memoryStorage();
    rememberCheckoutEmail("r@example.com", storage);
    expect(readCheckoutEmail(storage)).toBe("r@example.com");
  });
});
```

`tests/unit/csp.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildCsp, GROW_HOSTED_ORIGINS } from "@/lib/security/csp";

const directive = (csp: string, name: string) => csp.split("; ").find((d) => d === name || d.startsWith(`${name} `)) ?? "";

describe("buildCsp", () => {
  it("allows Supabase by its exact origin only", () => {
    expect(directive(buildCsp("https://abcd.supabase.co/"), "connect-src")).toBe("connect-src 'self' https://abcd.supabase.co");
  });
  it("falls back to self when Supabase is not configured", () => {
    expect(directive(buildCsp(undefined), "connect-src")).toBe("connect-src 'self'");
    expect(directive(buildCsp("not a url"), "connect-src")).toBe("connect-src 'self'");
  });
  it("loads no third-party script or frame: Grow is a full-page redirect", () => {
    const csp = buildCsp("https://abcd.supabase.co");
    expect(directive(csp, "script-src")).toBe("script-src 'self' 'unsafe-inline'");
    expect(directive(csp, "frame-src")).toBe("frame-src 'none'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toContain("cdn.meshulam");
  });
  it("cannot be framed, and forms post only to the site or Grow", () => {
    const csp = buildCsp("https://abcd.supabase.co");
    expect(directive(csp, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(csp, "form-action")).toBe(["form-action", "'self'", ...GROW_HOSTED_ORIGINS].join(" "));
    expect(directive(csp, "object-src")).toBe("object-src 'none'");
    expect(directive(csp, "base-uri")).toBe("base-uri 'self'");
  });
  it("keeps fonts, media and images first-party", () => {
    const csp = buildCsp("https://abcd.supabase.co");
    expect(directive(csp, "font-src")).toBe("font-src 'self'");
    expect(directive(csp, "media-src")).toBe("media-src 'self'");
    expect(directive(csp, "img-src")).toBe("img-src 'self' data: blob:");
  });
});
```

- [ ] **Step 2: Run, expect FAIL:** `npm test -- tests/unit/checkout.test.ts tests/unit/csp.test.ts`

- [ ] **Step 3: Implement the libraries.** `lib/payment/checkout.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanId } from "@/lib/constants";
import { GENDER_FOR_PAYMENT } from "@/lib/funnel/storage";
import type { Answers } from "@/lib/funnel/types";

export type WebPlan = "ANNUAL" | "MONTHLY";
export type CheckoutStep = "name" | "email" | "phone" | "summary";

export const toWebPlan = (plan: PlanId): WebPlan => (plan === "annual" ? "ANNUAL" : "MONTHLY");

/** Signed out: everything. Signed in: the phone is the account; the name only when the profile lacks a full one. */
export function checkoutSteps(signedIn: boolean, hasFullName: boolean): CheckoutStep[] {
  if (!signedIn) return ["name", "email", "phone", "summary"];
  return hasFullName ? ["email", "summary"] : ["name", "email", "summary"];
}

/** Mirrors the edge function (D6): two words once only letters, digits and spaces remain. */
export function isFullName(value: string): boolean {
  const safe = value
    .normalize("NFC")
    .replace(/\p{M}/gu, "")
    .replace(/['"`׳״]/g, "")
    .replace(/[^\p{L}\p{N} ]+/gu, " ");
  return safe.split(/\s+/).filter((word) => /\p{L}/u.test(word)).length >= 2;
}

const EMAIL_MAX = 254;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (value: string): boolean => value.trim().length <= EMAIL_MAX && EMAIL_RE.test(value.trim());

const GROW_HOST_RE = /^(?:[a-z0-9-]+\.)*meshulam\.co\.il$/;

/** The page we send the buyer to must be Grow's, over https (checked again here, after the server). */
export function isGrowHostedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && GROW_HOST_RE.test(url.hostname);
  } catch {
    return false;
  }
}

export type StartInput = { plan: WebPlan; installments: number; fullName: string; email: string; tokenConsent: boolean };
export type StartError =
  | "already_subscribed" | "invalid_input" | "signed_out" | "rate_limited" | "not_configured" | "processor_error" | "network";
export type StartResult = { url: string; webPaymentId: string } | { error: StartError };

const STATUS_ERROR: Record<number, StartError> = {
  400: "invalid_input",
  401: "signed_out",
  409: "already_subscribed",
  429: "rate_limited",
  502: "processor_error",
  503: "not_configured",
};

export async function startPayment(supabase: Pick<SupabaseClient, "functions">, input: StartInput): Promise<StartResult> {
  try {
    const { data, error } = await supabase.functions.invoke("createGrowPayment", { body: input });
    if (error) {
      const status = (error as { context?: { status?: unknown } }).context?.status;
      return { error: (typeof status === "number" && STATUS_ERROR[status]) || "network" };
    }
    const { url, webPaymentId } = (data ?? {}) as { url?: unknown; webPaymentId?: unknown };
    if (typeof url !== "string" || !isGrowHostedUrl(url) || typeof webPaymentId !== "string") return { error: "processor_error" };
    return { url, webPaymentId };
  } catch {
    return { error: "network" };
  }
}

type WaitOptions = {
  intervalMs?: number;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  stopped?: () => boolean;
};

const POLL_MS = 2_000;
const POLL_WINDOW_MS = 30_000;

/** Polls until access is granted or the window closes. The webhook, not this page, activates the subscription. */
export async function waitForAccess(check: () => Promise<boolean>, options: WaitOptions = {}): Promise<"active" | "timeout"> {
  const {
    intervalMs = POLL_MS,
    timeoutMs = POLL_WINDOW_MS,
    sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
    now = () => Date.now(),
    stopped = () => false,
  } = options;
  const deadline = now() + timeoutMs;
  for (;;) {
    if (stopped()) return "timeout";
    if (await check().catch(() => false)) return "active";
    if (now() + intervalMs > deadline) return "timeout";
    await sleep(intervalMs);
  }
}

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserSession(): Store | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

function safeRead(storage: Store | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeWrite(storage: Store | undefined, key: string, value: string | null): void {
  try {
    if (value === null) storage?.removeItem(key);
    else storage?.setItem(key, value);
  } catch {
    // Blocked storage: the checkout keeps working in memory.
  }
}

export function readPaymentGender(storage: Store | undefined = browserSession()): Answers["gender"] {
  const value = safeRead(storage, GENDER_FOR_PAYMENT);
  return value === "female" || value === "male" ? value : undefined;
}

const DRAFT_KEY = "ap.checkout.draft";
const EMAIL_KEY = "ap.checkout.email";

export type CheckoutDraft = { plan: PlanId; name: string; email: string; installments: number };

export function saveCheckoutDraft(draft: CheckoutDraft, storage: Store | undefined = browserSession()): void {
  safeWrite(storage, DRAFT_KEY, JSON.stringify(draft));
}

export function readCheckoutDraft(storage: Store | undefined = browserSession()): CheckoutDraft | null {
  try {
    const parsed: unknown = JSON.parse(safeRead(storage, DRAFT_KEY) ?? "null");
    if (!parsed || typeof parsed !== "object") return null;
    const d = parsed as Record<string, unknown>;
    if (d.plan !== "annual" && d.plan !== "monthly") return null;
    if (typeof d.name !== "string" || typeof d.email !== "string" || !Number.isInteger(d.installments)) return null;
    return { plan: d.plan, name: d.name, email: d.email, installments: d.installments as number };
  } catch {
    return null;
  }
}

export function clearCheckoutDraft(storage: Store | undefined = browserSession()): void {
  safeWrite(storage, DRAFT_KEY, null);
}

export function rememberCheckoutEmail(email: string, storage: Store | undefined = browserSession()): void {
  safeWrite(storage, EMAIL_KEY, email);
}

export function readCheckoutEmail(storage: Store | undefined = browserSession()): string | null {
  return safeRead(storage, EMAIL_KEY);
}
```

`lib/payment/copy.ts`:

```ts
import { g } from "@/lib/funnel/copy";
import type { Answers } from "@/lib/funnel/types";

type Gendered = { readonly fem: string; readonly masc: string };

export const gendered = (gender: Answers["gender"], text: Gendered): string => g(gender, text.fem, text.masc);

export const CHECKOUT_COPY = {
  heading: "רכישת מנוי",
  loading: "רגע, מכינים את הרכישה",
  chosenPlan: "המסלול שבחרת:",
  changePlan: "שינוי",
  stepOf: "שלב {x} מתוך {n}",
  back: "לשלב הקודם",
  next: "לשלב הבא",
  nameTitle: "מה שמך המלא?",
  namePlaceholder: "שם פרטי ושם משפחה",
  nameError: "צריך שם פרטי ושם משפחה, באותיות בלבד",
  emailTitle: "לאן לשלוח את החשבונית?",
  emailPlaceholder: "האימייל שלך",
  emailError: "כתובת האימייל לא נראית תקינה",
  phoneLocked: "מספר הטלפון הוא החשבון שאיתו נכנסים לאפליקציה, ולכן הוא לא נערך כאן.",
  edit: "עריכה",
  save: "שמירה",
  summaryTitle: "סיכום הזמנה",
  rows: { plan: "מסלול", price: "מחיר", total: "סה״כ לתשלום", name: "שם", email: "אימייל", phone: "טלפון", installments: "מספר תשלומים" },
  installmentOption: "{n} תשלומים",
  singlePayment: "תשלום אחד",
  perInstallment: "כל תשלום: {amount}",
  monthlyTerms: "חיוב חודשי של {amount} בהוראת קבע. אפשר לבטל בכל עת באתר.",
  consentLabel: "שמירת פרטי הכרטיס לחידוש עתידי",
  consentHelp: {
    fem: "אני מסכימה ש־Grow תשמור אסימון מוצפן של הכרטיס, לא את מספר הכרטיס, כדי שנוכל להציע חידוש בעוד שנה. בלי הסכמה לא נשמר דבר.",
    masc: "אני מסכים ש־Grow תשמור אסימון מוצפן של הכרטיס, לא את מספר הכרטיס, כדי שנוכל להציע חידוש בעוד שנה. בלי הסכמה לא נשמר דבר.",
  },
  pay: "לתשלום מאובטח",
  paying: "מעבירים לעמוד התשלום המאובטח של Grow",
  secureNote: "התשלום מתבצע בעמוד המאובטח של Grow (משולם). פרטי הכרטיס לא עוברים דרך האתר ולא נשמרים בו.",
  cancelled: "התשלום לא הושלם ולא חויב דבר. אפשר לנסות שוב.",
  errors: {
    already_subscribed: "כבר יש לך מנוי פעיל. אפשר להמשיך להתאמן באפליקציה.",
    not_configured: "התשלום באתר עדיין לא פתוח. בינתיים אפשר לרכוש מנוי באפליקציה.",
    invalid_input: "חלק מהפרטים לא תקינים. כדאי לבדוק את השם והאימייל.",
    rate_limited: { fem: "היו הרבה ניסיונות ברצף. נסי שוב בעוד כמה דקות.", masc: "היו הרבה ניסיונות ברצף. נסה שוב בעוד כמה דקות." },
    signed_out: "צריך לאמת שוב את מספר הטלפון.",
    processor_error: "לא הצלחנו לפתוח את עמוד התשלום. אפשר לנסות שוב.",
    network: "אין חיבור כרגע. אפשר לנסות שוב.",
  },
  success: {
    title: { fem: "ברוכה הבאה לפעילים+", masc: "ברוך הבא לפעילים+" },
    titleNeutral: "ברוכים הבאים לפעילים+",
    checking: "בודקים את המנוי",
    received: "התשלום התקבל, והחשבונית נשלחה ל־{email}.",
    receivedNoEmail: "התשלום התקבל, והחשבונית נשלחת לאימייל שמסרת.",
    pending: "התשלום התקבל ואנחנו מסיימים להפעיל את המנוי. זה יכול לקחת כמה דקות.",
    steps: [
      { title: "מורידים את האפליקציה", body: "פעילים+ זמינה לאייפון ולאנדרואיד." },
      { title: "נכנסים עם אותו מספר טלפון", body: "מתחברים עם המספר שאימתת כאן, וקוד חד־פעמי יישלח ב־SMS." },
      { title: "התוכנית האישית כבר מחכה", body: "התשובות מהשאלון נשמרו בפרופיל, כך שאפשר להתחיל להתאמן מיד." },
    ],
    manage: "ניהול המנוי",
  },
} as const;

/** Task 6 adds the subscription page's strings here. */
export const ACCOUNT_COPY = {} as const;
```

`lib/security/csp.ts`:

```ts
/**
 * The site's Content-Security-Policy. Everything the pages load is
 * first-party: next/font self-hosts the fonts, the hero video and images are
 * served from the site, and the only cross-origin calls go to Supabase (auth,
 * REST, edge functions), allowed by its exact origin. Payment is a full-page
 * redirect to Grow's hosted page (D1), so no Grow script or frame loads here;
 * top-level navigation is outside CSP, and the target is checked by
 * isGrowHostedUrl on the server and in the browser.
 *
 * script-src keeps 'unsafe-inline': the App Router writes inline
 * self.__next_f.push(...) bootstrap scripts that differ per page and per
 * build, so a hash list cannot cover them, and adding any hash would make
 * browsers ignore 'unsafe-inline' and break every page. The questionnaire's
 * resume script is covered by the same keyword. Moving to a per-request nonce
 * (middleware on every route) is the follow-up if 'unsafe-inline' must go.
 */
export const GROW_HOSTED_ORIGINS = ["https://secure.meshulam.co.il", "https://sandbox.meshulam.co.il"] as const;

function originOf(url: string | undefined): string | null {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
}

export function buildCsp(supabaseUrl: string | undefined): string {
  const supabase = originOf(supabaseUrl);
  const directives: readonly (readonly [string, readonly string[]])[] = [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'", "'unsafe-inline'"]],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", "data:", "blob:"]],
    ["font-src", ["'self'"]],
    ["media-src", ["'self'"]],
    ["connect-src", ["'self'", ...(supabase ? [supabase] : [])]],
    ["frame-src", ["'none'"]],
    ["frame-ancestors", ["'none'"]],
    ["form-action", ["'self'", ...GROW_HOSTED_ORIGINS]],
    ["base-uri", ["'self'"]],
    ["object-src", ["'none'"]],
  ];
  return directives.map(([name, values]) => [name, ...values].join(" ")).join("; ");
}
```

- [ ] **Step 4: Run, expect PASS:** `npm test -- tests/unit/checkout.test.ts tests/unit/csp.test.ts`

- [ ] **Step 5: UI.** `components/payment/CheckoutFields.tsx`:

```tsx
"use client";

import { useRef, useState, type FormEvent } from "react";
import { ContinueButton, FieldError, fieldClass } from "@/components/funnel/parts";
import { isEmail, isFullName } from "@/lib/payment/checkout";
import { CHECKOUT_COPY as C } from "@/lib/payment/copy";

type FieldProps = {
  id: string;
  label: string;
  placeholder: string;
  error: string;
  type: "text" | "email";
  autoComplete: string;
  value: string;
  valid: (value: string) => boolean;
  submitLabel: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
};

/** One labelled field and its continue button; the label is the step's question. */
function Field({ id, label, placeholder, error, type, autoComplete, value, valid, submitLabel, onChange, onSubmit }: FieldProps) {
  const [shown, setShown] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const errorId = `${id}-error`;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim().replace(/\s+/g, " ");
    if (!valid(trimmed)) {
      setShown(error);
      input.current?.focus();
      return;
    }
    onSubmit(trimmed);
  };
  return (
    <form noValidate onSubmit={submit}>
      <label htmlFor={id} className="block font-display text-h3 font-bold">
        {label}
      </label>
      <input
        ref={input}
        id={id}
        type={type}
        dir={type === "email" ? "ltr" : undefined}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-describedby={shown ? errorId : undefined}
        aria-invalid={shown ? true : undefined}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          if (shown && valid(event.target.value.trim())) setShown("");
        }}
        className={`mt-4 ${fieldClass(Boolean(shown))}`}
      />
      <FieldError id={errorId} text={shown} />
      <ContinueButton type="submit" label={submitLabel} />
    </form>
  );
}

type StepProps = { value: string; onChange: (value: string) => void; onSubmit: (value: string) => void; submitLabel?: string };

export function NameStep({ value, onChange, onSubmit, submitLabel = C.next }: StepProps) {
  return (
    <Field id="checkout-name" label={C.nameTitle} placeholder={C.namePlaceholder} error={C.nameError} type="text"
      autoComplete="name" value={value} valid={isFullName} submitLabel={submitLabel} onChange={onChange} onSubmit={onSubmit} />
  );
}

export function EmailStep({ value, onChange, onSubmit, submitLabel = C.next }: StepProps) {
  return (
    <Field id="checkout-email" label={C.emailTitle} placeholder={C.emailPlaceholder} error={C.emailError} type="email"
      autoComplete="email" value={value} valid={isEmail} submitLabel={submitLabel} onChange={onChange} onSubmit={onSubmit} />
  );
}
```

`components/payment/CheckoutSummary.tsx`:

```tsx
"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { LockIcon } from "@/components/ui/icons";
import { PLANS, STORE_ANDROID, STORE_IOS, type PlanId } from "@/lib/constants";
import type { Answers } from "@/lib/funnel/types";
import { rememberCheckoutEmail, startPayment, toWebPlan, type CheckoutStep, type StartError } from "@/lib/payment/checkout";
import { CHECKOUT_COPY as C, gendered } from "@/lib/payment/copy";
import { formatLocal } from "@/lib/phone";
import { formatShekel, installmentAmount } from "@/lib/pricing";
import { loadBrowserSupabase } from "@/lib/supabase/lazy";

const INSTALLMENTS_ID = "checkout-installments";
const CONSENT_ID = "checkout-consent";
const CONSENT_HELP_ID = "checkout-consent-help";
const LINKISH = "inline-flex min-h-12 items-center rounded-[10px] px-2 font-bold text-blue-deep underline underline-offset-4 hover:bg-blue-wash";

type Props = {
  plan: PlanId;
  name: string;
  email: string;
  phone: string | null;
  gender: Answers["gender"];
  installments: number;
  onInstallments: (count: number) => void;
  onEdit: (step: CheckoutStep) => void;
  onSignedOut: () => void;
};

type Status = { kind: "idle" } | { kind: "redirecting" } | { kind: "error"; error: StartError };

function errorText(error: StartError, gender: Answers["gender"]): string {
  const text = C.errors[error];
  return typeof text === "string" ? text : gendered(gender, text);
}

export default function CheckoutSummary({ plan, name, email, phone, gender, installments, onInstallments, onEdit, onSignedOut }: Props) {
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const info = PLANS.find((p) => p.id === plan) ?? PLANS[0];
  const annual = plan === "annual";

  const pay = async () => {
    if (status.kind === "redirecting") return;
    setStatus({ kind: "redirecting" });
    const supabase = await loadBrowserSupabase();
    const result = supabase
      ? await startPayment(supabase, { plan: toWebPlan(plan), installments: annual ? installments : 1, fullName: name, email, tokenConsent: annual && consent })
      : ({ error: "network" } as const);
    if ("url" in result) {
      rememberCheckoutEmail(email);
      window.location.assign(result.url);
      return;
    }
    if (result.error === "signed_out") {
      setStatus({ kind: "idle" });
      onSignedOut();
      return;
    }
    setStatus({ kind: "error", error: result.error });
  };

  const rows: [string, string, CheckoutStep | null][] = [
    [C.rows.plan, info.longName, null],
    [C.rows.price, `${formatShekel(info.price)} ${info.priceSuffix}`, null],
    [C.rows.total, formatShekel(info.total), null],
    [C.rows.name, name, "name"],
    [C.rows.email, email, "email"],
    ...(phone ? [[C.rows.phone, formatLocal(phone), null] as [string, string, CheckoutStep | null]] : []),
  ];

  return (
    <div>
      <h3 className="font-display text-h3 font-bold">{C.summaryTitle}</h3>
      <dl className="mt-5 grid gap-3">
        {rows.map(([label, value, step]) => (
          <div key={label} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-hairline pb-3">
            <dt className="text-ink-soft">{label}</dt>
            <dd className="flex items-center gap-2 font-display text-lead font-bold">
              <bdi>{value}</bdi>
              {step ? (
                <button type="button" className={LINKISH} onClick={() => onEdit(step)} aria-label={`${C.edit} ${label}`}>
                  {C.edit}
                </button>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>

      {annual ? (
        <div className="mt-6">
          <label htmlFor={INSTALLMENTS_ID} className="mb-2 block font-display font-bold">
            {C.rows.installments}
          </label>
          <select
            id={INSTALLMENTS_ID}
            value={installments}
            onChange={(event) => onInstallments(Number(event.target.value))}
            className="min-h-[60px] w-full rounded-field border-2 border-hairline bg-white px-4 text-lead"
          >
            {Array.from({ length: info.maxInstallments }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n === 1 ? C.singlePayment : C.installmentOption.replace("{n}", String(n))}
              </option>
            ))}
          </select>
          <p className="mt-2 text-lead">{C.perInstallment.replace("{amount}", formatShekel(installmentAmount(info.total, installments)))}</p>

          <div className="mt-6 flex items-start gap-3">
            <input
              id={CONSENT_ID}
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              aria-describedby={CONSENT_HELP_ID}
              className="mt-1 h-6 w-6 shrink-0 accent-blue-deep"
            />
            <div>
              <label htmlFor={CONSENT_ID} className="font-display font-bold">
                {C.consentLabel}
              </label>
              <p id={CONSENT_HELP_ID} className="mt-1 text-ink-soft">
                {gendered(gender, C.consentHelp)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-lead">{C.monthlyTerms.replace("{amount}", formatShekel(info.price))}</p>
      )}

      {status.kind === "error" ? (
        <div role="alert" className="mt-6 rounded-field bg-burgundy-wash px-4 py-3 font-medium text-burgundy">
          <p>{errorText(status.error, gender)}</p>
          {status.error === "already_subscribed" || status.error === "not_configured" ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <Button href={STORE_IOS} variant="outline">App Store</Button>
              <Button href={STORE_ANDROID} variant="outline">Google Play</Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-7 grid gap-3">
        <Button size="lg" className="w-full" onClick={() => void pay()} disabled={status.kind === "redirecting"}>
          {status.kind === "redirecting" ? C.paying : C.pay}
        </Button>
        <p className="flex items-center gap-2 text-ink-soft">
          <LockIcon className="h-5 w-5 shrink-0" />
          {C.secureNote}
        </p>
      </div>
    </div>
  );
}
```

`components/payment/Checkout.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Otp from "@/components/funnel/Otp";
import Register from "@/components/funnel/Register";
import { PLANS, type PlanId } from "@/lib/constants";
import { loadSession } from "@/lib/funnel/storage";
import {
  checkoutSteps, isEmail, isFullName, readCheckoutDraft, readPaymentGender, saveCheckoutDraft, type CheckoutStep,
} from "@/lib/payment/checkout";
import { CHECKOUT_COPY as C } from "@/lib/payment/copy";
import { formatLocal } from "@/lib/phone";
import { formatShekel } from "@/lib/pricing";
import { loadBrowserSupabase } from "@/lib/supabase/lazy";
import { EmailStep, NameStep } from "./CheckoutFields";
import CheckoutSummary from "./CheckoutSummary";

type Identity = { signedIn: boolean; name: string; phone: string | null };
type PhoneView = { sub: "phone" | "otp"; phone: string };

const SIGNED_OUT: Identity = { signedIn: false, name: "", phone: null };
const LINKISH = "inline-flex min-h-12 items-center rounded-[10px] px-2 font-bold text-blue-deep underline underline-offset-4 hover:bg-blue-wash";

async function loadIdentity(): Promise<Identity> {
  const supabase = await loadBrowserSupabase();
  if (!supabase) return SIGNED_OUT;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return SIGNED_OUT;
  const { data: profile } = await supabase.from("users").select("full_name").eq("id", data.user.id).maybeSingle();
  const phone = data.user.phone ? `+${data.user.phone.replace(/^\+/, "")}` : null;
  return { signedIn: true, name: (profile as { full_name?: string | null } | null)?.full_name?.trim() ?? "", phone };
}

type Props = {
  plan: PlanId;
  /** Returns the buyer to the plan cards above (the choice stays live). */
  onChangePlan: () => void;
};

/** The checkout steps under the plan selector: identity, invoice email, then the summary that hands off to Grow. */
export default function Checkout({ plan, onChangePlan }: Props) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [steps, setSteps] = useState<CheckoutStep[]>([]);
  const [index, setIndex] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [installments, setInstallments] = useState(1);
  const [editingName, setEditingName] = useState(false);
  const [phoneView, setPhoneView] = useState<PhoneView>({ sub: "phone", phone: "" });
  const [busy, setBusy] = useState(false);
  const [session] = useState(() => loadSession());
  const [gender] = useState(() => readPaymentGender());
  const heading = useRef<HTMLHeadingElement>(null);
  const info = PLANS.find((p) => p.id === plan) ?? PLANS[0];

  // First load, and again after Otp's router.push("/payment") remounts the page: resume from the draft.
  useEffect(() => {
    let alive = true;
    void loadIdentity().then((loaded) => {
      if (!alive) return;
      const draft = readCheckoutDraft();
      const fullName = draft && isFullName(draft.name) ? draft.name : loaded.name;
      const draftEmail = draft?.email ?? "";
      const nextSteps = checkoutSteps(loaded.signedIn, isFullName(fullName));
      const resume = loaded.signedIn && isFullName(fullName) && isEmail(draftEmail);
      setIdentity(loaded);
      setName(fullName);
      setEmail(draftEmail);
      setInstallments(draft?.installments ?? 1);
      setSteps(nextSteps);
      setIndex(resume ? nextSteps.indexOf("summary") : 0);
      heading.current?.focus();
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (identity) saveCheckoutDraft({ plan, name, email, installments });
  }, [identity, plan, name, email, installments]);

  const step = steps[index];
  const next = () => setIndex((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setIndex((i) => Math.max(i - 1, 0));
  const goTo = (target: CheckoutStep) => {
    if (target === "name" && !steps.includes("name")) return setEditingName(true);
    const i = steps.indexOf(target);
    if (i >= 0) setIndex(i);
  };

  const afterSignIn = async () => {
    const loaded = await loadIdentity();
    setIdentity({ ...loaded, name: loaded.name || name });
    next();
  };

  const signInAgain = () => {
    const signedOutSteps = checkoutSteps(false, true);
    setIdentity(SIGNED_OUT);
    setSteps(signedOutSteps);
    setPhoneView({ sub: "phone", phone: "" });
    setIndex(signedOutSteps.indexOf("phone"));
  };

  if (!identity) {
    return (
      <section id="checkout" aria-busy="true" className="mt-10 rounded-card bg-surface p-[clamp(1rem,3.5vw,2.5rem)] shadow-lift-2">
        <p className="text-lead">{C.loading}</p>
      </section>
    );
  }

  const body = editingName ? (
    <NameStep value={name} onChange={setName} submitLabel={C.save} onSubmit={(value) => { setName(value); setEditingName(false); }} />
  ) : step === "name" ? (
    <NameStep value={name} onChange={setName} onSubmit={(value) => { setName(value); next(); }} />
  ) : step === "email" ? (
    <EmailStep value={email} onChange={setEmail} onSubmit={(value) => { setEmail(value); next(); }} />
  ) : step === "phone" ? (
    phoneView.sub === "phone" ? (
      <Register
        view={{ sub: "phone", phone: phoneView.phone }}
        gender={gender}
        name={name}
        onNameChange={setName}
        onName={setName}
        onCodeSent={(phone) => setPhoneView({ sub: "otp", phone })}
        onBusy={setBusy}
      />
    ) : (
      <Otp
        phone={phoneView.phone}
        answers={{ ...session.answers, full_name: name }}
        sessionId={session.id}
        onEditPhone={() => setPhoneView((view) => ({ ...view, sub: "phone" }))}
        onComplete={() => void afterSignIn()}
        onBusy={setBusy}
      />
    )
  ) : (
    <CheckoutSummary
      plan={plan}
      name={name}
      email={email}
      phone={identity.phone}
      gender={gender}
      installments={installments}
      onInstallments={setInstallments}
      onEdit={goTo}
      onSignedOut={signInAgain}
    />
  );

  return (
    <section id="checkout" aria-labelledby="checkout-heading" className="mt-10 rounded-card bg-surface p-[clamp(1rem,3.5vw,2.5rem)] shadow-lift-2">
      <h2 id="checkout-heading" ref={heading} tabIndex={-1} className="font-display text-h3 font-bold outline-none">
        {C.heading}
      </h2>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 text-lead">
        {C.chosenPlan} <strong>{`${info.longName}, ${formatShekel(info.price)} ${info.priceSuffix}`}</strong>
        <button type="button" className={LINKISH} onClick={onChangePlan}>
          {C.changePlan}
        </button>
      </p>

      {identity.signedIn && !editingName && step !== "summary" ? (
        <dl className="mt-5 grid gap-2 text-lead">
          {name ? (
            <div className="flex flex-wrap items-center gap-x-3">
              <dt className="text-ink-soft">{C.rows.name}</dt>
              <dd className="font-bold"><bdi>{name}</bdi></dd>
              <dd>
                <button type="button" className={LINKISH} onClick={() => goTo("name")}>{C.edit}</button>
              </dd>
            </div>
          ) : null}
          {identity.phone ? (
            <div className="flex flex-wrap items-center gap-x-3">
              <dt className="text-ink-soft">{C.rows.phone}</dt>
              <dd className="font-bold"><bdi dir="ltr">{formatLocal(identity.phone)}</bdi></dd>
              <dd className="basis-full text-base text-ink-soft">{C.phoneLocked}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {!editingName ? (
        <p className="mt-6 font-bold text-ink-soft" aria-live="polite">
          {C.stepOf.replace("{x}", String(index + 1)).replace("{n}", String(steps.length))}
        </p>
      ) : null}
      <div className="mt-4">{body}</div>
      {index > 0 && !busy && !editingName && step !== "phone" ? (
        <button type="button" className={`mt-4 ${LINKISH}`} onClick={back}>
          {C.back}
        </button>
      ) : null}
    </section>
  );
}
```

`Register`'s phone step and `Otp` render their titles through the funnel's `StepTitle` (an `h1`), so `/payment` briefly has two `h1`s during phone verification. That is the accepted cost of reusing them unchanged; `pages.spec.ts` checks the initial render, which still has one.

`components/payment/PaymentFlow.tsx` (full file):

```tsx
"use client";

import { useEffect, useState } from "react";
import Checkout from "@/components/payment/Checkout";
import PlanSelector from "@/components/payment/PlanSelector";
import StoreFallback from "@/components/payment/StoreFallback";
import type { PlanId } from "@/lib/constants";
import { readCheckoutDraft } from "@/lib/payment/checkout";
import { WEB_CHECKOUT_ENABLED } from "@/lib/payment/config";
import { CHECKOUT_COPY as C } from "@/lib/payment/copy";

type Props = {
  /** Plan preselected from `/payment?plan=`; validated by the page. */
  initialPlan?: PlanId;
  /** Back from Grow's cancel URL (`/payment?cancelled=1`). */
  cancelled?: boolean;
};

/**
 * Owns the buyer's plan choice and what comes after the plans. Flag off
 * (production until Task 9): the store fallback ends the path. Flag on:
 * "המשך לרכישה" opens the checkout under the plans; a checkout draft in
 * sessionStorage (Otp's remount, Grow's cancel URL) reopens it directly.
 */
export default function PaymentFlow({ initialPlan = "annual", cancelled = false }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlan);
  const [stage, setStage] = useState<"plans" | "checkout">("plans");

  useEffect(() => {
    if (!WEB_CHECKOUT_ENABLED) return;
    const draft = readCheckoutDraft();
    if (!draft) return;
    setSelectedPlan(draft.plan);
    setStage("checkout");
  }, []);

  const changePlan = () => {
    const checked = document.querySelector<HTMLInputElement>('input[name="plan"]:checked');
    checked?.scrollIntoView({ block: "center" });
    checked?.focus();
  };

  return (
    <>
      {WEB_CHECKOUT_ENABLED && cancelled ? (
        <p role="status" className="mt-6 rounded-field bg-blue-wash px-4 py-3 text-lead font-medium">
          {C.cancelled}
        </p>
      ) : null}
      <PlanSelector
        selected={selectedPlan}
        onSelect={setSelectedPlan}
        onContinue={WEB_CHECKOUT_ENABLED && stage === "plans" ? () => setStage("checkout") : undefined}
      />
      {WEB_CHECKOUT_ENABLED ? (
        stage === "checkout" ? <Checkout plan={selectedPlan} onChangePlan={changePlan} /> : null
      ) : (
        <StoreFallback />
      )}
    </>
  );
}
```

`components/payment/PlanSelector.tsx`: change `PAYMENT_METHODS` to `["Visa", "Mastercard"] as const` with the comment `// Grow's hosted pages: card for both plans. Task 9 adds Bit / Apple Pay / Google Pay if the one-time page shows them.` (a standing order is card-only, and the hosted pages' methods are confirmed only in Task 9).

`app/payment/page.tsx`: widen `searchParams` to `Promise<{ plan?: string | string[]; cancelled?: string | string[] }>`, read `const { plan, cancelled } = await searchParams;`, and render `<PaymentFlow initialPlan={parsePlan(plan)} cancelled={(Array.isArray(cancelled) ? cancelled[0] : cancelled) === "1"} />`.

- [ ] **Step 6: Success page.** `components/payment/PaymentSuccess.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { STORE_ANDROID, STORE_IOS } from "@/lib/constants";
import type { Answers } from "@/lib/funnel/types";
import { clearCheckoutDraft, readCheckoutEmail, readPaymentGender, waitForAccess } from "@/lib/payment/checkout";
import { WEB_CHECKOUT_ENABLED } from "@/lib/payment/config";
import { CHECKOUT_COPY, gendered } from "@/lib/payment/copy";
import { loadBrowserSupabase } from "@/lib/supabase/lazy";

const S = CHECKOUT_COPY.success;

type State = "checking" | "active" | "pending";

/** Grow's success URL lands here. The webhook activates the subscription; this page only waits to see it. */
export default function PaymentSuccess() {
  const [state, setState] = useState<State>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [gender, setGender] = useState<Answers["gender"]>(undefined);

  useEffect(() => {
    let alive = true;
    setEmail(readCheckoutEmail());
    setGender(readPaymentGender());
    clearCheckoutDraft();
    void (async () => {
      const supabase = await loadBrowserSupabase();
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      if (!supabase || !session) {
        if (alive) setState("pending");
        return;
      }
      const result = await waitForAccess(
        async () => {
          const { data, error } = await supabase.functions.invoke("checkUserSubscription", { body: {} });
          return !error && (data as { hasAccess?: unknown } | null)?.hasAccess === true;
        },
        { stopped: () => !alive },
      );
      if (alive) setState(result === "active" ? "active" : "pending");
    })();
    return () => {
      alive = false;
    };
  }, []);

  const title = gender ? gendered(gender, S.title) : S.titleNeutral;
  const message = state === "pending" ? S.pending : email ? S.received.replace("{email}", email) : S.receivedNoEmail;

  return (
    <div className="mx-auto max-w-[44rem] text-center">
      <span aria-hidden="true" className="mx-auto mb-6 flex h-[84px] w-[84px] items-center justify-center rounded-pill bg-green-deep text-white">
        <CheckIcon className="h-[42px] w-[42px]" />
      </span>
      <h1 id="payment-success-heading" className="font-display text-[clamp(2rem,1.4rem+2.2vw,3rem)] font-black leading-[1.08]">{title}</h1>
      <p role="status" className="mt-4 text-lead">
        {state === "checking" ? S.checking : <bdi>{message}</bdi>}
      </p>
      <ol className="mt-10 grid gap-5 text-start">
        {S.steps.map((step, i) => (
          <li key={step.title} className="flex gap-4 rounded-card bg-surface p-5 shadow-lift-1">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-blue-deep font-display font-bold text-white">{i + 1}</span>
            <span>
              <strong className="block font-display text-lead">{step.title}</strong>
              <span className="text-ink-soft">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button href={STORE_IOS} size="lg">App Store</Button>
        <Button href={STORE_ANDROID} size="lg" variant="outline">Google Play</Button>
      </div>
      {WEB_CHECKOUT_ENABLED ? (
        <Link href="/account/subscription" className="mt-6 inline-flex min-h-12 items-center font-bold text-blue-deep underline underline-offset-4">
          {S.manage}
        </Link>
      ) : null}
    </div>
  );
}
```

`app/payment/success/page.tsx`:

```tsx
import type { Metadata } from "next";
import PaymentSuccess from "@/components/payment/PaymentSuccess";
import Section from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "התשלום התקבל",
  robots: { index: false, follow: false },
};

export default function PaymentSuccessPage() {
  return (
    <Section id="payment-success" labelledBy="payment-success-heading" className="pt-[clamp(2.5rem,5vw,4.5rem)]">
      <PaymentSuccess />
    </Section>
  );
}
```

- [ ] **Step 7: CSP header and test plumbing.** `next.config.ts`:

```ts
import type { NextConfig } from "next";
import { LEGACY_REDIRECTS } from "./lib/redirects";
import { MEDIA_CACHE_RULES } from "./lib/cache-headers";
import { buildCsp } from "./lib/security/csp";

// Production builds only (next build / next start, which is also what the e2e
// serves): next dev needs eval and a websocket the policy does not allow.
const CSP = process.env.NODE_ENV === "production"
  ? [{ key: "Content-Security-Policy", value: buildCsp(process.env.NEXT_PUBLIC_SUPABASE_URL) }]
  : [];

const nextConfig: NextConfig = {
  // The e2e builds (playwright configs) write to their own folders, so their
  // stub Supabase env never overwrites the local .next. Unset everywhere
  // else, including Vercel, so production builds keep the default.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async redirects() {
    return LEGACY_REDIRECTS.map((r) => ({ ...r, permanent: true }));
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          ...CSP,
        ],
      },
      ...MEDIA_CACHE_RULES,
    ];
  },
};

export default nextConfig;
```

`playwright.config.ts`: add `testIgnore: /checkout\.spec\.ts$/,` next to `testDir`.

`playwright.checkout.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";
import { E2E_SUPABASE } from "./tests/e2e/supabase-stub";

/** The checkout needs NEXT_PUBLIC_WEB_CHECKOUT=true at build time, so it gets its own build, port and folder. */
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: /checkout\.spec\.ts$/,
  use: { baseURL: "http://localhost:3101", locale: "he-IL" },
  webServer: {
    command: "npm run build && npx next start -p 3101",
    port: 3101,
    reuseExistingServer: process.env.PW_REUSE_SERVER === "1",
    timeout: 240_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: E2E_SUPABASE.url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: E2E_SUPABASE.anonKey,
      SUPABASE_URL: E2E_SUPABASE.url,
      SUPABASE_SERVICE_ROLE_KEY: "e2e-service-key",
      NEXT_PUBLIC_WEB_CHECKOUT: "true",
      NEXT_DIST_DIR: ".next-e2e-checkout",
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
});
```

`package.json` scripts: add `"test:e2e:checkout": "playwright test -c playwright.checkout.config.ts"`. `.gitignore`: add `/.next-e2e-checkout/` under `/.next-e2e/`.

- [ ] **Step 8: e2e.** `tests/e2e/csp-helpers.ts`:

```ts
import type { Page } from "@playwright/test";

/**
 * Collects CSP violations: the console messages (they survive navigation) and
 * securitypolicyviolation events on the current document.
 */
export async function watchCsp(page: Page): Promise<() => Promise<string[]>> {
  const fromConsole: string[] = [];
  page.on("console", (message) => {
    if (/Content Security Policy/i.test(message.text())) fromConsole.push(message.text());
  });
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] };
    w.__csp = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      w.__csp.push(`${event.effectiveDirective} ${event.blockedURI}`);
    });
  });
  return async () => {
    const fromEvents = await page
      .evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? [])
      .catch(() => [] as string[]);
    return [...fromConsole, ...fromEvents];
  };
}
```

`tests/e2e/csp.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { SITE_ROUTES } from "../../lib/routes";
import { watchCsp } from "./csp-helpers";
import { stubSupabase } from "./supabase-stub";

const ROUTES = [...SITE_ROUTES, "/payment/success?wp=0f8b6c2e9a414d3b8e571c2d3e4f5a6b", "/account/subscription"];

for (const route of ROUTES) {
  test(`${route} loads under the enforced CSP with no violation`, async ({ page }) => {
    await stubSupabase(page);
    const violations = await watchCsp(page);
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    expect(res?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForLoadState("networkidle");
    expect(await violations()).toEqual([]);
  });
}
```

(`/account/subscription` arrives in Task 6. Until then keep it out of `ROUTES`; Task 6 adds it back.)

`tests/e2e/checkout.spec.ts`:

```ts
import { expect, test, type Page, type Route } from "@playwright/test";
import { OTP_LENGTH } from "../../lib/funnel/constants";
import { COPY } from "../../lib/funnel/copy";
import { CHECKOUT_COPY as C } from "../../lib/payment/copy";
import { watchCsp } from "./csp-helpers";
import { GOOD_CODE, stubSupabase } from "./supabase-stub";

/*
  The checkout against stubbed Supabase and a stubbed Grow page: no request
  leaves the machine and nothing is charged. createGrowPayment and
  checkUserSubscription are answered here; the redirect to Grow lands on a
  local stub page. Alerts are matched by text: Next's route announcer is a
  second, empty role="alert" on every page.
*/

const GROW_URL = "https://sandbox.meshulam.co.il/s/e2e-hosted-page";
const WP = "0f8b6c2e-9a41-4d3b-8e57-1c2d3e4f5a6b";
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "POST, OPTIONS",
};

type Reply = { status: number; body: unknown };
const OK: Reply = { status: 200, body: { url: GROW_URL, webPaymentId: WP } };

const fulfil = (route: Route, reply: Reply) =>
  route.request().method() === "OPTIONS"
    ? route.fulfill({ status: 204, headers: CORS })
    : route.fulfill({ status: reply.status, headers: CORS, contentType: "application/json", body: JSON.stringify(reply.body) });

/** Registered after stubSupabase, so these run first. Returns the createGrowPayment bodies sent. */
async function stubFunctions(page: Page, create: Reply = OK, access: Reply = { status: 200, body: { hasAccess: true } }) {
  const sent: unknown[] = [];
  await page.route(/\/functions\/v1\/createGrowPayment$/, (route) => {
    if (route.request().method() === "POST") sent.push(route.request().postDataJSON());
    return fulfil(route, create);
  });
  await page.route(/\/functions\/v1\/checkUserSubscription$/, (route) => fulfil(route, access));
  await page.route(`${new URL(GROW_URL).origin}/**`, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Grow</title><h1>Grow</h1>" }));
  return sent;
}

async function openCheckout(page: Page, plan: "annual" | "monthly" = "annual") {
  await page.goto(`/payment?plan=${plan}`);
  await page.getByRole("button", { name: "המשך לרכישה" }).click();
  await expect(page.getByRole("heading", { name: C.heading })).toBeVisible();
}

async function signUp(page: Page, name = "רחל כהן", email = "r@example.com") {
  await page.getByLabel(C.nameTitle).fill(name);
  await page.getByRole("button", { name: C.next }).click();
  await page.getByLabel(C.emailTitle).fill(email);
  await page.getByRole("button", { name: C.next }).click();
  await page.getByLabel(COPY.register.phoneLabel, { exact: true }).fill("0501234567");
  await page.getByRole("button", { name: COPY.register.phoneCta }).click();
  await page.getByLabel(COPY.otp.codeLabel.replace("{n}", String(OTP_LENGTH))).fill(GOOD_CODE);
  await expect(page.getByRole("heading", { name: C.summaryTitle })).toBeVisible();
}

const SIGN_UP_STUB = { profileName: null, profileAfterMerge: "רחל כהן" };

test("signed out, annual in 6 installments: verifies the phone, then hands off to Grow without a token", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  const sent = await stubFunctions(page);
  const violations = await watchCsp(page);
  await openCheckout(page);
  await signUp(page);
  await page.getByLabel(C.rows.installments).selectOption("6");
  await expect(page.getByText("כל תשלום: 118 ₪")).toBeVisible();
  await expect(page.getByLabel(C.consentLabel)).not.toBeChecked();
  expect(await violations()).toEqual([]);
  await page.getByRole("button", { name: C.pay }).click();
  await page.waitForURL(GROW_URL);
  expect(sent).toEqual([{ plan: "ANNUAL", installments: 6, fullName: "רחל כהן", email: "r@example.com", tokenConsent: false }]);
});

test("annual with consent ticked asks for the token", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  const sent = await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  await page.getByLabel(C.consentLabel).check();
  await page.getByRole("button", { name: C.pay }).click();
  await page.waitForURL(GROW_URL);
  expect(sent).toEqual([{ plan: "ANNUAL", installments: 1, fullName: "רחל כהן", email: "r@example.com", tokenConsent: true }]);
});

test("monthly: no installments, no token consent, standing-order terms", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  const sent = await stubFunctions(page);
  await openCheckout(page, "monthly");
  await signUp(page);
  await expect(page.getByLabel(C.rows.installments)).toHaveCount(0);
  await expect(page.getByLabel(C.consentLabel)).toHaveCount(0);
  await expect(page.getByText("חיוב חודשי של 99 ₪ בהוראת קבע")).toBeVisible();
  await page.getByRole("button", { name: C.pay }).click();
  await page.waitForURL(GROW_URL);
  expect(sent).toEqual([{ plan: "MONTHLY", installments: 1, fullName: "רחל כהן", email: "r@example.com", tokenConsent: false }]);
});

test("a signed-in buyer with a full profile name only gives the email", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  await page.evaluate(() => sessionStorage.removeItem("ap.checkout.draft"));
  await page.goto("/payment");
  await page.getByRole("button", { name: "המשך לרכישה" }).click();
  await expect(page.getByText("שלב 1 מתוך 2")).toBeVisible();
  await expect(page.getByLabel(C.emailTitle)).toBeVisible();
  await expect(page.getByText("050-1234567")).toBeVisible();
});

test("a one-word name is refused before anything is sent", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await page.getByLabel(C.nameTitle).fill("רחל");
  await page.getByRole("button", { name: C.next }).click();
  await expect(page.getByRole("alert").filter({ hasText: C.nameError })).toBeVisible();
});

test("already subscribed: explains, offers the apps, stays on the site", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page, { status: 409, body: { code: "already_subscribed" } });
  await openCheckout(page);
  await signUp(page);
  await page.getByRole("button", { name: C.pay }).click();
  await expect(page.getByRole("alert").filter({ hasText: C.errors.already_subscribed })).toBeVisible();
  await expect(page.getByRole("link", { name: "App Store" }).first()).toBeVisible();
  await expect(page).toHaveURL(/\/payment/);
});

test("keys not set yet: the dormant answer sends buyers to the apps", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page, { status: 503, body: { code: "not_configured" } });
  await openCheckout(page);
  await signUp(page);
  await page.getByRole("button", { name: C.pay }).click();
  await expect(page.getByRole("alert").filter({ hasText: C.errors.not_configured })).toBeVisible();
});

test("back from Grow's cancel page: told nothing was charged, the summary is restored", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  await page.goto("/payment?cancelled=1");
  await expect(page.getByRole("status").filter({ hasText: C.cancelled })).toBeVisible();
  await expect(page.getByRole("heading", { name: C.summaryTitle })).toBeVisible();
});

test("success page: gendered welcome, the invoice email, and the next steps once access shows", async ({ page }) => {
  await stubSupabase(page, SIGN_UP_STUB);
  await stubFunctions(page);
  await openCheckout(page);
  await signUp(page);
  await page.evaluate(() => {
    sessionStorage.setItem("ap.funnel.gender", "female");
    sessionStorage.setItem("ap.checkout.email", "r@example.com");
  });
  await page.goto("/payment/success?wp=0f8b6c2e9a414d3b8e571c2d3e4f5a6b");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(C.success.title.fem);
  await expect(page.getByText("r@example.com")).toBeVisible();
  await expect(page.getByText(C.success.steps[1].title)).toBeVisible();
});
```

- [ ] **Step 9: Run everything, expect PASS:**

```bash
cd /Users/itayostraich/Documents/GitHub/active-plus-website
npm test && npm run typecheck && npm run lint && npm run test:e2e && npm run test:e2e:checkout
```

- [ ] **Step 10: Commit** (website)

```bash
git add lib/payment/checkout.ts lib/payment/copy.ts lib/security/csp.ts tests/unit/checkout.test.ts tests/unit/csp.test.ts components/payment/Checkout.tsx components/payment/CheckoutFields.tsx components/payment/CheckoutSummary.tsx components/payment/PaymentSuccess.tsx components/payment/PaymentFlow.tsx components/payment/PlanSelector.tsx app/payment/page.tsx app/payment/success/page.tsx next.config.ts playwright.config.ts playwright.checkout.config.ts package.json .gitignore tests/e2e/csp-helpers.ts tests/e2e/csp.spec.ts tests/e2e/checkout.spec.ts
git commit -m "feat: web checkout through grow's hosted page, behind the flag"
```

---

### Task 6: Cancellation for the monthly plan (both repos)

Israeli consumer protection lets a buyer cancel an ongoing subscription bought online in the same channel, so "אפשר לבטל בכל עת" must be true on the web. Access continues to `expires_at` (D9, the store behaviour).

**Files:**
- App repo: Create `shared/supabase/functions/cancelGrowSubscription/decide.ts`, `decide.test.ts`, `index.ts`; Modify `shared/supabase/functions/checkUserSubscription/index.ts` (adds `platform`)
- Website: Create `lib/payment/account.ts`, `tests/unit/account.test.ts`, `components/account/PhoneSignIn.tsx`, `components/account/SubscriptionManager.tsx`, `app/account/subscription/page.tsx`; Modify `lib/payment/copy.ts` (`ACCOUNT_COPY`), `components/layout/Footer.tsx`, `middleware.ts`, `tests/e2e/csp.spec.ts`, `tests/e2e/checkout.spec.ts`

**Interfaces:**
- Consumes: `growConfig`, `cancelDirectDebit` (Task 2); `markSubscriptionCancelled` (Task 2); `web_payments` columns `grow_transaction_id`, `grow_transaction_token`, `grow_asmachta` on the first charge, whose id is the subscription's `store_transaction_id` (Task 3); plan 2's `Register` (unchanged props) and `verifyCode`.
- Produces (app):
  - `decide.ts`: `type ActiveSubscription = { id: string; platform: string | null; planType: string; autoRenew: boolean; cancelledAt: string | null; expiresAt: string; storeTransactionId: string | null }`; `type FirstCharge = { transactionId: string | null; transactionToken: string | null; asmachta: string | null }`; `type CancelDecision = { kind: "cancel"; charge: { transactionId: string; transactionToken: string; asmachta: string } } | { kind: "already_cancelled" } | { kind: "not_found" } | { kind: "not_cancelable"; reason: "store" | "annual" | "missing_charge" }`; `decideCancel(sub: ActiveSubscription | null, charge: FirstCharge | null, now: Date): CancelDecision`
  - HTTP `POST /functions/v1/cancelGrowSubscription` (user JWT, empty body) -> `200 { status: "cancelled" | "already_cancelled"; expiresAt: string }` | `404 { code: "not_found" }` | `409 { code: "not_cancelable"; reason }` | `401` | `502 { code: "processor_error" }` | `503 { code: "not_configured" }`
  - `checkUserSubscription` response: `subscription.platform: "apple" | "google" | "grow" | null` (additive)
- Produces (website): `type SubscriptionInfo = { planType: string; expiresAt: string; autoRenew: boolean; platform: string | null }`; `type ManageAction = "cancel" | "cancelled" | "annual" | "apple" | "google" | "manual"`; `manageAction(sub: SubscriptionInfo): ManageAction`; `loadSubscription(supabase): Promise<SubscriptionInfo | null | "error">`; `type CancelResult = "cancelled" | "already_cancelled" | "not_found" | "not_cancelable" | "error"`; `cancelWebSubscription(supabase): Promise<CancelResult>`; `formatIsraelDate(iso: string): string`; `APPLE_MANAGE_URL`, `GOOGLE_MANAGE_URL`

- [ ] **Step 1: Failing tests.** App `cancelGrowSubscription/decide.test.ts`:

```ts
import { assertEquals } from "std/assert/mod.ts";
import { decideCancel, type ActiveSubscription } from "./decide.ts";

const NOW = new Date("2026-10-20T10:00:00Z");
const SUB: ActiveSubscription = {
  id: "sub-1", platform: "grow", planType: "MONTHLY", autoRenew: true, cancelledAt: null,
  expiresAt: "2026-11-07T10:00:00.000Z", storeTransactionId: "wp-1",
};
const CHARGE = { transactionId: "t1", transactionToken: "ttok", asmachta: "a1" };

Deno.test("an active monthly web subscription is cancelled with its first charge", () => {
  assertEquals(decideCancel(SUB, CHARGE, NOW), { kind: "cancel", charge: CHARGE });
});

Deno.test("cancelling twice is answered, not repeated", () => {
  assertEquals(decideCancel({ ...SUB, autoRenew: false, cancelledAt: "2026-10-19T10:00:00.000Z" }, CHARGE, NOW), { kind: "already_cancelled" });
});

Deno.test("nothing to cancel: none, or already expired", () => {
  assertEquals(decideCancel(null, null, NOW), { kind: "not_found" });
  assertEquals(decideCancel({ ...SUB, expiresAt: "2026-10-01T10:00:00.000Z" }, CHARGE, NOW), { kind: "not_found" });
});

Deno.test("store and annual subscriptions are not cancelled here", () => {
  assertEquals(decideCancel({ ...SUB, platform: "apple" }, null, NOW), { kind: "not_cancelable", reason: "store" });
  assertEquals(decideCancel({ ...SUB, planType: "ANNUAL" }, CHARGE, NOW), { kind: "not_cancelable", reason: "annual" });
});

Deno.test("without the first charge's tokens the office cancels in Grow", () => {
  assertEquals(decideCancel(SUB, { ...CHARGE, transactionToken: null }, NOW), { kind: "not_cancelable", reason: "missing_charge" });
  assertEquals(decideCancel(SUB, null, NOW), { kind: "not_cancelable", reason: "missing_charge" });
});
```

Website `tests/unit/account.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { cancelWebSubscription, formatIsraelDate, loadSubscription, manageAction } from "@/lib/payment/account";

const SUB = { planType: "MONTHLY", expiresAt: "2026-11-07T10:00:00.000Z", autoRenew: true, platform: "grow" };
const invoker = (result: unknown) => ({ functions: { invoke: vi.fn().mockResolvedValue(result) } });
const httpError = (status: number) => ({ data: null, error: { context: { status } } });

describe("manageAction", () => {
  it("offers cancel only for an active monthly web subscription", () => {
    expect(manageAction(SUB)).toBe("cancel");
    expect(manageAction({ ...SUB, autoRenew: false })).toBe("cancelled");
    expect(manageAction({ ...SUB, planType: "ANNUAL" })).toBe("annual");
  });
  it("sends store buyers to their store, and manual ones to the office", () => {
    expect(manageAction({ ...SUB, platform: "apple" })).toBe("apple");
    expect(manageAction({ ...SUB, platform: "google" })).toBe("google");
    expect(manageAction({ ...SUB, platform: null })).toBe("manual");
  });
});

describe("loadSubscription", () => {
  it("reads the active subscription with its platform", async () => {
    const supabase = invoker({ data: { hasAccess: true, subscription: { ...SUB, id: "s1", daysRemaining: 5 } }, error: null });
    expect(await loadSubscription(supabase as never)).toEqual(SUB);
  });
  it("no access is null; a failed call is an error", async () => {
    expect(await loadSubscription(invoker({ data: { hasAccess: false }, error: null }) as never)).toBeNull();
    expect(await loadSubscription(invoker(httpError(500)) as never)).toBe("error");
  });
});

describe("cancelWebSubscription", () => {
  it("maps the function's answers", async () => {
    expect(await cancelWebSubscription(invoker({ data: { status: "cancelled", expiresAt: SUB.expiresAt }, error: null }) as never)).toBe("cancelled");
    expect(await cancelWebSubscription(invoker({ data: { status: "already_cancelled", expiresAt: SUB.expiresAt }, error: null }) as never)).toBe("already_cancelled");
    expect(await cancelWebSubscription(invoker(httpError(404)) as never)).toBe("not_found");
    expect(await cancelWebSubscription(invoker(httpError(409)) as never)).toBe("not_cancelable");
    expect(await cancelWebSubscription(invoker(httpError(502)) as never)).toBe("error");
  });
});

it("formats dates on the Israel calendar (23:30 UTC is already the next day there)", () => {
  expect(formatIsraelDate("2026-11-06T23:30:00.000Z")).toBe("7 בנובמבר 2026");
});
```

- [ ] **Step 2: Run, expect FAIL:** app `~/.deno/bin/deno test --no-lock cancelGrowSubscription/`; website `npm test -- tests/unit/account.test.ts`.

- [ ] **Step 3: Implement (app).** `cancelGrowSubscription/decide.ts`:

```ts
// Whether a cancel request can stop a standing order. Pure: the function
// around it loads the rows and calls Grow.

export type ActiveSubscription = {
  id: string;
  platform: string | null;
  planType: string;
  autoRenew: boolean;
  cancelledAt: string | null;
  expiresAt: string;
  /** For grow: the first charge's web_payments id. */
  storeTransactionId: string | null;
};

export type FirstCharge = { transactionId: string | null; transactionToken: string | null; asmachta: string | null };

export type CancelDecision =
  | { kind: "cancel"; charge: { transactionId: string; transactionToken: string; asmachta: string } }
  | { kind: "already_cancelled" }
  | { kind: "not_found" }
  | { kind: "not_cancelable"; reason: "store" | "annual" | "missing_charge" };

export function decideCancel(sub: ActiveSubscription | null, charge: FirstCharge | null, now: Date): CancelDecision {
  if (!sub || new Date(sub.expiresAt) <= now) return { kind: "not_found" };
  if (sub.platform !== "grow") return { kind: "not_cancelable", reason: "store" };
  if (sub.planType !== "MONTHLY") return { kind: "not_cancelable", reason: "annual" };
  if (sub.cancelledAt || !sub.autoRenew) return { kind: "already_cancelled" };
  if (!charge?.transactionId || !charge.transactionToken || !charge.asmachta) {
    return { kind: "not_cancelable", reason: "missing_charge" };
  }
  return {
    kind: "cancel",
    charge: { transactionId: charge.transactionId, transactionToken: charge.transactionToken, asmachta: charge.asmachta },
  };
}
```

`cancelGrowSubscription/index.ts`:

```ts
// cancelGrowSubscription: the website's "ביטול המנוי". Stops the Grow standing
// order (updateDirectDebit changeStatus=2, D9) and marks the subscription not
// renewing; access continues to expires_at. userId from the JWT only.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { growConfig } from "../_shared/grow.ts";
import { cancelDirectDebit } from "../_shared/growClient.ts";
import { checkRateLimit, getRateLimitIdentifier, rateLimitExceededResponse } from "../_shared/ratelimit.ts";
import { markSubscriptionCancelled } from "../_shared/subscriptionUpsert.ts";
import { createServiceClient } from "../_shared/supabaseClient.ts";
import { decideCancel, type ActiveSubscription, type FirstCharge } from "./decide.ts";

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method !== "POST") return json(405, { code: "method_not_allowed" });

  const config = growConfig(Deno.env.toObject());
  if (!config) return json(503, { code: "not_configured" });

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json(401, { code: "unauthorized" });
  const supabase = createServiceClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return json(401, { code: "unauthorized" });

  const limit = await checkRateLimit(getRateLimitIdentifier(req, user.id), "payment");
  if (!limit.success) return rateLimitExceededResponse(cors, limit);

  try {
    const now = new Date();
    const { data: subRow, error: subError } = await supabase
      .from("subscriptions")
      .select("id, store_platform, plan_type, auto_renew, cancelled_at, expires_at, store_transaction_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .gte("expires_at", now.toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subError) throw new Error(`subscriptions lookup failed: ${subError.message}`);
    const sub: ActiveSubscription | null = subRow
      ? {
        id: subRow.id, platform: subRow.store_platform, planType: subRow.plan_type, autoRenew: subRow.auto_renew ?? false,
        cancelledAt: subRow.cancelled_at, expiresAt: subRow.expires_at, storeTransactionId: subRow.store_transaction_id,
      }
      : null;

    let charge: FirstCharge | null = null;
    if (sub?.platform === "grow" && sub.storeTransactionId) {
      const { data, error } = await supabase
        .from("web_payments")
        .select("grow_transaction_id, grow_transaction_token, grow_asmachta")
        .eq("id", sub.storeTransactionId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw new Error(`web_payments lookup failed: ${error.message}`);
      charge = data
        ? { transactionId: data.grow_transaction_id, transactionToken: data.grow_transaction_token, asmachta: data.grow_asmachta }
        : null;
    }

    const decision = decideCancel(sub, charge, now);
    const done = (status: string) => {
      console.log(JSON.stringify({ fn: "cancelGrowSubscription", userId: user.id, subscriptionId: sub?.id, status }));
      return json(200, { status, expiresAt: sub?.expiresAt });
    };
    if (decision.kind === "not_found") return json(404, { code: "not_found" });
    if (decision.kind === "not_cancelable") return json(409, { code: "not_cancelable", reason: decision.reason });
    if (decision.kind === "already_cancelled") return done("already_cancelled");

    const res = await cancelDirectDebit(config, decision.charge);
    if (!res.ok) {
      console.error(JSON.stringify({ fn: "cancelGrowSubscription", userId: user.id, error: res.error }));
      return json(502, { code: "processor_error" });
    }
    await markSubscriptionCancelled(sub!.id, now);
    return done("cancelled");
  } catch (error) {
    console.error(JSON.stringify({ fn: "cancelGrowSubscription", userId: user.id, error: error instanceof Error ? error.message : String(error) }));
    return json(500, { code: "internal_error" });
  }
});
```

`checkUserSubscription/index.ts`: add `platform: string | null` to `SubscriptionCheckResponse.subscription`; add `store_platform` to the `.select(...)` list; add `platform: activeSubscription.store_platform ?? null,` to the response's `subscription` object. Nothing else changes (app clients ignore the new field).

- [ ] **Step 4: Implement (website).** `lib/payment/account.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

type Invoker = Pick<SupabaseClient, "functions">;

export type SubscriptionInfo = { planType: string; expiresAt: string; autoRenew: boolean; platform: string | null };
export type ManageAction = "cancel" | "cancelled" | "annual" | "apple" | "google" | "manual";
export type CancelResult = "cancelled" | "already_cancelled" | "not_found" | "not_cancelable" | "error";

export const APPLE_MANAGE_URL = "https://apps.apple.com/account/subscriptions";
export const GOOGLE_MANAGE_URL = "https://play.google.com/store/account/subscriptions";

export function manageAction(sub: SubscriptionInfo): ManageAction {
  if (sub.platform === "apple") return "apple";
  if (sub.platform === "google") return "google";
  if (sub.platform !== "grow") return "manual";
  if (sub.planType !== "MONTHLY") return "annual";
  return sub.autoRenew ? "cancel" : "cancelled";
}

export async function loadSubscription(supabase: Invoker): Promise<SubscriptionInfo | null | "error"> {
  try {
    const { data, error } = await supabase.functions.invoke("checkUserSubscription", { body: {} });
    if (error) return "error";
    const body = data as { hasAccess?: boolean; subscription?: Partial<SubscriptionInfo> } | null;
    const s = body?.subscription;
    if (!body?.hasAccess || !s || typeof s.planType !== "string" || typeof s.expiresAt !== "string") return null;
    return { planType: s.planType, expiresAt: s.expiresAt, autoRenew: s.autoRenew === true, platform: s.platform ?? null };
  } catch {
    return "error";
  }
}

export async function cancelWebSubscription(supabase: Invoker): Promise<CancelResult> {
  try {
    const { data, error } = await supabase.functions.invoke("cancelGrowSubscription", { body: {} });
    if (error) {
      const status = (error as { context?: { status?: unknown } }).context?.status;
      return status === 404 ? "not_found" : status === 409 ? "not_cancelable" : "error";
    }
    const status = (data as { status?: unknown } | null)?.status;
    return status === "cancelled" || status === "already_cancelled" ? status : "error";
  } catch {
    return "error";
  }
}

const dateFormatter = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "long", year: "numeric" });
export const formatIsraelDate = (iso: string): string => dateFormatter.format(new Date(iso));
```

`lib/payment/copy.ts`: replace the `ACCOUNT_COPY` placeholder object with:

```ts
export const ACCOUNT_COPY = {
  title: "ניהול מנוי",
  loading: "טוענים את המנוי",
  signedOut: "כדי לנהל את המנוי צריך לאמת את מספר הטלפון שאיתו נרשמת.",
  codeLabel: "הקוד שקיבלת ב־SMS",
  verify: "אימות",
  none: "לא מצאנו מנוי פעיל למספר הזה.",
  error: "לא הצלחנו לטעון את המנוי. אפשר לנסות שוב.",
  retry: "לנסות שוב",
  plans: { ANNUAL: "מנוי שנתי", MONTHLY: "מנוי חודשי" } as Record<string, string>,
  nextCharge: "החיוב הבא: {date}",
  activeUntil: "המנוי פעיל עד {date}",
  annualNote: "המנוי השנתי לא מתחדש אוטומטית, ולא יהיה חיוב נוסף.",
  cancel: "ביטול המנוי",
  confirmTitle: "לבטל את המנוי החודשי?",
  confirmBody: "לא יהיו חיובים נוספים. אפשר להמשיך להתאמן עד {date}.",
  confirmYes: "כן, לבטל",
  confirmNo: "לא, להשאיר",
  cancelled: "המנוי בוטל. לא יהיו חיובים נוספים, והגישה נשארת עד {date}.",
  cancelFailed: "הביטול לא הושלם. אפשר לנסות שוב, או להתקשר אלינו.",
  apple: "המנוי נרכש ב־App Store, ולכן מבטלים אותו שם.",
  appleLink: "לניהול מנויים ב־App Store",
  google: "המנוי נרכש ב־Google Play, ולכן מבטלים אותו שם.",
  googleLink: "לניהול מנויים ב־Google Play",
  manual: "את המנוי הזה מנהל המשרד. לביטול אפשר להתקשר אלינו:",
} as const;
```

`components/account/PhoneSignIn.tsx`:

```tsx
"use client";

import { useState, type FormEvent } from "react";
import Register from "@/components/funnel/Register";
import { ContinueButton, FieldError, fieldClass } from "@/components/funnel/parts";
import { COPY } from "@/lib/funnel/copy";
import { verifyCode, type VerifyResult } from "@/lib/funnel/signin";
import { ACCOUNT_COPY as A } from "@/lib/payment/copy";
import { toE164 } from "@/lib/phone";
import { loadBrowserSupabase } from "@/lib/supabase/lazy";

const CODE_ID = "account-code";
const CODE_ERROR_ID = "account-code-error";
const VERIFY_ERROR: Record<Exclude<VerifyResult, "ok">, string> = {
  invalid: COPY.otp.wrongCode,
  rateLimited: COPY.otp.rateLimited,
  error: COPY.otp.verifyFailed,
};

/**
 * Sign-in for the subscription page: Register's phone step sends the code,
 * this form verifies it. No questionnaire merge: an account page must never
 * create or change a profile.
 */
export default function PhoneSignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [phone, setPhone] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !phone) return;
    setBusy(true);
    const supabase = await loadBrowserSupabase();
    const result = supabase ? await verifyCode(supabase, toE164(phone), code) : "error";
    setBusy(false);
    if (result === "ok") return onSignedIn();
    setError(VERIFY_ERROR[result]);
  };

  if (phone === null) {
    return (
      <Register view={{ sub: "phone", phone: "" }} gender={undefined} name="" onNameChange={() => {}} onName={() => {}}
        onCodeSent={setPhone} onBusy={setBusy} />
    );
  }
  return (
    <form noValidate onSubmit={submit} aria-busy={busy || undefined}>
      <label htmlFor={CODE_ID} className="mb-2 block font-display font-bold">{A.codeLabel}</label>
      <input
        id={CODE_ID}
        inputMode="numeric"
        autoComplete="one-time-code"
        dir="ltr"
        value={code}
        aria-describedby={error ? CODE_ERROR_ID : undefined}
        aria-invalid={error ? true : undefined}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
        className={fieldClass(Boolean(error))}
      />
      <FieldError id={CODE_ERROR_ID} text={error} />
      <ContinueButton type="submit" label={A.verify} disabled={busy} />
    </form>
  );
}
```

`components/account/SubscriptionManager.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import PhoneNumber from "@/components/ui/PhoneNumber";
import { CONTACT_PHONE, CONTACT_PHONE_TEL } from "@/lib/constants";
import {
  APPLE_MANAGE_URL, cancelWebSubscription, formatIsraelDate, GOOGLE_MANAGE_URL, loadSubscription, manageAction,
  type SubscriptionInfo,
} from "@/lib/payment/account";
import { ACCOUNT_COPY as A } from "@/lib/payment/copy";
import { loadBrowserSupabase } from "@/lib/supabase/lazy";
import PhoneSignIn from "./PhoneSignIn";

type View =
  | { kind: "loading" } | { kind: "signedOut" } | { kind: "none" } | { kind: "error" }
  | { kind: "ready"; sub: SubscriptionInfo; confirming: boolean; message: string | null };

export default function SubscriptionManager() {
  const [view, setView] = useState<View>({ kind: "loading" });

  const load = useCallback(async () => {
    setView({ kind: "loading" });
    const supabase = await loadBrowserSupabase();
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    if (!supabase || !session) return setView({ kind: "signedOut" });
    const sub = await loadSubscription(supabase);
    if (sub === "error") return setView({ kind: "error" });
    setView(sub ? { kind: "ready", sub, confirming: false, message: null } : { kind: "none" });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cancel = async (sub: SubscriptionInfo) => {
    const supabase = await loadBrowserSupabase();
    const result = supabase ? await cancelWebSubscription(supabase) : "error";
    const date = formatIsraelDate(sub.expiresAt);
    setView(
      result === "cancelled" || result === "already_cancelled"
        ? { kind: "ready", sub: { ...sub, autoRenew: false }, confirming: false, message: A.cancelled.replace("{date}", date) }
        : { kind: "ready", sub, confirming: false, message: A.cancelFailed },
    );
  };

  if (view.kind === "loading") return <p role="status" className="text-lead">{A.loading}</p>;
  if (view.kind === "signedOut") {
    return (
      <div>
        <p className="mb-6 text-lead">{A.signedOut}</p>
        <PhoneSignIn onSignedIn={() => void load()} />
      </div>
    );
  }
  if (view.kind === "none") return <p className="text-lead">{A.none}</p>;
  if (view.kind === "error") {
    return (
      <div role="alert">
        <p className="text-lead">{A.error}</p>
        <Button className="mt-4" onClick={() => void load()}>{A.retry}</Button>
      </div>
    );
  }

  const { sub, confirming, message } = view;
  const action = manageAction(sub);
  const date = formatIsraelDate(sub.expiresAt);
  return (
    <div className="grid gap-5">
      <p className="font-display text-h3 font-bold">{A.plans[sub.planType] ?? sub.planType}</p>
      <p className="text-lead">{(action === "cancel" ? A.nextCharge : A.activeUntil).replace("{date}", date)}</p>
      {message ? <p role="status" className="rounded-field bg-blue-wash px-4 py-3 text-lead font-medium">{message}</p> : null}
      {action === "annual" ? <p className="text-lead">{A.annualNote}</p> : null}
      {action === "apple" ? <p className="text-lead">{A.apple} <a className="font-bold text-blue-deep underline" href={APPLE_MANAGE_URL}>{A.appleLink}</a></p> : null}
      {action === "google" ? <p className="text-lead">{A.google} <a className="font-bold text-blue-deep underline" href={GOOGLE_MANAGE_URL}>{A.googleLink}</a></p> : null}
      {action === "manual" ? (
        <p className="text-lead">
          {A.manual}{" "}
          <a href={`tel:${CONTACT_PHONE_TEL}`} dir="ltr" className="font-bold text-green-deep underline"><PhoneNumber value={CONTACT_PHONE} /></a>
        </p>
      ) : null}
      {action === "cancel" && !confirming ? (
        <Button variant="outline" onClick={() => setView({ ...view, confirming: true, message: null })}>{A.cancel}</Button>
      ) : null}
      {action === "cancel" && confirming ? (
        <section aria-labelledby="cancel-confirm" className="rounded-card border-2 border-burgundy p-5">
          <h2 id="cancel-confirm" className="font-display text-h3 font-bold">{A.confirmTitle}</h2>
          <p className="mt-2 text-lead">{A.confirmBody.replace("{date}", date)}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => void cancel(sub)}>{A.confirmYes}</Button>
            <Button variant="outline" onClick={() => setView({ ...view, confirming: false })}>{A.confirmNo}</Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
```

`app/account/subscription/page.tsx`:

```tsx
import type { Metadata } from "next";
import SubscriptionManager from "@/components/account/SubscriptionManager";
import Section from "@/components/ui/Section";
import { ACCOUNT_COPY as A } from "@/lib/payment/copy";

export const metadata: Metadata = {
  title: A.title,
  robots: { index: false, follow: false },
};

export default function SubscriptionPage() {
  return (
    <Section id="subscription" labelledBy="subscription-heading" className="pt-[clamp(2.5rem,5vw,4.5rem)]">
      <h1 id="subscription-heading" className="mb-8 font-display text-[clamp(2rem,1.4rem+2.2vw,3rem)] font-black">{A.title}</h1>
      <SubscriptionManager />
    </Section>
  );
}
```

`components/layout/Footer.tsx`: import `WEB_CHECKOUT_ENABLED` from `@/lib/payment/config` and make `LEGAL` `[...(WEB_CHECKOUT_ENABLED ? [{ href: "/account/subscription", label: "ניהול מנוי" }] : []), { href: "/privacy-policy", ... }, { href: "/delete-account", ... }]`. `/delete-account` stays exactly as it is.

`middleware.ts`: matcher becomes `["/questionnaire", "/payment/:path*", "/account/:path*", "/api/checkout/:path*"]`.

`tests/e2e/csp.spec.ts`: add `"/account/subscription"` back to `ROUTES`.

`tests/e2e/checkout.spec.ts`, append:

```ts
test("subscription page: a monthly web subscriber signs in and cancels after confirming", async ({ page }) => {
  await stubSupabase(page, { profileName: "רחל כהן" });
  await stubFunctions(page, OK, {
    status: 200,
    body: { hasAccess: true, subscription: { id: "s1", planType: "MONTHLY", expiresAt: "2026-11-07T10:00:00.000Z", autoRenew: true, platform: "grow" } },
  });
  let cancels = 0;
  await page.route(/\/functions\/v1\/cancelGrowSubscription$/, (route) => {
    if (route.request().method() === "POST") cancels += 1;
    return fulfil(route, { status: 200, body: { status: "cancelled", expiresAt: "2026-11-07T10:00:00.000Z" } });
  });
  await page.goto("/account/subscription");
  await page.getByLabel(COPY.register.phoneLabel, { exact: true }).fill("0501234567");
  await page.getByRole("button", { name: COPY.register.phoneCta }).click();
  await page.getByLabel("הקוד שקיבלת ב־SMS").fill(GOOD_CODE);
  await page.getByRole("button", { name: "אימות" }).click();
  await page.getByRole("button", { name: "ביטול המנוי" }).click();
  await expect(page.getByRole("heading", { name: "לבטל את המנוי החודשי?" })).toBeVisible();
  expect(cancels).toBe(0);
  await page.getByRole("button", { name: "כן, לבטל" }).click();
  await expect(page.getByRole("status").filter({ hasText: "המנוי בוטל" })).toBeVisible();
  expect(cancels).toBe(1);
});
```

- [ ] **Step 5: Run, expect PASS:**

```bash
cd /Users/itayostraich/Documents/GitHub/FitnessForSeniorsApp/shared/supabase/functions
~/.deno/bin/deno test --no-lock cancelGrowSubscription/ _shared/ growWebhook/ createGrowPayment/
~/.deno/bin/deno check --no-lock cancelGrowSubscription/index.ts checkUserSubscription/index.ts
cd /Users/itayostraich/Documents/GitHub/active-plus-website
npm test && npm run typecheck && npm run lint && npm run test:e2e && npm run test:e2e:checkout
```

- [ ] **Step 6: Commit in each repo**

```bash
# app repo
git add shared/supabase/functions/cancelGrowSubscription/decide.ts shared/supabase/functions/cancelGrowSubscription/decide.test.ts shared/supabase/functions/cancelGrowSubscription/index.ts shared/supabase/functions/checkUserSubscription/index.ts
git commit -m "feat(functions): cancel a monthly web subscription through grow"
# website
git add lib/payment/account.ts lib/payment/copy.ts tests/unit/account.test.ts components/account/PhoneSignIn.tsx components/account/SubscriptionManager.tsx app/account/subscription/page.tsx components/layout/Footer.tsx middleware.ts tests/e2e/csp.spec.ts tests/e2e/checkout.spec.ts
git commit -m "feat: subscription page with web cancellation"
```

---

### Task 7: Legal and app-side visibility (both repos)

- [ ] **Step 1: Privacy policy draft for the client (not published).** Write `docs/legal/2026-10-privacy-policy-grow-draft.md` in the website repo: the exact Hebrew paragraphs to add to `app/privacy-policy/page.tsx`, each with where it goes. Cover: Grow (Meshulam) as the payment processor, card details typed only on Grow's page and never reaching the site; what checkout collects (full name, email for the invoice, phone as the account) and why; the optional card-token consent (what a token is, that it is kept by Grow, that nothing is saved without the checkbox, how to withdraw); Morning issuing the invoice and receiving name, phone and email for it; questionnaire answers stored in the profile; cancelling a monthly subscription on `/account/subscription`. Do not edit `app/privacy-policy/page.tsx` and do not touch `/delete-account`. Send the draft to the client (Task 0); publishing it is a one-line follow-up once approved, before Task 9 flips the flag.
- [ ] **Step 2: Admin label.** In FitnessForSeniorsApp: `grep -rn "store_platform\|'apple'\|\"apple\"\|'google'" admin-dashboard/src --include='*.ts' --include='*.tsx'`. Wherever apple/google get a readable label, add `grow` -> "אתר (Grow)" the same way, with a test where a label map is already tested.
- [ ] **Step 3: Runbook.** In FitnessForSeniorsApp `docs/RUNBOOKS.md`, next to the account-deletion runbook, add "Web (Grow) subscribers": before deleting a user with a `grow` monthly subscription, cancel the standing order (the user's `/account/subscription`, or Grow's back office by the asmachta on the first `web_payments` row), because deletion cascades `web_payments` and removes the tokens `updateDirectDebit` needs. Add a weekly check: `select id, user_id, kind, created_at from web_payments where status = 'paid' and invoice_status in ('pending', 'failed') order by created_at;` (charges without a Morning document; issue them by hand in Morning). And: a failed renewal shows only in `growWebhook` logs (`result: failed_renewal`, with the attempts count); Grow retries for up to 10 days.
- [ ] **Step 4: Commit in each repo**

```bash
# website
git add docs/legal/2026-10-privacy-policy-grow-draft.md
git commit -m "docs: privacy policy changes for web checkout, for client approval"
# app repo (list the admin files Step 2 changed explicitly)
git add docs/RUNBOOKS.md <admin-dashboard files from Step 2>
git commit -m "feat(admin): label web purchases and document grow deletion steps"
```

---

### Task 8: Release (dormant)

"Live" means: migration applied, functions deployed, both PRs merged, website deployed, and every Grow path answering `not_configured`. Nothing can charge. No Grow secret is set in this task.

- [ ] **Step 1: PRs.** App: push `feat/grow-web-checkout`, open a PR to `main` (summary, the Step 1 schema output from Task 1, test plan). Website: push `feat/grow-checkout`, open a PR to `main`. Both get `/code-review` and `/simplify` before merge; fix CRITICAL and HIGH findings.
- [ ] **Step 2: Merge the app PR**, then from an up-to-date `main` in `/Users/itayostraich/Documents/GitHub/FitnessForSeniorsApp/shared`:

```bash
supabase migration list
```

Every local migration older than `20261005090000` must show a Remote version. Known quirk: migrations applied through the dashboard or MCP are recorded under their own timestamps, so the same change can appear as one local-only row and one remote-only row. Explain every local-only row except ours before pushing; for one whose objects provably exist in production, `supabase migration repair --status applied <version>`. Never `--include-all` blindly.

```bash
supabase db push --dry-run   # must list exactly 20261005090000_grow_web_payments.sql
supabase db push
```

Then re-run Task 1 Step 1's queries in the SQL editor and confirm: `subscriptions_store_platform_check` includes `grow`; `web_payments` exists with RLS on and no policies; `subscription_income.web_payment_id` exists.

- [ ] **Step 3: Deploy the functions** (from `shared/`; the CLI does not apply `config.toml` JWT pins, so the flag is explicit):

```bash
supabase functions deploy createGrowPayment
supabase functions deploy growWebhook --no-verify-jwt
supabase functions deploy cancelGrowSubscription
supabase functions deploy checkUserSubscription
```

Deploy `checkUserSubscription` with the same JWT setting it has now (dashboard -> Edge Functions -> checkUserSubscription -> "Enforce JWT verification"; if it is off today, add `--no-verify-jwt`).

- [ ] **Step 4: Confirm dormant** (anon key from the dashboard, typed in the terminal, never pasted into chat):

```bash
BASE=https://<project-ref>.supabase.co/functions/v1
curl -s -X POST "$BASE/createGrowPayment" -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" -d '{}'       # {"code":"not_configured"} 503
curl -s -X POST "$BASE/cancelGrowSubscription" -H "Authorization: Bearer $ANON" -d '{}'                                         # {"code":"not_configured"} 503
curl -s -X POST "$BASE/growWebhook" -d 'data%5BprocessId%5D=1'                                                                 # {"code":"not_configured"} 503
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/createGrowPayment" -d '{}'                                             # 401 (gateway, no JWT)
curl -s -X POST "$BASE/checkUserSubscription" -H "Authorization: Bearer $ANON"                                                 # 401 Invalid or expired token
```

Also open the app on a test phone and confirm an existing subscriber still has access (checkUserSubscription redeployed).

- [ ] **Step 5: Merge the website PR.** Before merging, `vercel env ls` (or the dashboard) must show `NEXT_PUBLIC_WEB_CHECKOUT` unset (or not `true`) for Production. After Vercel deploys: open every route in a real browser on production (the list in `lib/routes.ts`, plus `/payment/success` and `/account/subscription`), DevTools console open, and confirm no CSP violation, the hero video plays, fonts load, the questionnaire resumes, and `/payment` shows the store fallback. If anything is blocked, switch the header key in `next.config.ts` to `Content-Security-Policy-Report-Only`, redeploy, record the blocked URL in `progress.md`, and fix the policy before switching back.
- [ ] **Step 6:** Record in `progress.md`: migration applied (date), function versions, website deployment URL, and "dormant until Task 9".

---

### Task 9: After keys (sandbox end-to-end, payload capture, live purchase, flip the flag)

Starts when Task 0's credentials and webhook enablement exist. Secrets are typed by Itay into `supabase secrets set`; never committed, never pasted into chat, never logged.

- [ ] **Step 1: Sandbox secrets and a preview with the flag on.**

```bash
cd /Users/itayostraich/Documents/GitHub/FitnessForSeniorsApp/shared
supabase secrets set GROW_API_URL=https://sandbox.meshulam.co.il/api/light/server/1.0 GROW_USER_ID=... GROW_PAGE_CODE_ONE_TIME=... GROW_PAGE_CODE_RECURRING=... GROW_RENEWAL_WEBHOOK_KEY=... GROW_ENV=sandbox SITE_URL=https://<preview-domain>
```

(`GROW_ANNUAL_AUTO_RENEW` and `GROW_MONTHLY_MAX_CHARGES` stay unset unless Grow support answered differently.) In Vercel set `NEXT_PUBLIC_WEB_CHECKOUT=true` for **Preview only** and deploy a preview of `main`. Invoices stay dry runs in sandbox by design.

- [ ] **Step 2: Shape check with Grow's simulator.** `GET https://sandbox.meshulam.co.il/api/light/server/1.0/updateMyUrl/?url=https://<project-ref>.supabase.co/functions/v1/growWebhook`. The simulated notify is for an unknown process, so expect 401 or 400; read the logged `keys` and compare with `parseFirstNotify`'s field names.
- [ ] **Step 3: Sandbox purchases on the preview** (test cards 4580458045804580 for single payments, 4580000000000000 or 4580111111111121 otherwise; Bit, Apple Pay and Google Pay are live-only and are not used here): annual 3 installments without consent; annual 1 payment with consent; monthly. After each, check:

```sql
select id, kind, plan_type, amount, installments, status, token_consent, card_token is not null as has_token,
       grow_direct_debit_id, period_end, approved_at, invoice_status
from web_payments order by created_at desc limit 5;
select store_platform, plan_type, expires_at, auto_renew, is_manual, recurring_income, price_nis
from subscriptions where store_platform = 'grow' order by created_at desc limit 5;
select amount, income_date, web_payment_id from subscription_income where web_payment_id is not null order by created_at desc limit 5;
```

Expected: `paid`, `approved_at` set, `invoice_status = 'dry_run'`; token only with consent; annual `auto_renew false`, monthly `true` and `period_end` a month plus two days; one income row per charge. `checkUserSubscription` returns `hasAccess: true`, and the iOS app opens without the paywall for that phone. On one run close the tab right after paying and confirm activation still happens (Review Focus 4). On the summary page, confirm the success page shows the gendered heading after a questionnaire run.

- [ ] **Step 4: Replay and forgery.** Re-post one stored `raw` notify to `growWebhook` (rebuild the form fields from `web_payments.raw` with curl `-F`) and confirm `{"result":"duplicate"}` with no new rows (Review Focus 1). Change `data[processToken]` and confirm 401 and nothing written (Review Focus 2).
- [ ] **Step 5: Fit the parsers to reality.** Redact names, phones, emails and tokens from one captured first-charge `raw`, one renewal (Step 6) and the `getTransactionInfo` response (run it once by hand with curl using a sandbox transaction), and replace the `FIRST` / `RENEWAL` / `FAILURE` fixtures in `_shared/grow.test.ts` and the `readTransactionInfo` cases with the real shapes. If `cardBrand` values are now known, add the Morning card-type map (isracard 1, visa 2, mastercard 3, amex 4, diners 5) to `buildIncomeDocument` with a test. If Grow answered Task 0 questions differently from the plan's assumptions (paymentNum range, chargeType, apiKey, notify encoding, hosted-page host), change the code with tests first. Run all suites; commit `fix(functions): grow parsers follow captured sandbox payloads`; redeploy the touched functions (Task 8 Step 3 commands).
- [ ] **Step 6: Renewal and failure webhooks.** Ask Grow support to fire a test "recurring payment" and a "failure recurring payment" webhook for the sandbox standing order (or use the dashboard's webhook test). Confirm: a `renewal` row, `expires_at` extended from the current expiry, a second income row, no approve call in the logs; the failure is logged as `failed_renewal` and writes nothing.
- [ ] **Step 7: Cancel on the preview.** `/account/subscription` -> cancel the sandbox monthly; confirm `auto_renew false`, `cancelled_at` set, and the standing order cancelled in Grow's back office.
- [ ] **Step 8: Hosted page review.** Note which methods each hosted page offers and update `PAYMENT_METHODS` in `PlanSelector.tsx` (add Bit / Apple Pay / Google Pay only if the one-time page shows them); confirm the hosted page host matches `isGrowHostedUrl` and `GROW_HOSTED_ORIGINS`; commit and deploy.
- [ ] **Step 9: Production.** After Grow's integration review: publish the approved privacy text; Grow invoices confirmed off; production webhooks configured to `growWebhook` with the production webhook key; Morning account confirmed; then

```bash
supabase secrets set GROW_API_URL=https://secure.meshulam.co.il/api/light/server/1.0 GROW_USER_ID=... GROW_PAGE_CODE_ONE_TIME=... GROW_PAGE_CODE_RECURRING=... GROW_RENEWAL_WEBHOOK_KEY=... GROW_ENV=production SITE_URL=https://www.activeplus.co.il
```

and confirm `MORNING_DRY_RUN` is `false` (it is shared with the expense sync; check with the office before changing it).

- [ ] **Step 10: One live purchase (Itay)** from a preview deployment with the flag on: monthly 99 ₪ with a real card. Verify: the Morning חשבונית מס/קבלה arrives at the buyer's email and appears in Morning; NO Grow invoice or receipt email arrives (D8); `web_payments.invoice_status = 'issued'`. Then cancel on `/account/subscription`, refund in Grow's back office, issue a credit note (תעודת זיכוי) in Morning, and record the refund as a negative `subscription_income` row (the existing refund convention).
- [ ] **Step 11: Flip the flag.** Set `NEXT_PUBLIC_WEB_CHECKOUT=true` for Production in Vercel and redeploy. Watch `growWebhook` and `createGrowPayment` logs for the first day, and run Task 7's invoice check query daily for the first week. Record the go-live in `progress.md`.

---

## Self-review

**Signatures across tasks.**

| Produced in | Name | Consumed in |
|---|---|---|
| Task 1 | `web_payments` columns (`kind`, `parent_id`, `full_name`, `phone`, `email`, `token_consent`, `grow_process_id/token`, `grow_transaction_id/token`, `grow_asmachta`, `grow_direct_debit_id`, `card_token`, `card_suffix`, `card_brand`, `period_end`, `subscription_id`, `approved_at`, `invoice_*`, `raw`) | Task 3 `db.ts` (`COLUMNS`, `chargeColumns`, `insertRenewal`), Task 3b `setInvoice`, Task 4 `insertPayment`/`setProcess`/`markFailed`, Task 6 cancel lookup |
| Task 1 | `subscription_income.web_payment_id` (unique) | Task 3 `recordIncome` (`onConflict: "web_payment_id"`) |
| Task 2 | `growConfig(env): GrowConfig \| null` | Tasks 3, 4, 6 `index.ts`; tests in 3 and 4 |
| Task 2 | `buildCreatePaymentForm(CreatePaymentInput): FormData` | Task 4 `createPayment` (passes `saveCardToken`, `notifyUrl`, `config`) |
| Task 2 | `GrowFirstNotify`, `GrowRenewal`, `GrowRenewalFailure`, `parse*`, `classifyCallback`, `parseBody` | Task 3 `handle.ts`, `index.ts` |
| Task 2 | `TransactionCheck`, `getTransactionInfo` | Task 3 `WebhookDeps.confirm` |
| Task 2 | `approveTransaction(config, pageCode, raw)` | Task 3 `WebhookDeps.approve` via `n.raw` |
| Task 2 | `CreatedProcess`, `createPaymentProcess` | Task 4 `CreateDeps.createProcess` |
| Task 2 | `cancelDirectDebit`, `markSubscriptionCancelled` | Task 6 `index.ts` |
| Task 2 | `NormalizedSubscription.priceNis`, `StorePlatform 'grow'` | Task 3 `completeCharge` |
| Task 2 | `firstPeriodEnd`, `nextExpiry` | Task 3 `claimFirst`, `renewalRow` |
| Task 3 | `WebhookDeps`, `Db`, `completeCharge`, `Completion` | Task 3b adds `invoice`, `setInvoice`, `installments`, `cardSuffix` |
| Task 3b | `IncomeDocumentInput` = `InvoiceInput` | `issueInvoice(environment, input)` and `buildIncomeDocument(input)` take the same shape |
| Task 4 | HTTP body `{ plan, installments, fullName, email, tokenConsent }`, `200 { url, webPaymentId }`, 400/401/409/429/502/503 | Task 5 `startPayment` (`STATUS_ERROR` covers each) and the e2e stubs |
| Task 4 | CORS origins | Task 5 browser calls to `createGrowPayment` / `checkUserSubscription`, Task 6 `cancelGrowSubscription` |
| Task 6 | `checkUserSubscription.subscription.platform` | Task 6 `loadSubscription` / `manageAction` |
| plan 2 | `Register` (`view, gender, name, onNameChange, onName, onCodeSent, onBusy`), `Otp` (`phone, answers, sessionId, onEditPhone, onComplete, onBusy`) | Task 5 `Checkout`, Task 6 `PhoneSignIn` (Register only), used unchanged |

The cancel lookup relies on the subscription's `store_transaction_id` being the first charge's `web_payments.id`; Task 3 sets `storeKey: payment.id` for first charges and `storeKey: parent.id` for renewals, so it holds for the life of the subscription.

**Rulings coverage.**

| Ruling | Where |
|---|---|
| D1 hosted page, full-page redirect, no wallet SDK | Global Constraints; Task 2 `buildCreatePaymentForm` (regular page codes); Task 4 returns `url`; Task 5 `window.location.assign` after `isGrowHostedUrl`; CSP with no Grow script |
| D2 two webhook shapes, routed by shape, renewals by `grow_direct_debit_id` | Task 2 `classifyCallback`, `parseFirstNotify`, `parseRenewal`, `parseRenewalFailure`; Task 1 unique index; Task 3 handlers |
| D3 no HMAC; processId + processToken + getTransactionInfo + sum; renewal webhookKey + known debit + sum; 401 | Task 3 `handleFirstCharge`, `handleRenewal`, tests "forged", "confirmation decides", "renewal verification" |
| D4 nullable token, consent checkbox, auto-renew off | Task 1 `card_token` nullable, `token_consent`; Task 2 form; Task 3 `firstChargeFields`; Task 5 checkbox (unticked); `GROW_ANNUAL_AUTO_RENEW` default false |
| D5 approve after verified first charge only, all fields, own page code; 200 for recorded/duplicate | Task 2 `APPROVE_FIELDS`, `buildApproveForm`, `pageCodeFor`; Task 3 `approveOnce`, `STATUS` map |
| D6 no special characters, hex cField1, two-word name, FormData, chargeType=1 | Global Constraints; Task 2 `growSafeText`, `toHexId`, test "no Grow parameter carries a special character"; Task 4 and Task 5 `isFullName` |
| D7 `GROW_MONTHLY_MAX_CHARGES` default 120 | Task 2 `growConfig`, monthly form test; Task 0 question 1 |
| D8 Grow invoices off is post-keys; verify NO Grow invoice | Task 0; Task 9 Step 10 |
| D9 cancel via `updateDirectDebit changeStatus=2`, access to `expires_at` | Task 2 `buildCancelDirectDebitForm`; Task 6 |
| D10 simpler CSP, form-action to Grow hosted origins, no frame-src | Task 5 `buildCsp` (`frame-src 'none'`, `form-action` with `GROW_HOSTED_ORIGINS`), CSP e2e on every route |
| D11 revision by one subagent, keeping Task 3b | This revision; Task 3b kept and extended to renewals |
| Rulings before research (dormant 503, MORNING_DRY_RUN default, flag off in production, Task 0 deferred, email on web_payments, local stack, privacy draft, CSP verified per route, gendered wording) | Global Constraints; Tasks 1, 5, 7, 8 |

**Review Focus pins.** Duplicate notify and renewal: Task 3 "duplicate", "resumed", Task 3b "never for duplicates". Forged notify: Task 3 "forged", "sum other", "renewal verification". Renewal months later: Task 2 `nextExpiry` / `firstPeriodEnd`, Task 3 renewal tests. Tab closed after paying: the handler takes no browser input; Task 9 Step 3. Already subscribed: Task 4 test (no row, no Grow call), Task 5 e2e. Consent unticked: Task 2 form tests, Task 3 "consent unticked", Task 5 e2e body `tokenConsent: false`. Keys missing: Task 2 `growConfig`, Task 4 test, Task 5 e2e, Task 8 Step 4.

**Assumptions Task 9 verifies** (each has a stated default in the code): notify encoding (all three parsed); `allPaymentsNum` for installments; `directDebitId` present on the monthly first notify; `getTransactionInfo` field names; first-charge and renewal ids not overlapping (handled as duplicate if they do); `paymentNum` as the standing order's charge count; `chargeType=1` on both pages; the hosted page host; card-brand values for Morning; whether an `apiKey` is needed.

**Placeholders.** None. The two places that adapt to live data are explicit procedures: Task 1 Step 1 aligns the local drift block with production's column types, and Task 9 Step 5 swaps doc-based fixtures for captured ones.
