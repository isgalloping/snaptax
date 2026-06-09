# Camera Live Footer Alignment — Design

**Date:** 2026-06-10  
**Status:** Implemented  
**Supersedes:** Footer layout section of [`2026-06-10-camera-live-footer-ui-design.md`](./2026-06-10-camera-live-footer-ui-design.md)  
**Reference mockup:** `assets/image-42bfdc5e-eea7-4b7a-b2b2-fb70fa15fff7.png`

## Problem

Live Footer 四控件高度不一致：Batch 为方形缩略图 + 外置标签，Done 按钮 `min-h-14`，快门 72px 圆 + 外置标签，`items-end` 导致视觉基线混乱。

## Approved decisions

| 主题 | 选择 |
|------|------|
| BATCH 样式 | **A** — 竖向圆角卡片 + 堆叠图标 + 数字 + 内部 `BATCH N`（无缩略图） |
| 布局方案 | **统一 Tile + Grid 两行** |
| Tile 尺寸 | `h-[5.5rem] w-[4.25rem] rounded-xl` |
| 快门 | 行 1 内 `compact` 52px 圆；`TAKE PHOTO` 仅快门列第二行 |
| 对齐 | 三矩形等高顶底对齐；快门圆在行 1 垂直居中 |

## Layout

```
┌─────────┬─────────┬─────────┬─────────┐
│ BATCH   │  ( ○ )  │ FLASH   │ DONE &  │  row 1: h-[5.5rem]
│  tile   │ shutter │  tile   │ REVIEW  │
├─────────┼─────────┼─────────┼─────────┤
│         │TAKE     │         │         │  row 2: label only
│         │PHOTO    │         │         │
└─────────┴─────────┴─────────┴─────────┘
```

## Components

| 文件 | 变更 |
|------|------|
| `FooterActionTile.tsx` | **新建** — 统一 tile 尺寸与交互 |
| `StackCardsIcon.tsx` | **新建** — BATCH 堆叠卡片图标 |
| `BatchCountBadge.tsx` | 图标版，去掉 `latestThumbUrl` |
| `FlashDoneButton.tsx` / `ReviewDoneButton.tsx` | 改用 `FooterActionTile` |
| `CameraLiveFooter.tsx` | `grid-cols-4` 两行布局 |
| `CameraShutterControl.tsx` | `compact` 模式（52px 环） |
| `homeVisual.snapCamera` | `footerTile`, `footerTileRow`, `batchTileFill` |

## Out of scope

- Gallery 缩略图条
- postReview / batchPreview footer
- Cooldown 弧逻辑
