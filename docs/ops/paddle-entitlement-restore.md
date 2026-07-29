# Paddle entitlement restore (ops)

When a chargeback is **lost** (no `chargeback_reverse`), `snaptax_season_entitlements.status` stays `disputed` until manual restore.

## Investigate

```sql
SELECT * FROM snaptax_webhook_events
WHERE transaction_id = '<txn_…>'
ORDER BY created_at;

SELECT id, user_id, tax_season, transaction_id, status, status_reason, status_updated_at
FROM snaptax_season_entitlements
WHERE transaction_id = '<txn_…>';
```

## Restore (disputed → active only)

Use `restoreSeasonEntitlementActive` from `lib/billing/restoreSeasonEntitlement.ts` (e.g. one-off tsx script):

```ts
import { restoreSeasonEntitlementActive } from "@/lib/billing/restoreSeasonEntitlement";

await restoreSeasonEntitlementActive({
  userId: "<uuid>",
  taxSeason: "2026",
  reason: "manual_restore_ops",
});
```

- `refunded` → refuse (`refunded_use_repurchase`); user must repurchase.
- After restore, ask user to reopen Settings/Export so `fetchSeasonEntitlement` refreshes.

## Dashboard

Subscribe Paddle notifications: `transaction.completed`, `adjustment.created`, `adjustment.updated`.
