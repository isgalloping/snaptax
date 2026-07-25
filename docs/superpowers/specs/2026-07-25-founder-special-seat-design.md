# Founder SPECIAL Internal Test Checkout — Design

**Status:** Approved (brainstorming)  
**Date:** 2026-07-25  
**Scope:** Internal-only Paddle checkout price for whitelisted test accounts in production, preview, and local dev.

---

## 1. Problem

Snap1099 needs to exercise the full Paddle checkout → webhook → season entitlement path in **production and preview** without paying public tier prices ($5–$29). The feature must remain invisible to non-whitelisted users and must **not** consume Founder Program seats (#1–50).

---

## 2. Goals

| Goal | Detail |
|------|--------|
| **Test checkout** | Whitelisted Google accounts complete real Paddle payment at a dedicated test price |
| **All purchase entry points** | Paywall export + Founder Program Sheet (`founderPurchase: true`) |
| **No seat impact** | No `founder_number`, no Widget scarcity change, no Founder Badge |
| **Fail-closed** | Missing env, empty whitelist, or non-matching email → existing public behavior |
| **Isolate from verify bypass** | Reuse `verfyUser` flag for email only; do **not** enable `canBypassPay`, `isMockAI`, or `runModel=verify` |

---

## 3. Non-goals

- Marketing / legal pricing pages showing SPECIAL
- Multiple whitelist emails (keep single `verfyUser` string)
- Displaying numeric USD in app UI (Paddle overlay shows real amount)
- Local-only or preview-only restriction (local dev included when configured)
- Founder seat assignment or tier locking for SPECIAL purchasers

---

## 4. Configuration

| Name | Type | Purpose |
|------|------|---------|
| `FOUNDER_LEVEL_SPECIAL` | Env (Vercel + `.env.local`) | Paddle Price ID for internal test SKU |
| `verfyUser` | Vercel Flag (existing) | Single whitelisted email (case-insensitive) |
| `PADDLE_SPECIAL_MIN_AMOUNT_CENTS` | Env (optional) | Webhook min for SPECIAL transactions; default `100` ($1.00) |

Public tiers continue using `PADDLE_MIN_AMOUNT_CENTS` (default `500`).

---

## 5. Eligibility (server-only)

New module: `lib/billing/specialCheckout.ts`

```typescript
resolveSpecialCheckoutEligible(actor: Actor, verfyUser: string): boolean
```

**All must be true:**

1. `actor.kind === "user"`
2. `actor.email` normalized equals `verfyUser` normalized (trim + lowercase)
3. `verfyUser` is non-empty
4. `getPaddlePriceIdSpecial()` returns a non-empty string from `FOUNDER_LEVEL_SPECIAL`

**Must NOT require:** `runModel === "verify"`, `VERCEL_ENV !== "production"`, or `founderProgramEnabled`.

Helper: `getPaddlePriceIdSpecial()` in `lib/server/env.ts`, mirroring other `FOUNDER_LEVEL_*` lookups.

---

## 6. Architecture — recommended approach

**Explicit internal skuTier `SPECIAL`** (not silent price override on public tiers).

Extend `FounderTier`:

```typescript
export type FounderTier =
  | "FOUNDER_LEVEL_SUPER"
  | "EARLY"
  | "FOUNDER"
  | "DEFAULT"
  | "SPECIAL"; // internal-only; excluded from marketing and seat logic
```

Data flow:

```
verfyUser flag + FOUNDER_LEVEL_SPECIAL env
        ↓
resolveSpecialCheckoutEligible(actor, verfyUser)
        ↓
getSeasonOffer / checkout-intent → skuTier: SPECIAL, paddlePriceId: special
        ↓
Paddle checkout (real amount on Paddle UI)
        ↓
Webhook → grant season entitlement; skip assignFounderSeat
```

---

## 7. API changes

### 7.1 `GET /api/billing/season-offer`

Before normal `resolveSeasonOfferFromState`, if eligible:

```json
{
  "skuTier": "SPECIAL",
  "priceUsd": 0,
  "priceCents": 0,
  "taxSeason": "2025",
  "priceDisplay": "internal_test",
  "priceLabel": "Test price"
}
```

Load `verfyUser` via existing flags pattern (server-side).

### 7.2 `POST /api/billing/checkout-intent`

If eligible **before** tier resolution:

- Force `resolvedSkuTier = "SPECIAL"`
- `paddlePriceId = getPaddlePriceIdSpecial()`
- **Override** `founderPurchase` path (ignore `FOUNDER_PROGRAM_FULL`)
- Persist intent with `skuTier: "SPECIAL"`
- Include `skuTier: "SPECIAL"` in Paddle `customData`

Extend zod `founderTierSchema` to include `"SPECIAL"`.

### 7.3 `GET /api/founder/program` (optional overlay)

When eligible, include:

```json
{ "internalTestCheckout": true, "internalTestPriceLabel": "Test price" }
```

Same `resolveSpecialCheckoutEligible` helper; keeps Widget / Sheet in sync with season-offer.

---

## 8. Webhook

In `handlePaddleWebhook.ts`:

- `isFounderSkuTier()` **excludes** `SPECIAL` → no `assignFounderSeatOnFirstPurchase`
- `grantPaddleSeasonEntitlement` runs normally
- Log: `skuTier: "SPECIAL"`, `internal_test_checkout: true`

In `validatePaddleTransaction`:

- When `customData.skuTier === "SPECIAL"` (or intent skuTier SPECIAL), use `PADDLE_SPECIAL_MIN_AMOUNT_CENTS` instead of `PADDLE_MIN_AMOUNT_CENTS`
- Reject SPECIAL transactions below special min with `amount_too_low`

---

## 9. UI

| Surface | Whitelisted | Others |
|---------|-------------|--------|
| PaywallSheet | `{price}` → **Test price** | `formatCurrency(priceUsd)` |
| TaxExportCard | same | unchanged |
| FounderProgramSheet | season line + Claim CTA → **Test price** | tier price |
| FounderProgramWidget | subtitle `{price}` → **Test price** | unchanged |
| Marketing / legal pricing | never SPECIAL | unchanged |

Client: extend `useSeasonOffer` with `priceLabel`, `isInternalTestPrice` (`priceDisplay === "internal_test"`). When internal test, do not fallback to `$29`.

Founder Sheet: when `internalTestCheckout`, skip client `!programOpen` gate before calling checkout-intent.

Paddle overlay always shows Paddle-configured amount.

Copy constant: English **`Test price`** (server-sourced `priceLabel`; not i18n).

---

## 10. Security

| Risk | Mitigation |
|------|------------|
| Public users get test price | Server-only eligibility; fail-closed without env + email match |
| SPECIAL leaks on marketing | Explicit exclusion from `pricingPageData`, `buildFounderTierConfigs` seat map |
| Accidental free verify bypass | Separate function from `buildVerifyContext.canBypass*` |
| Webhook replay at $0.01 | SPECIAL min amount env; separate from public min |
| Intent tampering (client sends skuTier) | Server recomputes eligibility; ignores client tier when not eligible |

---

## 11. Error handling

| Case | Behavior |
|------|----------|
| `FOUNDER_LEVEL_SPECIAL` unset | Eligibility false; public flow |
| `verfyUser` empty | Eligibility false |
| Ghost / unsigned user | Eligibility false |
| Paddle SPECIAL price misconfigured | checkout-intent 500 or payment unavailable; log warn |
| Webhook amount below SPECIAL min | Ignore grant; log `amount_too_low` |
| Founder program full + whitelisted | checkout-intent succeeds with SPECIAL (no seat) |

---

## 12. Testing

### Unit

- `resolveSpecialCheckoutEligible`: email match/mismatch, ghost actor, empty verfyUser, missing env
- `getSeasonOffer` / `resolveSeasonOfferFromState`: eligible → SPECIAL payload
- `checkout-intent`: eligible overrides founderPurchase + program full
- `validatePaddleTransaction`: SPECIAL min vs public min
- `isFounderSkuTier`: SPECIAL excluded

### Manual (preview / prod)

1. Set `FOUNDER_LEVEL_SPECIAL` + `verfyUser` to test Google email
2. Login → Paywall shows **Test price** → Paddle completes → Export unlocked
3. Same user → Founder Sheet → **Test price** → purchase → no founder badge / seat
4. Non-whitelisted account → normal tier prices only
5. Remove env → whitelisted user reverts to public pricing

---

## 13. Files to touch (implementation reference)

| Area | Files |
|------|-------|
| Types | `lib/founder/types.ts` |
| Env | `lib/server/env.ts`, `scripts/load-env.mjs` (if aliasing needed) |
| Core | `lib/billing/specialCheckout.ts` (new) |
| Offer | `lib/server/seasonOffer.ts`, `app/api/billing/season-offer/route.ts` |
| Checkout | `app/api/billing/checkout-intent/route.ts` |
| Founder API | `app/api/founder/program/route.ts` |
| Webhook | `lib/billing/handlePaddleWebhook.ts`, `lib/billing/validatePaddleTransaction.ts` |
| Client | `lib/client/useSeasonOffer.ts`, `PaywallSheet.tsx`, `TaxExportCard.tsx`, `FounderProgramSheet.tsx`, `WidgetStack.tsx` |
| Tests | co-located `*.test.ts` |
| Docs | `docs/tech/` env table (optional follow-up) |

---

## 14. Decisions log (brainstorming)

| Question | Decision |
|----------|----------|
| Consume founder seat? | **No** |
| Whitelist mechanism | Reuse **`verfyUser`** flag; no verify bypass |
| Checkout scope | **Paywall + Founder Sheet** |
| UI price display | **Test price** (no numeric USD in app) |
| Environments | **production + preview + local** |
| Display price source | **Hardcoded label** (not env/flag USD) |
| Approach | **Explicit `SPECIAL` skuTier** (recommended over silent price override) |
