# Founder SPECIAL Internal Test Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let whitelisted Google accounts (`verfyUser` flag + matching email) checkout at `FOUNDER_LEVEL_SPECIAL` Paddle price in production, preview, and local dev — without consuming Founder seats or enabling verify bypass.

**Architecture:** Add internal `SPECIAL` skuTier gated by server-only `resolveSpecialCheckoutEligible`. Short-circuit `season-offer` and `checkout-intent` before public tier logic; webhook grants season entitlement but skips `assignFounderSeat`. UI shows fixed label **Test price** (no numeric USD).

**Tech Stack:** Next.js 16 · TypeScript · Vercel Flags (`verfyUser`) · Paddle · node:test (`npm run test:unit`)

**Spec:** [`docs/superpowers/specs/2026-07-25-founder-special-seat-design.md`](../specs/2026-07-25-founder-special-seat-design.md)

## Global Constraints

- Whitelist: reuse existing Flags key **`verfyUser`** (single email, case-insensitive); do **not** enable `canBypassPay`, `isMockAI`, or require `runModel=verify`
- Env: **`FOUNDER_LEVEL_SPECIAL`** = Paddle Price ID; optional **`PADDLE_SPECIAL_MIN_AMOUNT_CENTS`** default **`100`**
- Public min unchanged: **`PADDLE_MIN_AMOUNT_CENTS`** default **`500`**
- **No founder seat:** `SPECIAL` must never call `assignFounderSeatOnFirstPurchase`
- UI copy: English **`Test price`** only; no `formatCurrency` for internal test
- Fail-closed: missing env or non-whitelist → existing public behavior
- Marketing/legal pricing pages must **not** expose SPECIAL
- Environments: production + preview + local (when configured)

---

## File map

| File | Responsibility |
|------|----------------|
| `lib/founder/types.ts` | Add `SPECIAL` to `FounderTier`; export `PublicFounderTier` |
| `lib/server/env.ts` | `getPaddlePriceIdSpecial()`, `envSpecialMinAmountCents()` |
| `lib/billing/specialCheckout.ts` | Eligibility + `buildSpecialSeasonOffer()` |
| `lib/server/seasonOffer.ts` | Call special resolver before public tier |
| `app/api/billing/season-offer/route.ts` | Pass `priceLabel` for internal test |
| `app/api/billing/checkout-intent/route.ts` | Force SPECIAL when eligible |
| `app/api/founder/program/route.ts` | Overlay `internalTestCheckout` fields |
| `lib/billing/validatePaddleTransaction.ts` | SPECIAL min amount branch |
| `lib/billing/handlePaddleWebhook.ts` | Ensure SPECIAL excluded from seat assign |
| `lib/client/useSeasonOffer.ts` | `priceLabel`, `isInternalTestPrice` |
| `components/settings/PaywallSheet.tsx` | Use `priceLabel` |
| `components/settings/TaxExportCard.tsx` | Use `priceLabel` |
| `components/home/sheets/FounderProgramSheet.tsx` | Test price + skip programOpen gate |
| `components/home/widgets/WidgetStack.tsx` | Test price in widget preview |
| `lib/founder/fetchFounderProgramClient.ts` | Extend response type |

---

### Task 1: Types, env helpers, and eligibility core

**Files:**
- Modify: `lib/founder/types.ts`
- Modify: `lib/server/env.ts`
- Create: `lib/billing/specialCheckout.ts`
- Create: `lib/billing/specialCheckout.test.ts`
- Modify: `lib/server/founderConfig.ts` (use `PublicFounderTier` for flag price record)

**Interfaces:**
- Produces:
  - `PublicFounderTier = Exclude<FounderTier, "SPECIAL">`
  - `getPaddlePriceIdSpecial(): string`
  - `envSpecialMinAmountCents(): number`
  - `normalizeWhitelistEmail(email: string): string`
  - `resolveSpecialCheckoutEligible(actor: Actor, verfyUser: string): boolean`
  - `buildSpecialSeasonOffer(taxSeason: string): SeasonOffer & { priceDisplay: "internal_test"; priceLabel: "Test price" }`
  - `SPECIAL_PRICE_LABEL = "Test price" as const`

- [ ] **Step 1: Write failing tests**

Create `lib/billing/specialCheckout.test.ts`:

```typescript
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import type { Actor } from "@/lib/auth/getActor";
import {
  normalizeWhitelistEmail,
  resolveSpecialCheckoutEligible,
  buildSpecialSeasonOffer,
  SPECIAL_PRICE_LABEL,
} from "./specialCheckout";

const user: Actor = { kind: "user", userId: "u1", email: "Test@Example.com" };
const ghost: Actor = { kind: "ghost", ghostId: "g1", bound: false };

describe("normalizeWhitelistEmail", () => {
  it("lowercases and trims", () => {
    assert.equal(normalizeWhitelistEmail("  Test@Example.com "), "test@example.com");
  });
});

describe("resolveSpecialCheckoutEligible", () => {
  const orig = process.env.FOUNDER_LEVEL_SPECIAL;

  afterEach(() => {
    if (orig === undefined) delete process.env.FOUNDER_LEVEL_SPECIAL;
    else process.env.FOUNDER_LEVEL_SPECIAL = orig;
  });

  it("returns true for matching user with env set", () => {
    process.env.FOUNDER_LEVEL_SPECIAL = "pri_special_test";
    assert.equal(resolveSpecialCheckoutEligible(user, "test@example.com"), true);
  });

  it("returns false for ghost", () => {
    process.env.FOUNDER_LEVEL_SPECIAL = "pri_special_test";
    assert.equal(resolveSpecialCheckoutEligible(ghost, "test@example.com"), false);
  });

  it("returns false when verfyUser empty", () => {
    process.env.FOUNDER_LEVEL_SPECIAL = "pri_special_test";
    assert.equal(resolveSpecialCheckoutEligible(user, ""), false);
  });

  it("returns false when env missing", () => {
    delete process.env.FOUNDER_LEVEL_SPECIAL;
    assert.equal(resolveSpecialCheckoutEligible(user, "test@example.com"), false);
  });

  it("returns false for non-matching email", () => {
    process.env.FOUNDER_LEVEL_SPECIAL = "pri_special_test";
    assert.equal(resolveSpecialCheckoutEligible(user, "other@example.com"), false);
  });
});

describe("buildSpecialSeasonOffer", () => {
  it("returns internal test payload", () => {
    const offer = buildSpecialSeasonOffer("2025");
    assert.equal(offer.skuTier, "SPECIAL");
    assert.equal(offer.priceUsd, 0);
    assert.equal(offer.priceCents, 0);
    assert.equal(offer.taxSeason, "2025");
    assert.equal(offer.priceDisplay, "internal_test");
    assert.equal(offer.priceLabel, SPECIAL_PRICE_LABEL);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- lib/billing/specialCheckout.test.ts`  
Expected: FAIL — module `./specialCheckout` not found

- [ ] **Step 3: Implement types and core module**

`lib/founder/types.ts` — extend union and add alias:

```typescript
export type FounderTier =
  | "FOUNDER_LEVEL_SUPER"
  | "EARLY"
  | "FOUNDER"
  | "DEFAULT"
  | "SPECIAL";

export type PublicFounderTier = Exclude<FounderTier, "SPECIAL">;
```

`lib/server/env.ts` — add:

```typescript
export function getPaddlePriceIdSpecial(): string {
  return (process.env.FOUNDER_LEVEL_SPECIAL ?? "").trim();
}

export function envSpecialMinAmountCents(): number {
  const raw = process.env.PADDLE_SPECIAL_MIN_AMOUNT_CENTS;
  if (raw == null || raw.trim() === "") return 100;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
}
```

`lib/billing/specialCheckout.ts`:

```typescript
import type { Actor } from "@/lib/auth/getActor";
import type { SeasonOffer } from "@/lib/server/seasonOffer";
import { getPaddlePriceIdSpecial } from "@/lib/server/env";

export const SPECIAL_PRICE_LABEL = "Test price" as const;

export type InternalTestSeasonOffer = SeasonOffer & {
  priceDisplay: "internal_test";
  priceLabel: typeof SPECIAL_PRICE_LABEL;
};

export function normalizeWhitelistEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function resolveSpecialCheckoutEligible(
  actor: Actor,
  verfyUser: string,
): boolean {
  const priceId = getPaddlePriceIdSpecial();
  if (!priceId) return false;
  if (!verfyUser.trim()) return false;
  if (actor.kind !== "user" || !actor.email) return false;
  return (
    normalizeWhitelistEmail(actor.email) === normalizeWhitelistEmail(verfyUser)
  );
}

export function buildSpecialSeasonOffer(taxSeason: string): InternalTestSeasonOffer {
  return {
    skuTier: "SPECIAL",
    priceUsd: 0,
    priceCents: 0,
    taxSeason,
    priceDisplay: "internal_test",
    priceLabel: SPECIAL_PRICE_LABEL,
  };
}
```

`lib/server/founderConfig.ts` — change `Record<FounderTier, number>` to `Record<PublicFounderTier, number>` in `buildFounderTierConfigs` / `resolveFounderProgramConfig` (import `PublicFounderTier`).

- [ ] **Step 4: Run tests**

Run: `npm run test:unit -- lib/billing/specialCheckout.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/founder/types.ts lib/server/env.ts lib/billing/specialCheckout.ts lib/billing/specialCheckout.test.ts lib/server/founderConfig.ts
git commit -m "feat(billing): add SPECIAL checkout eligibility core"
```

---

### Task 2: Season offer server path

**Files:**
- Modify: `lib/server/seasonOffer.ts`
- Modify: `lib/server/seasonOffer.test.ts`
- Modify: `app/api/billing/season-offer/route.ts`

**Interfaces:**
- Consumes: `resolveSpecialCheckoutEligible`, `buildSpecialSeasonOffer` from Task 1
- Produces: `getSeasonOffer(userId?, actor?, verfyUser?)` returns SPECIAL offer when eligible

- [ ] **Step 1: Write failing test**

Add to `lib/server/seasonOffer.test.ts`:

```typescript
import { buildSpecialSeasonOffer } from "@/lib/billing/specialCheckout";

it("resolveSpecialSeasonOffer returns internal test offer", () => {
  const offer = buildSpecialSeasonOffer("2025");
  assert.equal(offer.skuTier, "SPECIAL");
  assert.equal(offer.priceLabel, "Test price");
});
```

Add integration-style test for new helper `resolveSeasonOfferForActor` in `seasonOffer.ts`:

```typescript
it("returns SPECIAL when actor is eligible", () => {
  const actor = { kind: "user" as const, userId: "u1", email: "test@example.com" };
  process.env.FOUNDER_LEVEL_SPECIAL = "pri_special";
  const offer = resolveSeasonOfferForActor({
    actor,
    verfyUser: "test@example.com",
    enabled: true,
    tiers: mockTiers,
    user: null,
    claimedCount: 0,
    programOpen: true,
    taxSeason: "2025",
  });
  assert.equal(offer.skuTier, "SPECIAL");
  assert.equal(offer.priceDisplay, "internal_test");
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm run test:unit -- lib/server/seasonOffer.test.ts`

- [ ] **Step 3: Implement**

`lib/server/seasonOffer.ts`:

```typescript
import {
  buildSpecialSeasonOffer,
  resolveSpecialCheckoutEligible,
} from "@/lib/billing/specialCheckout";
import type { Actor } from "@/lib/auth/getActor";

export type SeasonOffer = {
  priceUsd: number;
  priceCents: number;
  skuTier: FounderTier;
  taxSeason: string;
  priceDisplay?: "internal_test";
  priceLabel?: string;
};

export type ResolveSeasonOfferForActorInput = ResolveSeasonOfferInput & {
  actor: Actor | null;
  verfyUser: string;
};

export function resolveSeasonOfferForActor(
  input: ResolveSeasonOfferForActorInput,
): SeasonOffer {
  if (
    input.actor &&
    resolveSpecialCheckoutEligible(input.actor, input.verfyUser)
  ) {
    return buildSpecialSeasonOffer(input.taxSeason);
  }
  return resolveSeasonOfferFromState(input);
}

export async function getSeasonOffer(
  userId?: string,
  options?: { actor?: Actor | null; verfyUser?: string },
): Promise<SeasonOffer> {
  const config = await resolveFounderProgramConfig();
  const state = await getFounderProgramState(userId);
  const taxSeason = currentTaxSeason();
  const verfyUser = options?.verfyUser ?? "";

  return resolveSeasonOfferForActor({
    actor: options?.actor ?? null,
    verfyUser,
    enabled: config.enabled,
    tiers: config.tiers,
    user: state.user,
    claimedCount: state.claimedCount,
    programOpen: state.programOpen,
    taxSeason,
  });
}
```

`app/api/billing/season-offer/route.ts`:

```typescript
import { verfyUserFlag } from "@/flags/verify";

// inside handler after getActor:
const verfyUser = await verfyUserFlag();
const offer = await getSeasonOffer(userId, { actor, verfyUser });

return NextResponse.json({
  ...offer,
  priceLabel:
    offer.priceLabel ??
    (offer.priceDisplay === "internal_test"
      ? offer.priceLabel
      : formatCurrency(offer.priceUsd)),
});
```

Fix route so internal test keeps `"Test price"` (do not run `formatCurrency` when `priceDisplay === "internal_test"`).

- [ ] **Step 4: Run tests**

Run: `npm run test:unit -- lib/server/seasonOffer.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/server/seasonOffer.ts lib/server/seasonOffer.test.ts app/api/billing/season-offer/route.ts
git commit -m "feat(billing): short-circuit season offer for SPECIAL checkout"
```

---

### Task 3: Checkout-intent SPECIAL override

**Files:**
- Modify: `app/api/billing/checkout-intent/route.ts`
- Create: `lib/billing/checkoutIntentSpecial.test.ts` (pure helper tests)

**Interfaces:**
- Consumes: `resolveSpecialCheckoutEligible`, `getPaddlePriceIdSpecial`, `buildSpecialSeasonOffer`
- Produces: checkout-intent returns `{ skuTier: "SPECIAL", paddlePriceId }` for eligible users even when `founderPurchase: true` and program full

- [ ] **Step 1: Extract testable resolver**

Create `lib/billing/resolveCheckoutSkuTier.ts`:

```typescript
import type { Actor } from "@/lib/auth/getActor";
import type { FounderTier } from "@/lib/founder/types";
import { resolveSpecialCheckoutEligible } from "@/lib/billing/specialCheckout";
import {
  resolveFounderCheckoutSkuTier,
  type FounderCheckoutUser,
} from "@/lib/server/founderProgram";
import { resolveSeasonOfferFromState } from "@/lib/server/seasonOffer";
import type { FounderTierConfig } from "@/lib/server/founderConfig";

export type ResolveCheckoutSkuTierInput = {
  actor: Actor;
  verfyUser: string;
  body: { founderPurchase?: boolean; skuTier?: FounderTier; taxSeason: string };
  founderUser: FounderCheckoutUser | null;
  claimedCount: number;
  programOpen: boolean;
  enabled: boolean;
  tiers: Record<Exclude<FounderTier, "SPECIAL">, FounderTierConfig>;
};

export type ResolveCheckoutSkuTierResult =
  | { skuTier: "SPECIAL"; isSpecial: true }
  | { skuTier: FounderTier; isSpecial: false };

export function resolveCheckoutSkuTier(
  input: ResolveCheckoutSkuTierInput,
): ResolveCheckoutSkuTierResult {
  if (resolveSpecialCheckoutEligible(input.actor, input.verfyUser)) {
    return { skuTier: "SPECIAL", isSpecial: true };
  }

  if (input.body.founderPurchase) {
    const resolution = resolveFounderCheckoutSkuTier({
      user: input.founderUser,
      claimedCount: input.claimedCount,
      programOpen: input.programOpen,
    });
    if (!resolution.ok) throw new Error(resolution.error);
    return { skuTier: resolution.skuTier, isSpecial: false };
  }

  if (input.body.skuTier != null) {
    return { skuTier: input.body.skuTier, isSpecial: false };
  }

  const offer = resolveSeasonOfferFromState({
    enabled: input.enabled,
    tiers: input.tiers,
    user: input.founderUser,
    claimedCount: input.claimedCount,
    programOpen: input.programOpen,
    taxSeason: input.body.taxSeason,
  });
  return { skuTier: offer.skuTier, isSpecial: false };
}
```

- [ ] **Step 2: Write failing tests**

`lib/billing/checkoutIntentSpecial.test.ts`:

```typescript
it("forces SPECIAL for whitelisted user even when founder program full", () => {
  process.env.FOUNDER_LEVEL_SPECIAL = "pri_special";
  const result = resolveCheckoutSkuTier({
    actor: { kind: "user", userId: "u1", email: "test@example.com" },
    verfyUser: "test@example.com",
    body: { founderPurchase: true, taxSeason: "2025" },
    founderUser: null,
    claimedCount: 50,
    programOpen: false,
    enabled: true,
    tiers: mockTiers,
  });
  assert.deepEqual(result, { skuTier: "SPECIAL", isSpecial: true });
});
```

- [ ] **Step 3: Wire route**

`app/api/billing/checkout-intent/route.ts`:

```typescript
import { verfyUserFlag } from "@/flags/verify";
import { resolveCheckoutSkuTier } from "@/lib/billing/resolveCheckoutSkuTier";
import { getPaddlePriceIdSpecial } from "@/lib/server/env";

const founderTierSchema = z.enum([
  "FOUNDER_LEVEL_SUPER",
  "EARLY",
  "FOUNDER",
  "DEFAULT",
  "SPECIAL",
]);

// after parsing body:
const verfyUser = await verfyUserFlag();
const { skuTier: resolvedSkuTier, isSpecial } = resolveCheckoutSkuTier({ ... });

const paddlePriceId = isSpecial
  ? getPaddlePriceIdSpecial()
  : config.tiers[resolvedSkuTier as PublicFounderTier].paddlePriceId;

if (isSpecial && !paddlePriceId) throw new Error("PADDLE_SPECIAL_PRICE_MISSING");
```

- [ ] **Step 4: Run tests**

Run: `npm run test:unit -- lib/billing/checkoutIntentSpecial.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/billing/resolveCheckoutSkuTier.ts lib/billing/checkoutIntentSpecial.test.ts app/api/billing/checkout-intent/route.ts
git commit -m "feat(billing): SPECIAL checkout-intent override for whitelisted users"
```

---

### Task 4: Webhook validation and seat exclusion

**Files:**
- Modify: `lib/billing/validatePaddleTransaction.ts`
- Modify: `lib/billing/validatePaddleTransaction.test.ts`
- Modify: `lib/billing/handlePaddleWebhook.ts`

**Interfaces:**
- Consumes: `envSpecialMinAmountCents()` from Task 1
- Produces: SPECIAL transactions ≥ $1 (default) pass; `isFounderSkuTier("SPECIAL") === false`

- [ ] **Step 1: Write failing tests**

Add to `validatePaddleTransaction.test.ts`:

```typescript
it("accepts SPECIAL tier at special min ($1) but rejects below", () => {
  process.env.PADDLE_SPECIAL_MIN_AMOUNT_CENTS = "100";
  const ok = validatePaddleTransaction({
    ...basePayload,
    data: {
      ...basePayload.data!,
      details: { totals: { total: "100", currency_code: "USD" } },
      custom_data: { intentId: "intent-uuid", skuTier: "SPECIAL" },
    },
  });
  assert.equal(ok.ok, true);

  const low = validatePaddleTransaction({
    ...basePayload,
    data: {
      ...basePayload.data!,
      details: { totals: { total: "50", currency_code: "USD" } },
      custom_data: { intentId: "intent-uuid", skuTier: "SPECIAL" },
    },
  });
  assert.equal(low.ok, false);
  if (!low.ok) assert.equal(low.reason, "amount_too_low");
});
```

Add webhook unit test (extract `isFounderSkuTier` to `lib/billing/founderSkuTier.ts` if needed):

```typescript
assert.equal(isFounderSkuTier("SPECIAL"), false);
assert.equal(isFounderSkuTier("FOUNDER"), true);
```

- [ ] **Step 2: Implement validation branch**

`validatePaddleTransaction.ts`:

```typescript
import { envSpecialMinAmountCents } from "@/lib/server/env";

function minAmountCentsForSku(skuTier: string | undefined): number {
  if (skuTier === "SPECIAL") return envSpecialMinAmountCents();
  return envMinAmountCents();
}

// inside validatePaddleTransaction, before amount check:
const skuTier = data.custom_data?.skuTier;
const minCents = minAmountCentsForSku(skuTier);
```

Ensure `isFounderSkuTier` in webhook excludes `"SPECIAL"`. Add log field `internal_test_checkout: true` when skuTier is SPECIAL.

- [ ] **Step 3: Run tests**

Run: `npm run test:unit -- lib/billing/validatePaddleTransaction.test.ts`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add lib/billing/validatePaddleTransaction.ts lib/billing/validatePaddleTransaction.test.ts lib/billing/handlePaddleWebhook.ts
git commit -m "feat(billing): webhook SPECIAL min amount and no seat assign"
```

---

### Task 5: Founder program API overlay

**Files:**
- Modify: `app/api/founder/program/route.ts`
- Modify: `lib/founder/fetchFounderProgramClient.ts`

**Interfaces:**
- Produces response fields: `internalTestCheckout?: boolean`, `internalTestPriceLabel?: "Test price"`

- [ ] **Step 1: Implement route overlay**

```typescript
import { verfyUserFlag } from "@/flags/verify";
import { resolveSpecialCheckoutEligible, SPECIAL_PRICE_LABEL } from "@/lib/billing/specialCheckout";

const actor = await getActor(request);
const verfyUser = await verfyUserFlag();
const state = await getFounderProgramState(userId);
const internalTestCheckout =
  actor.kind === "user" && resolveSpecialCheckoutEligible(actor, verfyUser);

return NextResponse.json({
  ...state,
  ...(internalTestCheckout
    ? {
        internalTestCheckout: true,
        internalTestPriceLabel: SPECIAL_PRICE_LABEL,
      }
    : {}),
});
```

- [ ] **Step 2: Extend client type**

```typescript
export type FounderProgramClientState = {
  // ...existing
  internalTestCheckout?: boolean;
  internalTestPriceLabel?: string;
};
```

- [ ] **Step 3: Commit**

```bash
git add app/api/founder/program/route.ts lib/founder/fetchFounderProgramClient.ts
git commit -m "feat(founder): expose internal test checkout overlay on program API"
```

---

### Task 6: Client UI — season offer hook and Paywall

**Files:**
- Modify: `lib/client/useSeasonOffer.ts`
- Modify: `components/settings/PaywallSheet.tsx`
- Modify: `components/settings/TaxExportCard.tsx`

**Interfaces:**
- Consumes: `GET /api/billing/season-offer` with `priceDisplay`, `priceLabel`

- [ ] **Step 1: Extend hook**

```typescript
export type ClientSeasonOffer = {
  priceUsd: number;
  priceCents: number;
  priceLabel: string;
  skuTier: FounderTier;
  taxSeason: string;
  priceDisplay?: "internal_test";
};

export function useSeasonOffer() {
  // ...
  const isInternalTestPrice = offer?.priceDisplay === "internal_test";
  const priceLabel = offer?.priceLabel ?? formatCurrency(offer?.priceUsd ?? DEFAULT_PRICE_USD);

  return {
    offer,
    priceUsd: offer?.priceUsd ?? DEFAULT_PRICE_USD,
    priceLabel,
    isInternalTestPrice,
    skuTier: offer?.skuTier ?? ("DEFAULT" as FounderTier),
  };
}
```

Accept `priceUsd: 0` when `priceDisplay === "internal_test"` (do not discard offer).

- [ ] **Step 2: Update PaywallSheet and TaxExportCard**

Replace `formatCurrency(priceUsd)` with `priceLabel` from hook:

```typescript
const { priceLabel } = useSeasonOffer();
const displayPrice = priceLabel;
// template.replace("{price}", displayPrice)
```

- [ ] **Step 3: Manual smoke**

Run dev server; whitelisted user should see **Test price** on Export CTA (requires env + flag in local).

- [ ] **Step 4: Commit**

```bash
git add lib/client/useSeasonOffer.ts components/settings/PaywallSheet.tsx components/settings/TaxExportCard.tsx
git commit -m "feat(ui): show Test price label for internal SPECIAL checkout"
```

---

### Task 7: Founder Widget and Sheet

**Files:**
- Modify: `components/home/widgets/WidgetStack.tsx`
- Modify: `components/home/widgets/FounderProgramWidget.tsx`
- Modify: `components/home/sheets/FounderProgramSheet.tsx`

- [ ] **Step 1: WidgetStack preview**

```typescript
function buildFounderPreview(program: FounderProgramResponse): FounderWidgetPreview {
  if (program.internalTestCheckout && program.internalTestPriceLabel) {
    return {
      priceUsd: 0,
      priceLabel: program.internalTestPriceLabel,
      remaining: program.remaining,
    };
  }
  // existing priceUsd path
}
```

Extend `FounderWidgetPreview` with optional `priceLabel?: string`.

- [ ] **Step 2: FounderProgramWidget**

Use `preview.priceLabel ?? formatCurrency(preview.priceUsd)` in subtitle.

- [ ] **Step 3: FounderProgramSheet**

When `program.internalTestCheckout`:
- Use `program.internalTestPriceLabel` for season line and claim CTA
- Skip `!fresh.programOpen` block before checkout-intent

```typescript
if (!fresh.internalTestCheckout && !fresh.programOpen) {
  notifyProgramFull(fresh.seatsTotal);
  return;
}
```

- [ ] **Step 4: Commit**

```bash
git add components/home/widgets/WidgetStack.tsx components/home/widgets/FounderProgramWidget.tsx components/home/sheets/FounderProgramSheet.tsx
git commit -m "feat(founder): internal test price in widget and sheet"
```

---

### Task 8: Regression, type fixes, and guard rails

**Files:**
- Modify: any files broken by `FounderTier` union (grep `Record<FounderTier`)
- Verify: `lib/legal/pricingPageData.ts` — no SPECIAL path
- Verify: `lib/founder/tiers.ts`, `resolveDisplayTier.ts` — exclude SPECIAL (assert unreachable or narrow to `PublicFounderTier`)
- Modify: `lib/founder/types.ts` consumers as needed

- [ ] **Step 1: Run full unit suite**

Run: `npm run test:unit`  
Expected: all pass

- [ ] **Step 2: Run lint on touched files**

Run: `npm run lint`  
Fix any new errors in modified files only.

- [ ] **Step 3: Grep guard**

Run: `rg 'SPECIAL' lib/legal/pricingPageData.ts` — must not appear in public tier rows.

- [ ] **Step 4: Commit fixes**

```bash
git add -A
git commit -m "chore(billing): fix FounderTier SPECIAL fallout and regression tests"
```

---

## Manual test checklist (preview/prod)

1. Vercel: set `FOUNDER_LEVEL_SPECIAL=<paddle_price_id>` on Preview + Production
2. Flags: set `verfyUser` to test Google account email
3. Login as test account → Paywall shows **Test price** → Paddle checkout completes → Export unlocked
4. Founder Sheet → **Test price** → purchase → no Founder badge, no seat consumed (`founder_number` null)
5. Login as other Google account → normal tier prices only
6. Unset `FOUNDER_LEVEL_SPECIAL` → test account reverts to public pricing immediately

---

## Spec coverage self-review

| Spec section | Task |
|--------------|------|
| Eligibility server-only | Task 1 |
| season-offer SHORT-circuit | Task 2 |
| checkout-intent override + founderPurchase | Task 3 |
| Webhook no seat + SPECIAL min | Task 4 |
| Founder program overlay | Task 5 |
| UI Test price all surfaces | Tasks 6–7 |
| Marketing exclusion | Task 8 |
| Fail-closed / no verify bypass | Tasks 1, 3 |
| PADDLE_SPECIAL_MIN_AMOUNT_CENTS | Tasks 1, 4 |

No placeholders remain. Type names consistent across tasks.
