# Production Verify Flags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Vercel Flags (`runModel`, `verfyUser`, `isNeedPay`, `isMockAI`) into server-side verify bypass — mock AI receipts and optional payment skip — for one whitelisted Google user when `runModel=verify`.

**Architecture:** Centralized `buildVerifyContext` (pure, testable) + `resolveVerifyContext` (evaluates Vercel flags via `@flags-sdk/vercel`). Receipt and export API routes call `resolveVerifyContext(actor)` once per request; mock AI in `processReceiptTax`, fake entitlement via `ensureBypassEntitlement`.

**Tech Stack:** Next.js 16 App Router, `flags` + `@flags-sdk/vercel`, Prisma, node:test + tsx

**Spec:** [`docs/superpowers/specs/2026-06-13-production-verify-flags-design.md`](../specs/2026-06-13-production-verify-flags-design.md)

---

## File map

| File | Action | Responsibility |
|------|--------|----------------|
| `flags/verify.ts` | Create | 4 flag defs + `identify` + re-exports for discovery |
| `lib/verify/buildVerifyContext.ts` | Create | Pure gating logic (unit-tested) |
| `lib/verify/context.ts` | Create | `resolveVerifyContext` — flag evaluate + pure builder |
| `lib/verify/mockReceiptVision.ts` | Create | Random mock `VisionProcessResult` |
| `lib/verify/ensureBypassEntitlement.ts` | Create | Idempotent fake entitlement insert |
| `lib/verify/bypassTransactionId.ts` | Create | `verify_bypass_{userId}_{season}` helper |
| `app/.well-known/vercel/flags/route.ts` | Create | Flags Explorer discovery |
| `lib/receipts/processReceiptTax.ts` | Modify | Accept `canMockAi`, branch to mock |
| `app/api/receipts/route.ts` | Modify | Pass `canMockAi` from verify context |
| `app/api/receipts/[id]/process/route.ts` | Modify | Same |
| `app/api/entitlements/current/route.ts` | Modify | `ensureBypassEntitlement` when `canBypassPay` |
| `app/api/export/tax-pack/route.ts` | Modify | Same before entitlement check |
| `lib/server/log/types.ts` | Modify | Add `biz.verify` module + meta keys |
| `package.json` | Modify | `@flags-sdk/vercel` |
| `.env.example` | Modify | `FLAGS`, `FLAGS_SECRET` |
| `lib/verify/buildVerifyContext.test.ts` | Create | Gating matrix |
| `lib/verify/mockReceiptVision.test.ts` | Create | Mock bounds |
| `lib/verify/bypassTransactionId.test.ts` | Create | Transaction ID format |

---

### Task 1: Install dependency and document env

**Files:**
- Modify: `package.json`, `package-lock.json`, `.env.example`

- [ ] **Step 1: Install adapter**

```bash
cd /Users/huanggang/Documents/codeworks/snaptax
npm install @flags-sdk/vercel
```

- [ ] **Step 2: Update `.env.example`**

Append after line 28:

```env
# Vercel Flags (auto-provisioned on Vercel; pull locally with `vercel env pull .env.local`)
FLAGS=
FLAGS_SECRET=
```

- [ ] **Step 3: Verify env present locally**

```bash
grep -E '^(FLAGS|FLAGS_SECRET)=' .env.local | sed 's/=.*/=<set>/'
```

Expected: both `<set>`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add @flags-sdk/vercel for production verify flags"
```

---

### Task 2: Pure verify context builder + tests

**Files:**
- Create: `lib/verify/buildVerifyContext.ts`
- Create: `lib/verify/buildVerifyContext.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/verify/buildVerifyContext.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildVerifyContext } from "./buildVerifyContext";
import type { Actor } from "@/lib/auth/getActor";

const userActor: Actor = {
  kind: "user",
  userId: "u1",
  email: "test@example.com",
};
const ghostActor: Actor = { kind: "ghost", ghostId: "g1", bound: false };

const verifyFlags = {
  runModel: "verify",
  verfyUser: "test@example.com",
  isNeedPay: false,
  isMockAI: true,
};

describe("buildVerifyContext", () => {
  it("allows full bypass for whitelisted user in verify mode", () => {
    const ctx = buildVerifyContext(userActor, verifyFlags);
    assert.equal(ctx.canBypass, true);
    assert.equal(ctx.canBypassPay, true);
    assert.equal(ctx.canMockAi, true);
  });

  it("matches email case-insensitively", () => {
    const ctx = buildVerifyContext(
      { ...userActor, email: "Test@Example.com" },
      verifyFlags,
    );
    assert.equal(ctx.canBypass, true);
  });

  it("blocks ghost actors", () => {
    const ctx = buildVerifyContext(ghostActor, verifyFlags);
    assert.equal(ctx.canBypass, false);
    assert.equal(ctx.canMockAi, false);
  });

  it("blocks when runModel is production", () => {
    const ctx = buildVerifyContext(userActor, {
      ...verifyFlags,
      runModel: "production",
    });
    assert.equal(ctx.canBypass, false);
  });

  it("blocks non-whitelist email", () => {
    const ctx = buildVerifyContext(
      { ...userActor, email: "other@example.com" },
      verifyFlags,
    );
    assert.equal(ctx.canBypass, false);
  });

  it("requires isNeedPay false for pay bypass", () => {
    const ctx = buildVerifyContext(userActor, {
      ...verifyFlags,
      isNeedPay: true,
    });
    assert.equal(ctx.canBypassPay, false);
  });

  it("requires isMockAI true for mock bypass", () => {
    const ctx = buildVerifyContext(userActor, {
      ...verifyFlags,
      isMockAI: false,
    });
    assert.equal(ctx.canMockAi, false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm run test:unit -- lib/verify/buildVerifyContext.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement `lib/verify/buildVerifyContext.ts`**

```typescript
import type { Actor } from "@/lib/auth/getActor";

export type VerifyFlagValues = {
  runModel: string;
  verfyUser: string;
  isNeedPay: boolean;
  isMockAI: boolean;
};

export type VerifyContext = {
  isVerifyMode: boolean;
  isWhitelisted: boolean;
  canBypass: boolean;
  canBypassPay: boolean;
  canMockAi: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function buildVerifyContext(
  actor: Actor,
  flags: VerifyFlagValues,
): VerifyContext {
  const isVerifyMode = flags.runModel === "verify";
  const isWhitelisted =
    actor.kind === "user" &&
    !!actor.email &&
    !!flags.verfyUser &&
    normalizeEmail(actor.email) === normalizeEmail(flags.verfyUser);
  const canBypass = isVerifyMode && isWhitelisted;

  return {
    isVerifyMode,
    isWhitelisted,
    canBypass,
    canBypassPay: canBypass && flags.isNeedPay === false,
    canMockAi: canBypass && flags.isMockAI === true,
  };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm run test:unit -- lib/verify/buildVerifyContext.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/verify/buildVerifyContext.ts lib/verify/buildVerifyContext.test.ts
git commit -m "feat(verify): add pure buildVerifyContext with unit tests"
```

---

### Task 3: Flag definitions + resolveVerifyContext

**Files:**
- Create: `flags/verify.ts`
- Create: `lib/verify/context.ts`

- [ ] **Step 1: Create `flags/verify.ts`**

```typescript
import { dedupe, flag } from "flags/next";
import { vercelAdapter } from "@flags-sdk/vercel";
import { getSessionFromCookies } from "@/lib/auth/session";

const identify = dedupe(async () => {
  const session = await getSessionFromCookies();
  if (!session?.email) return {};
  return { user: { email: session.email } };
});

export const runModelFlag = flag<string>({
  key: "runModel",
  adapter: vercelAdapter(),
  identify,
  defaultValue: "production",
  options: [
    { label: "验证模式", value: "verify" },
    { label: "生产模式", value: "production" },
  ],
});

export const verfyUserFlag = flag<string>({
  key: "verfyUser",
  adapter: vercelAdapter(),
  identify,
  defaultValue: "",
});

export const isNeedPayFlag = flag<boolean>({
  key: "isNeedPay",
  adapter: vercelAdapter(),
  identify,
  defaultValue: true,
  options: [
    { label: "Off", value: false },
    { label: "On", value: true },
  ],
});

export const isMockAIFlag = flag<boolean>({
  key: "isMockAI",
  adapter: vercelAdapter(),
  identify,
  defaultValue: false,
  options: [
    { label: "Off", value: false },
    { label: "On", value: true },
  ],
});
```

- [ ] **Step 2: Create `lib/verify/context.ts`**

```typescript
import type { Actor } from "@/lib/auth/getActor";
import {
  isMockAIFlag,
  isNeedPayFlag,
  runModelFlag,
  verfyUserFlag,
} from "@/flags/verify";
import {
  buildVerifyContext,
  type VerifyContext,
} from "@/lib/verify/buildVerifyContext";

const FAIL_CLOSED_FLAGS = {
  runModel: "production",
  verfyUser: "",
  isNeedPay: true,
  isMockAI: false,
} as const;

export async function resolveVerifyContext(
  actor: Actor,
): Promise<VerifyContext> {
  try {
    const [runModel, verfyUser, isNeedPay, isMockAI] = await Promise.all([
      runModelFlag(),
      verfyUserFlag(),
      isNeedPayFlag(),
      isMockAIFlag(),
    ]);
    return buildVerifyContext(actor, {
      runModel,
      verfyUser,
      isNeedPay,
      isMockAI,
    });
  } catch {
    return buildVerifyContext(actor, FAIL_CLOSED_FLAGS);
  }
}

export type { VerifyContext };
```

- [ ] **Step 3: Commit**

```bash
git add flags/verify.ts lib/verify/context.ts
git commit -m "feat(verify): add Vercel flag definitions and resolveVerifyContext"
```

---

### Task 4: Mock receipt vision + tests

**Files:**
- Create: `lib/verify/mockReceiptVision.ts`
- Create: `lib/verify/mockReceiptVision.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/verify/mockReceiptVision.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mockReceiptVision } from "./mockReceiptVision";
import { US_EXPORT_CATEGORIES } from "@/lib/tax/usExportCategories";

describe("mockReceiptVision", () => {
  it("returns done status with amount in range for US", () => {
    const result = mockReceiptVision("us");
    assert.equal(result.status, "done");
    assert.ok(result.amount != null && result.amount >= 5 && result.amount <= 200);
    assert.equal(result.taxAmount, Math.round(result.amount! * 0.25 * 100) / 100);
    assert.equal(result.aiRaw.mock, true);
    assert.notEqual(result.category, "PERSONAL");
    assert.ok(US_EXPORT_CATEGORIES.includes(result.category as never));
  });

  it("returns EUR currency for EU", () => {
    const result = mockReceiptVision("eu");
    assert.equal(result.currency, "EUR");
    assert.equal(result.status, "done");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm run test:unit -- lib/verify/mockReceiptVision.test.ts
```

- [ ] **Step 3: Implement `lib/verify/mockReceiptVision.ts`**

```typescript
import type { VisionProcessResult } from "@/lib/openai/receiptVision";
import { resolveDeductionRatio } from "@/lib/tax/usCategories";
import { US_EXPORT_CATEGORIES } from "@/lib/tax/usExportCategories";
import type { TaxRegion } from "@/lib/tax/types";

const MOCK_MERCHANTS = [
  "Shell",
  "Home Depot",
  "McDonald's",
  "Walmart",
  "Costco",
] as const;

const MOCK_CATEGORIES = US_EXPORT_CATEGORIES.filter((c) => c !== "PERSONAL");

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomAmount(): number {
  const cents = 500 + Math.floor(Math.random() * (20000 - 500 + 1));
  return cents / 100;
}

export function mockReceiptVision(dataRegion: TaxRegion): VisionProcessResult {
  const amount = randomAmount();
  const taxAmount = Math.round(amount * 0.25 * 100) / 100;
  const category = pickRandom(MOCK_CATEGORIES);
  const merchant = pickRandom(MOCK_MERCHANTS);
  const deductionRatio = resolveDeductionRatio(category, 1);
  const deductible = category !== "PERSONAL";

  const fields =
    dataRegion === "eu"
      ? {
          amount,
          currency: "EUR",
          merchant,
          category,
          deductible,
          vat_rate: 0.25,
          vat_amount: taxAmount,
          confidence: 0.95,
        }
      : {
          amount,
          merchant,
          category,
          deductible,
          deduction_ratio: deductionRatio,
          confidence: 0.95,
        };

  return {
    fields,
    taxAmount,
    status: "done",
    merchantName: merchant,
    category,
    amount,
    currency: dataRegion === "eu" ? "EUR" : "USD",
    deductible,
    aiRaw: { mock: true, model: "verify-mock", region: dataRegion },
  };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm run test:unit -- lib/verify/mockReceiptVision.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/verify/mockReceiptVision.ts lib/verify/mockReceiptVision.test.ts
git commit -m "feat(verify): add mockReceiptVision for verify-mode AI bypass"
```

---

### Task 5: Bypass entitlement helper + tests

**Files:**
- Create: `lib/verify/bypassTransactionId.ts`
- Create: `lib/verify/bypassTransactionId.test.ts`
- Create: `lib/verify/ensureBypassEntitlement.ts`

- [ ] **Step 1: Write failing test for transaction ID**

Create `lib/verify/bypassTransactionId.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bypassTransactionId } from "./bypassTransactionId";

describe("bypassTransactionId", () => {
  it("builds stable verify_bypass id", () => {
    assert.equal(
      bypassTransactionId("user-uuid", "2026"),
      "verify_bypass_user-uuid_2026",
    );
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm run test:unit -- lib/verify/bypassTransactionId.test.ts
```

- [ ] **Step 3: Implement helpers**

`lib/verify/bypassTransactionId.ts`:

```typescript
export function bypassTransactionId(userId: string, taxSeason: string): string {
  return `verify_bypass_${userId}_${taxSeason}`;
}
```

`lib/verify/ensureBypassEntitlement.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { currentTaxSeason } from "@/lib/tax/season";
import { utcNow } from "@/lib/time/utc";
import { bypassTransactionId } from "@/lib/verify/bypassTransactionId";

export async function ensureBypassEntitlement(
  userId: string,
  taxSeason: string = currentTaxSeason(),
): Promise<boolean> {
  const existing = await prisma.snaptaxSeasonEntitlement.findUnique({
    where: { userId_taxSeason: { userId, taxSeason } },
  });
  if (existing) return false;

  await prisma.snaptaxSeasonEntitlement.create({
    data: {
      userId,
      taxSeason,
      transactionId: bypassTransactionId(userId, taxSeason),
      paidAt: utcNow(),
      amount: 0,
      channelCode: "verify_bypass",
    },
  });
  return true;
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm run test:unit -- lib/verify/bypassTransactionId.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/verify/bypassTransactionId.ts lib/verify/bypassTransactionId.test.ts lib/verify/ensureBypassEntitlement.ts
git commit -m "feat(verify): add ensureBypassEntitlement for pay bypass"
```

---

### Task 6: Wire mock AI into receipt pipeline

**Files:**
- Modify: `lib/receipts/processReceiptTax.ts`
- Modify: `app/api/receipts/route.ts`
- Modify: `app/api/receipts/[id]/process/route.ts`
- Modify: `lib/server/log/types.ts`

- [ ] **Step 1: Extend log types**

In `lib/server/log/types.ts`, add to `LogModule`:

```typescript
  | "biz.verify"
```

Add to `LogMeta`:

```typescript
  verifyBypass?: boolean;
  mockAi?: boolean;
  bypassPay?: boolean;
```

- [ ] **Step 2: Update `lib/receipts/processReceiptTax.ts`**

```typescript
import { mockReceiptVision } from "@/lib/verify/mockReceiptVision";

export async function processReceiptTax(params: {
  receiptId: string;
  dataRegion: TaxRegion;
  imageBuffer: Buffer;
  mime: "image/jpeg" | "image/png";
  industry?: string | null;
  canMockAi?: boolean;
}) {
  const result = params.canMockAi
    ? mockReceiptVision(params.dataRegion)
    : await processReceiptVision(
        params.imageBuffer,
        params.mime,
        params.dataRegion,
        params.industry,
      );
  // ... rest unchanged
}
```

- [ ] **Step 3: Update `app/api/receipts/route.ts` POST handler**

After `const actor = await getActor(...)` add:

```typescript
import { resolveVerifyContext } from "@/lib/verify/context";
import { logEvent } from "@/lib/server/log/logEvent";
import { baseLogEntry } from "@/lib/server/log/context";
```

Before `processReceiptTax` call:

```typescript
        const verify = await resolveVerifyContext(actor);
        if (verify.canBypass) {
          logEvent({
            ...baseLogEntry("biz.verify", request, actor),
            level: "info",
            success: true,
            durationMs: 0,
            meta: {
              verifyBypass: true,
              mockAi: verify.canMockAi,
              bypassPay: verify.canBypassPay,
            },
          });
        }

        const result = await processReceiptTax({
          receiptId,
          dataRegion,
          imageBuffer: bytes,
          mime,
          industry,
          canMockAi: verify.canMockAi,
        });
```

- [ ] **Step 4: Same pattern in `app/api/receipts/[id]/process/route.ts`**

Resolve verify context after `getActor`, log if `canBypass`, pass `canMockAi: verify.canMockAi` to `processReceiptTax`.

When mock is used, log `biz.openai` with `meta: { reason: "verify_mock" }` instead of implying OpenAI ran — optional but clearer.

- [ ] **Step 5: Run unit tests**

```bash
npm run test:unit
```

Expected: all pass

- [ ] **Step 6: Commit**

```bash
git add lib/receipts/processReceiptTax.ts app/api/receipts/route.ts app/api/receipts/\[id\]/process/route.ts lib/server/log/types.ts
git commit -m "feat(verify): wire mock AI into receipt upload and process routes"
```

---

### Task 7: Wire payment bypass into entitlements + export

**Files:**
- Modify: `app/api/entitlements/current/route.ts`
- Modify: `app/api/export/tax-pack/route.ts`

- [ ] **Step 1: Update `app/api/entitlements/current/route.ts`**

```typescript
import { resolveVerifyContext } from "@/lib/verify/context";
import { ensureBypassEntitlement } from "@/lib/verify/ensureBypassEntitlement";
import { logEvent } from "@/lib/server/log/logEvent";
import { baseLogEntry } from "@/lib/server/log/context";
```

After actor check:

```typescript
    const verify = await resolveVerifyContext(actor);
    if (verify.canBypassPay) {
      const created = await ensureBypassEntitlement(actor.userId, season);
      if (created || verify.canBypass) {
        logEvent({
          ...baseLogEntry("biz.verify", request, actor),
          level: "info",
          success: true,
          durationMs: 0,
          meta: {
            verifyBypass: true,
            bypassPay: true,
            taxSeason: season,
          },
        });
      }
    }
```

Then existing `findUnique` entitlement query.

- [ ] **Step 2: Update `app/api/export/tax-pack/route.ts`**

After actor check, before entitlement query:

```typescript
    const verify = await resolveVerifyContext(actor);
    if (verify.canBypassPay) {
      await ensureBypassEntitlement(actor.userId, season);
    }
```

Existing entitlement check unchanged.

- [ ] **Step 3: Commit**

```bash
git add app/api/entitlements/current/route.ts app/api/export/tax-pack/route.ts
git commit -m "feat(verify): wire pay bypass into entitlements and export APIs"
```

---

### Task 8: Flags Explorer discovery route

**Files:**
- Create: `app/.well-known/vercel/flags/route.ts`

- [ ] **Step 1: Create route**

```typescript
import { getProviderData } from "flags/next";
import { NextResponse } from "next/server";
import {
  isMockAIFlag,
  isNeedPayFlag,
  runModelFlag,
  verfyUserFlag,
} from "@/flags/verify";

export async function GET() {
  return NextResponse.json(
    getProviderData({
      runModelFlag,
      verfyUserFlag,
      isNeedPayFlag,
      isMockAIFlag,
    }),
  );
}
```

- [ ] **Step 2: Verify route compiles**

```bash
npm run lint 2>&1 | head -30
```

Note: repo may have pre-existing lint errors; ensure no new errors in new files.

- [ ] **Step 3: Commit**

```bash
git add app/.well-known/vercel/flags/route.ts
git commit -m "feat(verify): add Vercel Flags Explorer discovery route"
```

---

### Task 9: Final verification and spec update

**Files:**
- Modify: `docs/superpowers/specs/2026-06-13-production-verify-flags-design.md` (§10 status)

- [ ] **Step 1: Run full unit tests**

```bash
npm run test:unit
```

Expected: all pass including `lib/verify/*.test.ts`

- [ ] **Step 2: Update spec implementation status table**

Set `@flags-sdk/vercel` and Code integration to ✅ Implemented.

- [ ] **Step 3: Manual checklist (production/preview with flags configured)**

1. Whitelist Google user + `runModel=verify` + `isMockAI=true` → snap → random amount, `aiRaw.mock=true` in DB
2. Non-whitelist user + same flags → real OpenAI (or existing error if no key)
3. Whitelist + `isNeedPay=false` → Export skips Paywall; DB row `channel_code=verify_bypass`
4. `runModel=production` → whitelist user gets normal OpenAI, no mock
5. Ghost user → never mock/bypass

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-06-13-production-verify-flags-design.md
git commit -m "docs: mark production verify flags as implemented"
```

---

## Spec coverage checklist

| Spec section | Task |
|--------------|------|
| §4 Gating logic | Task 2, 3 |
| §5 Architecture files | Tasks 1–8 |
| §6.1 Mock AI | Task 4, 6 |
| §6.2 Payment bypass | Task 5, 7 |
| §7 Security/logging | Task 6, 7 (`biz.verify`) |
| §8 Error handling (fail closed) | Task 3 `FAIL_CLOSED_FLAGS` |
| §9 Unit tests | Tasks 2, 4, 5 |
| §9 Manual checklist | Task 9 |

## Out of scope (do not implement)

- `landingType` flag
- Client UI changes
- Ghost whitelist
- Auto-revoke fake entitlements
