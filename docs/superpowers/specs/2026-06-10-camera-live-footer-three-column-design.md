# Camera Live Footer Three-Column Layout — Design

**Date:** 2026-06-10  
**Status:** Implemented  
**Builds on:** [`2026-06-10-camera-live-footer-dock-design.md`](./2026-06-10-camera-live-footer-dock-design.md)  
**Reference mockup:** `assets/image-412cb644-8c69-46b1-849e-58df07a673e7.png`

## Problem

户外蓝领场景需要更大触控区；快门必须在几何中心；BATCH 需显示拍照缩略图；三列 1:1:1 布局。

## Approved decisions

| 主题 | 选择 |
|------|------|
| 列布局 | **A** — `grid-cols-3` 等宽 1:1:1 |
| 列 1 | BATCH — 最新缩略图 + 数字 overlay + `BATCH N` |
| 列 2 | TAKE PHOTO — 96px 快门圆 + 标签，几何居中 |
| 列 3 | FLASH / DONE & REVIEW — `grid-cols-2` 各 50% |
| 行高 | `min-h-[6.5rem]`（104px） |
| Cooldown | 0.5s（已有） |

## Layout

```
┌────────────────────────────────────────────────┐
│  [ BATCH 33% ]  [ TAKE PHOTO 33% ]  [F|R 33%] │
│                    TAKE PHOTO                   │
└────────────────────────────────────────────────┘
```

## Out of scope

- 上方 Gallery 条保留
- single 模式快门仍用 full 尺寸
