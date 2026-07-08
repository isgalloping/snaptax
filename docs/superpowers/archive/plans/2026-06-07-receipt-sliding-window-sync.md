# Receipt Sliding-Window Sync Implementation Plan

> **Status:** Implemented (2026-06-07)

**Goal:** Local-first startup; async merge top 100 by `updatedAt`; no sync deletes; LWW merge.

**Spec:** [`2026-06-07-receipt-sliding-window-sync-design.md`](../specs/2026-06-07-receipt-sliding-window-sync-design.md)

## Tasks (completed)

1. API: `orderBy updatedAt`, limit max 100, serialize `updatedAt`
2. Prisma indexes on `(user_id|ghost_id, updated_at)`
3. `lib/client/receiptSync.ts` — `unionMergeLWW`, `top100ByUpdatedAt`; remove prune
4. `receiptDb` — `updatedAt` serialize + fallback
5. `HomeScreen` — Phase 0 top100 local; sync union merge

**Verify:** `npx next build` · `node --test lib/client/receiptSync.test.ts`
