# Flash Done Fast Lane — Design

**Date:** 2026-06-10  
**Status:** Implemented  
**Builds on:** [`topics/capture-pipeline-design.md`](../topics/capture-pipeline-design.md)  
**References:** batch camera mockup (FLASH DONE + DONE & REVIEW dual CTAs)

## Problem

Post-batch Review 沙盒为 100% 阻断废图而设计，但 **95% 正常连拍** 被强制「验尸式」审图，点击成本过高。主屏已有 Delete / Resnap / Retry 作为异步复检队列。

目标：在 Live 连拍底部增加 **⚡ FLASH DONE 快车道**（盲拍直达主屏 + flush），保留 **DONE & REVIEW 严审道** 与 **BATCH 气泡轻量预览**。

## Approved decisions

| 主题 | 选择 |
|------|------|
| FLASH DONE | 跳过 postReview → 立即 `finishSession` / flush + 关相机 |
| DONE & REVIEW | 原 Done → 进入 **postReview** 顺序审 |
| BATCH 气泡 | **C** — count≥1 可点 → **batchPreview**（只看，无 Accept 队列）→ BACK 回 live |
| 连拍写 IDB | 不变（每张即时写入） |
| Flash 额外序列化 | 不需要（已写 IDB） |
| 主屏熔断 | 不变 — blurry / syncStuck 原地 Retry（AC-2） |

---

## State machine

```
Live 连拍
├─ BATCH 气泡 (n≥1) → batchPreview
│       BACK → live（session 不变，不 flush）
├─ ⚡ FLASH DONE → finishSession (isFlashPass=true)
├─ DONE & REVIEW → postReview → 审完 → finishSession
├─ BACK → onBatchClose
│
batchPreview
│    大图 + gallery；无 DELETE/RESNAP/Accept
│    BACK → live
│
postReview / liveResnap
     （不变，见 2026-06-09 spec）
```

---

## Live footer UI

```
[ BATCH n ]   [ ◉ Shutter ]   [ ⚡ FLASH DONE ]   [ ✓ DONE & REVIEW ]
```

| 控件 | 样式 | 行为 | disabled |
|------|------|------|----------|
| BATCH n | 绿光 | → batchPreview | n=0 |
| Shutter | 绿环圆钮 | 连拍 | capturing |
| FLASH DONE | 黄边 + ⚡ 光晕 | `onFlashDone` | n=0 |
| DONE & REVIEW | 绿边 + ✓ | `onFinishCapture` → postReview | n=0 |

### batchPreview vs postReview

| | batchPreview | postReview |
|---|--------------|------------|
| 入口 | BATCH 气泡 | DONE & REVIEW |
| 审阅控件 | 无 | DELETE / RESNAP / Accept |
| Accept 队列 | 无 | 必须审完 |
| BACK | live 继续拍 | live 补拍（Accept 保留） |
| flush | 不触发 | 队列空后触发 |

batchPreview 起始张：`selectedId ?? sessionIds[last]`

---

## Data / flush

```typescript
// SnapButton
handleFlashDone = () => finishSession(); // existing onBatchDone path

handleFinishCapture = () => enter postReview; // unchanged

handleBatchPreviewEnter = () => {
  setPhase('batchPreview');
  setReviewId(selectedId ?? latest);
};
```

| 路径 | flush |
|------|-------|
| FLASH DONE | 立即 `onBatchDone(sessionIds)` |
| postReview 完成 | `onBatchDone` |
| batchPreview BACK | 无 |
| Live BACK | 无（onBatchClose） |

---

## Components

| 文件 | 动作 |
|------|------|
| `lib/ui/homeVisual.ts` | `snapCamera.flashDone` tokens |
| `components/camera/FlashDoneButton.tsx` | **新建** |
| `components/camera/ReviewDoneButton.tsx` | **新建**（或内联 DONE & REVIEW） |
| `components/camera/CameraOverlay.tsx` | 四控件 footer；`batchPreview` phase |
| `components/camera/BatchCountBadge.tsx` | `onPress` → batchPreview |
| `components/home/SnapButton.tsx` | `handleFlashDone` / `handleBatchPreviewEnter` |
| `docs/superpowers/topics/capture-pipeline-design.md` | 注记 Live Done 已拆双 CTA |
| `docs/product/PRODUCT-SPEC.md` | §3.1 更新 |

---

## Acceptance

**AC-1：** 连拍 3 张 → ⚡ FLASH DONE → ≤200ms 关相机、无 postReview → 主屏 +3 processing。

**AC-2：** Flash 批次中 blurry/stuck 票在主屏原地 Retry/Resnap。

**AC-3：** BATCH 气泡 → batchPreview → BACK → 继续拍 → FLASH 仍 flush 全部。

**AC-4：** DONE & REVIEW → postReview 顺序审 → 审完 flush。

**AC-5：** n=0 时 FLASH / DONE & REVIEW / 气泡 disabled。

**AC-6：** `npx next build` 通过。

---

## Out of scope

- 默认记住用户上次选 Flash vs Review
- batchPreview 内 DELETE/RESNAP（主屏/严审道负责）
- 动画时长精确 200ms 自动化测试（手工 AC-1）
