# Camera Live Footer — Topic Design

**Topic ID:** `camera-live-footer`  
**Status:** Consolidated · implemented  
**Last verified:** 2026-07-08

---

## 1. Summary

Batch Snap **Live** 模式底部控件统一在黑色圆角 **footerDock** 内，四列比例布局：**BATCH · TAKE PHOTO · FLASH DONE · DONE & REVIEW**。快门为 **96px hero** 白心圆 + 绿色 cooldown 弧；Done 按钮为实心黄/深绿 tile。Gallery 最新张 **黄框**（`ring-yellow-500`），选中白框与之互斥（最新优先黄框）。

**Resnap（`mode="single"`）：** 模糊重拍复用同一 `footerDock` + hero 快门 + `TAKE PHOTO` 标签，无 BATCH/DONE 列（`CameraShutterFooter`）。

**Cooldown：** `SHUTTER_COOLDOWN_MS = 300`（`lib/camera/shutterCooldown.ts`）；`capturing` 期间快门 disabled + 弧动画。

**Out of scope：** postReview / batchPreview footer；`camera-session-sync-audit`（独立 active audit）。

---

## 2. Canonical links

| Doc | Relevance |
|-----|-----------|
| [`docs/product/PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md) | §3.1 相机 · 快门 cooldown |
| [`docs/superpowers/topics/capture-pipeline-design.md`](./capture-pipeline-design.md) | Post-batch review · immediate list · OCR/upload 管线 |
| [`docs/superpowers/specs/2026-06-08-batch-snap-camera-design.md`](../specs/2026-06-08-batch-snap-camera-design.md) | Batch Snap 主 spec |
| [`docs/superpowers/specs/2026-06-10-flash-done-fast-lane-design.md`](../specs/2026-06-10-flash-done-fast-lane-design.md) | FLASH DONE 快车道 |
| [`components/camera/CameraLiveFooter.tsx`](../../../components/camera/CameraLiveFooter.tsx) | Live 四列 footer |
| [`components/camera/CameraShutterFooter.tsx`](../../../components/camera/CameraShutterFooter.tsx) | Resnap 单快门 footer |
| [`components/camera/CameraOverlay.tsx`](../../../components/camera/CameraOverlay.tsx) | Live / single 路由 |
| [`lib/ui/homeVisual.ts`](../../../lib/ui/homeVisual.ts) | `snapCamera.*` tokens |
| [`lib/camera/shutterCooldown.ts`](../../../lib/camera/shutterCooldown.ts) | Cooldown 常量 |

---

## 3. Decisions

### 3.1 Visual polish (initial)

| Element | Style |
|---------|-------|
| **快门** | 白心圆 + 绿色 SVG cooldown 弧；`Take Photo` 标签 |
| **FLASH DONE** | 黄底实心 `flashDoneFill` |
| **DONE & REVIEW** | 深绿实心 `reviewDoneFill` |
| **BATCH** | 堆叠图标 + 数字 + `BATCH N`；可点击进 batchPreview |
| **Gallery 最新** | `galleryLatest` 黄框 |

### 3.2 Footer dock & grid (final layout)

| Topic | Choice |
|-------|--------|
| **容器** | `footerDock` — `rounded-2xl bg-zinc-950/95 border border-zinc-800/80 mx-3 mb-2` |
| **列布局** | **4 列** `grid-cols-[20fr_35fr_25fr_20fr]`（非三列 1:1:1 草案） |
| **行高** | `min-h-[6.5rem]`（104px） |
| **快门** | `size="hero"`（96px）；列 2 垂直居中 + 下方 `TAKE PHOTO` |
| **BATCH** | `BatchCountBadge` — outline 绿描边；`latestId` 缩略图 + overlay |
| **Done 列** | `showDualDone` 时 FLASH + REVIEW；否则 placeholder tile |
| **Compliance** | 脚注在 Dock **外** |

### 3.3 Resnap shutter footer (2026-06-18)

- `CameraOverlay` `mode === "single"` → `CameraShutterFooter`（dock + hero 快门 only）
- `CameraLiveFooter` 中心列抽取为 `CameraShutterColumn`（Live 与 ShutterFooter 共用）
- 行为不变：单次拍摄后关闭

### 3.4 Cooldown

```typescript
// lib/camera/shutterCooldown.ts
export const SHUTTER_COOLDOWN_MS = 300;
```

Spec 迭代曾提议 500ms / 1s；**现行代码 300ms**（与 `2026-06-10-camera-live-footer-column-ratio-design` 一致）。

### 3.5 Wiring

| Mode | Footer |
|------|--------|
| Live / liveResnap | `CameraLiveFooter` + `BatchGalleryStrip(latestId)` |
| single（模糊重拍） | `CameraShutterFooter` |

---

## 4. Component map

| File | Role |
|------|------|
| `CameraLiveFooter.tsx` | Dock + 4-col grid |
| `CameraShutterFooter.tsx` | Resnap dock wrapper |
| `CameraShutterColumn.tsx` | Hero shutter + label |
| `CameraShutterControl.tsx` | 快门圆 + cooldown 弧 |
| `BatchCountBadge.tsx` | BATCH tile |
| `FlashDoneButton.tsx` / `ReviewDoneButton.tsx` | Done tiles via `FooterActionTile` |
| `FooterActionTile.tsx` | 统一 tile 交互 |
| `BatchGalleryStrip.tsx` | 缩略图条 + latest 黄框 |

---

## 5. Decision log

| Date | Old spec | Superseded by |
|------|----------|---------------|
| 2026-06-10 | `archive/specs/2026-06-10-camera-live-footer-ui-design.md` | **this topic** §3.1 |
| 2026-06-10 | `archive/specs/2026-06-10-camera-live-footer-alignment-design.md` | **this topic** §3.2 (tile 对齐 → dock) |
| 2026-06-10 | `archive/specs/2026-06-10-camera-live-footer-dock-design.md` | **this topic** §3.2 |
| 2026-06-10 | `archive/specs/2026-06-10-camera-live-footer-three-column-design.md` | **not implemented** — 保留 4 列比例 |
| 2026-06-10 | `archive/specs/2026-06-10-camera-live-footer-column-ratio-design.md` | **this topic** §3.2 (final grid) |
| 2026-06-18 | `archive/specs/2026-06-18-resnap-shutter-footer-design.md` | **this topic** §3.3 |

---

## 6. Archive index

### Specs (6)

| File | Role |
|------|------|
| [`archive/specs/2026-06-10-camera-live-footer-ui-design.md`](../archive/specs/2026-06-10-camera-live-footer-ui-design.md) | 初始 UI polish |
| [`archive/specs/2026-06-10-camera-live-footer-alignment-design.md`](../archive/specs/2026-06-10-camera-live-footer-alignment-design.md) | Tile 等高对齐 |
| [`archive/specs/2026-06-10-camera-live-footer-dock-design.md`](../archive/specs/2026-06-10-camera-live-footer-dock-design.md) | 黑色 Dock 容器 |
| [`archive/specs/2026-06-10-camera-live-footer-three-column-design.md`](../archive/specs/2026-06-10-camera-live-footer-three-column-design.md) | 三列草案（未落地） |
| [`archive/specs/2026-06-10-camera-live-footer-column-ratio-design.md`](../archive/specs/2026-06-10-camera-live-footer-column-ratio-design.md) | 四列 20/35/25/20 终稿 |
| [`archive/specs/2026-06-18-resnap-shutter-footer-design.md`](../archive/specs/2026-06-18-resnap-shutter-footer-design.md) | Resnap footer 统一 |

### Plans

无独立 plan（实现在 batch-snap-camera 波次内）。

---

## 7. Implemented plans

- 无专用 plan；Live footer 迭代嵌套于 batch Snap 实现周期（见 `2026-06-08-batch-snap-camera` 相关 waves）。
