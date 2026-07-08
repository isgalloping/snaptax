# Flash Done Fast Lane Implementation Plan

> **Status:** Implemented

**Goal:** Live 连拍底部双 CTA（⚡ FLASH DONE 快车道 + DONE & REVIEW 严审道）+ BATCH 气泡 batchPreview 轻量查看。

**Architecture:** 扩展 `CameraPhase` 为 `live | batchPreview | postReview | liveResnap`；`handleFlashDone` 复用 `finishSession`；footer 四控件横排；batchPreview 复用 viewport + gallery，无 review controls。

**Tech Stack:** Next.js React, existing SnapButton / CameraOverlay / batchReviewQueue.

**Spec:** [`2026-06-10-flash-done-fast-lane-design.md`](../specs/2026-06-10-flash-done-fast-lane-design.md)

---

### Task 1: Visual tokens + FlashDoneButton

**Files:**
- Modify: `lib/ui/homeVisual.ts`
- Create: `components/camera/FlashDoneButton.tsx`
- Create: `components/camera/ReviewDoneButton.tsx`

- [ ] **Step 1: Add tokens**

```typescript
// homeVisual.snapCamera
flashDone:
  "border-2 border-yellow-500/80 shadow-[0_0_16px_rgba(234,179,8,0.45)] bg-zinc-900/90",
reviewDone:
  "border border-green-500/50 shadow-[0_0_16px_rgba(34,197,94,0.35)] bg-zinc-900/90",
```

- [ ] **Step 2: FlashDoneButton** — `h-14 w-14` min, ⚡ icon + "Flash Done" caption, `aria-label="Flash done"`

- [ ] **Step 3: ReviewDoneButton** — ✓ + "Done & Review", `aria-label="Done and review"`

---

### Task 2: CameraPhase batchPreview

**Files:**
- Modify: `components/camera/CameraOverlay.tsx`

- [ ] **Step 1: Extend type**

```typescript
export type CameraPhase = "live" | "batchPreview" | "postReview" | "liveResnap";
```

- [ ] **Step 2: Flags**

```typescript
const isBatchPreview = mode === "batch" && phase === "batchPreview";
const hideVideo = isPostReview || isBatchPreview;
```

- [ ] **Step 3: batchPreview footer** — `ReceiptReviewViewport` + `BatchGalleryStrip` only; no `ReceiptReviewControls`

- [ ] **Step 4: BACK handler**

```typescript
if (isBatchPreview) {
  onBatchPreviewBack?.();
  return;
}
```

- [ ] **Step 5: Live footer 四控件**

Replace single Done with:

```tsx
<div className="flex items-end justify-between gap-2 px-4 pb-3 pt-2">
  <BatchCountBadge ... onPress={onBatchPreviewEnter} latestId={latestThumb?.id} />
  <Shutter />
  <FlashDoneButton onClick={onFlashDone} disabled={batchCount === 0} />
  <ReviewDoneButton onClick={onFinishCapture} disabled={batchCount === 0} />
</div>
```

Add props: `onFlashDone`, `onBatchPreviewEnter`, `onBatchPreviewBack`

- [ ] **Step 6: Shrink gap / `px-4`** if 4 controls overflow on 375px — use `gap-1.5`, `text-[9px]` captions

---

### Task 3: SnapButton wiring

**Files:**
- Modify: `components/home/SnapButton.tsx`

- [ ] **Step 1: handleFlashDone**

```typescript
const handleFlashDone = async () => {
  if (sessionIdsRef.current.length === 0) return;
  await finishSession();
};
```

- [ ] **Step 2: handleBatchPreviewEnter**

```typescript
const handleBatchPreviewEnter = (id: string) => {
  setPhase("batchPreview");
  setReviewId(id);
  setSelectedId(id);
};
```

- [ ] **Step 3: handleBatchPreviewBack**

```typescript
const handleBatchPreviewBack = () => {
  setPhase("live");
  setReviewId(undefined);
};
```

- [ ] **Step 4: Wire CameraOverlay props**

```typescript
onFlashDone={() => void handleFlashDone()}
onBatchPreviewEnter={handleBatchPreviewEnter}
onBatchPreviewBack={handleBatchPreviewBack}
onSelectThumb={
  phase === "batchPreview"
    ? (id) => { setReviewId(id); setSelectedId(id); }
    : ...
}
```

- [ ] **Step 5: BatchCountBadge** — pass `latestId={sessionThumbs.at(-1)?.id}` and `onPress` only when count > 0

---

### Task 4: Docs + build

**Files:**
- Modify: `docs/product/PRODUCT-SPEC.md` §3.1
- Modify: `docs/superpowers/topics/capture-pipeline-design.md` — note Live Done split

- [ ] **Step 1: PRODUCT-SPEC** — Flash / Review / Preview 三路径

- [ ] **Step 2: Build**

```bash
npx next build
```

Expected: exit 0

- [ ] **Step 3: Manual AC-1–AC-5**

---

## Plan self-review

| Spec | Task |
|------|------|
| FLASH → finishSession | 3.1 |
| DONE & REVIEW → postReview | existing handleFinishCapture |
| batchPreview | 2, 3 |
| Four-control footer | 2.5 |
| AC-5 disabled n=0 | 2.5 |

No placeholders.

## Estimated effort

~3h implement + 30m device QA
