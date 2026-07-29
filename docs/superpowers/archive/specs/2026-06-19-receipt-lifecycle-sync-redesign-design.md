# Receipt Lifecycle & Sync Redesign — Design

**Date:** 2026-06-19  
**Status:** Draft (design only — **no implementation**)  
**Scope:** Redesign receipt **status**, **sync**, **retention**, **worker-session gating**, and **local-first export** to satisfy seven product constraints. Supersedes conflicting portions of older sync specs (see §10).

**References:** `docs/product/PRODUCT-SPEC.md` · `docs/tech/06-receipt-ai-pipeline.md` · [2026-06-07-receipt-sliding-window-sync-design.md](./2026-06-07-receipt-sliding-window-sync-design.md) · [2026-06-07-receipt-sync-budget-design.md](./2026-06-07-receipt-sync-budget-design.md) · [2026-06-10-camera-session-sync-audit.md](./2026-06-10-camera-session-sync-audit.md)

---

## Summary

Blue-collar 1099 users work **offline, in bursts, and under time pressure**. The current receipt model mixes AI status, sync flags, and LWW merge in ways that violate new constraints: `done` rows can still change, background sync can run during capture, export reads server PG instead of local IDB, and IDB never prunes.

This spec separates concerns into three layers:

1. **AI status** (`processing` | `done` | `blurry`) — unchanged semantics for Vision; `blurry` remains resnap-able.
2. **Sync plane** (`pendingUpload`, upload budget, merge window) — new **WorkerSession gate**, **50-row window**, **3-try budget**, **done immutability**.
3. **Tax filing plane** (`taxSeason`, `taxSeasonDate`) — set on first successful upload and on export; the only post-`done` mutations allowed locally.

**Recommended package:** incremental evolution of existing IDB + orchestrator (**not** a greenfield SyncEngine). Adds explicit **WorkerSession** gating so capture is never contending with flush/poll/list-fetch.

---

## Product constraints (source requirements)

| # | Requirement | Design response |
|---|-------------|-----------------|
| **C1** | Data consistency between local and server | Deterministic merge rules; `pendingUpload` always wins; `done` business fields immutable; filed metadata converges from export PATCH |
| **C2** | Offline capture; sync after startup when worker is **not** actively working | Phase 0 local-only; Phase 2 sync only when `!workerSessionActive`; offline rows flush when online + idle |
| **C3** | Local retention **1.5 years** (18 months) | Idle background prune of receipt rows + photos + tombstones older than cutoff |
| **C4** | Must not slow app startup | Phase 0 unchanged; prune and Phase 2 never block first paint or shutter |
| **C5** | While worker is actively capturing, sync must not interfere with snap | **WorkerSession** = zero auto flush, zero watcher poll, zero auto list fetch (user ↻ still allowed) |
| **C6** | `done` is terminal; online conflict resolution prefers **latest 50** by `updatedAt`; unsynced first; **3** auto failures then manual sync | Done lock; `RECEIPT_SYNC_LIMIT=50`; pending queue priority; `MAX_WRITE_BUDGET=3` |
| **C7** | After sync to server, persist tax season; **export reads local**; after export, update server filed state | `taxSeason` on first upload; local IDB pack build; post-export server `updateMany` / PATCH filed |

---

## Decisions (locked for this draft)

| Topic | Choice | Notes |
|-------|--------|-------|
| Done terminal semantics | **1A** | `status=done` blocks changes to amount/merchant/category/taxAmount/ai fields; **only** `taxSeason` / `taxSeasonDate` (and sync metadata) may update |
| Worker session gate | **2A** | Camera open, batch active, or post-batch review → **no automatic** upload/flush/poll/list-fetch |
| Approach | **A + B** | Incremental orchestrator changes + WorkerSession gate (not full SyncEngine rewrite) |
| Sync window | **50** rows by `updatedAt desc` | Replaces 100-row window in UI and merge fetch |
| Write budget | **3** failed writes | Replaces 5; manual ↻ / Tap Retry resets to 3 |
| Retention | **18 calendar months** from `timestamp` | Prune on idle only |
| Export source of truth | **Local IDB** | Server PATCH filed after successful local pack generation |
| AI status enum | **Unchanged** | `processing` \| `done` \| `blurry` |

---

## Current vs target (gap analysis)

| Area | Current (code) | Target (this spec) |
|------|----------------|---------------------|
| `done` merge | Remote LWW can overwrite business fields | Done lock — remote cannot change protected fields |
| Startup Phase 2 | May flush/upload even if camera opens quickly | Phase 2 deferred until `!workerSessionActive` |
| Camera / batch | Watcher paused; **upload + list fetch** may still run | **2A:** zero auto network during WorkerSession |
| Sync window | 100 (`UI_RECEIPT_LIMIT`) | 50 |
| Failure budget | 5 (`MAX_WRITE_BUDGET`) | 3 |
| IDB retention | Full history kept | 18-month idle prune |
| Export | `prepareExportSync` → server PG → generate | Build from local IDB; server filed PATCH only |
| `taxSeason` on upload | Not consistently set client-side | Set on first successful upload (current tax season) |
| Batch Done flush | Immediate `flushPendingUploads` | Queue flush until WorkerSession ends (unless user ↻) |

---

## Architecture — three planes

```
┌─────────────────────────────────────────────────────────────┐
│  UI plane (buckets: processing / action / review / ready)   │
│  — derived from status + flags; no new user-facing statuses │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  AI status plane: processing → done | blurry                  │
│  — server Vision; resnap resets to processing                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Sync plane: pendingUpload, writeBudget, merge window       │
│  — gated by WorkerSession + online + visibility             │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Tax filing plane: taxSeason (on upload), taxSeasonDate       │
│  — (on export); filed = both set                              │
└─────────────────────────────────────────────────────────────┘
```

### New module boundaries (implementation phase — not built yet)

| Module | Responsibility |
|--------|----------------|
| `lib/client/workerSession.ts` | Single source: `isActive()` from cameraOpen \| batchActive \| postReviewActive |
| `lib/client/receiptSyncGate.ts` | `canAutoSync()`, `canAutoFlush()`, `canAutoPoll()` — all false when WorkerSession active |
| `lib/client/receiptMergePolicy.ts` | Done lock + pendingUpload win + LWW for non-terminal rows |
| `lib/client/receiptRetention.ts` | `pruneOlderThan(18mo)` — idle job only |
| `lib/export/buildLocalTaxPack.ts` | Local CSV/ZIP/PDF from IDB rows + local/remote image URLs |
| `lib/client/exportFiledSync.ts` | After local export success → PATCH server filed ids |

Existing modules to **adapt** (not replace): `receiptSyncOrchestrator`, `receiptSync`, `receiptSyncBudget`, `ProcessingReceiptWatcher`, `HomeScreen`, `exportPrepareFlow`.

---

## §1 AI status machine (minimal change)

Vision rules stay as documented in `docs/tech/06-receipt-ai-pipeline.md`:

```
processing ──Vision OK──► done
         └──Vision fail──► blurry
         └──Vision error──► processing (retry via /process)

blurry ──resnap──► processing (replace image, re-run Vision)
done ──resnap──► N/A (user edits via review flow only if product adds later; MVP: no re-AI on done)
```

**Change vs today:** once local row is `done`, **merge from API must not alter** AI-derived fields even if server `updatedAt` is newer (see §3).

---

## §2 Sync & lifecycle state machine (major change)

### 2.1 Local row flags

| Field | Semantics |
|-------|-----------|
| `status` | AI status |
| `pendingUpload` | Local changes not yet acknowledged by server upload |
| `photoMissing` | No local blob; needs resnap before upload |
| `writeBudgetRemaining` | Auto write attempts left (default **3**) |
| `syncStuck` | Derived: `writeBudgetRemaining <= 0` (not persisted separately) |
| `taxSeason` | Assigned on **first successful upload** = `currentTaxSeason()` |
| `taxSeasonDate` | Set on **export success** (filed instant) |
| `updatedAt` | LWW key; bumped on local mutation and server ack |

### 2.2 WorkerSession gate (**2A**)

```typescript
workerSessionActive =
  cameraOpen || batchActive || postReviewActive
```

When `workerSessionActive`:

| Operation | Allowed? |
|-----------|----------|
| `savePhoto` + `saveReceipt` (local) | ✅ Always |
| Auto `flushPendingUploads` | ❌ |
| Auto `syncFromServer` / list fetch | ❌ |
| `ProcessingReceiptWatcher` poll / `/process` | ❌ |
| User ↻ manual sync (TaxHeader / camera overlay) | ✅ |
| User Tap Retry on stuck row | ✅ (bypass gate once) |
| Export flow (explicit user action) | ✅ (may flush + sync as part of export prep — see §6) |

**Batch path change:** `handleBatchDone` today flushes immediately. **Target:** refresh local list only; enqueue pending rows; flush when `!workerSessionActive`.

**Single snap path:** unchanged UX — camera closes before upload; `workerSessionActive` becomes false, then upload proceeds.

### 2.3 Startup phases

```
Phase 0 (sync, ≤1.5s goal):
  IDB → loadRecentUnfiled(30) + top50ByUpdatedAt → render
  NO network

Phase 2 (async, after hydrated + rAF):
  IF workerSessionActive → skip; schedule retry on session end
  ELSE:
    1. flushPendingUploads (pending first, concurrency 2)
    2. fetchReceiptList(limit=50)
    3. merge with policy (§3)
    4. ProcessingQueue.bootstrap

Retention job (Phase 3 idle):
  requestIdleCallback / setTimeout(30s+) → pruneReceiptsOlderThan(18mo)
  NEVER in Phase 0/2 critical path
```

### 2.4 Online sync priority (**C6**)

When reconciling inconsistencies:

1. **All** `pendingUpload=true` rows (any age), ordered by `updatedAt desc`
2. Then **top 50** non-pending rows by `updatedAt desc` from server window
3. Local rows outside window **remain in IDB** but are not merge-fetched from server (same union model as today, smaller window)

Header `taxSavedEstimate` continues to use **full local unfiled sum** (indexed), not window-limited.

### 2.5 Write budget (**3 tries**)

| Event | Budget |
|-------|--------|
| New capture | Reset to 3 |
| Failed `POST /receipts` | −1 |
| Failed `POST /process` | −1 |
| `GET` poll | Free |
| Manual ↻ / Tap Retry | Reset to 3 |
| `photoMissing` upload | Budget 0 until resnap (unchanged) |

At 0 → `syncStuck`; card shows manual retry; no silent auto-retry storm.

---

## §3 Merge policy & done lock (**1A**, **C1**)

### 3.1 Rules (priority order)

1. **Tombstone** — delete wins if `updatedAt` ≥ row
2. **`pendingUpload=true` (local)** — local row wins entirely over remote
3. **`status=done` (local)** — **protected fields frozen** on local copy:
   - `status`, `amount`, `merchant`, `category`, `taxAmount`, `deductible`, `currency`, `dataRegion`, `aiConfidence`, `subtitle`
   - **Merge allowed:** `taxSeason`, `taxSeasonDate`, `hasRemoteImage`, `updatedAt` (only if remote filed metadata is strictly newer and local not pending)
4. **Non-done** — LWW by `updatedAt`; tie → prefer row with server ack (`pendingUpload=false`)

### 3.2 Server-side mirror (future implementation)

Server should reject PATCH/upsert that mutates protected fields on `status=done` except filed metadata endpoints. Client policy is necessary but not sufficient for multi-device — server enforcement recommended in same release.

### 3.3 `blurry` and `processing`

Still mutable by remote until locally `done`. Resnap always resets to `processing` locally and on server.

---

## §4 Retention (**C3**, **C4**)

### 4.1 Receipt rows（18 个月）

- **Cutoff:** `timestamp < now − 18 months`
- **Scope:** receipt metadata, OPFS photo dirs, tombstones for pruned ids
- **Never prune:** rows with `pendingUpload=true` or `status=processing` (even if old)
- **Trigger:** idle callback ≥30s after startup, and on `visibilitychange` → visible after long background (optional second pass)
- **UI:** pruned rows disappear from list; user cannot recover (acceptable for 1.5y product rule)

### 4.2 Photo full image（90 天 · 已同步）

**Canonical：** [`12-local-image-storage-design.md`](../../tech/12-local-image-storage-design.md) §7

- **条件：** `hasRemoteImage=true` 且 `remoteSyncedAtMs < now − 90 days`
- **动作：** 删除 OPFS **full** 文件；保留 **thumb**；`fullPurged=true`
- **永不删 full：** `pendingUpload=true` 或 `status=processing`
- **触发：** 与 §4.1 同一 idle 任务；不阻塞首屏/快门
- **查看：** 无 local full → `GET /api/receipts/:id/image` signed URL

---

## §5 Tax season & filed state (**C7**)

| Event | Local | Server |
|-------|-------|--------|
| First successful upload | Set `taxSeason = currentTaxSeason()` if empty | Same on insert/update in upload handler |
| Export success | Set `taxSeasonDate = now()` for exported ids; ensure `taxSeason` matches export year | `updateMany` filed (existing export API pattern) |
| Filed definition | `taxSeason` non-empty **and** `taxSeasonDate` set | Same (`isReceiptFiled`) |

Export **does not** re-run AI or change amounts — only filing metadata.

---

## §6 Local-first export (**C7**)

### 6.1 Flow

```
User taps Export
  → ensureGhostSession + entitlement check (server, unchanged)
  → prepareExportLocal:
       loadAllReceipts from IDB
       filter by tax year + export gate rules
       optional: flush pending (user-initiated; not WorkerSession-blocked)
  → buildLocalTaxPack(format) — CSV / ZIP / PDF / XLSX client-side or hybrid:
       metadata from IDB
       images: local blob preferred; else signed URL fetch
  → on success: exportFiledSync(exportedIds) → server PATCH
  → on PATCH failure: local filed state kept; show retry banner (export file already delivered)
```

### 6.2 `prepareExportSync` replacement

Deprecate server-PG-as-source export path for CPA/TurboTax packs. Server `POST /api/export/tax-pack` may remain for:

- Entitlement verification
- Filed PATCH persistence
- Optional server-side fallback when local pack cannot include images (document as degraded mode)

Primary path: **local build** using existing helpers (`buildLocalTurboTaxCsv`, extend to ZIP/PDF patterns from `buildCpaPack`).

### 6.3 Consistency note

Export prep may still call **one** targeted sync (user-initiated) to pull remote-only rows onto device before pack build — but pack contents always read **IDB**, not live PG query on server.

---

## §7 UI behavior (no new Modals)

| Signal | UI |
|--------|-----|
| `pendingUpload` count > 0 && online && !WorkerSession | Subtle list header: "Syncing N receipts…" |
| `syncStuck` | Existing Tap to Retry on card |
| WorkerSession active | No new indicators (capture stays clean) |
| Export with pending (non-stuck) | Export sheet step warns count mismatch |

Buckets (`processing` / `action` / `review` / `ready`) unchanged.

---

## §8 Constants (target)

```typescript
export const UI_RECEIPT_LIMIT = 50;
export const RECEIPT_SYNC_LIMIT = 50;
export const STARTUP_UNFILED_LIMIT = 30; // unchanged
export const MAX_WRITE_BUDGET = 3;
export const RETENTION_MONTHS = 18;
export const UPLOAD_CONCURRENCY = 2;
```

Rename `top100ByUpdatedAt` → `topByUpdatedAt(limit)` when implementing.

---

## §9 Acceptance criteria

1. Offline: 10 snaps → all in IDB with `pendingUpload`; shutter never blocked.
2. WorkerSession: batch 5 shots + Done → **no** upload until overlay fully closed; then flush all 5.
3. `done` row: remote merge with different amount → local amount unchanged.
4. Filed: export success → local + server `taxSeasonDate`; amount unchanged.
5. Cold start: local list visible without network; snap available within PRD 1.5s target on throttled profile.
6. Retention: row with `timestamp` 19 months ago pruned after idle job; 17-month row kept.
7. Sync window: with 80 local rows, merge fetch requests `limit=50`; pending rows outside window still flush first.
8. Budget: 3 failed uploads → stuck; ↻ resets → 4th attempt allowed.
9. Export: airplane mode after sync → CSV/ZIP generates from IDB without PG read.

---

## §10 Supersedes / amends

| Document | Effect |
|----------|--------|
| [receipt-sliding-window-sync-design.md](./2026-06-07-receipt-sliding-window-sync-design.md) | Window **100 → 50** |
| [receipt-sync-budget-design.md](./2026-06-07-receipt-sync-budget-design.md) | Budget **5 → 3** |
| [camera-session-sync-audit.md](./2026-06-10-camera-session-sync-audit.md) | **2A** overrides G1/G4 gray areas — no auto fetch/flush during WorkerSession |
| [indexeddb-receipt-query-design.md](./2026-06-10-indexeddb-receipt-query-design.md) | Adds retention prune (contradicts "no sliding delete" for **time-based** prune only) |

Does **not** change: Ghost auth, Paddle export gate, Vision prompts, zero Modal core flow.

---

## §11 Out of scope

- Full SyncEngine rewrite with persistent op log
- Background Sync API / Periodic Sync registration
- Multi-region data residency
- Re-AI classification after `done`
- Expanding sync window above 50
- Phone-number auth or cloud-sync marketing copy

---

## §12 Implementation follow-up (explicitly deferred)

When approved:

1. Invoke **writing-plans** → `docs/superpowers/plans/2026-06-19-receipt-lifecycle-sync-redesign.md`
2. Update `docs/tech/06-receipt-ai-pipeline.md` §6.5–6.6 and `PRODUCT-SPEC.md` §12 status table
3. Phased rollout: **P0** done lock + WorkerSession + budget 3 + window 50 → **P1** local export → **P2** retention prune

**No code changes until this spec is approved.**

---

## Appendix A — State diagram (target)

```mermaid
stateDiagram-v2
    direction TB

    state "Capture (local)" as cap {
        [*] --> LocalWrite: snap / batch shot
        LocalWrite --> LocalWrite: WorkerSession active\nIDB only
    }

    state "Upload queue" as up {
        PendingUpload --> Uploading: flush when\n!WorkerSession && online
        Uploading --> Synced: POST /receipts OK\nset taxSeason
        Uploading --> Stuck: budget exhausted
        Stuck --> PendingUpload: manual retry\nreset budget
    }

    state "AI status" as ai {
        processing --> done: Vision OK
        processing --> blurry: Vision reject
        processing --> processing: Vision error
        blurry --> processing: resnap
    }

    state "Terminal done" as done {
        done --> done: merge locked\nexcept filed fields
        done --> Filed: export success\ntaxSeasonDate set
    }

    LocalWrite --> PendingUpload: pendingUpload=true
    Synced --> processing: server ack
    ai --> done: status update
    done --> Filed
```

## Appendix B — WorkerSession vs current pause matrix

| Signal | Current watcher pause | Target WorkerSession gate |
|--------|----------------------|---------------------------|
| cameraOpen | pause poll | block poll + flush + auto fetch |
| batchActive | same as camera | same |
| postReviewActive | same as camera | same |
| detail sheet | pause poll | pause poll only (session inactive) |
| settings | pause poll | pause poll only |
| document.hidden | pause poll | pause poll + defer Phase 2 |

---

**Review gate:** Please confirm decisions **1A** and **2A** (or specify changes). After approval, implementation plan only — no code until plan is accepted.
