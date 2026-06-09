# Receipt Filter Tab Touch Target — Design

**Date:** 2026-06-10  
**Status:** Implemented  

## Problem

Filter tab 高度约 32–36px，户外蓝领/粗手指场景难以准确点击和横向滑动。

## Approved decisions

| Token | 值 |
|-------|-----|
| 最小高度 | `min-h-14`（56px） |
| 内边距 | `px-4 py-3` |
| 字号 | `text-sm` |
| Tab 间距 | `gap-3` |
| 布局 | `inline-flex items-center` |

## Files

- `lib/ui/homeVisual.ts` — `filterTab` tokens
- `components/home/ReceiptFilterBar.tsx` — apply tokens
