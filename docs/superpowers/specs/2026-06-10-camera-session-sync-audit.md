# Camera Session — Sync & Fetch Behavior Audit

**Date:** 2026-06-10  
**Status:** Approved (audit — no code changes)  
**Type:** Business-logic compliance review  
**Scope:** Whether sync/fetch behavior during photo capture matches product expectations

## References

| Doc | Relevance |
|-----|-----------|
| `docs/product/PRODUCT-SPEC.md` | 拍照即走、离线可拍、核心零 Modal |
| `docs/prd/0.0.1.md` | 不得打断核心拍照、弱网 ≤1.5s 可拍 |
| `docs/superpowers/specs/2026-06-07-fast-startup-local-first-design.md` | Phase 2 defer merge when camera open |
| `docs/superpowers/specs/2026-06-07-background-polling-policy-design.md` | Watcher pause signals |
| `docs/superpowers/specs/2026-06-08-batch-snap-camera-design.md` | Batch persist / Done flush / camera ↻ sync |
| `docs/superpowers/specs/2026-06-09-post-batch-review-flow-design.md` | postReview phases while camera stays open |

## Executive summary

**Verdict: implementation matches product expectations.**

Product intent is **“don’t interrupt capture”** (UI stability + no polling contention), not **“zero network while camera is open.”** Approved tech specs allow background `fetchReceiptList` during Phase 2 with **deferred UI merge**. Current code follows that model.

No P0 business-logic defects were found. Two **documentation inconsistencies** between older specs are noted; runtime behavior follows the stricter / newer polling-policy spec.

---

## Product expectations (business layer)

Derived from PRD + PRODUCT-SPEC + approved designs:

| ID | Expectation | Rationale |
|----|-------------|-----------|
| **E1** | Camera open must not block shutter or show blocking sync UI | 核心拍照零 Modal；拍照放弃率目标 |
| **E2** | List behind overlay must not **jump** from silent background sync while camera is open | fast-startup test #5 |
| **E3** | Batch: each shot → IndexedDB only; upload/analysis queue only after **Done** (or post-review complete) | batch-snap design |
| **E4** | Batch **BACK**: keep IDB rows; close camera; refresh list on close; no forced upload flush | batch-snap decision A |
| **E5** | Single / Resnap: close camera first, then upload immediately when online | resnap = single-shot path |
| **E6** | User-initiated sync (↻) in camera overlay is allowed | batch-snap UX table |
| **E7** | Background AI polling pauses while user is “busy” (camera, detail, settings, app hidden) | polling-policy |
| **E8** | Offline: snap works; no OpenAI; rows stay `pendingUpload` until online flush | PRODUCT-SPEC §2.2 |

**Explicit non-goals** (not product requirements):

- Zero HTTP requests while `cameraOpen === true`
- Deferring user-initiated manual sync during camera
- Deferring single-shot upload until some global “session end”

---

## Implementation map

| Mechanism | File(s) | Behavior |
|-----------|---------|----------|
| `cameraOpen` signal | `SnapButton` → `onCameraOpenChange` → `HomeScreen` state | `true` from `openCamera` until batch close/Done/single close |
| UI merge defer | `HomeScreen.applyMergeOrDefer` + `pendingMergeRef` | Server merge with `applyMode: "defer"` queues state until camera closes |
| Pending flush | `useEffect` on `cameraOpen` | Applies queued merge when camera closes |
| Watcher pause | `HomeScreen` → `ProcessingReceiptWatcher.setPaused` | Stops interval + skips ticks (except `tickOnce` retry bypass) |
| Batch local persist | `handleBatchShot` | `savePhoto` + `saveReceipt`; no `setReceipts`, no upload |
| Batch flush | `handleBatchDone` | `refreshListFromLocal` → `flushPendingUploads` → `bootstrapFromList` |
| Batch BACK | `SnapButton.handleClose` → `handleBatchClose` | `setCamera(false)` then `refreshListFromLocal` |
| Single upload | `handleCapture` after overlay `onClose` | `ensureGhostSession` + `uploadReceipt` when online |
| Manual sync | `handleManualListSync` | `syncFromServer(..., "immediate")` — never deferred |
| Phase 2 startup | `runDeferredStartup` | Ghost + flush + `syncFromServer(..., "defer")`; **does not** gate fetch on `cameraOpen` |

---

## Scenario matrix

| Scenario | Expected (business) | Actual | Verdict |
|----------|---------------------|--------|---------|
| Batch: shoot 3 while online | Stream stays live; 3 IDB rows; home list unchanged behind overlay | `handleBatchShot` writes IDB only | ✅ |
| Batch: Done after 3 shots | Camera closes; list shows 3 processing cards; uploads flush | `handleBatchDone` refresh + flush + queue bootstrap | ✅ |
| Batch: BACK with 2 shots | 2 rows kept in IDB; camera closes; list refresh includes them; pending until flush | `handleBatchClose` → `refreshListFromLocal` | ✅ |
| Batch: postReview / liveResnap phases | Same pause/defer as live batch (camera still open) | `cameraOpen` stays true through phases | ✅ |
| Open camera during Phase 2 sync | No visible list jump until camera closes | `applyMergeOrDefer` queues merge | ✅ |
| Background poll while camera open | No repeating `GET /api/receipts` from watcher | `setPaused(true)` stops interval | ✅ |
| ↻ sync tap in camera overlay | User-initiated refresh allowed | `handleManualListSync` immediate | ✅ (by design) |
| Single Snap (online) | Camera closes; then upload | `onClose` → `setCamera(false)` → `handleCapture` network | ✅ |
| Resnap from list | Single mode; same as single | `handleCapture` with `replaceId` | ✅ |
| Detail sheet open | No background poll | `selectedReceipt != null` → pause | ✅ |
| Settings open | No background poll | `view === 'settings'` → pause | ✅ |
| App backgrounded | No background poll | `document.hidden` → pause | ✅ |
| Offline batch + Done | Local list refresh; no upload | flush skipped when offline; pending rows remain | ✅ |
| Retry sync on stuck row | One-shot poll even if paused | `watcher.tickOnce({ bypassPause: true })` | ✅ |

---

## Gray areas (spec-allowed; not business bugs)

| Item | Behavior | Why gray |
|------|----------|----------|
| **G1** Phase 2 fetch during camera | `fetchReceiptList` still runs; only UI merge deferred | Matches fast-startup + polling-policy Phase 2 wording; contradicts literal “no fetch while shooting” |
| **G2** In-flight HTTP before pause | Request started before `cameraOpen` may complete after open; defer path queues merge | Rare race; UI still stable if `defer` mode |
| **G3** `onTaxSaved` from in-flight watcher tick | Could update header estimate while overlay visible | Overlay covers header; user rarely sees; not a capture blocker |
| **G4** Single upload after close | Network runs with `cameraOpen === false` | Correct for E5; watcher may resume polling — intended |

---

## Spec cross-doc inconsistencies

| Topic | Doc A | Doc B | Runtime |
|-------|-------|-------|---------|
| Merge defer scope | fast-startup: **camera only** | polling-policy: camera + detail + settings + hidden | Follows **polling-policy** (stricter pause) |
| Phase 2 fetch during camera | fast-startup: fetch OK, merge defer | polling-policy: “One fetch; merge defer if camera open” | **Aligned** with both |

**Recommendation:** Treat `background-polling-policy-design.md` as canonical for pause signals; add one line to `fast-startup-local-first-design.md` cross-ref (optional doc cleanup, out of scope for this audit).

---

## Code ↔ batch design drift (non-functional)

| batch-snap design | Current code | Impact |
|-------------------|--------------|--------|
| Done → `top100ByUpdatedAt([...])` | `loadTopByUpdatedAt(100)` + indexed tax sum | Semantically equivalent after IndexedDB v2 work |

---

## Manual acceptance checklist

Use when validating regressions (no automation required for this audit):

1. **Batch no-jump:** Cold start → open camera before Phase 2 finishes → shoot 2 → confirm shutter never blocked; close Done → list shows 2 new rows.
2. **Defer merge:** With slow network, open camera during background sync → list count stable until camera closes → then updates.
3. **Poll silence:** DevTools Network → open camera with no manual sync → no watcher interval `GET /api/receipts` every 3s.
4. **Manual sync in camera:** Tap ↻ in overlay → list state may update behind overlay (OK); no modal.
5. **BACK partial batch:** Shoot 2 → BACK → home list includes 2 local processing rows without Done flush.
6. **Single path:** One snap → camera closes → upload request fires (online).

---

## Out of scope (this audit)

- Tightening to “zero network while camera open” (would need new design + plan)
- Playwright automation (option B from brainstorm)
- Est. Tax Saved formula (see `snap1099-tax.mdc` / IndexedDB spec)
- Camera UI layout / post-review UX

---

## Decision log

| Date | Decision |
|------|----------|
| 2026-06-10 | User chose audit-only (option A); no code changes required for business compliance |
| 2026-06-10 | Verdict: **PASS** — behavior matches product + approved tech specs |
