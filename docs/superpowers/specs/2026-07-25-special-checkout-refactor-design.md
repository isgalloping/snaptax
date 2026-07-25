# SPECIAL Checkout Refactor — Design

**Status:** Approved (brainstorming)  
**Date:** 2026-07-25  
**Supersedes:** [`2026-07-25-founder-special-seat-design.md`](./2026-07-25-founder-special-seat-design.md) (config & flags portions)  
**Removes:** [`2026-06-13-production-verify-flags-design.md`](./2026-06-13-production-verify-flags-design.md) verify bypass system

---

## 1. Problem

The initial SPECIAL internal checkout (feat/founder-special-seat) reused legacy verify flags (`verfyUser`) and hardcoded **Test price** UI copy. Product wants:

1. Cleaner **Flags governance** — dedicated `specialUsers` + `specialPrice`; remove verify flags entirely
2. **Env rename** — `SPECIAL_LEVEL_USER` replaces `FOUNDER_LEVEL_SPECIAL`
3. **Multi-user whitelist** — comma-separated emails in Flags
4. **Numeric display price** from `specialPrice` flag (aligned manually with Paddle)
5. **Remove verify bypass** — no Mock AI, no free Export; internal testing = real SPECIAL Paddle checkout only

---

## 2. Goals

| Goal | Detail |
|------|--------|
| **SPECIAL checkout** | Whitelisted Google users pay at `SPECIAL_LEVEL_USER` Paddle price |
| **Multi-user whitelist** | `specialUsers` flag, English comma-separated emails |
| **Display price** | `specialPrice` flag (integer USD) → `formatCurrency` in app; never on marketing/legal pages |
| **Webhook min** | Derived from `specialPrice` (USD → cents); remove `PADDLE_SPECIAL_MIN_AMOUNT_CENTS` |
| **Flags cleanup** | Delete `runModel`, `verfyUser`, `isNeedPay`, `isMockAI` and all bypass logic |
| **No seat impact** | SPECIAL still does not assign `founder_number` |
| **Fail-closed** | Missing env, empty users, or `specialPrice === 0` → public tier behavior |

---

## 3. Non-goals

- Auto-sync Paddle price with Flag
- SPECIAL on marketing/pricing pages
- Founder seat assignment for SPECIAL
- Replacement for Mock AI or free Export bypass
- Intent snapshot of `specialPrice` at checkout time (MVP reads current Flag at webhook; optional follow-up)

---

## 4. Configuration

### 4.1 Environment

| Name | Type | Purpose |
|------|------|---------|
| **`SPECIAL_LEVEL_USER`** | Env | Paddle Price ID for internal test SKU (replaces `FOUNDER_LEVEL_SPECIAL`) |

**Removed env:** `PADDLE_SPECIAL_MIN_AMOUNT_CENTS`, `FOUNDER_LEVEL_SPECIAL` (no long-term alias required; one-time ops rename on deploy).

`lib/server/env.ts`:

```typescript
export function getSpecialLevelUserPriceId(): string {
  return (process.env.SPECIAL_LEVEL_USER ?? "").trim();
}
```

Remove `getPaddlePriceIdSpecial()`, `envSpecialMinAmountCents()`.

### 4.2 Flags (`flags/special.ts`)

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| **`specialUsers`** | `string` | `""` | Comma-separated whitelist emails |
| **`specialPrice`** | `number` | `0` | Integer USD for display + webhook min (e.g. `1` = $1.00) |

Same `identify` pattern as `flags/founder.ts` (session email for Vercel targeting UI only; **eligibility is always server-side**).

### 4.3 Deleted Flags (`flags/verify.ts` — delete file)

- `runModel`, `verfyUser`, `isNeedPay`, `isMockAI`

Update `app/.well-known/vercel/flags/route.ts`: remove verify flags; register `specialUsersFlag`, `specialPriceFlag`.

---

## 5. Architecture

**Recommended:** Independent `flags/special.ts` + refactored `lib/billing/specialCheckout.ts`. Do **not** merge SPECIAL into `flags/founder.ts` or keep verify dead code.

```
specialUsers + specialPrice (Flags) + SPECIAL_LEVEL_USER (Env)
        ↓
resolveSpecialCheckoutEligible(actor, specialUsers, specialPriceUsd)
        ↓
season-offer / checkout-intent → skuTier: SPECIAL, priceLabel: formatCurrency(specialPrice)
        ↓
Paddle checkout (customData.skuTier: SPECIAL)
        ↓
Webhook → min from specialPrice; grant entitlement; skip assignFounderSeat
```

Internal skuTier **`SPECIAL`** unchanged from prior implementation.

---

## 6. Eligibility (server-only)

```typescript
parseSpecialUsers(raw: string): ReadonlySet<string>
isSpecialUser(email: string, specialUsers: string): boolean

resolveSpecialCheckoutEligible(
  actor: Actor,
  specialUsers: string,
  specialPriceUsd: number,
): boolean
```

**All must be true:**

1. `actor.kind === "user"` with non-empty `actor.email`
2. `isSpecialUser(actor.email, specialUsers)`
3. `getSpecialLevelUserPriceId()` non-empty
4. `specialPriceUsd > 0`

**Must NOT require:** `runModel`, `verfyUser`, `isPlatformVerifyAllowed`, or `founderProgramEnabled`.

Email normalization: `trim().toLowerCase()` on both sides.

---

## 7. Pricing & display

### 7.1 Season offer

```typescript
buildSpecialSeasonOffer(taxSeason: string, specialPriceUsd: number): SeasonOffer & {
  priceDisplay: "internal_test";
  priceLabel: string; // formatCurrency(specialPriceUsd)
}
```

- Remove hardcoded `SPECIAL_PRICE_LABEL = "Test price"`
- `priceUsd` / `priceCents` populated from Flag (not zero placeholders)

### 7.2 Visibility

| Surface | Whitelisted | Public |
|---------|-------------|--------|
| Paywall / Export / Widget / Sheet | `priceLabel` from Flag | Public tier prices |
| Marketing / legal pricing | never SPECIAL | unchanged |

Ops discipline: **Paddle SKU price matches `specialPrice`** manually.

---

## 8. API changes

| Route | Change |
|-------|--------|
| `GET /api/billing/season-offer` | Load `specialUsersFlag`, `specialPriceFlag`; pass to `getSeasonOffer` |
| `POST /api/billing/checkout-intent` | Same; `paddlePriceId = getSpecialLevelUserPriceId()` |
| `GET /api/founder/program` | Overlay `internalTestCheckout` + `internalTestPriceLabel: formatCurrency(specialPrice)` |

Replace all `verfyUserFlag()` imports with special flags.

`resolveCheckoutSkuTier` / `resolveSeasonOfferForActor` parameters: `{ specialUsers, specialPriceUsd }`.

Client tampering: non-eligible users sending `skuTier: "SPECIAL"` still rejected (existing guard).

---

## 9. Webhook

### 9.1 Min amount

Extend validation:

```typescript
validatePaddleTransaction(
  payload,
  options?: { minAmountCents?: number },
)
```

In `handlePaddleWebhook` (or caller):

- If `skuTier === "SPECIAL"`: `minCents = founderPriceUsdToCents(await specialPriceFlag())`
- Else: `minCents = envMinAmountCents()` (default 500)
- If SPECIAL and `specialPrice === 0`: reject grant

Remove `envSpecialMinAmountCents()` and `PADDLE_SPECIAL_MIN_AMOUNT_CENTS`.

### 9.2 Seat & logging

- `isFounderSkuTier("SPECIAL") === false` (unchanged)
- Log `skuTier: "SPECIAL"`, `internal_test_checkout: true` on success

---

## 10. Verify bypass removal

Delete entirely:

| Path | Action |
|------|--------|
| `flags/verify.ts` | Delete |
| `lib/verify/*` | Delete directory |
| `app/api/entitlements/current/route.ts` | Remove `resolveVerifyContext` / `ensureBypassEntitlement` |
| `app/api/export/tax-pack/route.ts`, `filed/route.ts` | Same |
| `app/api/receipts/[id]/process/route.ts` | Remove verify logging / `canMockAi` |
| `lib/receipts/receiptUploadService.ts` | Remove verify branch |
| `lib/receipts/processReceiptTax.ts` | Remove `mockReceiptVision` import and branch |
| `lib/receipts/processReceiptTaxRouter.ts` | Remove `canMockAi` parameter |
| `lib/server/log/types.ts` | Remove `biz.verify` if unused |

After removal:

- Export requires real entitlement (Paddle or prior purchase)
- Receipt processing always uses real Vision path

Mark `2026-06-13-production-verify-flags-design.md` as **Removed**.

---

## 11. Client

`useSeasonOffer`:

- Keep `isInternalTestPrice` via `priceDisplay === "internal_test"`
- Use API `priceUsd` / `priceLabel` from Flag (remove zero-placeholder acceptance)
- Public fallback `$29` unchanged for non-internal offers

Paddle `customData` continues to include `skuTier: "SPECIAL"` from intent response.

---

## 12. Security

| Risk | Mitigation |
|------|------------|
| Public sees test price | Server-only eligibility; marketing excludes SPECIAL |
| Flag tampering by client | Server recomputes eligibility; ignore client tier when not eligible |
| Webhook underpayment | Min cents from `specialPrice` for SPECIAL tier |
| Verify bypass residue | Delete modules and tests; grep for `resolveVerifyContext` |

---

## 13. Error handling

| Case | Behavior |
|------|----------|
| `SPECIAL_LEVEL_USER` unset | Eligibility false |
| `specialUsers` empty | Eligibility false |
| `specialPrice === 0` | Eligibility false; webhook rejects SPECIAL if misconfigured |
| Non-whitelist email | Public pricing |
| Paddle/env price drift | Ops responsibility; webhook min uses Flag `specialPrice` |

---

## 14. Testing

- `parseSpecialUsers`: commas, spaces, case, empty
- `resolveSpecialCheckoutEligible`: multi-hit, partial miss, specialPrice=0, env missing
- `buildSpecialSeasonOffer`: correct `priceLabel` e.g. `$1.00`
- `validatePaddleTransaction`: SPECIAL min from options; public min unchanged
- Grep: no `resolveVerifyContext`, `verfyUser`, `isMockAI` references
- Full `npm run test:unit` green after deletions

---

## 15. Ops migration

**Env rename:**

```
FOUNDER_LEVEL_SPECIAL → SPECIAL_LEVEL_USER
(remove PADDLE_SPECIAL_MIN_AMOUNT_CENTS)
```

**Flags:**

| Remove | Add |
|--------|-----|
| runModel, verfyUser, isNeedPay, isMockAI | specialUsers: `a@x.com,b@y.com` |
| | specialPrice: `1` |

---

## 16. Files to touch (implementation reference)

| Area | Files |
|------|-------|
| Flags | Create `flags/special.ts`; delete `flags/verify.ts`; update `.well-known/vercel/flags/route.ts` |
| Env | `lib/server/env.ts`, `.env.example` |
| Core | `lib/billing/specialCheckout.ts`, tests |
| Offer / checkout | `lib/server/seasonOffer.ts`, `app/api/billing/*`, `lib/billing/resolveCheckoutSkuTier.ts` |
| Webhook | `lib/billing/validatePaddleTransaction.ts`, `handlePaddleWebhook.ts` |
| Founder API | `app/api/founder/program/route.ts` |
| Verify removal | routes + receipts listed in §10 |
| Client | `lib/client/useSeasonOffer.ts` (minor) |
| Docs | This spec; supersede notes on prior specs |

---

## 17. Decisions log

| Question | Decision |
|----------|----------|
| Env name | **`SPECIAL_LEVEL_USER`** (Paddle Price ID) |
| Whitelist | **`specialUsers`** Flag, comma-separated |
| Display price | **`specialPrice`** Flag, `formatCurrency` (standard `$X.XX`) |
| Verify flags | **Delete all** + bypass logic |
| Webhook min | **From `specialPrice`**, remove `PADDLE_SPECIAL_MIN_AMOUNT_CENTS` |
| Paddle vs Flag price | **Manual alignment** (ops) |
| Architecture | **Independent `flags/special.ts`** |
