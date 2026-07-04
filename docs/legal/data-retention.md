# Snap1099 Data Retention Policy

**Last Updated:** June 2026  
**Related:** [Privacy Policy](/privacy) · [Terms of Service](/terms) · [Pricing](/pricing) · [Refund Policy](/refund) · [All policies](/policies) · [Security](/security)

This summary describes how long Snap1099 keeps different types of data. Technical details may be updated as our infrastructure evolves; material changes will be reflected in our Privacy Policy.

> **Languages:** This page is canonical in English. French and German Privacy Policies link here for retention periods (MVP).

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
| Export Tax Pack files | **Not stored long-term** on server (MVP) | Generated on demand; user downloads CSV/XLSX |

## Logs

| Data | Retention |
|------|-----------|
| Security and API logs (no receipt images) | Up to **90 days** on our hosting platform (Vercel default) |

Structured logs exclude receipt image bytes and mask email where applicable (see `docs/superpowers/specs/2026-06-06-logging-design.md`).

## Your controls

- **Export Tax Pack** — structured portability (CSV/XLSX)  
- **Delete Account** (Settings) — erase local IndexedDB/OPFS and cloud data tied to you  

## Code constants (audit reference)

| Constant | Value | File |
|----------|-------|------|
| `RECEIPT_RETENTION_MONTHS` | 18 | `lib/client/receiptRetention.ts` |
| `PHOTO_FULL_RETENTION_MS` | 90 days | `lib/client/photoRetention.ts` |
| `GC_RETENTION_MS` | 24 hours | `lib/api/dbRateLimit.ts` |

Questions: **snaptax.lightxforge@gmail.com**
