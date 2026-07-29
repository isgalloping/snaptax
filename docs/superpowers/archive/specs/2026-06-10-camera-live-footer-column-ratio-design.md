# Camera Live Footer Column Ratio — Design

**Date:** 2026-06-10  
**Status:** Implemented  
**Builds on:** [`2026-06-10-camera-live-footer-three-column-design.md`](./2026-06-10-camera-live-footer-three-column-design.md)

## Approved decisions

| 列 | 宽度 | 内容 |
|----|------|------|
| BATCH | 20% | 图标 + 数字 + `BATCH N`（无缩略图） |
| TAKE PHOTO | 35% | hero 快门 + 下方标签 |
| FLASH DONE | 25% | 黄底 tile |
| DONE & REVIEW | 20% | 深绿 tile |
| Cooldown | 0.3s | `SHUTTER_COOLDOWN_MS = 300` |

## Grid

`grid-cols-[20fr_35fr_25fr_20fr]`
