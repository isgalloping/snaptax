# SPECIAL Checkout Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor internal SPECIAL checkout to use `SPECIAL_LEVEL_USER` env, `specialUsers` + `specialPrice` Flags, numeric UI pricing, webhook min from `specialPrice`; delete all verify bypass flags and logic.

**Architecture:** New `flags/special.ts`; refactor `lib/billing/specialCheckout.ts` for multi-user whitelist + Flag-driven price; wire billing APIs and webhook; delete `flags/verify.ts` and `lib/verify/*`; strip bypass branches from entitlement/export/receipt routes.

**Tech Stack:** Next.js 16 · Vercel Flags · Paddle · node:test (`npm run test:unit`)

**Spec:** [`docs/superpowers/specs/2026-07-25-special-checkout-refactor-design.md`](../specs/2026-07-25-special-checkout-refactor-design.md)

**Branch:** Continue on `feat/founder-special-seat`

## Global Constraints

- Whitelist: **`specialUsers`** Flag only (comma-separated emails); **not** `verfyUser`
- Env: **`SPECIAL_LEVEL_USER`** = Paddle Price ID; **remove** `FOUNDER_LEVEL_SPECIAL`, `PADDLE_SPECIAL_MIN_AMOUNT_CENTS`
- Display: **`specialPrice`** Flag integer USD → **`formatCurrency`** (e.g. `$1.00`); never on marketing/legal pages
- Webhook SPECIAL min: **`founderPriceUsdToCents(specialPrice)`** via `validatePaddleTransaction(..., { minAmountCents })`
- **Delete** verify flags: `runModel`, `verfyUser`, `isNeedPay`, `isMockAI` and **all** bypass logic (Mock AI, free Export)
- Fail-closed: empty `specialUsers`, `specialPrice === 0`, or missing env → public tier behavior
- SPECIAL **must not** assign founder seats (unchanged)
- Ops: Paddle SKU price manually aligned with `specialPrice` Flag

---

## File map

| File | Action |
|------|--------|
| `flags/special.ts` | Create |
| `flags/verify.ts` | Delete |
| `app/.well-known/vercel/flags/route.ts` | Swap verify → special flags |
| `lib/server/env.ts` | Rename env helper; remove special min env |
| `lib/billing/specialCheckout.ts` | Multi-user + Flag price |
| `lib/billing/specialCheckout.test.ts` | Update tests |
| `lib/billing/resolveCheckoutSkuTier.ts` | New params |
| `lib/billing/checkoutIntentSpecial.test.ts` | Update mocks |
| `lib/server/seasonOffer.ts` | New params |
| `lib/server/seasonOffer.test.ts` | Update |
| `app/api/billing/season-offer/route.ts` | special flags |
| `app/api/billing/checkout-intent/route.ts` | special flags + env rename |
| `app/api/founder/program/route.ts` | special flags + formatCurrency label |
| `lib/billing/validatePaddleTransaction.ts` | Optional minAmountCents |
| `lib/billing/handlePaddleWebhook.ts` | Load specialPrice for SPECIAL min |
| `lib/verify/*` | Delete entire directory |
| Entitlement/export/receipt routes | Remove verify imports/branches |
| `lib/receipts/processReceiptTax.ts` | Remove mock branch |
| `lib/receipts/processReceiptTaxRouter.ts` | Remove canMockAi |
| `lib/client/useSeasonOffer.ts` | Require priceUsd > 0 for internal_test |
| `.env.example` | Document SPECIAL_LEVEL_USER |

---

### Task 1: Special flags + delete verify flags

**Files:**
- Create: `flags/special.ts`
- Delete: `flags/verify.ts`
- Modify: `app/.well-known/vercel/flags/route.ts`

**Interfaces:**
- Produces: `specialUsersFlag(): Promise<string>`, `specialPriceFlag(): Promise<number>`

- [ ] **Step 1: Create `flags/special.ts`**

```typescript
import { dedupe, flag } from "flags/next";
import { vercelAdapter } from "@flags-sdk/vercel";
import { getSessionFromCookies } from "@/lib/auth/session";

const identify = dedupe(async () => {
  const session = await getSessionFromCookies();
  if (!session?.email) return {};
  return { user: { email: session.email } };
});

export const specialUsersFlag = flag<string>({
  key: "specialUsers",
  adapter: vercelAdapter(),
  identify,
  defaultValue: "",
});

/** Season price in USD for internal test users (e.g. 1 = $1.00). */
export const specialPriceFlag = flag<number>({
  key: "specialPrice",
  adapter: vercelAdapter(),
  identify,
  defaultValue: 0,
});
```

- [ ] **Step 2: Update flags discovery route**

Replace verify flag imports with:

```typescript
import { specialPriceFlag, specialUsersFlag } from "@/flags/special";

getProviderData({
  specialUsersFlag,
  specialPriceFlag,
  founderProgramEnabledFlag,
  // ...founder price flags unchanged
})
```

- [ ] **Step 3: Delete `flags/verify.ts`**

- [ ] **Step 4: Commit**

```bash
git add flags/special.ts flags/verify.ts app/.well-known/vercel/flags/route.ts
git commit -m "refactor(flags): replace verify flags with specialUsers and specialPrice"
```

---

### Task 2: Env rename + specialCheckout core refactor

**Files:**
- Modify: `lib/server/env.ts`
- Modify: `lib/billing/specialCheckout.ts`
- Modify: `lib/billing/specialCheckout.test.ts`
- Modify: `.env.example` (if present)

**Interfaces:**
- Produces:
  - `getSpecialLevelUserPriceId(): string`
  - `parseSpecialUsers(raw: string): ReadonlySet<string>`
  - `isSpecialUser(email: string, specialUsers: string): boolean`
  - `resolveSpecialCheckoutEligible(actor, specialUsers, specialPriceUsd): boolean`
  - `buildSpecialSeasonOffer(taxSeason, specialPriceUsd): InternalTestSeasonOffer`

- [ ] **Step 1: Write failing tests**

Replace/update `lib/billing/specialCheckout.test.ts`:

```typescript
it("parseSpecialUsers splits comma list case-insensitively", () => {
  const set = parseSpecialUsers(" a@x.com , B@Y.com ");
  assert.equal(set.has("a@x.com"), true);
  assert.equal(set.has("b@y.com"), true);
  assert.equal(set.size, 2);
});

it("resolveSpecialCheckoutEligible true for second whitelisted user", () => {
  process.env.SPECIAL_LEVEL_USER = "pri_special";
  const actor = { kind: "user" as const, userId: "u1", email: "b@y.com" };
  assert.equal(
    resolveSpecialCheckoutEligible(actor, "a@x.com,b@y.com", 1),
    true,
  );
});

it("resolveSpecialCheckoutEligible false when specialPrice is 0", () => {
  process.env.SPECIAL_LEVEL_USER = "pri_special";
  assert.equal(
    resolveSpecialCheckoutEligible(user, "test@example.com", 0),
    false,
  );
});

it("buildSpecialSeasonOffer uses formatCurrency priceLabel", () => {
  const offer = buildSpecialSeasonOffer("2025", 1);
  assert.equal(offer.priceUsd, 1);
  assert.equal(offer.priceCents, 100);
  assert.equal(offer.priceLabel, "$1.00");
});
```

Use `SPECIAL_LEVEL_USER` env in tests (not `FOUNDER_LEVEL_SPECIAL`).

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm run test:unit -- lib/billing/specialCheckout.test.ts`

- [ ] **Step 3: Implement env + specialCheckout**

`lib/server/env.ts`:

```typescript
export function getSpecialLevelUserPriceId(): string {
  return (process.env.SPECIAL_LEVEL_USER ?? "").trim();
}
```

Remove `getPaddlePriceIdSpecial()` and `envSpecialMinAmountCents()`.

`lib/billing/specialCheckout.ts` — full rewrite of eligibility + offer builder:

```typescript
import { formatCurrency } from "@/lib/format";
import { founderPriceUsdToCents } from "@/lib/founder/pricing";
import { getSpecialLevelUserPriceId } from "@/lib/server/env";

export function parseSpecialUsers(raw: string): ReadonlySet<string> {
  const set = new Set<string>();
  for (const part of raw.split(",")) {
    const email = normalizeWhitelistEmail(part);
    if (email) set.add(email);
  }
  return set;
}

export function isSpecialUser(email: string, specialUsers: string): boolean {
  if (!specialUsers.trim()) return false;
  return parseSpecialUsers(specialUsers).has(normalizeWhitelistEmail(email));
}

export function resolveSpecialCheckoutEligible(
  actor: Actor,
  specialUsers: string,
  specialPriceUsd: number,
): boolean {
  if (!getSpecialLevelUserPriceId()) return false;
  if (!specialUsers.trim() || specialPriceUsd <= 0) return false;
  if (actor.kind !== "user" || !actor.email) return false;
  return isSpecialUser(actor.email, specialUsers);
}

export function buildSpecialSeasonOffer(
  taxSeason: string,
  specialPriceUsd: number,
): InternalTestSeasonOffer {
  return {
    skuTier: "SPECIAL",
    priceUsd: specialPriceUsd,
    priceCents: founderPriceUsdToCents(specialPriceUsd),
    taxSeason,
    priceDisplay: "internal_test",
    priceLabel: formatCurrency(specialPriceUsd),
  };
}
```

Remove `SPECIAL_PRICE_LABEL` export.

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor(billing): specialUsers whitelist and specialPrice display"
```

---

### Task 3: Wire billing APIs + checkout resolver

**Files:**
- Modify: `lib/server/seasonOffer.ts`, `lib/server/seasonOffer.test.ts`
- Modify: `lib/billing/resolveCheckoutSkuTier.ts`, `lib/billing/checkoutIntentSpecial.test.ts`
- Modify: `app/api/billing/season-offer/route.ts`
- Modify: `app/api/billing/checkout-intent/route.ts`
- Modify: `app/api/founder/program/route.ts`

**Interfaces:**
- Consumes: Task 2 functions + `specialUsersFlag`, `specialPriceFlag`
- `ResolveSeasonOfferForActorInput` adds `specialUsers: string`, `specialPriceUsd: number` (remove `verfyUser`)

- [ ] **Step 1: Update seasonOffer**

```typescript
export type ResolveSeasonOfferForActorInput = ResolveSeasonOfferInput & {
  actor: Actor | null;
  specialUsers: string;
  specialPriceUsd: number;
};

export function resolveSeasonOfferForActor(input: ResolveSeasonOfferForActorInput): SeasonOffer {
  if (
    input.actor &&
    resolveSpecialCheckoutEligible(input.actor, input.specialUsers, input.specialPriceUsd)
  ) {
    return buildSpecialSeasonOffer(input.taxSeason, input.specialPriceUsd);
  }
  return resolveSeasonOfferFromState(input);
}

export async function getSeasonOffer(
  userId?: string,
  options?: { actor?: Actor | null; specialUsers?: string; specialPriceUsd?: number },
): Promise<SeasonOffer> {
  // ...
  return resolveSeasonOfferForActor({
    actor: options?.actor ?? null,
    specialUsers: options?.specialUsers ?? "",
    specialPriceUsd: options?.specialPriceUsd ?? 0,
    // ...
  });
}
```

- [ ] **Step 2: Update resolveCheckoutSkuTier**

Replace `verfyUser: string` with `specialUsers: string; specialPriceUsd: number`:

```typescript
if (resolveSpecialCheckoutEligible(input.actor, input.specialUsers, input.specialPriceUsd)) {
  return { skuTier: "SPECIAL", isSpecial: true };
}
```

Update all tests to pass `specialUsers` + `specialPriceUsd`; env `SPECIAL_LEVEL_USER`.

- [ ] **Step 3: Update API routes**

Pattern for all three routes:

```typescript
import { specialPriceFlag, specialUsersFlag } from "@/flags/special";

const [specialUsers, specialPriceUsd] = await Promise.all([
  specialUsersFlag(),
  specialPriceFlag(),
]);
```

`checkout-intent`:

```typescript
paddlePriceId = isSpecial
  ? getSpecialLevelUserPriceId()
  : config.tiers[resolvedSkuTier as PublicFounderTier].paddlePriceId;
```

`founder/program`:

```typescript
import { formatCurrency } from "@/lib/format";

const internalTestCheckout =
  actor.kind === "user" &&
  resolveSpecialCheckoutEligible(actor, specialUsers, specialPriceUsd);

...(internalTestCheckout
  ? { internalTestCheckout: true, internalTestPriceLabel: formatCurrency(specialPriceUsd) }
  : {}),
```

Remove all `verfyUserFlag` imports.

- [ ] **Step 4: Run tests**

Run: `npm run test:unit -- lib/server/seasonOffer.test.ts lib/billing/checkoutIntentSpecial.test.ts`

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor(billing): wire special flags into season-offer and checkout-intent"
```

---

### Task 4: Webhook min from specialPrice

**Files:**
- Modify: `lib/billing/validatePaddleTransaction.ts`
- Modify: `lib/billing/validatePaddleTransaction.test.ts`
- Modify: `lib/billing/handlePaddleWebhook.ts`

**Interfaces:**
- `validatePaddleTransaction(payload, options?: { minAmountCents?: number })`

- [ ] **Step 1: Write failing test**

```typescript
it("uses custom minAmountCents when provided", () => {
  const result = validatePaddleTransaction(
    { ...basePayload, data: { ...basePayload.data!, details: { totals: { total: "100", currency_code: "USD" } }, custom_data: { skuTier: "SPECIAL" } } },
    { minAmountCents: 100 },
  );
  assert.equal(result.ok, true);
});

it("rejects below custom min", () => {
  const result = validatePaddleTransaction(
    { ...basePayload, data: { ...basePayload.data!, details: { totals: { total: "50", currency_code: "USD" } }, custom_data: { skuTier: "SPECIAL" } } },
    { minAmountCents: 100 },
  );
  assert.equal(result.ok, false);
});
```

Remove tests that set `PADDLE_SPECIAL_MIN_AMOUNT_CENTS`.

- [ ] **Step 2: Implement validatePaddleTransaction**

```typescript
export function validatePaddleTransaction(
  payload: PaddleWebhookPayload,
  options?: { minAmountCents?: number },
): PaddleTransactionValidation {
  // ...
  const minCents =
    options?.minAmountCents ?? minAmountCentsForSku(data.custom_data?.skuTier);
  // minAmountCentsForSku keeps public default only (no envSpecialMinAmountCents)
}
```

- [ ] **Step 3: Update handlePaddleWebhook**

Before `validatePaddleTransaction`, determine skuTier from custom_data (or defer: pass min after reading flags when skuTier is SPECIAL):

```typescript
import { specialPriceFlag } from "@/flags/special";
import { founderPriceUsdToCents } from "@/lib/founder/pricing";

const skuTierHint = payload.data?.custom_data?.skuTier;
let minAmountCents: number | undefined;
if (skuTierHint === "SPECIAL") {
  const specialPrice = await specialPriceFlag();
  if (specialPrice <= 0) {
    // finishWebhookEvent ignored special_price_unconfigured
  }
  minAmountCents = founderPriceUsdToCents(specialPrice);
}

const validated = validatePaddleTransaction(payload, { minAmountCents });
```

Extract async webhook validation helper if `handleTransactionCompleted` needs refactor for testability.

- [ ] **Step 4: Run tests + commit**

```bash
git commit -m "refactor(billing): webhook SPECIAL min from specialPrice flag"
```

---

### Task 5: Delete verify bypass system

**Files:**
- Delete: `lib/verify/` (all files)
- Modify: `app/api/entitlements/current/route.ts`
- Modify: `app/api/export/tax-pack/route.ts`
- Modify: `app/api/export/filed/route.ts`
- Modify: `app/api/receipts/[id]/process/route.ts`
- Modify: `lib/receipts/receiptUploadService.ts`
- Modify: `lib/receipts/processReceiptTax.ts`
- Modify: `lib/receipts/processReceiptTaxRouter.ts`
- Modify: `lib/server/log/types.ts` (if `biz.verify` exists)

- [ ] **Step 1: Strip entitlements route**

Remove:

```typescript
import { resolveVerifyContext } from "@/lib/verify/context";
import { ensureBypassEntitlement } from "@/lib/verify/ensureBypassEntitlement";
// and the canBypassPay block
```

Restore direct entitlement lookup only.

- [ ] **Step 2: Strip export routes**

Remove `resolveVerifyContext` / `ensureBypassEntitlement` from `tax-pack/route.ts` and `filed/route.ts`.

- [ ] **Step 3: Strip receipt processing**

`app/api/receipts/[id]/process/route.ts`: remove verify context fetch, `canMockAi` param, verify log meta.

`receiptUploadService.ts`: remove entire verify short-circuit block at top of upload flow.

`processReceiptTax.ts`: remove `canMockAi` option and `mockReceiptVision` branch — always real Vision path.

`processReceiptTaxRouter.ts`: remove `canMockAi` parameter from `pickReceiptTaxRoute` and callers.

- [ ] **Step 4: Delete lib/verify**

```bash
git rm -r lib/verify/
```

- [ ] **Step 5: Grep guard**

Run: `rg 'resolveVerifyContext|verfyUser|isMockAI|isNeedPay|runModel|mockReceiptVision|ensureBypassEntitlement' --glob '*.ts' --glob '*.tsx'`

Expected: no matches (except docs/plans).

- [ ] **Step 6: Run full test suite; fix broken tests**

Run: `npm run test:unit`

- [ ] **Step 7: Commit**

```bash
git commit -m "refactor: remove production verify bypass flags and logic"
```

---

### Task 6: Client useSeasonOffer cleanup

**Files:**
- Modify: `lib/client/useSeasonOffer.ts`

- [ ] **Step 1: Tighten validation**

```typescript
function isValidSeasonOffer(data: ClientSeasonOffer): boolean {
  if (data.priceDisplay === "internal_test") {
    return typeof data.priceUsd === "number" && data.priceUsd > 0;
  }
  // ...existing public validation
}
```

Remove zero-placeholder acceptance for internal test.

- [ ] **Step 2: Commit**

```bash
git commit -m "refactor(ui): require positive specialPrice in season offer client"
```

---

### Task 7: Regression, env docs, final grep

**Files:**
- Modify: `.env.example`
- Any remaining `FOUNDER_LEVEL_SPECIAL` / `getPaddlePriceIdSpecial` references

- [ ] **Step 1: Update `.env.example`**

```env
# Internal test Paddle price ID (whitelist via Flags specialUsers + specialPrice)
SPECIAL_LEVEL_USER=
```

Remove `FOUNDER_LEVEL_SPECIAL` / `PADDLE_SPECIAL_MIN_AMOUNT_CENTS` if documented.

- [ ] **Step 2: Grep old symbols**

```bash
rg 'FOUNDER_LEVEL_SPECIAL|getPaddlePriceIdSpecial|PADDLE_SPECIAL_MIN_AMOUNT_CENTS|SPECIAL_PRICE_LABEL|verfyUser' --glob '*.{ts,tsx}'
```

Fix any stragglers in code (docs/plans OK).

- [ ] **Step 3: Full test + lint on touched files**

Run: `npm run test:unit`

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: env docs and SPECIAL refactor regression cleanup"
```

---

## Manual test checklist

1. Vercel Flags: `specialUsers=you@example.com`, `specialPrice=1`
2. Env: `SPECIAL_LEVEL_USER=<paddle_price_id>` (remove old vars)
3. Whitelisted user → Paywall shows **$1.00** → Paddle checkout → Export unlocked
4. Second email in comma list also works
5. Non-whitelisted → public tier prices only
6. Receipt upload → always real Vision (no instant mock)
7. Export without payment → 402 / paywall (no bypass)

---

## Spec coverage self-review

| Spec § | Task |
|--------|------|
| Env SPECIAL_LEVEL_USER | 2, 7 |
| flags/special.ts | 1 |
| Delete verify flags | 1, 5 |
| Multi-user specialUsers | 2 |
| specialPrice display | 2, 3, 6 |
| Webhook min from specialPrice | 4 |
| API wiring | 3 |
| Verify removal | 5 |
| Client | 6 |
| Grep/regression | 7 |

No placeholders. Type names consistent across tasks.

---

**Plan complete.** Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — implement sequentially in this session

Which approach?
