# Post-Batch Review Flow Implementation Plan

> **Status:** Implemented

**Goal:** 连拍不打断 → Live Done 进 postReview → DELETE/RESNAP/Accept 审完 → flush + 回主页。

**Architecture:** 重构 `SnapButton` 三 phase（`live | postReview | liveResnap`）；`batchReviewQueue.ts` 管未审队列；复用 `ReceiptReviewViewport` / `ReceiptReviewControls`；Live Done 不再 flush。

**Tech Stack:** Next.js React client components, IndexedDB (`receiptDb`), existing `CameraOverlay` batch UI.

**Spec:** [`2026-06-09-post-batch-review-flow-design.md`](../specs/2026-06-09-post-batch-review-flow-design.md)

---

## File map

| File | Responsibility |
|------|----------------|
| `lib/camera/batchReviewQueue.ts` | Pure helpers: unreviewed, next, complete |
| `components/home/SnapButton.tsx` | Session state + phase transitions + flush on complete |
| `components/camera/CameraOverlay.tsx` | Render live / postReview / liveResnap footers |
| `components/camera/BatchGalleryStrip.tsx` | accepted / current / pending visuals |
| `lib/camera/reviewEnterMode.ts` | Remove (no longer used) |

---

### Task 1: batchReviewQueue helpers

**Files:**
- Create: `lib/camera/batchReviewQueue.ts`

- [ ] **Step 1: Create queue module**

```typescript
export function unreviewedIds(
  sessionIds: readonly string[],
  acceptedIds: ReadonlySet<string>,
): string[] {
  return sessionIds.filter((id) => !acceptedIds.has(id));
}

export function nextUnreviewedId(
  sessionIds: readonly string[],
  acceptedIds: ReadonlySet<string>,
  afterId?: string,
): string | undefined {
  const pending = unreviewedIds(sessionIds, acceptedIds);
  if (pending.length === 0) return undefined;
  if (!afterId) return pending[0];
  const afterIndex = sessionIds.indexOf(afterId);
  if (afterIndex === -1) return pending[0];
  for (let i = afterIndex + 1; i < sessionIds.length; i++) {
    const id = sessionIds[i];
    if (!acceptedIds.has(id)) return id;
  }
  for (const id of sessionIds) {
    if (!acceptedIds.has(id)) return id;
  }
  return undefined;
}

export function isReviewComplete(
  sessionIds: readonly string[],
  acceptedIds: ReadonlySet<string>,
): boolean {
  return unreviewedIds(sessionIds, acceptedIds).length === 0;
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit --pretty false 2>&1 | head -20`  
Expected: no errors in new file

---

### Task 2: SnapButton phase state machine

**Files:**
- Modify: `components/home/SnapButton.tsx`
- Delete: `lib/camera/reviewEnterMode.ts`

- [ ] **Step 1: Replace phase type and state**

```typescript
import {
  isReviewComplete,
  nextUnreviewedId,
  unreviewedIds,
} from "@/lib/camera/batchReviewQueue";

export type BatchPhase = "live" | "postReview" | "liveResnap";

// state:
const [phase, setPhase] = useState<BatchPhase>("live");
const [acceptedIds, setAcceptedIds] = useState<Set<string>>(() => new Set());
const [reviewId, setReviewId] = useState<string | undefined>();
const resnapSlotIndexRef = useRef<number | null>(null);
```

Remove `REVIEW_ENTER_MODE` import and `enterReview` on batch shot.

- [ ] **Step 2: handleBatchShot — stay live (or liveResnap → postReview)**

```typescript
const handleBatchShot = async (file: File) => {
  const id = await onBatchShot(file);
  const slot = resnapSlotIndexRef.current;

  if (slot !== null) {
    sessionIdsRef.current = [
      ...sessionIdsRef.current.slice(0, slot),
      id,
      ...sessionIdsRef.current.slice(slot),
    ];
    resnapSlotIndexRef.current = null;
    setSessionThumbs((prev) => {
      const thumb = createBatchThumb(id, file);
      return [...prev.slice(0, slot), thumb, ...prev.slice(slot)];
    });
    setPhase("postReview");
    setReviewId(id);
    setSelectedId(id);
    return;
  }

  sessionIdsRef.current = [...sessionIdsRef.current, id];
  const thumb = createBatchThumb(id, file);
  setSessionThumbs((prev) => [...prev, thumb]);
  setSelectedId(id);
};
```

- [ ] **Step 3: handleFinishCapture (Live Done) → postReview**

Replace `handleDone` flush-on-done with:

```typescript
const handleFinishCapture = () => {
  const first = unreviewedIds(sessionIdsRef.current, acceptedIds)[0];
  if (!first) return;
  setPhase("postReview");
  setReviewId(first);
  setSelectedId(first);
};
```

- [ ] **Step 4: handleReviewAccept**

```typescript
const finishSession = async () => {
  const ids = [...sessionIdsRef.current];
  resetSession();
  streamPromiseRef.current = null;
  setCamera(false);
  await onBatchDone(ids);
};

const handleReviewAccept = async () => {
  if (!reviewId) return;
  const nextAccepted = new Set(acceptedIds).add(reviewId);
  setAcceptedIds(nextAccepted);
  if (isReviewComplete(sessionIdsRef.current, nextAccepted)) {
    await finishSession();
    return;
  }
  const nextId = nextUnreviewedId(sessionIdsRef.current, nextAccepted, reviewId);
  setReviewId(nextId);
  setSelectedId(nextId);
};
```

- [ ] **Step 5: handleReviewDelete — advance or finish**

After `removeFromSession` + `onReviewDelete`, recompute pending; if empty `finishSession()`, else set `reviewId` to first pending.

- [ ] **Step 6: handleReviewResnap**

```typescript
const handleReviewResnap = async (id: string) => {
  const slot = sessionIdsRef.current.indexOf(id);
  await onReviewDelete(id);
  removeFromSession(id);
  setAcceptedIds((prev) => {
    const next = new Set(prev);
    next.delete(id);
    return next;
  });
  resnapSlotIndexRef.current = slot >= 0 ? slot : sessionIdsRef.current.length;
  setPhase("liveResnap");
  setReviewId(undefined);
};
```

- [ ] **Step 7: handlePostReviewBack → live**

```typescript
const handlePostReviewBack = () => {
  setPhase("live");
  setReviewId(undefined);
};
```

- [ ] **Step 8: resetSession clears acceptedIds + resnapSlot**

- [ ] **Step 9: Delete `lib/camera/reviewEnterMode.ts`**

---

### Task 3: CameraOverlay phase wiring

**Files:**
- Modify: `components/camera/CameraOverlay.tsx`

- [ ] **Step 1: Update `CameraPhase`**

```typescript
export type CameraPhase = "live" | "postReview" | "liveResnap";
```

- [ ] **Step 2: Derive UI flags**

```typescript
const isPostReview = mode === "batch" && phase === "postReview";
const isLiveResnap = mode === "batch" && phase === "liveResnap";
const isLiveBatch = mode === "batch" && phase === "live";
const hideVideo = isPostReview;
```

- [ ] **Step 3: Live Done calls `onFinishCapture` (new prop), not `onDone`**

Add prop `onFinishCapture?: () => void` — wired from SnapButton `handleFinishCapture`.  
Keep `onDone` unused in batch live (flush moved to SnapButton on queue complete).

- [ ] **Step 4: BACK handler**

```typescript
const handleBack = () => {
  if (isPostReview) {
    onPostReviewBack?.();
    return;
  }
  handleClose();
};
```

Remove `onReviewAccept` on BACK.

- [ ] **Step 5: liveResnap footer**

Same as live but **hide** Live Done button; only Shutter + Badge + gallery preview.

- [ ] **Step 6: postReview footer**

Keep `ReceiptReviewControls` + gallery; pass `acceptedIds` to strip.

- [ ] **Step 7: Remove `onEnterReview` from Badge in live** (optional preview only via gallery select)

---

### Task 4: BatchGalleryStrip accepted state

**Files:**
- Modify: `components/camera/BatchGalleryStrip.tsx`

- [ ] **Step 1: Add props**

```typescript
acceptedIds?: ReadonlySet<string>;
reviewMode?: boolean;
```

- [ ] **Step 2: Visual classes**

```typescript
const accepted = acceptedIds?.has(thumb.id);
const selected = thumb.id === selectedId;
// className: selected → white ring; accepted → opacity-60 + green ring-1; else normal
```

- [ ] **Step 3: onSelect in postReview**

Parent passes handler: if unreviewed → jump; if accepted → treat as view-only (optional: call onAcceptNext).

---

### Task 5: Docs + build

**Files:**
- Modify: `docs/product/PRODUCT-SPEC.md` §3.1

- [ ] **Step 1: Update §3.1** — Live Done → postReview; flush on queue complete

- [ ] **Step 2: Build**

Run: `npx next build`  
Expected: exit 0

- [ ] **Step 3: Manual checklist** — spec acceptance §1–10

---

## Plan self-review

| Spec requirement | Task |
|------------------|------|
| Live no per-shot review | Task 2 Step 2 |
| Live Done → postReview | Task 2 Step 3, Task 3 |
| Flush on complete | Task 2 Step 4 `finishSession` |
| Hybrid navigation | Task 2 Step 4–5, Task 4 |
| postReview BACK → live | Task 2 Step 7, Task 3 Step 4 |
| RESNAP slot insert | Task 2 Step 6 |
| Gallery states | Task 4 |
| Remove reviewEnterMode | Task 2 Step 9 |

No placeholders remain.

---

## Estimated effort

~4h implement + 1h device QA
