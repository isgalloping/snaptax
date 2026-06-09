# Camera Live Footer Dock — Design

**Date:** 2026-06-10  
**Status:** Implemented  
**Builds on:** [`2026-06-10-camera-live-footer-alignment-design.md`](./2026-06-10-camera-live-footer-alignment-design.md)  
**Reference mockup:** `assets/image-b489d324-febb-41a4-bd36-fd95fe34ef9b.png`

## Problem

Footer 控件虽已统一 tile，但与 mockup 仍有差距：无统一黑色圆角底栏；BATCH 内部布局（图标横排）；tile 为竖条非正方形；快门 cooldown 1s 过长。

## Approved decisions

| 主题 | 选择 |
|------|------|
| Footer 容器 | **A** — 统一黑色圆角 Dock 包裹四控件 |
| BATCH 布局 | 图标左上 · 数字居中 · `BATCH N` 贴底 |
| BATCH 样式 | 细绿描边 outline，弱实底 |
| Tile 尺寸 | 正方形 `h-16 w-16` |
| 快门 compact | 直径 `3.5rem`（56px），与 tile 行垂直居中 |
| Cooldown | **0.5s**（`SHUTTER_COOLDOWN_MS = 500`） |

## Dock layout

```
┌──────────────────────────────────────────────┐  footerDock
│  [BATCH]   ( ○ )   [FLASH]   [DONE&REVIEW]  │  h-16 row
│            TAKE PHOTO                        │
└──────────────────────────────────────────────┘
```

- Dock：`rounded-2xl bg-zinc-950/95 border border-zinc-800/80 mx-3 mb-2 px-2.5 py-2`
- Compliance 脚注在 Dock 外

## Components

| 文件 | 变更 |
|------|------|
| `lib/camera/shutterCooldown.ts` | **新建** — 共享 500ms constant |
| `CameraLiveFooter.tsx` | Dock 包裹 + grid |
| `BatchCountBadge.tsx` | 三区域内部布局 + outline 样式 |
| `CameraShutterControl.tsx` | 56px compact；导入 cooldown |
| `CameraOverlay.tsx` | 导入 cooldown |
| `homeVisual.ts` | `footerDock`, square `footerTile`, `batchTileOutline` |

## Out of scope

- Gallery 条、postReview footer
- single 模式快门尺寸（仍用 full 72px）
