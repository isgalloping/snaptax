# Receipt Sync Budget — Design

**Date:** 2026-06-07  
**Status:** Approved (design)  
**Scope:** Per-receipt write-operation budget (upload + AI analysis); manual retry after exhaustion; independent list sync with header refresh button.

## Problem

Background sync is too aggressive and failures are noisy:

- Pending uploads retry every 60s with no upper bound
- AI analysis polls up to ~20 ticks before stuck (~60s), independent of actual write failures
- `POST /process` failures throw `PROCESS_FAILED` → unhandled rejection in browser
- No manual way to refresh list/tax totals without restarting the app

Users want bounded silent retries, then explicit per-receipt retry, plus optional list refresh that does not consume per-receipt budget.

## Related decisions (already shipped or approved elsewhere)

| Topic | Choice | Reference |
|-------|--------|-----------|
| Header summary | **B** — subtitle under amount | [home-compact-layout-design.md](./2026-06-07-home-compact-layout-design.md) |
| Snap shutter | **C** — `h-[140px]` full width | same |
| Polling policy | **C** — pause on interaction + zero poll when idle | [background-polling-policy-design.md](./2026-06-07-background-polling-policy-design.md) |

## Decisions (this spec)

| Topic | Choice |
|-------|--------|
| Silent sync scope | **A + B** — offline upload + single-receipt AI analysis share one budget |
| What counts | **C** — only failed **write** ops: `POST /receipts`, `POST /process`; `GET /receipts` poll is observation only |
| Budget limit | **5** failed writes per receipt |
| After exhaustion | Per-receipt **Tap to Retry** (no global auto-retry storm) |
| Tap to Retry | **Reset budget to 5** |
| List sync (C) | **D** — header refresh button + keep startup / `online` auto list fetch; **never** counts toward per-receipt budget |

## Architecture

```
StoredReceipt.writeBudgetRemaining (default 5, IndexedDB)

HomeScreen
  ├─ flushPendingUploads ──► uploadReceipt() ──► fail → budget--
  ├─ ProcessingReceiptWatcher ──► poll GET list (free)
  │                              └─ POST /process ──► fail → budget--
  ├─ syncStuckIds (pendingUpload | processing when budget === 0)
  └─ TaxHeader refresh ──► syncFromServer() (C, independent)

receiptSyncBudget.ts
  ├─ getBudget(receipt) → number
  ├─ recordWriteFailure(receipt) → new budget | syncStuck
  └─ resetBudget(receipt) → 5
```

---

## §1 Write budget model

### Field

```typescript
// lib/storage/receiptDb.ts — StoredReceipt
writeBudgetRemaining?: number;  // 0..5, default 5 when omitted
```

Persist in IndexedDB so refresh/restart preserves exhaustion state.

### Constants

```typescript
const MAX_WRITE_BUDGET = 5;
```

### Budget rules

| Event | Budget |
|-------|--------|
| New capture / new pending row | Set to 5 |
| `POST /receipts` fails (network, 4xx, 5xx) | −1 |
| `POST /process` fails (non-2xx, excluding 404 orphan) | −1 |
| `GET /api/receipts` (poll or manual list sync) | No change |
| Write succeeds (201 upload, 200 process) | No change |
| User Tap to Retry | Reset to 5 |
| `writeBudgetRemaining === 0` | Mark **syncStuck**; stop all write ops for that receipt |

**syncStuck** replaces analysis-only stuck semantics: applies to both `pendingUpload` and `processing`.

---

## §2 Upload path (A)

Current: `flushPendingUploads` retries every 60s while online, unlimited.

### New behavior

1. Before `uploadReceipt()`, require `writeBudgetRemaining > 0`
2. On failure → `recordWriteFailure()` → persist → if 0, add to `syncStuckIds`
3. When syncStuck + pendingUpload → **skip** 60s auto-retry (zero write idle)
4. Tap to Retry on upload-stuck card:
   - `resetBudget()` → 5
   - Remove from `syncStuckIds`
   - Immediately attempt one upload
   - On success → normal processing enqueue

---

## §3 Analysis path (B)

Current: `ProcessingReceiptWatcher` uses `stuckAfterAttempts = 20` poll ticks; triggers `/process` at tick 6.

### New behavior

1. **Remove** poll-count-based stuck as primary exit condition
2. Poll continues while receipt is `processing`, active in queue, and not paused (observation only, no budget cost)
3. Before calling `POST /process`, require `writeBudgetRemaining > 0`
4. On `/process` failure → `recordWriteFailure()`; do **not** throw to caller (fix `PROCESS_FAILED` unhandled rejection)
5. On `/process` 404 (orphan local row) → no budget deduction; unwatch receipt
6. When budget === 0 → `onReceiptStuck` → unwatch → stop poll for that id
7. Tap to Retry on analysis-stuck card:
   - `resetBudget()` → 5
   - `triggerReceiptProcess(id)` + `queue.enqueue(id)` + `watcher.tickOnce()`

**Queue:** syncStuck receipts are excluded from cold-start `bootstrapFromList` auto-enqueue (same as current stale processing rule). Only manual Retry re-enqueues.

---

## §4 List sync (C) + header refresh

### Automatic (unchanged)

- Phase 1 startup: one `GET /api/receipts`
- Phase 2 deferred: one `GET /api/receipts` after flush
- `online` event: flush + one list refresh

### Manual (new)

- **TaxHeader:** refresh icon adjacent to settings (≥ 44×44px touch target)
- Tap → `syncFromServer()` once
- Offline: disabled or no-op with brief feedback
- In-flight: spinner on icon; debounce rapid taps
- **Does not** decrement any receipt `writeBudgetRemaining`
- **Does not** auto-retry syncStuck receipts

---

## §5 UI states

Rename or extend `analysisStuckIds` → **`syncStuckIds`** (covers upload + analysis).

| State | Icon | Title | Subtitle | Tap action |
|-------|------|-------|----------|------------|
| processing, budget > 0 | ⏳ spin | Uploading... / Analyzing | Processing | Open detail |
| pendingUpload, budget > 0 | ☁️ | Uploading... | Processing | Open detail |
| pendingUpload, syncStuck | ⚠️ | Upload paused | Tap to retry | Retry upload |
| processing, syncStuck | ⚠️ | Analysis paused | Tap to retry | Retry analysis |

Detail sheet: align stuck copy + Retry button with list card semantics.

---

## §6 Error handling & edge cases

| Case | Behavior |
|------|----------|
| `PROCESS_FAILED` | Decrement budget; return `{ ok: false }` instead of throw |
| `/process` 404 | No budget change; unwatch |
| Offline | No writes; budget unchanged; header refresh disabled |
| Pause (camera, sheet, settings, hidden tab) | Poll stops; budget unchanged |
| Settings clear local data | Clear receipts + syncStuckIds + queue/watcher reset |
| All receipts syncStuck or settled | Watcher stopped; zero background requests |
| User Retry while paused | Allowed (bypass pause for one write + optional tickOnce) |

---

## §7 Implementation approach

**Recommended:方案 1 — `StoredReceipt.writeBudgetRemaining`**

- Single counter per receipt across upload + analysis lifecycle
- Persisted in IndexedDB
- Shared helper module `lib/client/receiptSyncBudget.ts`

Rejected alternatives:

- In-memory Map only — budget resets on refresh (inconsistent)
- Budget inside watcher only — cannot unify upload path

---

## §8 Files

| File | Action |
|------|--------|
| `lib/client/receiptSyncBudget.ts` | **New** — get/decrement/reset budget |
| `lib/storage/receiptDb.ts` | Optional `writeBudgetRemaining` on `StoredReceipt` |
| `lib/client/receiptApi.ts` | `triggerReceiptProcess` returns result; no unhandled throw |
| `lib/client/processingReceiptWatcher.ts` | Budget gate before `/process`; remove poll-count stuck |
| `components/home/HomeScreen.tsx` | Upload gate; `syncStuckIds`; header sync handler |
| `components/home/TaxHeader.tsx` | Refresh button + `onSyncClick`, syncing state |
| `components/home/ReceiptListCard.tsx` | Upload-stuck UI copy |
| `components/receipts/ReceiptDetailSheet.tsx` | Upload-stuck copy if applicable |
| `docs/tech/06-receipt-ai-pipeline.md` | §6.5 add write budget + header sync |

---

## §9 Testing

1. Five consecutive failed uploads → Upload paused; sixth POST not sent
2. Poll continues during analysis; five failed `/process` → Analysis paused; poll stops for that id
3. Tap to Retry → budget resets to 5; immediate retry attempt
4. Header refresh → list + tax update; per-receipt budget unchanged
5. No processing and no pending work → no interval timers / zero background GET storm
6. `npm run build` passes

## Success criteria

- Silent background writes bounded at 5 failures per receipt
- Users explicitly retry stuck receipts; no infinite retry loops
- List refresh available without consuming write budget
- No `PROCESS_FAILED` unhandled rejections in console
