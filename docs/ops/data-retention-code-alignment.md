# Data Retention — Code Alignment (Internal)

**Last Updated:** July 2026  
**Public page:** [data-retention.md](../legal/data-retention.md) (`/data-retention`)  
**Compliance:** [`compliance-program-design.md`](../superpowers/topics/compliance-program-design.md) §7

Engineering audit reference. **Not linked from the public app.** Values here must match the user-facing Data Retention Policy and running code.

## On your device

| Data | Retention | Code / behavior |
|------|-----------|-----------------|
| Receipt records (IndexedDB) | Up to **18 months** from receipt `timestamp` | `RECEIPT_RETENTION_MONTHS = 18` in `lib/client/receiptRetention.ts`; background idle prune (~30s after load) |
| Receipts pending upload | **Not pruned** until upload completes | `pendingUpload` guard in `shouldPruneReceipt()` |
| Receipts in `processing` status | Kept until done, blurry, or deleted | No separate draft entity |
| Receipt photos (full resolution, OPFS) | Until upload succeeds, or **90 days** after cloud sync | `PHOTO_FULL_RETENTION_MS = 90 × 24h` in `lib/client/photoRetention.ts`; skipped while receipt is `processing` or `pendingUpload` |
| Thumbnails (OPFS) | With receipt row; full purge may leave thumb | `photoRetentionJob` |
| Encryption keys (local) | Until you delete app data or **Delete Account** | OPFS + `snaptax_crypto_meta` |

## On our servers (United States)

| Data | Retention | Code / behavior |
|------|-----------|-----------------|
| Receipt images & metadata (Postgres + Blob) | While Ghost session or Google account is active | Bound to `ghost_id` or `user_id` |
| Ghost session | Cookie + Postgres rows | Migrated on Google sign-in; deleted on Delete Account |
| Account & billing (Paddle entitlements) | As required for tax export entitlements and law | `snaptax_season_entitlements` |
| After **Delete Account** | Cloud receipts, images, and account rows permanently deleted | Client: `deleteAccountAndLocalData()`; server: `DELETE /api/users/me` — target completion within **30 days** |
| Rate limit buckets | Bucket rows garbage-collected after **24 hours** | `GC_RETENTION_MS = 24h` in `lib/api/dbRateLimit.ts` |
| Export Tax Pack files | **Not stored long-term** on server (MVP) | Generated on demand; user downloads |

## Logs

| Data | Retention |
|------|-----------|
| Security and API logs (no receipt images) | Up to **90 days** on our hosting platform (Vercel default) |

Structured logs exclude receipt image bytes and mask email where applicable. See [2026-06-06-logging-design.md](../superpowers/specs/2026-06-06-logging-design.md).

## Code constants

| Constant | Value | File |
|----------|-------|------|
| `RECEIPT_RETENTION_MONTHS` | 18 | `lib/client/receiptRetention.ts` |
| `PHOTO_FULL_RETENTION_MS` | 90 days | `lib/client/photoRetention.ts` |
| `GC_RETENTION_MS` | 24 hours | `lib/api/dbRateLimit.ts` |

## Verification

When changing retention behavior:

1. Update code constants and jobs.
2. Update [data-retention.md](../legal/data-retention.md) (user-facing numbers only).
3. Update this file so audit diff stays aligned.
