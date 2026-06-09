# Batch Receipt Review Mode Implementation Plan

> **Status:** Implemented  
> **Goal:** 连拍会话内 Review Mode — 全屏验图 + DELETE / RESNAP / Accept，对齐 `resnap.ui.png` + `resnap.detail.md`

**Spec:** [`2026-06-08-batch-receipt-review-design.md`](../specs/2026-06-08-batch-receipt-review-design.md)

**Depends on:** Batch snap camera (shipped)

---

## 架构

```
CameraOverlay
  phase: live | review
  reviewId?: string

live  → existing shutter / badge / batch done / gallery
review → ReceiptReviewViewport + ReceiptReviewControls + gallery
```

HomeScreen 提供 `handleReviewDelete(id)`；SnapButton 管理 phase 与 thumb 列表同步。

---

### Task 0: Review enter mode constant

**Files:** Create `lib/camera/reviewEnterMode.ts`

- [ ] `export const REVIEW_ENTER_MODE: 'auto' | 'tap' = 'auto'`（V1）
- [ ] 注释说明切 B 时改为 `'tap'`

---

### Task 1: Visual tokens

**Files:** `lib/ui/homeVisual.ts`

- [ ] 增加 `reviewControl.delete` / `resnap` / `accept` 颜色与尺寸（红圆、绿圆，`h-14 w-14`）

---

### Task 2: ReceiptReviewViewport + ReceiptReviewControls

**Files:**
- Create: `components/camera/ReceiptReviewViewport.tsx`
- Create: `components/camera/ReceiptReviewControls.tsx`

- [ ] Viewport：`object-contain` 全屏图，`thumb.url` 或 IndexedDB blob
- [ ] Controls：三列 DELETE | RESNAP | Accept（对齐 resnap.ui.png）
- [ ] `aria-label` 区分 Accept vs Batch Done

---

### Task 3: CameraOverlay phase 状态机

**Files:** `components/camera/CameraOverlay.tsx`

- [ ] Props：`phase`, `reviewId`, `onReviewDelete`, `onReviewResnap`, `onReviewAccept`, `onEnterReview`
- [ ] `phase === review`：隐藏 video 层（`visibility:hidden`，stream 不关）
- [ ] Live footer：shutter + batch done + badge
- [ ] Review footer：ReceiptReviewControls + gallery
- [ ] 顶栏 BACK：`phase === review` → `onReviewAccept()`；`live` → `onClose()`

---

### Task 4: Gallery + Badge 进入 Review

**Files:**
- Modify: `components/camera/BatchCountBadge.tsx`
- Modify: `components/camera/BatchGalleryStrip.tsx`

- [ ] Badge 可点击 → `onEnterReview(latestId)`（有图时）
- [ ] Gallery：`live` 点击 → enter review；`review` 点击 → switch `reviewId`

---

### Task 5: SnapButton + HomeScreen 接线

**Files:**
- Modify: `components/home/SnapButton.tsx`
- Modify: `components/home/HomeScreen.tsx`

- [ ] SnapButton state：`phase`, `reviewId`
- [ ] `handleBatchShot` 成功后：若 `REVIEW_ENTER_MODE === 'auto'` → `setPhase('review')` + `setReviewId(newId)`
- [ ] `handleReviewDelete`：`deleteStoredReceipt` + 更新 thumbs/sessionIds
- [ ] RESNAP：同 delete + `setPhase('live')`
- [ ] Accept：`setPhase('live')`
- [ ] 删至 0 张时自动回 live

---

### Task 6: 文档 + 验收

**Files:** `docs/product/PRODUCT-SPEC.md`（Snap Review 段落）

- [ ] 手工验收 spec §5 十条（含 auto-enter + tap 模式切换）
- [ ] `npx next build`

---

## 依赖与风险

| 风险 | 缓解 |
|------|------|
| 两枚 Done 混淆 | aria-label + 仅 live 显示 Batch Done |
| Stream 内存 | review 只 hide video，不 stop |
| delete 后 thumb URL 泄漏 | 沿用 `revokeBatchThumbs` |

## 预估

~3–4h 实现 + 1h 真机验收

## 与现有 Resnap 关系

| 入口 | 模式 | 行为 |
|------|------|------|
| 连拍 Review RESNAP | batch / review | 删 batch 项 + live 重拍 |
| 列表/详情 Resnap | single | 替换已有 receipt id（**不变**） |

---

## 进入 Review（已确认 **C**）

- **V1：** 快门后自动 Review + 保留 Badge/Gallery 点击
- **Fast-follow：** `REVIEW_ENTER_MODE = 'tap'` 切为 PRD 纯手动模式
