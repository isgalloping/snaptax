# Founder Program Widget — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Founder Program as Home Widget #1 with season-SKU Paddle checkout, 50-seat tier lock, Settings Badge, and Flag-driven pricing.

**Architecture:** Pure domain layer (`lib/founder/*`) for tier/seat/visibility; Postgres columns on `snaptax_users`; `GET /api/founder/program` + extended checkout-intent/webhook; UI as Widget card + bottom Sheet reusing PaywallSheet Paddle pattern. Waves are independently shippable — Wave 1–2 can run behind feature flag before UI goes live.

**Tech Stack:** Next.js 16 · React 19 · Tailwind 4 · Prisma · Vercel Flags (`flags/next`) · Paddle.js · node:test

**Spec:** [`docs/superpowers/specs/2026-06-30-founder-program-widget-design.md`](../specs/2026-06-30-founder-program-widget-design.md)

---

## Locked open items (from spec)

| Item | Decision |
|------|----------|
| Ghost UX | Show widget; Sheet shows **Sign in with Google** before Paddle |
| i18n | EN first in `en-US.ts`; add same keys to `fr-FR.ts` / `de-DE.ts` (translate or EN fallback) |
| Existing season buyers | **No backfill** — keep entitlement only; no `founder_number` |
| Flag keys | `founderProgramEnabled`, `founderPriceSuperCents`, `founderPriceEarlyCents`, `founderPriceFounderCents`, `founderPriceDefaultCents` |
| Paddle env | `PADDLE_PRICE_ID_FOUNDER_SUPER`, `PADDLE_PRICE_ID_FOUNDER_EARLY`, `PADDLE_PRICE_ID_FOUNDER`; `PADDLE_PRICE_ID` = DEFAULT |

---

## File map

| File | Responsibility |
|------|----------------|
| `lib/founder/types.ts` | Tier enum, status enum, API DTO types |
| `lib/founder/tiers.ts` | Seat→tier mapping, tier labels, price resolution inputs |
| `lib/founder/tiers.test.ts` | Tier + seat assignment unit tests |
| `lib/founder/visibility.ts` | `isFounderWidgetVisible()` pure function |
| `lib/founder/visibility.test.ts` | Visibility rules |
| `lib/founder/logFounderEvent.ts` | Client `biz.founder` console events (spec §14) |
| `lib/founder/founderStorage.ts` | `FOUNDER_WIDGET_SEEN_KEY` localStorage |
| `flags/founder.ts` | Vercel Flags definitions |
| `lib/server/founderConfig.ts` | Flag + env → resolved tier prices & Paddle IDs |
| `lib/server/founderProgram.ts` | DB reads: claimedCount, user founder fields |
| `lib/server/assignFounderSeat.ts` | Transactional seat assign on first founder purchase |
| `lib/server/assignFounderSeat.test.ts` | Race / cap tests with injected deps |
| `prisma/schema.prisma` | Founder columns on `SnaptaxUser` |
| `db/init-table.sql` | DDL + comments mirror |
| `app/api/founder/program/route.ts` | Public + session-aware program state |
| `app/api/billing/checkout-intent/route.ts` | Accept optional `skuTier` |
| `lib/billing/checkoutIntent.ts` | Persist `skuTier` on intent (migration) |
| `app/api/webhooks/paddle/route.ts` | Call `assignFounderSeat` after grant |
| `lib/home/buildWidgetPages.ts` | Prepend `founder` key when visible |
| `lib/home/buildWidgetPages.test.ts` | Founder ordering tests |
| `components/home/widgets/FounderProgramWidget.tsx` | Amber crown card |
| `components/home/sheets/FounderProgramSheet.tsx` | Offer + Google gate + Paddle |
| `components/home/widgets/WidgetPager.tsx` | Render founder + `onFounderOpen` |
| `components/home/widgets/WidgetStack.tsx` | Fetch program API, pass visibility |
| `components/home/HomeScreen.tsx` | Sheet state + refresh on purchase |
| `components/settings/SettingsAccountBlock.tsx` | Founder Badge row |
| `lib/i18n/locales/en-US.ts` (+ fr/de) | Copy keys |
| `lib/ui/homeVisual.ts` | `widgets.founder` tokens |
| `docs/product/PRODUCT-SPEC.md` | §12 row for Founder Program |

---

## Wave F0 — Domain & visibility (no UI)

### Task F0-1: Founder types and tier mapping

**Files:**
- Create: `lib/founder/types.ts`
- Create: `lib/founder/tiers.ts`
- Create: `lib/founder/tiers.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// lib/founder/tiers.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tierForSeat, nextSeatNumber, FOUNDER_SEATS_TOTAL } from "./tiers.ts";

describe("tierForSeat", () => {
  it("maps super tier for seats 1-10", () => {
    assert.equal(tierForSeat(1), "FOUNDER_LEVEL_SUPER");
    assert.equal(tierForSeat(10), "FOUNDER_LEVEL_SUPER");
  });
  it("maps early for 11-30", () => {
    assert.equal(tierForSeat(11), "EARLY");
    assert.equal(tierForSeat(30), "EARLY");
  });
  it("maps founder for 31-50", () => {
    assert.equal(tierForSeat(31), "FOUNDER");
    assert.equal(tierForSeat(50), "FOUNDER");
  });
  it("returns null beyond cap", () => {
    assert.equal(tierForSeat(51), null);
  });
});

describe("nextSeatNumber", () => {
  it("returns claimed+1 when under cap", () => {
    assert.equal(nextSeatNumber(0), 1);
    assert.equal(nextSeatNumber(49), 50);
  });
  it("returns null when full", () => {
    assert.equal(nextSeatNumber(FOUNDER_SEATS_TOTAL), null);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm run test:unit -- lib/founder/tiers.test.ts`  
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

```typescript
// lib/founder/types.ts
export type FounderTier =
  | "FOUNDER_LEVEL_SUPER"
  | "EARLY"
  | "FOUNDER"
  | "DEFAULT";

export type FounderStatus = "none" | "active" | "lapsed";

export const FOUNDER_SEATS_TOTAL = 50;
```

```typescript
// lib/founder/tiers.ts
import type { FounderTier } from "./types.ts";
export { FOUNDER_SEATS_TOTAL } from "./types.ts";

export function tierForSeat(seat: number): FounderTier | null {
  if (seat < 1 || seat > 50) return null;
  if (seat <= 10) return "FOUNDER_LEVEL_SUPER";
  if (seat <= 30) return "EARLY";
  return "FOUNDER";
}

export function nextSeatNumber(claimedCount: number): number | null {
  if (claimedCount >= FOUNDER_SEATS_TOTAL) return null;
  return claimedCount + 1;
}

export function tierDisplayLabel(tier: FounderTier): string {
  switch (tier) {
    case "FOUNDER_LEVEL_SUPER":
      return "Super Founder";
    case "EARLY":
      return "Early Founder";
    case "FOUNDER":
      return "Founder";
    default:
      return "Standard";
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm run test:unit -- lib/founder/tiers.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/founder/types.ts lib/founder/tiers.ts lib/founder/tiers.test.ts
git commit -m "feat(founder): add tier and seat mapping domain"
```

---

### Task F0-2: Widget visibility pure function

**Files:**
- Create: `lib/founder/visibility.ts`
- Create: `lib/founder/visibility.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isFounderWidgetVisible } from "./visibility.ts";

describe("isFounderWidgetVisible", () => {
  it("hidden when program disabled", () => {
    assert.equal(
      isFounderWidgetVisible({ enabled: false, claimedCount: 0, founderStatus: "none" }),
      false,
    );
  });
  it("hidden when seats full", () => {
    assert.equal(
      isFounderWidgetVisible({ enabled: true, claimedCount: 50, founderStatus: "none" }),
      false,
    );
  });
  it("hidden when user is active founder", () => {
    assert.equal(
      isFounderWidgetVisible({ enabled: true, claimedCount: 10, founderStatus: "active" }),
      false,
    );
  });
  it("visible for guest when seats remain", () => {
    assert.equal(
      isFounderWidgetVisible({ enabled: true, claimedCount: 12, founderStatus: "none" }),
      true,
    );
  });
  it("visible for lapsed founder (renew at default via sheet)", () => {
    assert.equal(
      isFounderWidgetVisible({ enabled: true, claimedCount: 12, founderStatus: "lapsed" }),
      true,
    );
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

```typescript
// lib/founder/visibility.ts
import type { FounderStatus } from "./types.ts";
import { FOUNDER_SEATS_TOTAL } from "./types.ts";

export type FounderVisibilityInput = {
  enabled: boolean;
  claimedCount: number;
  founderStatus: FounderStatus;
};

export function isFounderWidgetVisible(input: FounderVisibilityInput): boolean {
  if (!input.enabled) return false;
  if (input.claimedCount >= FOUNDER_SEATS_TOTAL) return false;
  if (input.founderStatus === "active") return false;
  return true;
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(founder): add widget visibility rules"
```

---

### Task F0-3: localStorage NEW badge + client analytics helper

**Files:**
- Create: `lib/founder/founderStorage.ts`
- Create: `lib/founder/logFounderEvent.ts`

- [ ] **Step 1: Add storage keys** (mirror `onboardingStorage` pattern)

```typescript
export const FOUNDER_WIDGET_SEEN_KEY = "snaptax_founder_widget_seen";

export function readFounderWidgetSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(FOUNDER_WIDGET_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markFounderWidgetSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FOUNDER_WIDGET_SEEN_KEY, "1");
  } catch {
    // quota / private mode
  }
}
```

- [ ] **Step 2: Client event logger** (console key=value; server webhook logs purchase success)

```typescript
type FounderEventName =
  | "founder_widget_impression"
  | "founder_widget_tap"
  | "founder_sheet_view"
  | "founder_google_gate"
  | "founder_checkout_start"
  | "founder_purchase_fail";

export function logFounderEvent(
  name: FounderEventName,
  meta: Record<string, string | number | boolean | null | undefined> = {},
): void {
  const parts = [
    `ts=${new Date().toISOString()}`,
    "level=info",
    "module=biz.founder",
    "success=true",
    `event=${name}`,
    ...Object.entries(meta)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}=${String(v)}`),
  ];
  console.log(parts.join(" "));
}
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(founder): add widget seen storage and client events"
```

---

## Wave F1 — Database & Flags

### Task F1-1: Prisma migration — founder columns

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `db/init-table.sql`
- Create: `prisma/migrations/YYYYMMDD_founder_columns/migration.sql` (via `npm run db:migrate:dev`)

- [ ] **Step 1: Add to `SnaptaxUser` model**

```prisma
  founderNumber   Int?      @map("founder_number")
  founderTier     String?   @map("founder_tier") @db.VarChar(32)
  founderStatus   String?   @map("founder_status") @db.VarChar(16)
  founderLockedAt DateTime? @map("founder_locked_at") @db.Timestamptz(3)

  @@index([founderNumber], map: "snaptax_users_founder_number_idx")
```

- [ ] **Step 2: Mirror DDL in `db/init-table.sql`** with COMMENT ON for each column.

- [ ] **Step 3: Run migration**

Run: `sudo pg_ctlcluster 16 main start` (if local PG down)  
Run: `npm run db:migrate:dev -- --name founder_columns`

- [ ] **Step 4: Commit**

```bash
git commit -m "db: add founder tier columns to snaptax_users"
```

---

### Task F1-2: Checkout intent SKU tier column

**Files:**
- Modify: `prisma/schema.prisma` (`SnaptaxCheckoutIntent`)
- Modify: `lib/billing/checkoutIntent.ts`
- Modify: `db/init-table.sql`

- [ ] **Step 1: Add optional `skuTier String? @map("sku_tier") @db.VarChar(32)`** to checkout intent model.

- [ ] **Step 2: Extend `createOrReuseCheckoutIntent(userId, taxSeason, skuTier?)`** — store tier on create; reuse only if same tier.

- [ ] **Step 3: Migrate + commit**

```bash
git commit -m "db: persist sku tier on checkout intents"
```

---

### Task F1-3: Vercel Flags + server config

**Files:**
- Create: `flags/founder.ts`
- Modify: `app/.well-known/vercel/flags/route.ts`
- Create: `lib/server/founderConfig.ts`
- Modify: `lib/server/env.ts` (add `getPaddlePriceIdForTier(tier)` helpers)

- [ ] **Step 1: Define flags** (pattern from `flags/verify.ts`)

```typescript
export const founderProgramEnabledFlag = flag<boolean>({
  key: "founderProgramEnabled",
  adapter: vercelAdapter(),
  identify,
  defaultValue: false,
});

export const founderPriceSuperCentsFlag = flag<number>({
  key: "founderPriceSuperCents",
  adapter: vercelAdapter(),
  identify,
  defaultValue: 100, // $1.00 season — adjust in Vercel dashboard
});
// ... early, founder, default cents flags
```

- [ ] **Step 2: Register in `app/.well-known/vercel/flags/route.ts`**

- [ ] **Step 3: `founderConfig.ts` resolves tiers**

```typescript
export async function resolveFounderProgramConfig(): Promise<FounderProgramConfig> {
  const enabled = await founderProgramEnabledFlag();
  const tiers = {
    FOUNDER_LEVEL_SUPER: {
      priceCents: await founderPriceSuperCentsFlag(),
      paddlePriceId: process.env.PADDLE_PRICE_ID_FOUNDER_SUPER ?? "",
    },
    // ...
    DEFAULT: {
      priceCents: await founderPriceDefaultCentsFlag(),
      paddlePriceId: getPaddlePriceId(),
    },
  };
  return { enabled, tiers };
}
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(founder): add Vercel Flags and server price config"
```

---

## Wave F2 — API & billing backend

### Task F2-1: Founder program read service

**Files:**
- Create: `lib/server/founderProgram.ts`

- [ ] **Step 1: Implement `getFounderProgramState(userId?: string)`**

```typescript
export async function getFounderProgramState(userId?: string) {
  const config = await resolveFounderProgramConfig();
  const claimedCount = await prisma.snaptaxUser.count({
    where: { founderNumber: { not: null } },
  });
  const user = userId
    ? await prisma.snaptaxUser.findUnique({
        where: { id: userId },
        select: {
          founderNumber: true,
          founderTier: true,
          founderStatus: true,
          seasonEntitlements: { where: { taxSeason: currentTaxSeason() }, take: 1 },
        },
      })
    : null;

  return {
    seatsTotal: FOUNDER_SEATS_TOTAL,
    claimedCount,
    remaining: Math.max(0, FOUNDER_SEATS_TOTAL - claimedCount),
    programOpen: config.enabled && claimedCount < FOUNDER_SEATS_TOTAL,
    tiers: config.tiers,
    user: user
      ? {
          founderStatus: (user.founderStatus as FounderStatus) ?? "none",
          founderTier: user.founderTier as FounderTier | null,
          founderNumber: user.founderNumber,
          currentSeasonEntitled: user.seasonEntitlements.length > 0,
        }
      : null,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(founder): add program state read service"
```

---

### Task F2-2: `GET /api/founder/program`

**Files:**
- Create: `app/api/founder/program/route.ts`

- [ ] **Step 1: Route with `withRequestLog("api.entitlement", ...)`**

```typescript
export const GET = withRequestLog("api.entitlement", async (request) => {
  const actor = await getActor(request);
  const userId = actor.kind === "user" ? actor.userId : undefined;
  const state = await getFounderProgramState(userId);
  return NextResponse.json(state);
});
```

- [ ] **Step 2: Manual smoke**

Run dev server; `curl -s http://localhost:3000/api/founder/program | jq .claimedCount`

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(founder): add GET /api/founder/program"
```

---

### Task F2-3: Atomic seat assignment

**Files:**
- Create: `lib/server/assignFounderSeat.ts`
- Create: `lib/server/assignFounderSeat.test.ts`

- [ ] **Step 1: Write failing tests** — user with no founder_number gets seat; full program returns `{ assigned: false }`; user already has number is idempotent.

- [ ] **Step 2: Implement transaction**

```typescript
export async function assignFounderSeatOnFirstPurchase(userId: string): Promise<{
  assigned: boolean;
  founderNumber: number | null;
  tier: FounderTier | null;
}> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.snaptaxUser.findUnique({
      where: { id: userId },
      select: { founderNumber: true },
    });
    if (user?.founderNumber != null) {
      return {
        assigned: false,
        founderNumber: user.founderNumber,
        tier: tierForSeat(user.founderNumber),
      };
    }
    const claimedCount = await tx.snaptaxUser.count({
      where: { founderNumber: { not: null } },
    });
    const seat = nextSeatNumber(claimedCount);
    if (seat == null) return { assigned: false, founderNumber: null, tier: null };
    const tier = tierForSeat(seat)!;
    await tx.snaptaxUser.update({
      where: { id: userId },
      data: {
        founderNumber: seat,
        founderTier: tier,
        founderStatus: "active",
        founderLockedAt: utcNow(),
      },
    });
    return { assigned: true, founderNumber: seat, tier };
  });
}
```

- [ ] **Step 3: Run tests + commit**

```bash
npm run test:unit -- lib/server/assignFounderSeat.test.ts
git commit -m "feat(founder): atomic seat assignment on first purchase"
```

---

### Task F2-4: Checkout intent + webhook integration

**Files:**
- Modify: `app/api/billing/checkout-intent/route.ts`
- Modify: `app/api/webhooks/paddle/route.ts`
- Modify: `components/settings/PaywallSheet.tsx` (pass `skuTier: "DEFAULT"` — no behavior change)

- [ ] **Step 1: Extend checkout-intent body schema**

```typescript
const bodySchema = z.object({
  taxSeason: z.string().min(1).optional(),
  skuTier: z.enum(["FOUNDER_LEVEL_SUPER", "EARLY", "FOUNDER", "DEFAULT"]).optional(),
  founderPurchase: z.boolean().optional(),
});
```

When `founderPurchase: true`, require logged-in user; resolve price ID from `nextSeatNumber(claimedCount)` tier (or locked tier if renewing active founder).

- [ ] **Step 2: Webhook after `grantPaddleSeasonEntitlement`**

```typescript
if (grant.skuTier && grant.skuTier !== "DEFAULT") {
  const seat = await assignFounderSeatOnFirstPurchase(grant.userId);
  logEvent({ module: "biz.founder", ..., meta: { event: "founder_purchase_success", ...seat } });
} else if (grant.founderRenewal) {
  await prisma.snaptaxUser.update({
    where: { id: grant.userId },
    data: { founderStatus: "active" },
  });
}
```

Pass `skuTier` via checkout custom_data from Paddle open call (same as `intentId` today).

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(founder): wire checkout intent and webhook seat grant"
```

---

## Wave F3 — Home UI (Widget + Sheet)

### Task F3-1: i18n + visual tokens

**Files:**
- Modify: `lib/i18n/locales/en-US.ts`, `fr-FR.ts`, `de-DE.ts`, `lib/i18n/types.ts`
- Modify: `lib/ui/homeVisual.ts`

- [ ] **Step 1: Add `home.widgets.founder` and `founderSheet` copy blocks**

EN strings:
- `label`: `Founder Program`
- `subtitle`: `Be one of the first 50 founders`
- `view`: `View`
- `newBadge`: `NEW`
- `sheet.title`, `sheet.seatsRemaining`, `sheet.becomeFounder`, `sheet.signInFirst`, `sheet.seasonPrice`, `sheet.alreadyEntitled`

- [ ] **Step 2: Add `homeVisual.widgets.founder`** — amber bg/border matching `#EAB308` family.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(founder): add i18n copy and visual tokens"
```

---

### Task F3-2: FounderProgramWidget component

**Files:**
- Create: `components/home/widgets/FounderProgramWidget.tsx`

- [ ] **Step 1: Implement card** (pattern: `MissingDeductionsWidget`)

```tsx
export function FounderProgramWidget({ onOpen, showNewBadge }: Props) {
  const copy = useUserCopy().home.widgets.founder;
  const visual = homeVisual.widgets.founder;
  const card = homeVisual.widgetPager.cardBase;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${copy.label}. ${copy.subtitle}`}
      className={`${card} flex min-h-16 flex-col ${visual.bg} ${visual.border} text-left transition-transform active:scale-[0.98]`}
    >
      <div className="flex items-center gap-1.5">
        <span aria-hidden>👑</span>
        {showNewBadge && (
          <span className="rounded bg-black px-1 py-0.5 text-[8px] font-black text-yellow-400">
            {copy.newBadge}
          </span>
        )}
        <p className={`text-xs font-semibold ${visual.accent}`}>{copy.label}</p>
      </div>
      <p className="mt-auto line-clamp-2 text-sm font-black leading-tight text-white">
        {copy.subtitle}
      </p>
      <span className="mt-0.5 text-[9px] font-bold text-zinc-300 underline decoration-zinc-600 underline-offset-2">
        {copy.view} &gt;
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(founder): add FounderProgramWidget card"
```

---

### Task F3-3: FounderProgramSheet

**Files:**
- Create: `components/home/sheets/FounderProgramSheet.tsx`

- [ ] **Step 1: Bottom sheet shell** — copy backdrop + slide-up from `LegalSheet.tsx` / `PaywallSheet.tsx` (fixed inset, `z-50`, drag handle).

- [ ] **Step 2: States**
  - Loading program API
  - Not signed in → `ContinueWithGoogleButton` + `logFounderEvent("founder_google_gate")`
  - Signed in → show tier for next seat, price formatted via `formatCurrency(priceCents/100)`, seats remaining, **Become Founder** CTA
  - Paddle flow: copy from `PaywallSheet.handlePay` but POST checkout-intent with `{ founderPurchase: true, skuTier }` and tier-specific `priceId` from API response
  - Already entitled this season → info text, no CTA

- [ ] **Step 3: On mount** `logFounderEvent("founder_sheet_view", { claimedCount })`

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(founder): add FounderProgramSheet with Google gate and Paddle"
```

---

### Task F3-4: Wire WidgetPager + HomeScreen

**Files:**
- Modify: `lib/home/buildWidgetPages.ts`
- Modify: `lib/home/buildWidgetPages.test.ts`
- Modify: `components/home/widgets/WidgetPager.tsx`
- Modify: `components/home/widgets/WidgetStack.tsx`
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1: Extend `WidgetPageKey` with `"founder"`**

```typescript
export function buildWidgetPageKeys(
  data: HomeWidgetsData,
  actionCount = 0,
  options?: { showFounder?: boolean },
): WidgetPageKey[] {
  const keys = /* existing logic */;
  if (options?.showFounder) {
    return ["founder", ...keys];
  }
  return keys;
}
```

- [ ] **Step 2: Add test** — when `showFounder: true`, first key is `"founder"`.

- [ ] **Step 3: `WidgetStack`** — fetch `/api/founder/program` on mount + when signed-in changes; compute `showFounder = isFounderWidgetVisible(...)`; pass to pager.

- [ ] **Step 4: `HomeScreen`** — `founderSheetOpen` state; on paid callback refresh program + entitlements; impression event once when visible.

- [ ] **Step 5: Run tests**

Run: `npm run test:unit -- lib/home/buildWidgetPages.test.ts`

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(founder): wire widget pager and home sheet state"
```

---

## Wave F4 — Settings Badge

### Task F4-1: Founder Badge in account block

**Files:**
- Modify: `components/settings/SettingsAccountBlock.tsx`
- Modify: `components/settings/SettingsScreen.tsx` (pass founder props from API or session bootstrap)

- [ ] **Step 1: Extend props**

```typescript
founderStatus?: FounderStatus;
founderTier?: FounderTier | null;
founderNumber?: number | null;
```

- [ ] **Step 2: Render badge when `founderStatus === "active"`**

```tsx
{founderStatus === "active" && founderNumber != null && (
  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-black text-yellow-400">
    👑 {tierDisplayLabel(founderTier ?? "FOUNDER")} #{founderNumber}
  </p>
)}
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(founder): show Founder Badge in Settings account"
```

---

## Wave F5 — Paywall SKU alignment & docs

### Task F5-1: PaywallSheet uses Flag default price (optional same PR)

**Files:**
- Modify: `components/settings/PaywallSheet.tsx`
- Create: `app/api/billing/season-offer/route.ts` (or extend program API)

- [ ] **Step 1: Fetch display price from server** instead of hardcoded copy `$49` in i18n — use `founderPriceDefaultCentsFlag` / season offer endpoint.

- [ ] **Step 2: Pass `skuTier: "DEFAULT"`** to checkout-intent.

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor(billing): resolve season price from flags not hardcoded copy"
```

---

### Task F5-2: PRODUCT-SPEC & manual QA

**Files:**
- Modify: `docs/product/PRODUCT-SPEC.md`

- [ ] **Step 1: Add §12 row** — Founder Program Widget + API + Badge.

- [ ] **Step 2: Manual checklist** (below)

- [ ] **Step 3: Commit**

```bash
git commit -m "docs: record Founder Program in PRODUCT-SPEC"
```

---

## Manual test checklist

- [ ] `founderProgramEnabled=false` → no founder widget
- [ ] `claimedCount=50` → widget hidden for all users
- [ ] Active founder → widget hidden; Settings shows badge with tier + #
- [ ] Ghost sees widget; sheet prompts Google before Paddle
- [ ] First purchase assigns seat + tier; webhook grants season entitlement
- [ ] NEW badge disappears after first view; card still tappable
- [ ] Widget stays fixed under Snap while scrolling receipts
- [ ] Paddle missing env → sheet shows payment unavailable (no fake success)
- [ ] axe: founder card + sheet no new critical/serious issues

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| Widget #1 position | F3-4 |
| Amber crown + NEW | F3-2, F0-3 |
| Visibility state machine | F0-2, F3-4 |
| Google gate | F3-3 |
| FounderProgramSheet | F3-3 |
| GET /api/founder/program | F2-2 |
| 50-seat cap + race | F2-3 |
| Flag pricing | F1-3 |
| Paddle webhook grant | F2-4 |
| Settings Badge | F4-1 |
| Analytics §14 | F0-3, F2-4, F3-4 |
| a11y | F3-2, F3-3 |
| No hardcoded $49 | F5-1 |
| Export entitlement | F2-4 (reuse season entitlements) |

---

## Suggested execution order

1. **F0 → F1 → F2** (backend complete; flag off in prod)
2. **F3** (UI visible when flag on)
3. **F4 → F5** (polish + docs)

Enable `founderProgramEnabled` in Vercel only after F2 webhook tested in Paddle sandbox.
