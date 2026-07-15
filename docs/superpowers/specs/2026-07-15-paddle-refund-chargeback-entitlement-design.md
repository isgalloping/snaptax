# Paddle Refund / Chargeback → Season Export Entitlement — Design

**Date:** 2026-07-15  
**Status:** Approved  
**References:** `docs/tech/07-paddle-billing.md` · `docs/legal/refund.md` · `app/api/webhooks/paddle/route.ts` · `lib/billing/grantSeasonEntitlement.ts` · `prisma` `SnaptaxSeasonEntitlement` · **Plan:** `docs/superpowers/plans/2026-07-15-paddle-refund-chargeback-entitlement.md`  
**Scope:** Pause/stop/restore **tax-season Export** entitlement from Paddle refund & dispute webhooks; webhook audit log; API/client messaging; legal copy. No Admin UI, no email notifications, no Founder seat reclaim.

## Summary

Today SnapTax grants a season entitlement on `transaction.completed` only. Refunds and chargebacks do **not** change `snaptax_season_entitlements`, so users can keep exporting after money is clawed back.

This design adds a per-entitlement `status` (`active` | `disputed` | `refunded`), processes Paddle **adjustment** webhooks to drive that status, and persists **every** inbound webhook (any type) into `snaptax_webhook_events` for audit/debug. Export is allowed only when `status === "active"`.

## Problem

| Gap | Impact |
|-----|--------|
| Webhook ignores non-`transaction.completed` | Refund/chargeback never reach app logic |
| Entitlement = “row exists” | No pause vs revoke semantics |
| No webhook payload archive | Hard to reconcile Paddle Dashboard vs DB |
| Legal `/refund` silent on auto-stop | Product behavior not disclosed |

## Approaches considered

| # | Approach | Pros | Cons |
|---|----------|------|------|
| **1 (chosen)** | `status` on `snaptax_season_entitlements` + adjustment handlers + `snaptax_webhook_events` | Fits `(userId, taxSeason)` model; repurchase = update same row; small surface | One live `transactionId` per season row |
| 2 | Separate holds table + join at read time | Richer audit of holds | Dual-write; easy to miss a gate |
| 3 | Hard-delete row / boolean revoked | Looks simple | Cannot keep “disputed until manual restore”; weak UX states |

**Decision:** Approach **1**.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Chargeback **lost** (no reverse) | Keep `disputed`; **manual** restore via runbook/script |
| Same-season **repurchase** | Allowed; new `transaction.completed` sets new `transactionId` + `active` |
| Data model | `status`: `active` \| `disputed` \| `refunded` |
| Founder seats | **Unchanged** (season gate only; existing lapsed display applies when not active) |
| Client UX | Same export gate; **different copy** for `disputed` vs `refunded` |
| Ops restore MVP | Internal lib + script/runbook — **no** Admin UI |
| Match key | Entitlement lookup by **`transactionId` only** |
| Refund apply when | Adjustment `action=refund` and status **`approved`** only |
| Partial refund | Any approved refund amount → full season `refunded` |
| Dispute start | `chargeback_warning` **or** `chargeback` → `disputed` |
| Dispute win | `chargeback_reverse` → `active` **if** current status is `disputed` |
| `refunded` terminal | Same txn ignores later dispute/reverse; reopen only via **new purchase** |
| `disputed` + approved refund | Upgrade to `refunded` |
| Legal | Update `docs/legal/refund.md` (+ Terms cross-link if needed) with product behavior |
| Audit table | `snaptax_webhook_events` with `channel_code`, `created_at`, `updated_at` |
| Channel code | Canonical **`paddle`** (lowercase; normalize on write) |

## Entitlement status machine

```text
                    transaction.completed (grant / repurchase)
                                  │
                                  ▼
                              ┌────────┐
              ┌───────────────│ active │◄──────────────┐
              │               └───┬────┘               │
              │                   │                    │
   chargeback_warning /     approved refund    chargeback_reverse
      chargeback                  │              (from disputed)
              │                   │                    │
              ▼                   ▼                    │
         ┌──────────┐       ┌──────────┐               │
         │ disputed │──────►│ refunded │───────────────┘ (no)
         └──────────┘       └──────────┘
              │                   │
              │ manual restore    │ new purchase (new txn)
              └───────────────────┴──► active
```

**Paid check:** `paid = (row exists && status === "active")`.

## Schema

### `SnaptaxSeasonEntitlement` additions

| Column | Type | Notes |
|--------|------|--------|
| `status` | `VARCHAR` | `active` \| `disputed` \| `refunded`; default `active` for backfill |
| Optional: `status_updated_at` | `timestamptz` | Last status transition |
| Optional: `status_reason` | `VARCHAR` | Short machine reason (`refund_approved`, `chargeback`, `manual_restore`, …) |

Existing unique keys unchanged: `(user_id, tax_season)`, `transaction_id`.

### `snaptax_webhook_events` (new)

Purpose: durable audit of **all** payment-channel webhooks for reconciliation and incident response. Not a substitute for `logEvent` — both remain.

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `channel_code` | VARCHAR | e.g. `paddle` |
| `event_id` | VARCHAR | Provider event id; **unique** with channel (idempotency) |
| `event_type` | VARCHAR | e.g. `transaction.completed`, `adjustment.updated` |
| `occurred_at` | timestamptz nullable | Provider timestamp when present |
| `transaction_id` | VARCHAR nullable | |
| `adjustment_id` | VARCHAR nullable | |
| `action` | VARCHAR nullable | e.g. `refund`, `chargeback`, `chargeback_warning`, `chargeback_reverse` |
| `adjustment_status` | VARCHAR nullable | e.g. `pending_approval`, `approved`, `rejected` |
| `payload` | JSONB | Raw or redacted payload sufficient for debug |
| `processing_result` | VARCHAR | `applied` \| `ignored` \| `error` |
| `processing_reason` | VARCHAR nullable | e.g. `txn_not_found`, `refunded_terminal`, `pending_approval`, `not_adjustment` |
| `entitlement_id` | UUID nullable | Row touched, if any |
| `status_before` / `status_after` | VARCHAR nullable | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Indexes:** unique `(channel_code, event_id)`; index `(transaction_id)`; index `(created_at)`.

**Ingress rule:** verify signature → **upsert/insert audit row** → run business handler → update `processing_*` / status columns on the same audit row when done.

## Webhook handling (`POST /api/webhooks/paddle`)

1. Verify `Paddle-Signature` (unchanged).
2. Parse JSON; write/ensure `snaptax_webhook_events` (`channel_code=paddle`). Duplicate `event_id` → return 200 without re-applying (idempotent).
3. Branch:
   - **`transaction.completed`:** existing validate + `resolveWebhookGrantTarget` + `grantPaddleSeasonEntitlement` (extend grant to always set `status=active` and replace `transactionId` on same-season repurchase).
   - **`adjustment.created` / `adjustment.updated`:** parse related transaction id + action + status; apply state machine above.
   - **Any other `event_type`:** audit `ignored` + reason `unhandled_event_type`; HTTP 200.
4. Prefer HTTP **2xx** after durable audit even when business outcome is `ignored`/`error` (retry storms help little once payload is stored); use `error` + ops alert for unexpected failures after retries exhausted if needed.

Grant / adjustment lookups that cannot find entitlement by `transactionId` → audit `ignored` / `txn_not_found` (do not create phantom rows).

## API & client

### `GET /api/entitlements/current`

```json
{
  "season": "2026",
  "paid": false,
  "paidAt": "2026-07-01T12:00:00.000Z",
  "status": "disputed"
}
```

| Field | Rule |
|-------|------|
| `paid` | `true` iff row exists and `status === "active"` |
| `status` | `active` \| `disputed` \| `refunded` \| `null` (no row) |
| `paidAt` | From row when present; unchanged semantics |

Export server gates must use the same **active** rule (never trust client-only `seasonPaid`).

### Client

- Refresh entitlement when entering Export / Settings (existing poll paths).
- Map `seasonPaid` ← API `paid`.
- Copy (i18n):
  - **disputed:** payment dispute in progress; export paused; may repurchase or contact support.
  - **refunded:** season entitlement ended; repurchase available.
- No push email / in-app inbox in this scope.

## Operations

- Runbook under `docs/ops/` (e.g. `paddle-entitlement-restore.md`): how to query `snaptax_webhook_events` by `transaction_id` / `event_id`, when to call restore.
- Internal helper e.g. `restoreSeasonEntitlementActive({ userId, taxSeason, reason })` used by script; sets `status=active`, writes audit reason `manual_restore` (optional companion event or log-only).
- **No** customer-facing restore control.

## Legal

Update `docs/legal/refund.md` (English canonical) to disclose:

1. Approved refunds stop Export for that purchased season; repurchase allowed.
2. Payment disputes / chargebacks pause Export for that season while the dispute is open.
3. If SnapTax prevails, Export may resume automatically.
4. If the dispute is lost, access may remain paused until manually reviewed.
5. Delete Account still does not auto-refund (existing).

Optional one-sentence pointer from Terms payment section → `/refund`.

## Testing

| Case | Expect |
|------|--------|
| Approved refund | `refunded`; `paid=false`; later dispute on same txn ignored |
| `chargeback_warning` / `chargeback` | `disputed` |
| `chargeback_reverse` | `disputed`→`active`; no-op if `refunded` |
| Old txn refund after repurchase | New `active` row/txn untouched |
| Partial approved refund | Full season `refunded` |
| Pending refund | No status change; audit `ignored`/`pending_approval` |
| Unhandled event types | Audit row exists; entitlement unchanged |
| Duplicate `event_id` | Idempotent; single apply |
| Entitlements API | `paid`/`status` consistent |
| Backfill | Existing rows → `status=active` |

## Out of scope

- Admin console / support console UI
- User email or push on status change
- Revoking or reassigning Founder seat numbers
- Prorated / partial entitlement retention
- Non-Paddle channels (table supports `channel_code` for future only)
- Changing Paddle Overlay checkout UX beyond Paywall after unpaid/disputed/refunded

## Implementation notes (non-binding)

- Migrate Prisma + `db/init-table.sql` / DB design notes per project rules.
- Extend `docs/tech/07-paddle-billing.md` webhook section.
- Keep structured `logEvent` alongside DB audit (`module: biz.paddle`).
- Confirm live Dashboard notification subscriptions include `adjustment.created` and `adjustment.updated`.

## Acceptance criteria

1. Approved refund for txn T stops Export for the season row whose `transaction_id=T`.
2. Chargeback warning/chargeback pauses Export; reverse restores when previously disputed.
3. Lost chargeback without reverse leaves `disputed` until manual restore.
4. Repurchase restores Export via new completed transaction.
5. Every received Paddle webhook leaves an auditable `snaptax_webhook_events` row with `channel_code=paddle`.
6. `/refund` documents the behavior.
7. Unit tests cover the state machine and match-by-`transactionId` race.
