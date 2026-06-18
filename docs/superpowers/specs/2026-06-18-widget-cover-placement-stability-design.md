# Widget Cover Placement Stability — Design

**Date:** 2026-06-18  
**Status:** Implemented  
**Scope:** Fix permanent left-widget disappearance after rapid left swipes — `displayIndex` stuck past visibility threshold; reverse swipe does not recover.

**References:** `lib/home/widgetCoverMotion.ts` · `components/home/widgets/WidgetCoverCarousel.tsx`

**Brainstorming approved:** 2026-06-18 — Option 1: triple continuous offsets for n=3, cancel snap to `committedIndex`, easeOutCubic index easing, threshold 1.2.

---

## 1. Problem

After multiple left swipes, the left peek widget **permanently disappears** (not just during animation). Reverse swipe does not restore the three-card layout.

**Root cause chain:**

1. Rapid swipes call `cancelAnimation()` before rAF completes → `displayIndex` stuck at fractional overshoot (e.g. `1.08`)
2. `buildSlidePlacements` for `n=3` uses `circularOffset`; left slide offset ≈ `-1.08`
3. Visibility filter `|offset| ≤ 1.05` **drops** the left slide from render
4. `cancelAnimation` does not reset `displayIndex` to `committedIndex`
5. `coverFlowEase` overshoot on index path worsens overshoot during partial frames

---

## 2. Locked decisions

| Topic | Choice |
|-------|--------|
| n=3 placement | **Triple continuous** — `carouselTriple(floor(k))` + offsets `-1-t`, `-t`, `+1-t` (always 3 DOM nodes) |
| Cancel animation | Snap `displayIndex = committedIndex` immediately |
| Index easing | `easeOutCubic` (no overshoot) |
| Visibility threshold | `1.2` (was `1.05`) |
| n=2 | Unchanged mirror formula |
| n=1 | Unchanged single center |

---

## 3. `buildSlidePlacements` (n=3)

```ts
const k = Math.floor(displayIndex);
const t = displayIndex - k;
const active = wrapIndex(k, 3);
const left = adjacentIndex(active, -1, 3);
const right = adjacentIndex(active, 1, 3);
// center active @ -t, left @ -1-t, right @ 1-t
```

Always emits 3 placements when `|offset| ≤ 1.2`.

---

## 4. Carousel changes

- `committedIndexRef` for cancel snap
- `cancelAnimation`: `setDisplayIndex(committedIndexRef.current)`
- `animateDisplayTo`: use `easeOutCubic` instead of `coverFlowEase`

---

## 5. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-P1 | `buildSlidePlacements(1.08, 3)` returns 3 slides including left peek |
| AC-P2 | After rapid left swipes, three widgets always visible at rest |
| AC-P3 | Reverse swipe restores layout from stuck state |
| AC-P4 | `npm run test:unit` passes |
