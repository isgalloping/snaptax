# Post-Batch Review Flow — Design

**Date:** 2026-06-09  
**Status:** Implemented  
**Supersedes:** Per-shot review in [`2026-06-08-batch-receipt-review-design.md`](./2026-06-08-batch-receipt-review-design.md) (partial — phase timing only)  
**Builds on:** [`2026-06-08-batch-snap-camera-design.md`](./2026-06-08-batch-snap-camera-design.md)  
**References:** `docs/ui/snap.ui.png`, `docs/ui/resnap.ui.png`, `docs/prd/snap.detail.md`, `docs/prd/resnap.detail.md`

## Problem

当前实现：**每张快门后自动 Review**，打断连拍节奏；Live **Done** 直接 flush + 回主页，无法在「扫完一批」后集中验清晰度。

目标：**默认连拍不打断 → Live Done 进入 Post-Review → DELETE/RESNAP/Accept 逐张处理 → 队列清空后 flush + 回主页**。

**Note (2026-06-10):** Live 底部 Done 拆为 **⚡ FLASH DONE**（快车道）与 **DONE & REVIEW**（严审道）。见 [`2026-06-10-flash-done-fast-lane-design.md`](./2026-06-10-flash-done-fast-lane-design.md).

## Approved decisions

| 主题 | 选择 |
|------|------|
| 默认模式 | 连拍 Live（batch） |
| Live 拍后 | **留 live**，不 per-shot Review |
| Live Done | 进入 **postReview**（不 flush、不关相机） |
| Flush 时机 | postReview **队列全部处理完**（Accept 或 DELETE） |
| 导航 | **C** — Accept/DELETE 后按拍摄序跳下一张未审；Gallery 可跳任意未审项 |
| postReview BACK | **A** — 回 Live 补拍；已 Accept 保留；再 Done 继续审剩余 |
| RESNAP | 删当前 → Live 重拍一张 → 同槽位插入新 id → 回 postReview |
| Live BACK | 不变 — 关相机，保留 IDB，不 flush |
| 列表 Resnap | 不变 — `single` 模式 |

---

## State machine

```
session open
├─ live
│    shutter → IDB + thumb，stay live
│    gallery → 预览选中（白框），无审阅控件
│    Done → postReview（cursor = 首张未审）
│    BACK → onBatchClose（关相机，保留 IDB）
│
├─ postReview
│    全屏大图 + DELETE | RESNAP | Accept(Done)
│    Accept → acceptedIds += id；cursor = 下一未审（拍摄序）
│    DELETE → 删 IDB；cursor = 下一未审
│    RESNAP → 删 IDB；liveResnap（单张重拍）
│    gallery → 跳任意未审项；已 Accept 可查看（Accept=跳下一张未审）
│    BACK → live（补拍，acceptedIds 保留）
│    未审队列空 → onBatchDone(flush) + 关相机 + 回主页
│
└─ liveResnap（RESNAP 子态，UI 同 live）
     单次 shutter → 新 id 插入 resnapSlot → postReview 显示新张
```

### Session state (SnapButton)

```typescript
sessionIds: string[]              // 拍摄顺序（含 RESNAP 插入）
acceptedIds: Set<string>          // postReview Accept
reviewId: string | null           // 当前显示
resnapSlotIndex: number | null    // RESNAP 时写入位置
phase: "live" | "postReview" | "liveResnap"
```

**未审队列：** `sessionIds.filter(id => !acceptedIds.has(id))`

**完成条件：** 未审队列长度为 0 → 调用 `onBatchDone(sessionIds)` → flush → 关相机。

---

## UI

### Live

同 `snap.ui.png`：Badge + Shutter + Done + Gallery。

| 控件 | 行为 |
|------|------|
| Done | `aria-label="Finish capture"` → 进入 postReview |
| Gallery | 仅预览/选中，不显示 DELETE/RESNAP |
| Badge | 可选点最新缩略图预览选中（不进 postReview） |

### postReview

同 `resnap.ui.png`：全屏大图 + DELETE | RESNAP | Accept + Gallery。

| Gallery 态 | 视觉 |
|------------|------|
| 当前 | 白框 |
| 未审 | 正常 |
| 已 Accept | 绿勾 + 略透明 |

| 控件 | 行为 |
|------|------|
| Done (Accept) | 确认当前 → 下一未审 |
| BACK | 回 live 补拍 |
| Shutter / Live Done | **隐藏** |

### liveResnap

与 Live 相同布局（Shutter + Badge），无 Live Done；拍一张后自动回 postReview。

---

## Data flow

- **拍时：** 仍即时 `savePhoto` + `saveReceipt`（连拍 spec 不变）
- **DELETE / RESNAP 删：** `onReviewDelete(id)` → IDB 删除
- **Accept：** 仅更新 `acceptedIds`，不删 IDB
- **Flush：** 仅 postReview 完成时 `onBatchDone`
- **移除：** `lib/camera/reviewEnterMode.ts` 的 per-shot auto 逻辑

---

## Files

| 文件 | 动作 |
|------|------|
| `lib/camera/batchReviewQueue.ts` | **新建** — 未审/下一未审/完成判定 |
| `lib/camera/reviewEnterMode.ts` | **删除** 或弃用 |
| `components/home/SnapButton.tsx` | 三 phase 状态机；Live Done → postReview |
| `components/camera/CameraOverlay.tsx` | `postReview` / `liveResnap`；Live Done 改语义 |
| `components/camera/BatchGalleryStrip.tsx` | 已审/未审/当前三态 |
| `components/camera/BatchCountBadge.tsx` | Live 仅预览，不进 postReview |
| `docs/product/PRODUCT-SPEC.md` | §3.1 更新 |
| `2026-06-08-batch-receipt-review-design.md` | 顶部 superseded 注记 |

**不改：** HomeScreen flush 逻辑（仍由 `onBatchDone` 触发）、列表 single Resnap。

---

## Acceptance

1. 连拍 3 张过程中 **不进入** postReview  
2. Live Done → postReview 从第 1 张未审开始  
3. Accept ×3 → 自动 flush + 关相机 + 回主页  
4. DELETE 1 张 + Accept 2 张 → flush 2 张  
5. RESNAP → liveResnap 拍 1 张 → postReview 显示新张  
6. postReview BACK → live 补拍 1 张 → Done → 审完所有未审  
7. Gallery 在 postReview 可跳未审项；Accept 后顺序跳下一张未审  
8. Live BACK 仍保留已拍、不上传  
9. 全部 DELETE → 队列空 → 关相机，flush 空集（无 pending 上传）  
10. `npx next build` 通过

---

## Out of scope

- postReview pinch zoom  
- 列表 Resnap 重构  
- 可配置 per-shot vs post-batch 开关（YAGNI）
