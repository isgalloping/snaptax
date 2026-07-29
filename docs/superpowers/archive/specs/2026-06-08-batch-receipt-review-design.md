# Batch Receipt Review Mode — Design

**Date:** 2026-06-08  
**Status:** Superseded (per-shot timing) — see [`2026-06-09-post-batch-review-flow-design.md`](./2026-06-09-post-batch-review-flow-design.md)  
**References:** `docs/ui/resnap.ui.png`, `docs/prd/resnap.detail.md`  
**Builds on:** [`2026-06-08-batch-snap-camera-design.md`](./2026-06-08-batch-snap-camera-design.md)

## Problem

连拍已实现，但拍后无法 **当场验清晰度**。模糊小票只能回首页从列表重拍，打断批量扫描节奏。

PRD 目标：在连拍会话内增加 **Review Mode** — 放大查看刚拍/选中缩略图，DELETE / RESNAP / Accept，不破坏 batch 会话。

## Scope

| In | Out |
|----|-----|
| 连拍相机内 Review Mode | 首页列表 Resnap 流程重构（保持现有 `single` 模式） |
| Gallery / Badge 进入 Review | Review 内 pinch zoom（二期，MVP 全屏大图） |
| DELETE / RESNAP / Accept | 批量重排序、多选删除 |

---

## 现状 vs 目标

| | 当前 | 目标（resnap.ui + PRD） |
|---|------|-------------------------|
| 拍后 | 留 live 相机，gallery 仅白框选中 | **V1 自动**进入 Review；亦可点缩略图切换 |
| 底部控件 | Shutter + Batch Done + Badge | Review 时换 **DELETE \| RESNAP \| Accept** |
| DELETE | 无 | 从 batch + IndexedDB 移除 |
| RESNAP | 仅首页 `resnapId` 单张替换 | Review 内：删当前张 → 回 live 重拍 |
| Accept (绿 Done) | 无（与 Batch Done 混淆） | 确认清晰 → 回 live，保留张数 |
| Batch Done | 结束会话回主页 | **仅 live 态**显示，Review 时隐藏 |

---

## 决策（建议）

| 主题 | 选择 |
|------|------|
| 进入 Review | **C** — **V1 快门后自动** Review 最新一张；**后续改 B**（仅点 Badge/Gallery）。V1 仍保留点击入口 |
| 两枚 Done | **Rename**：Review=`Accept`；Session=`Finish`（UI 仍可用 Done 文案 + aria 区分） |
| Review 相机流 | **Pause** — 隐藏 video，**保持 stream**（回 live 无重开延迟） |
| RESNAP 数据 | 先 **delete** 当前 id，再拍生成 **新 id**（batch count -1 再 +1） |
| Accept / BACK | Accept 明确；顶栏 BACK 在 Review = **等同 Accept**（回 live 不删） |
| 列表 Resnap | **不变** — `resnapId` + `single` 模式 |

---

## 方案对比

**方案 1 — CameraOverlay 双 phase `live | review`（推荐）**

- 同组件内切换布局；stream 保活
- 优点：状态集中、与连拍 spec 一致
- 缺点：`CameraOverlay` 变长（可拆 `ReceiptReviewPanel`）

**方案 2 — 独立全屏 `ReceiptReviewOverlay`**

- 叠在 CameraOverlay 之上
- 优点：边界清晰
- 缺点：z-index / stream 协调略繁

**方案 3 — 复用 `ReceiptDetailSheet` + zoom**

- 非相机语境，不符合 PRD「不离开相机流」

**推荐方案 1 + 子组件 `ReceiptReviewControls.tsx`**

---

## §1 状态机

```
batch session open
  ├─ phase: live
  │    shutter → onBatchShot → phase: review (reviewId = 最新)
  │    tap thumb/badge → phase: review (reviewId)  [V1 辅助入口；切 B 后为唯一入口]
  │    Batch Done → finish session → home
  │
  └─ phase: review (reviewId)
       show fullscreen image(reviewId)
       DELETE → remove id → phase: live
       RESNAP → remove id → phase: live (user re-shoots)
       Accept → phase: live (keep id)
       tap other thumb → reviewId = other
       BACK → phase: live (keep id, same as Accept)
```

**与 Session Done 区分：**

| 按钮 | 阶段 | 行为 |
|------|------|------|
| **Accept** ✓ 绿 | review | 回 live viewfinder |
| **Finish** ✓ 绿 | live | 关相机 + flush（现有 Batch Done） |

UI 文案建议：Review 右侧用 **Done**（PRD）；Live 右侧用 **Done** 或 **Finish** — 实现时用 `aria-label` 区分 `Accept receipt` vs `Finish batch`。

---

## §2 UI（对齐 resnap.ui.png）

### Live phase（不变）

同 `snap.ui.png`：viewfinder + Badge + Shutter + Batch Done + gallery。

### Review phase

```
┌─────────────────────────────────────┐
│  BACK (=Accept)          [↻] [⚙]   │
│                                     │
│     fullscreen receipt image        │
│     (object-contain, dark bg)       │
│                                     │
│  [🗑 DELETE] [✕ RESNAP] [✓ Done]   │  ← 红色圆钮 + 绿色 Accept
│                                     │
│  gallery strip (切换 reviewId)      │
└─────────────────────────────────────┘
```

| 控件 | 规格 |
|------|------|
| DELETE | 红底圆钮 + 文案；`min-h-14` 触控 |
| RESNAP | 红底圆钮 + ✕；删当前 + 回 live |
| Accept (Done) | 绿底圆钮 + ✓；回 live |
| Gallery | 保留；切换 `reviewId` |
| Shutter / Batch Done / Badge | **隐藏** |

**进入 Review（V1）：**

1. **自动** — 每次 `onBatchShot` 成功后 → `phase=review`，`reviewId=新 id`
2. **手动** — 点 **BatchCountBadge** 或 **Gallery** 任一项（切换/重进 Review）

**Fast-follow（切 B）：** 将 `lib/camera/reviewEnterMode` 设为 `'tap'` — 快门后留 live，仅手动进入。

---

## §3 数据流

```typescript
// SnapButton / HomeScreen callbacks
onReviewDelete(id: string): Promise<void>
  → deleteReceipt(id) + revoke thumb + update sessionIds

onReviewResnap(id: string): Promise<void>
  → same as delete; set phase live

onReviewAccept(): void
  → set phase live only
```

- 所有 shot 仍 **拍时即写 IndexedDB**（连拍 spec 不变）
- DELETE/RESNAP 才删 IDB；Accept 不碰数据
- Session Finish 仍走 `onBatchDone` flush

---

## §4 文件

| 文件 | 动作 |
|------|------|
| `components/camera/CameraOverlay.tsx` | `phase: live \| review` |
| `components/camera/ReceiptReviewControls.tsx` | **新建** DELETE/RESNAP/Accept |
| `components/camera/ReceiptReviewViewport.tsx` | **新建** 全屏大图 |
| `components/camera/BatchCountBadge.tsx` | 可点击 → `onEnterReview(latestId)` |
| `components/camera/BatchGalleryStrip.tsx` | 点击 → live: enter review；review: switch id |
| `components/home/SnapButton.tsx` | phase/reviewId state |
| `components/home/HomeScreen.tsx` | `handleReviewDelete` |
| `lib/ui/homeVisual.ts` | `reviewControl` tokens（红/绿圆钮） |
| `lib/camera/reviewEnterMode.ts` | **新建** `'auto' \| 'tap'` 常量（V1=`auto`，切 B 改 `tap`） |
| `docs/superpowers/specs/2026-06-08-batch-snap-camera-design.md` | 补交叉引用 |

**不改：** `ReceiptDetailSheet` 列表 Resnap、`ReceiptImageZoomViewer`（Review MVP 不 pinch）。

---

## §5 验收

1. 连拍 1 张 → **自动**进入 Review 显示该张
2. 连拍 3 张（每张 Accept 后）→ 点第 2 张缩略图 → Review 显示第 2 张
3. Accept → 回 live，3 张仍在 batch
4. DELETE → 回 live，batch 少 1，IDB 已删
5. RESNAP → 删当前 → live → 再拍 → **自动**再进 Review
6. Review 时无 Shutter / Batch Done
7. Batch Done（live）仍可结束会话 flush
8. 首页 blurry Resnap 仍走 single 模式
9. `reviewEnterMode='tap'` 时快门不自动进 Review（为切 B 预留）
10. `npx next build` 通过
