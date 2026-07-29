# Receipt Sync Ghost Reconcile Implementation Plan

> **Status:** Implemented (2026-06-07)

**Goal:** Fix receipt loss after Google link / restart / multi-device by stabilizing ghost cookie, safe reconcile, IndexedDB persist, post-login sync.

**Spec:** [`2026-06-07-receipt-sync-ghost-reconcile-design.md`](../specs/2026-06-07-receipt-sync-ghost-reconcile-design.md)

## Tasks (completed)

1. `app/api/ghost/register/route.ts` — idempotent reuse valid cookie (200) vs mint (201)
2. `lib/client/receiptSync.ts` — merge, prune, persist helpers
3. `components/home/HomeScreen.tsx` — safe syncFromServer + handlePostLoginSync
4. `components/settings/SettingsScreen.tsx` — call onPostLoginSync after sign-in

**Verify:** `npx next build`
