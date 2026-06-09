# Camera Live Footer UI Polish — Design

**Date:** 2026-06-10  
**Status:** Implemented  
**Builds on:** [`2026-06-08-batch-snap-camera-design.md`](./2026-06-08-batch-snap-camera-design.md), [`2026-06-10-flash-done-fast-lane-design.md`](./2026-06-10-flash-done-fast-lane-design.md)  
**Reference mockup:** `assets/image-c4f65250-4729-4cc3-9ae3-701c9a4c778a.png`

## Problem

Live footer 控件样式与 mockup 不一致：快门为黑色实心圆、Done 按钮为描边样式、Gallery 最新张无黄框高亮。

## Approved decisions

| 元素 | 样式 | 行为 |
|------|------|------|
| **快门** | 白心圆 + 绿色 SVG 弧 | 1s cooldown 倒计时弧（方案 A）；`Take Photo` 标签 |
| **⚡ FLASH DONE** | 黄底实心矩形 + 黑字 | 快车道 flush |
| **DONE & REVIEW** | 深绿实心矩形 + 白字 | 进入 postReview |
| **BATCH 气泡** | 竖向 tile：堆叠图标 + 数字 + 内部 `BATCH N`；点击进入 batchPreview |
| **Gallery 最新张** | `ring-yellow-500` 黄框 | 与选中白框互斥（最新优先黄框） |

## Components

| 文件 | 职责 |
|------|------|
| `components/camera/CameraShutterControl.tsx` | 白快门 + cooldown 绿弧 + 标签 |
| `components/camera/CameraLiveFooter.tsx` | Live 四列：Badge · Shutter · Flash Done · Review Done |
| `components/camera/FlashDoneButton.tsx` | 黄底实心 |
| `components/camera/ReviewDoneButton.tsx` | 深绿实心 |
| `components/camera/BatchGalleryStrip.tsx` | `latestId` 黄框 |
| `lib/ui/homeVisual.ts` | `flashDoneFill`, `reviewDoneFill`, `galleryLatest` tokens |

## Wiring

- `CameraOverlay` Live / liveResnap → `CameraLiveFooter` + `BatchGalleryStrip(latestId)`
- `CameraOverlay` single 模式 → 居中 `CameraShutterControl`（无 Done 列）
- Cooldown：`SHUTTER_COOLDOWN_MS = 300`；`capturing` 期间快门 disabled + 弧动画

## Out of scope

- postReview / batchPreview footer 布局不变
- 快门弧与 `onShot` 异步耗时的精确对齐（MVP：弧从 `capturing=true` 起算 1s）
