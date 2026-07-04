# Batch Snap Camera — Design

**Date:** 2026-06-08  
**Status:** Approved  
**References:** `docs/ui/snap.ui.png`, `docs/prd/snap.detail.md`

## Problem

Today: one shutter → camera closes → single receipt saved/uploaded → home. Workers with multiple receipts must repeat open/close N times.

Goal: **continuous capture session** — stay in camera, shoot N receipts, tap **Done** → close camera → flush batch to home + upload queue.

## Out of scope

- Resnap flow (stays **single-shot**, closes after one capture)
- Gallery multi-select delete/reorder (MVP: view + count only)
- Native `<input multiple>` batch pick (fallback remains one file per pick)

---

## Decisions (proposed)

| Topic | Choice |
|-------|--------|
| Session model | **Batch session** in `CameraOverlay`; HomeScreen owns flush |
| Persist timing | **Each shot** → compress (1280/q75) → **OPFS** + IDB meta + receipt row immediately（见 [`12-local-image-storage-design.md`](../../tech/12-local-image-storage-design.md)） |
| Upload timing | **On Done** → sequential flush (online); offline stays pending |
| Shutter cooldown | **1s** re-enable after capture (PRD) |
| BACK with partial batch | **A** — keep saved shots, close camera only |
| Resnap | **Single-shot** — bypass batch UI, close after capture |
| Top-right in camera | Reload + Settings icons (align home TaxHeader actions) |

---

## UX (from mockup + PRD)

```
┌─────────────────────────────────────┐
│  [BACK]              [↻] [⚙]      │  ← optional BACK left; sync+settings right
│                                     │
│         live viewfinder             │
│                                     │
│  [2]      ( ◉ shutter )      [✓]   │
│  badge    green ring          Done  │
│                                     │
│  ┌───┬───┬───┬───┐ gallery strip   │
│  └───┴───┴───┴───┘ selected=white  │
│  Terms & Privacy …                  │
└─────────────────────────────────────┘
```

| Control | Behavior |
|---------|----------|
| **Count badge (左下)** | Green glow; shows batch count + latest thumb overlay |
| **Shutter (中)** | Mechanical ring style; capture without stopping stream |
| **Done (右下)** | Close camera → `onBatchDone(sessionIds)` → flush uploads |
| **Gallery strip** | Thumbnails this session; tap to select (white border) |
| **BACK** | Close camera; **keep** shots already in IndexedDB (decision A) |
| **↻ / ⚙** | Same handlers as home sync + settings (open settings closes camera first) |

---

## Architecture

```
SnapButton
  mode: batch | resnap-single
  └─ CameraOverlay (batch UI)
       onShot(file) → HomeScreen.handleBatchShot
       onDone()     → HomeScreen.handleBatchDone → flush + close
       onClose()    → close only (keep IDB)

HomeScreen.handleBatchShot
  1. UUID + savePhoto + saveReceipt (pendingUpload, processing)
  2. Append to batchSessionIds ref (this open only)
  3. Do NOT upload until Done

HomeScreen.handleBatchDone
  1. setCameraOpen(false)
  2. Merge batch into receipts state (top100)
  3. flushPendingUploads (batch ids first) + enqueue processing
  4. apply pendingMerge if any
```

**Resnap path unchanged:** `handleCapture(file)` single file, close camera immediately.

---

## §1 CameraOverlay changes

### Capture loop (critical fix)

Current bug for batch: `handleShutter` calls `stopStream()` then `onCapture` → closes overlay.

New:

```typescript
// pseudo
async function handleShutter() {
  const file = await captureVideoFrame(video);
  await onShot(file);           // parent persists
  setBatchCount(n => n + 1);
  setCapturing(true);
  setTimeout(() => setCapturing(false), 1000);
  // stream stays live — do NOT stopStream
}
```

### Props (new shape)

```typescript
type CameraOverlayMode = "batch" | "single";

interface CameraOverlayProps {
  mode: CameraOverlayMode;
  initialStreamPromise: Promise<MediaStream>;
  onShot: (file: File) => void | Promise<void>;
  onDone?: () => void;              // batch only
  onClose: () => void;
  onFallback: () => void;
  onSyncClick?: () => void;
  onSettingsClick?: () => void;
  sessionThumbs: { id: string; url: string }[];
  selectedId?: string;
  onSelectThumb?: (id: string) => void;
}
```

`mode: "single"` → hide badge/Done/gallery; Done = implicit on first shot (resnap).

### Visual tokens

Add to `lib/ui/homeVisual.ts`:

```typescript
snapCamera: {
  shutterRing: "ring-2 ring-green-500/80",
  badgeGlow: "shadow-[0_0_16px_rgba(34,197,94,0.5)]",
  gallerySelected: "ring-2 ring-white",
}
```

---

## §2 HomeScreen / SnapButton

### SnapButton

- `onCapture` split → `onBatchShot` + `onBatchDone` OR keep `onCapture` for resnap + new batch callbacks
- Pass `resnapId != null` → `mode="single"` to overlay
- Do not call `setCamera(false)` on shot in batch mode

### handleBatchShot(file)

- Same local row creation as today’s `handleCapture` **without** upload block
- Track `batchSessionIdsRef.current.push(id)`
- Revoke blob URLs on session end

### handleBatchDone()

- Close camera via SnapButton callback
- `setReceipts(top100ByUpdatedAt([...new locals, ...prev]))`
- `await flushPendingUploads()` for pending in batch
- `queue.bootstrapFromList` for processing ids

### cameraOpen / merge defer

- Unchanged: while camera open, server merge deferred
- On Done close → existing `pendingMergeRef` flush effect runs

---

## §3 Data & offline

| Event | IndexedDB | UI (behind overlay) | Upload |
|-------|-----------|---------------------|--------|
| Each shot | photo + receipt | optional silent | no |
| Done | unchanged | list refresh visible | flush all batch pending |
| BACK (partial) | kept | refresh on close | pending until manual/online flush |
| Offline batch | all pendingUpload | same | flush when online (60s + Done already ran) |

Crash mid-batch: shots already in IDB appear on next app load (no data loss).

---

## §4 Fallback (no getUserMedia)

- Hidden `<input capture>`: remain **single-shot**; close after pick
- Optional later: `multiple` attribute — out of scope

---

## §5 Files

| File | Action |
|------|--------|
| `components/camera/CameraOverlay.tsx` | Batch UI + stream-persistent capture |
| `components/camera/BatchCountBadge.tsx` | **新建** |
| `components/camera/BatchGalleryStrip.tsx` | **新建** |
| `components/home/SnapButton.tsx` | batch vs single mode wiring |
| `components/home/HomeScreen.tsx` | `handleBatchShot` / `handleBatchDone` |
| `lib/ui/homeVisual.ts` | `snapCamera` tokens |
| `lib/camera/batchSession.ts` | **新建** — types + thumb URL helpers |
| `docs/prd/snap.detail.md` | already source; link from spec |
| `docs/product/PRODUCT-SPEC.md` | § Snap 连拍更新 |

**不改:** API routes, sync budget rules, ProcessingQueue semantics (enqueue after flush).

---

## §6 Acceptance

1. Normal Snap: shoot 3 receipts without leaving camera; badge shows 3; gallery has 3 thumbs
2. Done → camera closes; home list shows 3 new Processing/Uploading cards
3. Shutter disabled ≤1s between shots
4. Resnap: still one shot → close → replace receipt
5. BACK after 2 shots: 2 receipts remain in list
6. Offline batch + Done: 3 pending local cards; upload when online
7. UI matches `snap.ui.png` layout (badge / shutter / Done / strip)
8. `npm run build` passes

---

## §7 BACK behavior (confirmed)

**A — Keep shots:** BACK closes camera; all shots already written to IndexedDB remain; home list refreshes to include them (no upload flush unless user taps Done — pending stay pendingUpload until online flush / manual sync).
