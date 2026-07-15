# Paddle Refund / Chargeback Entitlement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pause/stop/restore tax-season Export entitlements from Paddle refund and chargeback webhooks, with durable webhook audit rows and clear client messaging.

**Architecture:** Add `status` on `snaptax_season_entitlements` (`active` | `disputed` | `refunded`). Persist every webhook into `snaptax_webhook_events` (`channel_code=paddle`). Drive transitions from adjustment events matched by `transactionId`. Export/`paid` only when `status === "active"`. Repurchase via new `transaction.completed` rewrites `transactionId` and sets `active`.

**Tech Stack:** Next.js API routes · Prisma/Postgres · existing Paddle signature verify · node:test unit tests · English legal markdown

**Spec:** `docs/superpowers/specs/2026-07-15-paddle-refund-chargeback-entitlement-design.md`

## Global Constraints

- Channel code on write: always lowercase **`paddle`**
- Match adjustments by **`transactionId` only** (never seize another txn’s repurchase)
- Refund applies only when adjustment status is **`approved`**
- Partial approved refund → full season **`refunded`**
- `refunded` is terminal for that txn (ignore later dispute/reverse on same txn)
- Lost chargeback (no reverse) stays **`disputed`** until manual restore
- Founder seats: do **not** modify
- No Admin UI; restore via lib + runbook/script
- Update `docs/legal/refund.md` with disclosed auto pause/stop behavior

---

## File map

| File | Responsibility |
|------|----------------|
| `prisma/schema.prisma` | `status` (+ optional reason/updated) on entitlement; new `SnaptaxWebhookEvent` |
| `prisma/migrations/20260715120000_entitlement_status_webhook_events/migration.sql` | DDL + backfill `status='active'` |
| `db/init-table.sql` | Keep greenfield DDL in sync |
| `lib/billing/entitlementStatus.ts` | Types + pure transition function |
| `lib/billing/isSeasonEntitlementPaid.ts` | `paid = status === "active"` helper |
| `lib/billing/recordWebhookEvent.ts` | Idempotent insert/update audit rows |
| `lib/billing/applySeasonEntitlementAdjustment.ts` | Load by txn → transition → persist |
| `lib/billing/grantSeasonEntitlement.ts` | Repurchase: new txnId + `status=active` |
| `lib/billing/restoreSeasonEntitlement.ts` | Manual `disputed`→`active` |
| `lib/billing/parsePaddleAdjustment.ts` | Extract txn/action/status from adjustment payload |
| `app/api/webhooks/paddle/route.ts` | Audit first; branch completed vs adjustment vs other |
| `app/api/entitlements/current/route.ts` | Return `paid` + `status` |
| `app/api/export/tax-pack/route.ts` · `filed/route.ts` | Gate on active status |
| `lib/client/authApi.ts` | `fetchSeasonEntitlement` (+ keep `fetchSeasonPaid`) |
| `components/export/*` · Settings · i18n | Disputed vs refunded copy |
| `docs/ops/paddle-entitlement-restore.md` | Runbook |
| `docs/legal/refund.md` · `docs/tech/07-paddle-billing.md` | Disclosure + tech |

---

### Task 1: Schema — entitlement status + webhook events

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260715120000_entitlement_status_webhook_events/migration.sql`
- Modify: `db/init-table.sql`
- Modify: `docs/tech/DB-DESIGN-SPEC.md` (short note under entitlements / new table)

**Interfaces:**
- Produces: Prisma models `SnaptaxSeasonEntitlement.status`, `SnaptaxWebhookEvent`

- [ ] **Step 1: Add Prisma fields**

On `SnaptaxSeasonEntitlement` add:

```prisma
status           String   @default("active") @map("status") @db.VarChar(32)
statusReason     String?  @map("status_reason") @db.VarChar(64)
statusUpdatedAt  DateTime? @map("status_updated_at") @db.Timestamptz(3)
```

Add model:

```prisma
model SnaptaxWebhookEvent {
  id                 String    @id @default(uuid()) @db.Uuid
  channelCode        String    @map("channel_code") @db.VarChar(64)
  eventId            String    @map("event_id") @db.VarChar(128)
  eventType          String    @map("event_type") @db.VarChar(128)
  occurredAt         DateTime? @map("occurred_at") @db.Timestamptz(3)
  transactionId      String?   @map("transaction_id") @db.VarChar(128)
  adjustmentId       String?   @map("adjustment_id") @db.VarChar(128)
  action             String?   @db.VarChar(64)
  adjustmentStatus   String?   @map("adjustment_status") @db.VarChar(64)
  payload            Json
  processingResult   String    @map("processing_result") @db.VarChar(32)
  processingReason   String?   @map("processing_reason") @db.VarChar(128)
  entitlementId      String?   @map("entitlement_id") @db.Uuid
  statusBefore       String?   @map("status_before") @db.VarChar(32)
  statusAfter        String?   @map("status_after") @db.VarChar(32)
  createdAt          DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt          DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)

  @@unique([channelCode, eventId], map: "snaptax_webhook_events_channel_event_key")
  @@index([transactionId], map: "snaptax_webhook_events_transaction_id_idx")
  @@index([createdAt], map: "snaptax_webhook_events_created_at_idx")
  @@map("snaptax_webhook_events")
}
```

- [ ] **Step 2: Write migration SQL**

```sql
ALTER TABLE snaptax_season_entitlements
  ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS status_reason VARCHAR(64),
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ(3);

UPDATE snaptax_season_entitlements SET status = 'active' WHERE status IS NULL;

CREATE TABLE snaptax_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_code VARCHAR(64) NOT NULL,
  event_id VARCHAR(128) NOT NULL,
  event_type VARCHAR(128) NOT NULL,
  occurred_at TIMESTAMPTZ(3),
  transaction_id VARCHAR(128),
  adjustment_id VARCHAR(128),
  action VARCHAR(64),
  adjustment_status VARCHAR(64),
  payload JSONB NOT NULL,
  processing_result VARCHAR(32) NOT NULL,
  processing_reason VARCHAR(128),
  entitlement_id UUID,
  status_before VARCHAR(32),
  status_after VARCHAR(32),
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT snaptax_webhook_events_channel_event_key UNIQUE (channel_code, event_id)
);
CREATE INDEX snaptax_webhook_events_transaction_id_idx ON snaptax_webhook_events (transaction_id);
CREATE INDEX snaptax_webhook_events_created_at_idx ON snaptax_webhook_events (created_at);
```

Mirror the same into `db/init-table.sql` for greenfield installs.

- [ ] **Step 3: Generate client**

Run: `npx prisma generate`  
Expected: success

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260715120000_entitlement_status_webhook_events db/init-table.sql docs/tech/DB-DESIGN-SPEC.md
git commit -m "feat(db): entitlement status and webhook event audit table"
```

---

### Task 2: Pure entitlement status transition

**Files:**
- Create: `lib/billing/entitlementStatus.ts`
- Create: `lib/billing/entitlementStatus.test.ts`
- Create: `lib/billing/isSeasonEntitlementPaid.ts`
- Create: `lib/billing/isSeasonEntitlementPaid.test.ts`

**Interfaces:**
- Produces:
  - `export type SeasonEntitlementStatus = "active" | "disputed" | "refunded"`
  - `export type EntitlementAdjustmentAction = "refund" | "chargeback" | "chargeback_warning" | "chargeback_reverse"`
  - `export function nextEntitlementStatus(input: { current: SeasonEntitlementStatus; action: EntitlementAdjustmentAction; adjustmentStatus?: string | null }): { next: SeasonEntitlementStatus; applied: boolean; reason: string }`
  - `export function isSeasonEntitlementPaid(status: string | null | undefined): boolean`

- [ ] **Step 1: Write failing tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextEntitlementStatus } from "./entitlementStatus.ts";
import { isSeasonEntitlementPaid } from "./isSeasonEntitlementPaid.ts";

describe("nextEntitlementStatus", () => {
  it("approved refund from active -> refunded", () => {
    assert.deepEqual(
      nextEntitlementStatus({
        current: "active",
        action: "refund",
        adjustmentStatus: "approved",
      }),
      { next: "refunded", applied: true, reason: "refund_approved" },
    );
  });

  it("ignores pending refund", () => {
    const r = nextEntitlementStatus({
      current: "active",
      action: "refund",
      adjustmentStatus: "pending_approval",
    });
    assert.equal(r.applied, false);
    assert.equal(r.next, "active");
  });

  it("chargeback_warning pauses active", () => {
    assert.equal(
      nextEntitlementStatus({
        current: "active",
        action: "chargeback_warning",
      }).next,
      "disputed",
    );
  });

  it("reverse restores disputed only", () => {
    assert.equal(
      nextEntitlementStatus({
        current: "disputed",
        action: "chargeback_reverse",
      }).next,
      "active",
    );
    assert.equal(
      nextEntitlementStatus({
        current: "refunded",
        action: "chargeback_reverse",
      }).applied,
      false,
    );
  });

  it("refunded is terminal for disputes", () => {
    assert.equal(
      nextEntitlementStatus({
        current: "refunded",
        action: "chargeback",
      }).applied,
      false,
    );
  });

  it("approved refund upgrades disputed", () => {
    assert.equal(
      nextEntitlementStatus({
        current: "disputed",
        action: "refund",
        adjustmentStatus: "approved",
      }).next,
      "refunded",
    );
  });
});

describe("isSeasonEntitlementPaid", () => {
  it("only active is paid", () => {
    assert.equal(isSeasonEntitlementPaid("active"), true);
    assert.equal(isSeasonEntitlementPaid("disputed"), false);
    assert.equal(isSeasonEntitlementPaid("refunded"), false);
    assert.equal(isSeasonEntitlementPaid(null), false);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm run test:unit -- lib/billing/entitlementStatus.test.ts lib/billing/isSeasonEntitlementPaid.test.ts`  
Expected: FAIL module not found / export missing

- [ ] **Step 3: Implement**

```ts
// lib/billing/entitlementStatus.ts
export type SeasonEntitlementStatus = "active" | "disputed" | "refunded";
export type EntitlementAdjustmentAction =
  | "refund"
  | "chargeback"
  | "chargeback_warning"
  | "chargeback_reverse";

export function nextEntitlementStatus(input: {
  current: SeasonEntitlementStatus;
  action: EntitlementAdjustmentAction;
  adjustmentStatus?: string | null;
}): { next: SeasonEntitlementStatus; applied: boolean; reason: string } {
  const { current, action } = input;
  if (current === "refunded") {
    return { next: "refunded", applied: false, reason: "refunded_terminal" };
  }
  if (action === "refund") {
    if (input.adjustmentStatus !== "approved") {
      return {
        next: current,
        applied: false,
        reason: "refund_not_approved",
      };
    }
    return { next: "refunded", applied: true, reason: "refund_approved" };
  }
  if (action === "chargeback" || action === "chargeback_warning") {
    if (current === "disputed") {
      return { next: "disputed", applied: false, reason: "already_disputed" };
    }
    return { next: "disputed", applied: true, reason: action };
  }
  if (action === "chargeback_reverse") {
    if (current !== "disputed") {
      return {
        next: current,
        applied: false,
        reason: "reverse_not_disputed",
      };
    }
    return { next: "active", applied: true, reason: "chargeback_reverse" };
  }
  return { next: current, applied: false, reason: "unknown_action" };
}
```

```ts
// lib/billing/isSeasonEntitlementPaid.ts
export function isSeasonEntitlementPaid(
  status: string | null | undefined,
): boolean {
  return status === "active";
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm run test:unit -- lib/billing/entitlementStatus.test.ts lib/billing/isSeasonEntitlementPaid.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/billing/entitlementStatus.ts lib/billing/entitlementStatus.test.ts lib/billing/isSeasonEntitlementPaid.ts lib/billing/isSeasonEntitlementPaid.test.ts
git commit -m "feat(billing): entitlement status transition helpers"
```

---

### Task 3: Webhook audit recorder

**Files:**
- Create: `lib/billing/recordWebhookEvent.ts`
- Create: `lib/billing/recordWebhookEvent.test.ts`

**Interfaces:**
- Produces:
  - `export const WEBHOOK_CHANNEL_PADDLE = "paddle"`
  - `export async function beginWebhookEvent(...): Promise<{ id: string; duplicate: boolean }>`
  - `export async function finishWebhookEvent(id, patch): Promise<void>`

- [ ] **Step 1: Failing tests with deps injection**

Test duplicate `eventId` returns `duplicate: true` without second insert; finish updates `processingResult`.

- [ ] **Step 2: Implement against Prisma (deps for unit tests)**

Normalize `channelCode` with `.trim().toLowerCase()` (always store `paddle`).

On unique violation of `(channel_code, event_id)`, return existing id + `duplicate: true`.

- [ ] **Step 3: Tests PASS + commit**

```bash
git commit -m "feat(billing): record snaptax_webhook_events audit rows"
```

---

### Task 4: Parse + apply Paddle adjustments

**Files:**
- Create: `lib/billing/parsePaddleAdjustment.ts`
- Create: `lib/billing/parsePaddleAdjustment.test.ts`
- Create: `lib/billing/applySeasonEntitlementAdjustment.ts`
- Create: `lib/billing/applySeasonEntitlementAdjustment.test.ts`

**Interfaces:**
- Consumes: `nextEntitlementStatus`
- Produces:
  - `parsePaddleAdjustmentPayload(payload): { transactionId, adjustmentId, action, adjustmentStatus } | null`
  - `applySeasonEntitlementAdjustment({ transactionId, action, adjustmentStatus, now? }): Promise<{ applied: boolean; reason: string; entitlementId?: string; statusBefore?: string; statusAfter?: string }>`

- [ ] **Step 1: Tests for parser**

Cover: refund approved/pending; chargeback_warning; missing transaction id → null.

Paddle shape (minimal):

```ts
// data.id = adj_...
// data.action = "refund" | "chargeback" | ...
// data.status = "approved" | "pending_approval" | ...
// data.transaction_id = "txn_..."
```

- [ ] **Step 2: Tests for apply**

Inject find-by-txn / update:
- unknown txn → `txn_not_found`, applied false
- active + approved refund → updates status refunded + statusReason + statusUpdatedAt
- repurchase race: update only the row returned by txn id

- [ ] **Step 3: Implement apply**

```ts
const row = await findByTransaction(transactionId); // select id,status
if (!row) return { applied: false, reason: "txn_not_found" };
const decision = nextEntitlementStatus({
  current: row.status as SeasonEntitlementStatus,
  action,
  adjustmentStatus,
});
if (!decision.applied) {
  return {
    applied: false,
    reason: decision.reason,
    entitlementId: row.id,
    statusBefore: row.status,
    statusAfter: row.status,
  };
}
await updateStatus(row.id, {
  status: decision.next,
  statusReason: decision.reason,
  statusUpdatedAt: now(),
});
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(billing): apply Paddle adjustment to season entitlement"
```

---

### Task 5: Fix grant / repurchase to set active + new transactionId

**Files:**
- Modify: `lib/billing/grantSeasonEntitlement.ts`
- Modify: `lib/billing/grantSeasonEntitlement.test.ts`

**Interfaces:**
- Change `updateEntitlement` data to include `transactionId`, `status: "active"`, `statusReason`, `statusUpdatedAt`

**Bug today:** same-season second purchase updates `paidAt`/`amount` but **keeps old `transactionId`** and returns that old id — breaks refund matching and repurchase restore.

- [ ] **Step 1: Update test expectations**

```ts
it("repurchase replaces transactionId and sets active", async () => {
  let updated: unknown;
  const result = await grantPaddleSeasonEntitlement(
    {
      userId: "user-1",
      taxSeason: "2026",
      transactionId: "txn-2",
      amountUsd: 49,
    },
    {
      findBySeason: async () => ({
        id: "ent-1",
        transactionId: "txn-1",
        status: "refunded",
      }),
      updateEntitlement: async (_id, data) => {
        updated = data;
      },
      now: () => new Date("2026-06-13T12:00:00.000Z"),
    },
  );
  assert.equal(result.transactionId, "txn-2");
  assert.equal(result.duplicateSeason, true);
  assert.deepEqual(updated, {
    paidAt: new Date("2026-06-13T12:00:00.000Z"),
    amount: 49,
    transactionId: "txn-2",
    status: "active",
    statusReason: "purchase_completed",
    statusUpdatedAt: new Date("2026-06-13T12:00:00.000Z"),
  });
});
```

Also: create path must set `status: "active"`.

- [ ] **Step 2: Implement minimal grant changes; tests PASS**

- [ ] **Step 3: Commit**

```bash
git commit -m "fix(billing): repurchase resets entitlement txn and active status"
```

---

### Task 6: Wire Paddle webhook route

**Files:**
- Modify: `app/api/webhooks/paddle/route.ts`
- Add integration-style unit tests if route helpers extracted: prefer extracting `handlePaddleWebhookPayload(payload)` to `lib/billing/handlePaddleWebhook.ts` + tests

**Interfaces:**
- Consumes: `beginWebhookEvent`, `finishWebhookEvent`, `parsePaddleAdjustmentPayload`, `applySeasonEntitlementAdjustment`, existing grant path

- [ ] **Step 1: Extract handler for testability (optional but recommended)**

`handlePaddleWebhookPayload(rawPayload): Promise<{ httpStatus: number; body: object }>`

Flow:
1. Read `event_id`, `event_type`, `occurred_at`, `data`
2. `beginWebhookEvent({ channelCode: "paddle", eventId, eventType, payload, processingResult: "received" })` — if duplicate, return `{ ok: true, duplicate: true }`
3. If `transaction.completed` → existing validate/grant path → finish applied/ignored
4. If `adjustment.created` | `adjustment.updated` → parse → apply → finish with status before/after
5. Else finish `ignored` / `unhandled_event_type`
6. Always prefer 200 after audit row exists

- [ ] **Step 2: Unit tests for handler**

- unhandled event audits ignored
- adjustment refund approved calls apply
- duplicate event_id short-circuits

- [ ] **Step 3: Point route.ts at handler after signature verify**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(paddle): handle adjustments and audit all webhooks"
```

---

### Task 7: Server paid gates use active status

**Files:**
- Modify: `app/api/entitlements/current/route.ts`
- Modify: `app/api/export/tax-pack/route.ts`
- Modify: `app/api/export/filed/route.ts`
- Modify: `lib/verify/ensureBypassEntitlement.ts` (ensure bypass rows created as `active`)
- Add/adjust: small unit test if gate helper extracted

**Interfaces:**
- Consumes: `isSeasonEntitlementPaid`

- [ ] **Step 1: Entitlements response**

```ts
return NextResponse.json({
  season,
  paid: isSeasonEntitlementPaid(entitlement?.status),
  paidAt: entitlement?.paidAt.toISOString() ?? null,
  status: entitlement?.status ?? null,
});
```

- [ ] **Step 2: Export gates**

Replace `if (!entitlement)` with:

```ts
if (!entitlement || !isSeasonEntitlementPaid(entitlement.status)) {
  return apiError("PAYMENT_REQUIRED", "Tax season export not paid", 402);
}
```

- [ ] **Step 3: Manual smoke / unit where available + commit**

```bash
git commit -m "fix(entitlement): gate export on active status"
```

---

### Task 8: Client entitlement status + copy

**Files:**
- Modify: `lib/client/authApi.ts` (`fetchSeasonPaid` + new `fetchSeasonEntitlement`)
- Modify: `lib/client/useAuthSession.ts` and/or `components/export/useTaxExportGate.tsx`
- Modify: `components/settings/TaxExportCard.tsx` / Settings banner as needed
- Modify: `lib/i18n/locales/en-US.ts` (+ `fr-FR.ts`, `de-DE.ts` if keys required by type)
- Modify: `lib/i18n/types.ts`

**Interfaces:**
- Produces: `fetchSeasonEntitlement(season): Promise<{ paid: boolean; status: string | null }>`
- `fetchSeasonPaid` becomes `return (await fetchSeasonEntitlement(season)).paid` (or keep boolean for callers)

- [ ] **Step 1: i18n keys**

```ts
// e.g. under settings.taxExport or paywall
entitlementDisputed:
  "Payment dispute in progress. Export for this season is paused. You can repurchase or contact support.",
entitlementRefunded:
  "This season’s export access ended after a refund. You can purchase again to unlock Export.",
```

- [ ] **Step 2: Wire UI when `!paid && status === "disputed"|"refunded"`**

Show the matching string near Paywall / Export card; unpaid with `status: null` keeps existing unpaid copy.

- [ ] **Step 3: Ensure Export entry refresh still calls entitlements API (already does)** so local `seasonPaid` clears after webhook.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(ui): explain disputed vs refunded season entitlement"
```

---

### Task 9: Manual restore helper + runbook

**Files:**
- Create: `lib/billing/restoreSeasonEntitlement.ts`
- Create: `lib/billing/restoreSeasonEntitlement.test.ts`
- Create: `docs/ops/paddle-entitlement-restore.md`
- Optional: `scripts/restore-season-entitlement.mjs` calling the lib via tsx

**Interfaces:**
- Produces: `restoreSeasonEntitlementActive({ userId, taxSeason, reason?: string }): Promise<{ ok: boolean; reason: string }>`
- Only transitions `disputed` → `active` (refuse `refunded` without repurchase: reason `refunded_use_repurchase`)

- [ ] **Step 1: Tests + implement**

- [ ] **Step 2: Runbook content**

Steps: find `snaptax_webhook_events` by `transaction_id` → confirm dispute lost → call restore → verify `GET /api/entitlements/current` → user reopens app.

- [ ] **Step 3: Commit**

```bash
git commit -m "docs(ops): runbook and helper to restore disputed entitlement"
```

---

### Task 10: Legal + tech docs

**Files:**
- Modify: `docs/legal/refund.md`
- Modify: `docs/legal/terms.md` (one sentence → `/refund` if missing behavior pointer)
- Modify: `docs/tech/07-paddle-billing.md`
- Modify: design status line in `docs/superpowers/specs/2026-07-15-paddle-refund-chargeback-entitlement-design.md` → **Approved**

- [ ] **Step 1: Add refund.md section**

```markdown
## Export access after refunds and disputes

- When a refund is **approved**, Export Tax Pack access for that purchased tax season is **stopped**. You may purchase the season again.
- When a payment **dispute / chargeback** is opened, Export for that season is **paused** while the dispute is open.
- If the dispute is resolved in our favor, Export may be **restored** automatically.
- If the dispute is lost, access may remain paused until we review the account manually.
```

- [ ] **Step 2: Update 07-paddle-billing.md**

Document: webhook events (completed + adjustments), status enum, audit table, paid = active only, Dashboard must subscribe to `adjustment.created` / `adjustment.updated`.

- [ ] **Step 3: Commit**

```bash
git commit -m "docs: disclose refund/dispute export pause and paddle webhook status"
```

---

### Task 11: Full unit regression + deploy checklist

- [ ] **Step 1: Run** `npm run test:unit` — expect PASS (including new suites)

- [ ] **Step 2: Checklist (manual / staging)**

1. Paddle Dashboard notification destination includes `adjustment.created`, `adjustment.updated`
2. Sandbox: complete purchase → `active`
3. Sandbox refund approved → `refunded` + Export 402
4. (If available) chargeback_warning → `disputed`; reverse → `active`
5. Query `snaptax_webhook_events` shows both applied and ignored types
6. `/refund` page shows new section

- [ ] **Step 3: Open PR** against `main` titled e.g. `feat(billing): pause export on Paddle refund/chargeback`

---

## Spec coverage self-check

| Spec requirement | Task |
|------------------|------|
| status active/disputed/refunded | 1, 2 |
| snaptax_webhook_events + channel_code + timestamps | 1, 3 |
| Match by transactionId | 4 |
| Refund approved only; partial = full stop | 2, 4 |
| chargeback_warning/chargeback → disputed; reverse → active | 2, 4 |
| refunded terminal; disputed+refund → refunded | 2 |
| Repurchase restores | 5 |
| Audit all events | 3, 6 |
| Entitlements API paid+status | 7, 8 |
| Export gate active-only | 7 |
| Client differentiated copy | 8 |
| Manual restore runbook | 9 |
| Legal + tech docs | 10 |
| Founder untouched | (explicit non-goal; no task mutates founder) |

## Placeholder scan

None intentional; implementers must use exact action strings from Paddle (`chargeback_warning`, etc.) as in Task 2.

## Type consistency

- Status strings: `"active" | "disputed" | "refunded"` everywhere
- Channel: `"paddle"`
- Helper: `isSeasonEntitlementPaid` for all server gates
