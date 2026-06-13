# 生产验证白名单 + Vercel Flags — Design

**Date:** 2026-06-13  
**Status:** Approved (implemented)  
**Scope:** Production verify-mode bypass for a single whitelisted Google user — mock AI receipts and optional payment skip — controlled by Vercel Flags.

**Canonical product spec:** [`docs/product/PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md)  
**Related:**

- [`2026-06-10-landing-flags-design.md`](./2026-06-10-landing-flags-design.md) — superseded landing A/B (not in scope)
- [`docs/tech/07-paddle-billing.md`](../../tech/07-paddle-billing.md) — entitlement / Paywall
- [`docs/tech/06-receipt-ai-pipeline.md`](../../tech/06-receipt-ai-pipeline.md) — OpenAI Vision pipeline
- [Vercel Flags SDK](https://vercel.com/docs/flags/vercel-flags/sdks/flags-sdk)

---

## 1. Problem

Production testing requires exercising full flows (receipt upload → AI → export → Paddle) without:

- Calling OpenAI on every test snap (cost + latency)
- Paying $49 per export test iteration
- Affecting real users when flags are toggled in the Vercel Dashboard

We need a **server-side, flag-driven verify lane** that only activates for one whitelisted Google account when the global mode is `verify`.

---

## 2. Decisions (brainstorming approved)

| Topic | Choice |
|-------|--------|
| Whitelist identity | **Google login email only** — Ghost users never bypass |
| Master switch | `runModel === "verify"` — when `"production"`, all users get normal flow |
| Whitelist flag | `verfyUser` (Vercel slug, typo preserved) — email string |
| Payment bypass | `isNeedPay === false` → upsert fake `season_entitlements` on **first export** |
| Fake entitlement ID | `transaction_id = verify_bypass_{userId}_{taxSeason}`, `channel_code = verify_bypass`, `amount = 0` |
| Mock AI | `isMockAI === true` → skip OpenAI; **still upload Blob + write DB** |
| Mock data | `amount` $5–$200; `taxAmount = round(amount × 0.25, 2)`; preset merchants; US category enum (exclude `PERSONAL`) |
| UI | **No visible indicator** — identical UX for whitelist user |
| Architecture | **Centralized `resolveVerifyContext`** (recommended approach A) |
| `landingType` flag | **Out of scope** — unchanged |

---

## 3. Vercel Flags (Dashboard — already configured)

| Flag | Kind | Purpose |
|------|------|---------|
| `runModel` | string | `"verify"` \| `"production"` — global mode |
| `verfyUser` | string | Whitelist Google email |
| `isNeedPay` | boolean | `false` = allow payment bypass for whitelisted user in verify mode |
| `isMockAI` | boolean | `true` = mock AI receipt fields for whitelisted user in verify mode |

**Env (pulled via `vercel env pull`):**

- `FLAGS` — per-environment SDK key (auto-provisioned)
- `FLAGS_SECRET` — encryption key for Flags SDK overrides

**Not in scope:** `landingType` (legacy A/B; product uses single `data_stream` landing).

---

## 4. Gating logic

### 4.1 VerifyContext

Single source of truth in `lib/verify/context.ts`:

```typescript
type VerifyContext = {
  isVerifyMode: boolean;   // runModel === "verify"
  isWhitelisted: boolean;  // actor.email matches verfyUser (case-insensitive, trimmed)
  canBypass: boolean;      // isVerifyMode && isWhitelisted && actor.kind === "user"
  canBypassPay: boolean;   // canBypass && isNeedPay === false
  canMockAi: boolean;      // canBypass && isMockAI === true
};
```

### 4.2 Iron rules

1. **All three** must hold for any bypass: `runModel === "verify"`, email match, `actor.kind === "user"`.
2. Ghost actors **never** bypass (no email in session).
3. Flag evaluation failure (missing `FLAGS`, adapter timeout, etc.) → **`canBypass = false`** — fall through to normal production behavior. Never default to mock/bypass on error.
4. Email comparison: `trim().toLowerCase()` on both sides.
5. When `runModel === "production"`: mock AI and pay bypass **disabled** even for whitelisted email. Existing fake entitlements in DB may still allow export (see §6.3).

### 4.3 Sequence

```
Request → getActor() → resolveVerifyContext(actor)
  ├─ canMockAi     → mockReceiptVision() instead of OpenAI
  ├─ canBypassPay  → ensureBypassEntitlement() before export entitlement check
  └─ else          → existing production path unchanged
```

---

## 5. Architecture

### 5.1 New files

| File | Responsibility |
|------|----------------|
| `flags/verify.ts` | Flag definitions + `vercelAdapter()` + `identify` (user email) |
| `lib/verify/context.ts` | `resolveVerifyContext(actor)` |
| `lib/verify/mockReceiptVision.ts` | Random mock `VisionProcessResult` |
| `lib/verify/ensureBypassEntitlement.ts` | Idempotent fake entitlement upsert |
| `app/.well-known/vercel/flags/route.ts` | Flags Explorer `getProviderData` discovery |

### 5.2 Modified files

| File | Change |
|------|--------|
| `lib/receipts/processReceiptTax.ts` | If `canMockAi`, call mock instead of `processReceiptVision` |
| `app/api/receipts/route.ts` | Pass verify context into tax processing (via actor) |
| `app/api/export/tax-pack/route.ts` | Before entitlement check: `ensureBypassEntitlement` when `canBypassPay` |
| `app/api/entitlements/current/route.ts` | When `canBypassPay`: `ensureBypassEntitlement` then read DB |
| `package.json` | Add `@flags-sdk/vercel` |
| `.env.example` | Document `FLAGS`, `FLAGS_SECRET` |

### 5.3 Unchanged

- Client: `useTaxExportGate`, `PaywallSheet`, `fetchSeasonPaid` — no verify-specific UI or API
- Export gate client flow unchanged

### 5.4 Dependencies

```bash
npm install @flags-sdk/vercel
vercel env pull .env.local
vercel flags prepare   # build-time flag definition fallback
```

### 5.5 identify (Flags SDK)

```typescript
const identify = dedupe(async () => {
  const session = await getSessionFromCookies();
  if (!session?.email) return {};
  return { user: { email: session.email } };
});
```

`resolveVerifyContext` **also** compares `actor.email` from `getActor` — defense in depth if identify is empty on a route.

---

## 6. Feature behavior

### 6.1 Mock AI (`canMockAi`)

**When:** Whitelisted Google user + `runModel=verify` + `isMockAI=true`.

**Pipeline:**

1. Blob upload — **unchanged**
2. Skip OpenAI — call `mockReceiptVision(dataRegion)`
3. Write receipt row — same shape as real Vision success

**Mock field rules (US default):**

| Field | Rule |
|-------|------|
| `amount` | Random $5.00–$200.00, 2 decimal places |
| `taxAmount` | `round(amount × 0.25, 2)` |
| `merchant` | Random from: `Shell`, `Home Depot`, `McDonald's`, `Walmart`, `Costco` |
| `category` | Random from US export categories, **exclude** `PERSONAL` |
| `deductible` | `true` when category ≠ `PERSONAL` |
| `deduction_ratio` | From `resolveDeductionRatio(category, 1)` |
| `confidence` | `0.95` |
| `status` | `done` |
| `aiRaw` | `{ mock: true, model: "verify-mock" }` |

**EU region:** Same amount/merchant rules; `currency: "EUR"`; `vat_amount = taxAmount`; `vat_rate: 0.25` for mock consistency.

**Tax spec exception:** Normal rule forbids updating `tax_amount` without Vision. This mock path is **verify-only**, gated by `canMockAi`, documented here as the sole exception.

### 6.2 Payment bypass (`canBypassPay`)

**When:** Whitelisted Google user + `runModel=verify` + `isNeedPay=false`.

**Trigger:** First export-gate touch for current tax season when no entitlement row exists. Client gate calls `GET /api/entitlements/current` before Paywall — upsert must happen there so `fetchSeasonPaid` returns `paid: true` on first Export tap. Also call `ensureBypassEntitlement` in `POST /api/export/tax-pack` before entitlement check (defense in depth).

**Upsert:**

```typescript
{
  userId: actor.userId,
  taxSeason: currentTaxSeason(),
  transactionId: `verify_bypass_${userId}_${taxSeason}`,
  paidAt: utcNow(),
  amount: 0,
  channelCode: "verify_bypass",
}
```

**Idempotency:** Unique on `(userId, taxSeason)` — safe to call multiple times.

**If real Paddle entitlement exists:** Do **not** upsert fake row; use existing paid record.

**Client:** Unchanged — `useTaxExportGate` → `fetchSeasonPaid` → skip Paywall when upserted row exists.

### 6.3 Fake entitlement lifecycle

- Persists in DB until manually deleted
- Identifiable: `channel_code = 'verify_bypass'`
- Cleanup SQL: `DELETE FROM snaptax_season_entitlements WHERE channel_code = 'verify_bypass';`
- If `isNeedPay` flipped back to `true` while fake row exists: export still works (known B-scheme behavior)
- If `runModel` flipped to `production`: mock AI stops; fake entitlement still satisfies export DB check

---

## 7. Security & logging

| Rule | Detail |
|------|--------|
| No client exposure | Bypass logic **server-only**; no `NEXT_PUBLIC_*` verify flags |
| Logging | Module `biz.verify`; fields: `verifyBypass`, `mockAi`, `bypassPay`, `userId`; **mask email**, never log `FLAGS` / secrets |
| Fail closed | Flag errors → normal production |
| Audit | `aiRaw.mock = true` on receipts; `channel_code = verify_bypass` on entitlements |

---

## 8. Error handling

| Scenario | Behavior |
|----------|----------|
| Missing `FLAGS` / `FLAGS_SECRET` | Warn in dev; `canBypass = false` |
| OpenAI down + `canMockAi=false` | Existing blurry/error behavior |
| OpenAI down + `canMockAi=true` | Mock succeeds |
| Upsert entitlement fails | Export 500; log error |
| Real entitlement exists | Skip fake upsert |

---

## 9. Testing

### 9.1 Unit tests (`lib/verify/*.test.ts`)

- `resolveVerifyContext` — matrix: `runModel` × email match × actor kind × flag values
- `mockReceiptVision` — amount bounds, taxAmount formula, valid categories
- `ensureBypassEntitlement` — idempotent upsert; no overwrite of real Paddle row

### 9.2 Manual checklist

1. Whitelist + `verify` + `isMockAI=true` → snap receipt, no OpenAI, random amounts
2. Non-whitelist + same flags → normal OpenAI
3. Whitelist + `isNeedPay=false` → export without Paywall (after entitlement upsert)
4. `runModel=production` → whitelist user normal flow
5. Ghost user → never bypass

---

## 10. Implementation status

| Item | Status |
|------|--------|
| Vercel Flags dashboard | ✅ Configured |
| `FLAGS` / `FLAGS_SECRET` local | ✅ Pulled |
| `@flags-sdk/vercel` | ✅ Installed |
| Code integration | ✅ Implemented |

---

## 11. Out of scope

- `landingType` A/B reintroduction
- Ghost-based whitelist
- Client-side verify UI / debug banner
- Configurable mock ranges via extra flags
- Auto-revoke fake entitlements when flags change
