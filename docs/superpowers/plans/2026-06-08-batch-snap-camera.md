# Batch Snap Camera Implementation Plan

> **Status:** Implemented (2026-06-08)

**Goal:** 连拍小票 — 相机内连续拍摄，Done 后关闭并 flush 上传；UI 对齐 `docs/ui/snap.ui.png` + `docs/prd/snap.detail.md`。

**Architecture:** `CameraOverlay` 持有会话 UI（badge / shutter / Done / gallery），流式相机不中断；每张 `onShot` 立即写 IndexedDB；`onDone` 触发 HomeScreen flush。Resnap 走 `single` 模式不变。

**Spec:** [`2026-06-08-batch-snap-camera-design.md`](../specs/2026-06-08-batch-snap-camera-design.md)

**Tech Stack:** Next.js 16 · React 19 · Tailwind 4 · existing `lib/camera/capturePhoto.ts`

---

## 文件结构

| 路径 | 职责 |
|------|------|
| `lib/camera/batchSession.ts` | Session 类型、blob URL 管理 |
| `lib/ui/homeVisual.ts` | `snapCamera` 视觉 token |
| `components/camera/BatchCountBadge.tsx` | 左下连拍计数徽章 |
| `components/camera/BatchGalleryStrip.tsx` | 底部缩略图条 |
| `components/camera/CameraOverlay.tsx` | 连拍 UI + 不断流快门 |
| `components/home/SnapButton.tsx` | batch / single 模式分发 |
| `components/home/HomeScreen.tsx` | shot / done / flush 编排 |

---

### Task 1: Tokens + batchSession 工具

**Files:**
- Modify: `lib/ui/homeVisual.ts`
- Create: `lib/camera/batchSession.ts`

- [ ] **Step 1:** 在 `homeVisual` 增加 `snapCamera` token（shutter 绿环、badge glow、gallery 选中白框）

- [ ] **Step 2:** 创建 `batchSession.ts`

```typescript
export type BatchThumb = { id: string; url: string };

export function createBatchThumb(id: string, file: File): BatchThumb {
  return { id, url: URL.createObjectURL(file) };
}

export function revokeBatchThumbs(thumbs: BatchThumb[]): void {
  for (const t of thumbs) URL.revokeObjectURL(t.url);
}
```

- [ ] **Step 3:** `npm run test:unit`（无新测则 skip）· `npx next build`

---

### Task 2: BatchCountBadge + BatchGalleryStrip

**Files:**
- Create: `components/camera/BatchCountBadge.tsx`
- Create: `components/camera/BatchGalleryStrip.tsx`

- [ ] **Step 1:** `BatchCountBadge` — 绿色发光容器、数字、`Batch Count: N` 文案（PRD）；0 张时隐藏或显示占位

- [ ] **Step 2:** `BatchGalleryStrip` — 横向 scroll；`selectedId` 白框；`onSelect` 回调；空态不渲染

- [ ] **Step 3:** Storybook 无 · 目视对照 `docs/ui/snap.ui.png`

---

### Task 3: CameraOverlay 连拍核心

**Files:**
- Modify: `components/camera/CameraOverlay.tsx`

- [ ] **Step 1:** 新增 props：`mode`, `onShot`, `onDone`, `sessionThumbs`, `selectedId`, `onSelectThumb`, optional sync/settings

- [ ] **Step 2:** 重写 `handleShutter` — **不** `stopStream`；`await onShot(file)`；1s cooldown

- [ ] **Step 3:** Footer 三列布局：Badge | Shutter（机械快门样式）| Done

- [ ] **Step 4:** Gallery strip + ComplianceFootnote 贴底（PRD）

- [ ] **Step 5:** Header 右上 ↻ / ⚙（batch 模式）；左 BACK 调用 `onClose`

- [ ] **Step 6:** `mode === "single"` — 隐藏 badge/Done/gallery；首拍后 `stopStream` + `onShot` + `onClose`（resnap 兼容）

---

### Task 4: SnapButton 接线

**Files:**
- Modify: `components/home/SnapButton.tsx`

- [ ] **Step 1:** 本地 state：`sessionThumbs`, `batchCount`, `selectedId`

- [ ] **Step 2:** `resnapId` → `mode="single"`；否则 `mode="batch"`

- [ ] **Step 3:** `onShot` 来自 parent；成功后 append thumb + increment count；**不** `setCamera(false)`

- [ ] **Step 4:** `onDone` → parent `onBatchDone` + revoke thumbs + reset session state + close

- [ ] **Step 5:** `onClose` (BACK) → revoke + close（保留 IDB 已写数据）

- [ ] **Step 6:** Props 扩展：`onBatchShot`, `onBatchDone`, `onSyncClick`, `onSettingsClick`

---

### Task 5: HomeScreen 编排

**Files:**
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1:** 提取 `createLocalReceiptFromFile(file)` — 与现有 `handleCapture` 本地段共用

- [ ] **Step 2:** `handleBatchShot(file)` — 仅 IDB + thumb；**不** upload；`batchSessionIdsRef.push(id)`

- [ ] **Step 3:** `handleBatchDone()` — close camera；`top100ByUpdatedAt` 刷新 list；`flushPendingUploads`；enqueue processing

- [ ] **Step 4:** `handleCapture` 保留给 resnap / file fallback single path

- [ ] **Step 5:** 传 `onSyncClick` / `onSettingsClick` 进 SnapButton（settings 先 `setView('settings')` + close camera）

---

### Task 6: 文档 + 验收

**Files:**
- Modify: `docs/product/PRODUCT-SPEC.md`（Snap 连拍段落）

- [ ] **Step 1:** 更新 PRODUCT-SPEC § Snap 为连拍 + Done flush

- [ ] **Step 2:** 手工验收清单（spec §6 全部 8 条）

- [ ] **Step 3:** `npx next build`

---

## 依赖顺序

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6
```

Task 2 可与 Task 1 并行；Task 3 依赖 Task 2 组件。

## 风险

| 风险 | 缓解 |
|------|------|
| 连拍内存（blob URL） | Done/BACK revoke；会话结束清 ref |
| iOS 相机关流 | 不 stop stream 直到 Done/BACK |
| 上传风暴 | Done 后顺序 flush；已有 write budget |
| merge 与连拍 | cameraOpen 期间仍 defer merge |

## 预估

~4–6h 实现 + 1h 真机验收（iOS Safari + Android Chrome）
