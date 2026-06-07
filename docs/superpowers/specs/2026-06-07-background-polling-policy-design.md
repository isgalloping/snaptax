# Background Polling Policy — Design

**Date:** 2026-06-07  
**Status:** Approved (design)  
**Scope:** Defer server polling until after app startup; single-thread processing queue; pause during user interaction and when idle.

## Problem

After pipeline resilience work, the app still polls too aggressively:

- `ProcessingReceiptWatcher.watch()` triggers an immediate `tick()` on startup
- Multiple `syncFromServer` + `flushPendingUploads` during boot compete with UI
- Polling continues while camera, detail sheet, or settings are open
- Timer runs even when no receipts are `processing`

Users report slow startup and repeating `GET /api/receipts` logs.

## Decisions

| Topic | Choice |
|-------|--------|
| Pause conditions | **C** — camera / detail sheet / settings / app hidden; zero poll when no processing |
| Startup | No poll until UI hydrated + deferred Phase 2 |
| Multi-processing | Single-thread FIFO queue (one active watch at a time) |
| Approach | **方案 1** — extend watcher + queue + HomeScreen gates |

## Architecture

```
HomeScreen
  ├─ Phase 1: IndexedDB + ghost session + ONE list fetch → hydrated
  ├─ Phase 2 (deferred): flush pending uploads + ONE list refresh
  └─ Phase 3: ProcessingQueue → ProcessingReceiptWatcher (single active id)

ProcessingReceiptWatcher
  ├─ pause/resume (aggregated signals from HomeScreen)
  ├─ stop timer when ids.size === 0
  └─ no immediate tick on watch(); delayed first tick after resume

ProcessingQueue
  ├─ FIFO pending ids
  ├─ active: string | null (max 1)
  └─ on settled → 500ms gap → next
```

---

## §1 Startup phases

### Phase 1 — blocking (local only)

1. `ensureTaxRegionCandidate()`
2. `loadReceipts()` from IndexedDB → render local list + local tax
3. `receiptsLocalReady && auth.hydrated` → home UI (Snap enabled)

**Forbidden in Phase 1:** `ensureGhostSession`, `fetchReceiptList`, watcher poll, `flushPendingUploads`.

### Phase 2 — deferred (after paint, background)

Schedule via `requestAnimationFrame` × 2 after UI visible:

1. `ensureGhostSession()`
2. `flushPendingUploads()` — serial, no polling
3. **One** `fetchReceiptList()` — merge into state (defer if camera open)
4. `processingQueue.bootstrapFromList(merged)`

### Phase 3 — background (conditional)

Start queue + watcher only when:

- `processingQueue.hasWork()`
- `!watcher.isPaused()`
- `document.visibilityState === 'visible'`

---

## §2 ProcessingQueue (new)

File: `lib/client/processingQueue.ts`

```typescript
class ProcessingQueue {
  enqueue(id: string): void       // dedupe
  onSettled(id: string): void     // clear active, schedule next after 500ms
  bootstrapFromList(receipts): { autoId, staleIds }
  get active(): string | null
  hasWork(): boolean
}
```

**Cold start bootstrap:**

- `newestProcessingId(list)` → sole auto-enqueue candidate
- All other `processing` ids → add to `analysisStuckIds` (no auto watch)
- User **Retry** → `enqueue(id)` + user-trigger bypass (see §4)

**Serial rule:** Watcher watches only `queue.active`. When receipt settles (`done`/`blurry`/stuck), `onSettled` → next after 500ms gap.

---

## §3 ProcessingReceiptWatcher changes

File: `lib/client/processingReceiptWatcher.ts`

| Change | Detail |
|--------|--------|
| `setPaused(paused: boolean)` | When true: clear interval, skip ticks |
| No immediate tick | Remove `void this.tick()` from `start()`; first tick on interval after resume |
| Stop when empty | `ids.size === 0` → clear timer (zero background requests) |
| Poll interval | 3000ms default (was 2500ms) |
| Single active id | `watch(id)` replaces set semantics — only one id watched at a time; `unwatch` on settle |

**Paused = no network.** On resume, schedule one tick after 1000ms debounce (avoid burst after closing sheet).

---

## §4 Pause signals (HomeScreen)

Aggregate into `watcher.setPaused(shouldPause)`:

| Signal | Source |
|--------|--------|
| `cameraOpen` | `SnapButton` → `onCameraOpenChange(boolean)` |
| `detailOpen` | `selectedReceipt != null` |
| `settingsOpen` | `view === 'settings'` |
| `appHidden` | `document.visibilityState === 'hidden'` |

```typescript
const shouldPause =
  cameraOpen || selectedReceipt != null || view === 'settings' || document.hidden;
```

**User-initiated retry** bypasses pause for one shot:

1. `triggerReceiptProcess(id)`
2. `queue.enqueue(id)` + force single tick if paused (optional `watcher.tickOnce()`)

---

## §5 Network reduction during user actions

| Action | Before | After |
|--------|--------|-------|
| Upload complete | extra `fetchReceiptList` | use upload response only |
| Snap new receipt | immediate watch + tick | enqueue after upload; respect pause |
| Phase 2 refresh | N/A | exactly one list fetch |
| Idle polling | every 2.5s always | every 3s only when active id exists and not paused |

---

## §6 Files

| File | Action |
|------|--------|
| `lib/client/processingQueue.ts` | **New** |
| `lib/client/processingReceiptWatcher.ts` | pause/resume, single-id, delayed tick |
| `components/home/HomeScreen.tsx` | 3-phase boot, pause effect, queue integration |
| `components/home/SnapButton.tsx` | `onCameraOpenChange` callback |
| `docs/tech/06-receipt-ai-pipeline.md` | §6.5 polling policy |

**Remove / simplify:** direct `resumeWatching` immediate watch loop; redundant list fetches in `uploadPending`.

---

## §7 Edge cases

| Case | Behavior |
|------|----------|
| Offline boot | Phase 1 local only; Phase 2 skipped until `online` |
| Online event | run Phase 2 equivalent (flush + one refresh + queue bootstrap) |
| All processing stuck | watcher stopped; zero poll |
| User opens camera while analyzing | pause; resume continues same active id |
| Settings clear data | dispose queue + watcher state |

---

## §8 Testing

1. Cold start: no repeating list poll before UI visible
2. After UI: at most 2 list fetches in first 5s (Phase 1 + Phase 2)
3. 5 processing receipts: 1 analyzing, 4 paused; serial not parallel logs
4. Open camera: poll stops; close: resumes after debounce
5. Background tab: poll stops
6. No processing: no interval timer running
7. `npm run build` passes

## Success criteria

- Startup feels instant; network work deferred off critical path
- User interactions never compete with 2.5s poll storm
- Processing receipts still eventually settle via serial queue + manual retry
