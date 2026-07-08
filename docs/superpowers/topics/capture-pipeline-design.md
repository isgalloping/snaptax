# Capture Pipeline — Topic Design

**Topic ID:** `capture-pipeline`  
**Status:** Consolidated · implemented  
**Last verified:** 2026-07-08

---

## 1. Summary

连拍与小票入库的 **端到端客户端管线**：快门 → 本地 OPFS/IDB → **立即出现在主屏列表** → 后台 Tesseract OCR → 上传 → 服务端 Path A/B AI → `done`。

**三阶段演进（归档来源）：**

1. **Per-shot Review（已废弃）** — 每张快门后自动进 Review，打断连拍。
2. **Post-batch Review（现行）** — Live 连拍不打断；**DONE & REVIEW** 进入 `postReview` 逐张 DELETE/RESNAP/Accept；队列清空后 flush。
3. **Immediate list + async OCR/upload（2026-07）** — 每张 `handleBatchShot` 即 `setReceipts`；上传 **不等待** OCR；列表 pill 区分 **analyzing** vs **uploading**。

**WorkerSession：** 相机打开期间 **零上传**；Done/Back 后 `flushSessionPendingUploads`。

**相关 topic：** Live footer 布局见 [`camera-live-footer-design.md`](./camera-live-footer-design.md)；同步生命周期见 [`receipt-sync-lifecycle-design.md`](./receipt-sync-lifecycle-design.md)。

---

## 2. Canonical links

| Doc | Relevance |
|-----|-----------|
| [`docs/product/PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md) | §3.1 连拍相机 · 列表 pill |
| [`docs/superpowers/specs/2026-06-08-batch-snap-camera-design.md`](../specs/2026-06-08-batch-snap-camera-design.md) | Batch Snap 主 spec（仍 active） |
| [`docs/superpowers/specs/2026-06-10-flash-done-fast-lane-design.md`](../specs/2026-06-10-flash-done-fast-lane-design.md) | FLASH DONE 快车道 vs DONE & REVIEW |
| [`docs/tech/11-ocr-pipeline-design.md`](../../tech/11-ocr-pipeline-design.md) | Path A / Vision 服务端 |
| [`components/home/HomeScreen.tsx`](../../../components/home/HomeScreen.tsx) | capture / batch / flush 集成 |
| [`components/home/SnapButton.tsx`](../../../components/home/SnapButton.tsx) | batch phase 状态机 |
| [`components/camera/CameraOverlay.tsx`](../../../components/camera/CameraOverlay.tsx) | live / postReview / liveResnap |
| [`lib/client/batchCaptureFlush.ts`](../../../lib/client/batchCaptureFlush.ts) | session flush（无 OCR 阻塞） |
| [`lib/client/scheduleOcrJob.ts`](../../../lib/client/scheduleOcrJob.ts) | Worker OCR |
| [`lib/receipts/receiptListVisualState.ts`](../../../lib/receipts/receiptListVisualState.ts) | 列表 pill 纯函数 |

---

## 3. Batch session state machine

```text
session open
├─ live
│    shutter → savePhoto + saveReceipt + setReceipts + scheduleOcrJob
│    gallery → 预览选中（白框）；不进 postReview
│    FLASH DONE → 快车道 flush + 关相机（见 flash-done spec）
│    DONE & REVIEW → postReview（cursor = 首张未审）
│    BACK → onBatchClose（关相机，保留 IDB，defer 结束 → 可 flush）
│
├─ postReview
│    全屏大图 + DELETE | RESNAP | Accept
│    Accept → acceptedIds += id；cursor = 下一未审（拍摄序）
│    DELETE → 删 IDB；cursor = 下一未审
│    RESNAP → 删 IDB → liveResnap 拍一张 → 回 postReview
│    BACK → live（补拍；已 Accept 保留）
│    未审队列空 → onBatchDone(flush) + 关相机 + 回主页
│
└─ liveResnap
     单次 shutter → 新 id 插入 resnapSlot → postReview
```

### SnapButton session fields

```typescript
sessionIds: string[]              // 拍摄顺序（含 RESNAP 插入）
acceptedIds: Set<string>          // postReview Accept
reviewId: string | null
resnapSlotIndex: number | null
phase: "live" | "postReview" | "liveResnap"
```

**未审队列：** `sessionIds.filter(id => !acceptedIds.has(id))`  
**完成条件：** 未审队列长度 0 → `onBatchDone` → flush → 关相机。

---

## 4. Capture → list → OCR → upload pipeline

```text
Shutter (single or batch live)
  → prepareReceiptCapture (compress, OPFS, IDB: processing, pendingUpload)
  → setReceipts (immediate list card)
  → scheduleOcrJob (background Worker, non-blocking)

Single-shot:
  → camera closes
  → ensureGhostSession + uploadPendingInner (parallel with OCR)
  → server AI (Path A if ocrDraft on wire, else Vision)
  → watcher / ProcessingQueue → done

Batch:
  → camera stays open (WorkerSession: no upload)
  → each shot: setReceipts + scheduleOcrJob
  → Done/Back: waitForBatchSavesIdle only (no waitForOcrJobs)
  → flushSessionPendingUploads
  → server AI per receipt
```

### Locked decisions (2026-07-04)

| # | Topic | Choice |
|---|--------|--------|
| 1 | Scope | Single + batch; upload **does not wait** for OCR; list visible **immediately** |
| 2 | WorkerSession | **Zero upload** while batch camera open |
| 3 | OCR/upload race | First upload AI result wins; late `ocrDraft` **does not** re-trigger OpenAI |
| 4 | Batch Done timing | `waitForBatchSavesIdle` only; **remove** `waitForOcrJobs` before flush |
| 5 | Batch list | Each `handleBatchShot` → `setReceipts` (mirror single `handleCapture`) |
| 6 | List pill | Before upload HTTP: **analyzing**; during HTTP: **uploading** |
| 7 | Single upload | Async upload immediately after local save + list insert |
| 8 | flush OCR gate | **Remove** `shouldBlockUploadForOcr` from flush paths |
| 9 | OCR complete handler | Safety net: `pendingUpload && !uploadInFlight` |
| 10 | Pill impl | React `uploadInFlightIds: Set<string>` |

### OCR vs upload race (accepted)

| Order | Server path |
|-------|-------------|
| OCR finishes before upload POST | Path A (`ocrDraft` in multipart) when quality gate passes |
| Upload POST before `ocrDraft` persisted | Vision fallback (Path B) — **no retry** when OCR completes later |

---

## 5. List card visual states

`resolveReceiptListVisualState` (`lib/receipts/receiptListVisualState.ts`):

| Condition | Pill | Icon |
|-----------|------|------|
| `syncStuck` | paused | paused |
| `pendingUpload` && id ∈ `uploadInFlightIds` | uploading | uploading |
| `pendingUpload` && not in flight | analyzing | analyzing |
| `!pendingUpload` && processing | analyzing | analyzing |
| `done` / `blurry` | none | done |

During batch camera session, cards update in React state but sit behind overlay; after Done, user sees **analyzing** pills immediately — not **uploading** until HTTP starts.

---

## 6. WorkerSession compliance

| Phase | Network |
|-------|---------|
| Batch camera open | No auto upload (`batchFlushActiveRef`, OCR defer) |
| Done / Back | Upload flush allowed |
| Single after capture | Camera closed → upload allowed immediately |
| Watcher poll | Paused when `cameraOpen` |
| Auto upload / fetch / 60s retry | **Blocked** when `cameraOpen`; catch-up on close (Phase C) |

---

## 7. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-1 | 连拍 N 张 Live 过程中 **不进入** postReview |
| AC-2 | DONE & REVIEW → postReview 从首张未审开始 |
| AC-3 | Accept 全部 → flush + 关相机 + 回主页 |
| AC-4 | RESNAP → liveResnap → 新 id 回 postReview |
| AC-5 | postReview BACK → live 补拍 → 再 Done 审剩余 |
| AC-6 | Live BACK 保留已拍 IDB，不上传直至 flush 路径 |
| AC-7 | Single：相机关闭后列表 **一帧内** 出现卡片；analyzing pill |
| AC-8 | Batch Done：N 张卡片立即可见；无 OCR 等待再 flush |
| AC-9 | 慢 OCR：upload 可先于 `ocrDraft`；仍可达 `done` via Vision |
| AC-10 | `shouldBlockUploadForOcr` **不**阻塞 flush |

---

## 8. Out of scope

- Per-shot auto Review（已废弃，不恢复）
- postReview pinch zoom
- 列表 Resnap 重构（仍 `single` 模式 + `resnapId`）
- Server 二次 AI when `ocrDraft` arrives after Vision upload
- WorkerSession / done lock lifecycle redesign（见 receipt-sync-lifecycle topic · deferred）

---

## 9. Decision log

| Date | Old spec / plan | Superseded by |
|------|-----------------|---------------|
| 2026-06-08 | `archive/specs/2026-06-08-batch-receipt-review-design.md` | post-batch review（**this topic** §3） |
| 2026-06-09 | `archive/specs/2026-06-09-post-batch-review-flow-design.md` | **this topic** §3 |
| 2026-07-04 | `archive/specs/2026-07-04-capture-immediate-list-async-pipeline-design.md` | **this topic** §4–§5 |
| 2026-07-04 | `archive/plans/2026-07-04-capture-immediate-list-async-pipeline.md` | implemented · **this topic** |

**Partial supersede:** `2026-06-08-batch-snap-camera-design.md` 仍 active；列表/flush 时序以 **this topic** 为准。

---

## 10. Implementation gaps

| Item | Status |
|------|--------|
| Post-batch review phases | ✅ |
| FLASH DONE / DONE & REVIEW dual CTA | ✅ · see camera-live-footer topic |
| Immediate list on batch shot | ✅ |
| OCR/upload decouple + pill states | ✅ |
| Receipt WorkerSession lifecycle redesign | **deferred** · receipt-sync-lifecycle topic |
