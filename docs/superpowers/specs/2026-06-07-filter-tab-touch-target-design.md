# Filter Tab Touch Target — Design

**Date:** 2026-06-07  
**Status:** Approved (design)  
**Scope:** Enlarge receipt filter pills by 15% for outdoor blue-collar users with larger fingers.

## Problem

Filter tabs (ALL / READY / PROCESSING / BLURRY + stuck ⚠️) use compact `text-xs` pills that are hard to tap accurately outdoors with gloved or larger fingers.

## Decision

| Topic | Choice |
|-------|--------|
| Scale | **+15%** on baseline dimensions |
| Scope | **A** — all pills (four tabs + ⚠️) **and** inter-tab gap |
| Approach | **方案 1** — `homeVisual.filterTab` tokens + shared pill classes |

## Baseline → Target

| Property | Before | After (×1.15) |
|----------|--------|---------------|
| padding-x | 12px (`px-3`) | 13.8px |
| padding-y | 6px (`py-1.5`) | 6.9px |
| font-size | 12px (`text-xs`) | 13.8px |
| gap | 8px (`gap-2`) | 9.2px |
| icon margin | 4px (`mr-1`) | 4.6px |

## Implementation

### `lib/ui/homeVisual.ts`

Add `filterTab` token block with rem values above.

### `components/home/ReceiptFilterBar.tsx`

- Shared pill padding/font classes from tokens
- Container gap from token
- Main tabs and ⚠️ pill use identical dimensions; only colors differ
- Keep horizontal scroll

## Non-goals

- Pull-to-refresh row sizing
- Enforcing 64×64px square hit targets (pills stay proportional)
- Filter logic changes

## Testing

1. All five pills visibly ~15% larger
2. Gap between pills increased proportionally
3. 375px viewport: horizontal scroll still works
4. `npm run build` passes
