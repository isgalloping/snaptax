# Widget Cover Flow Smooth Rotation — Design

**Date:** 2026-06-18  
**Status:** Implemented  
**Scope:** Fix stiff widget carousel animations on tap, swipe, and drag-release by replacing fixed-slot content swaps with a unified **floating `displayIndex`** model and per-slide circular positioning. Preserves triple-peek layout (no side gutters) from [`2026-06-18-widget-cover-triple-slot-design.md`](./2026-06-18-widget-cover-triple-slot-design.md).

**References:** `components/home/widgets/WidgetCoverCarousel.tsx` · `lib/home/widgetCoverMotion.ts` · `lib/home/widgetCarouselSlots.ts`

**Brainstorming approved:** 2026-06-18 — Option 1 (float `displayIndex` + per-slide DOM); both tap and drag-release stiff (option C); 2-slide side mirror accepted.

---

## 1. Problem

The triple-slot layout fixed empty left/right gutters but reintroduced **content teleporting**:

| Interaction | Current behavior | Why it feels stiff |
|-------------|------------------|-------------------|
| Tap side / quick swipe | `activeIndex` jumps; `carouselTriple` swaps widget content inside fixed left/center/right slots | Slot transforms stay at −1/0/+1 — **nothing animates** except inner content replacement |
| Drag release | `dragOffsetPx` resets to 0 and index commits in one frame | Snap lacks a dedicated settle animation |
| Inner layout | `focus` side ↔ center toggles instantly | Font size / ProgressArc appear/disappear without transition |

**Goal:** One motion model for drag, tap, and swipe — cards **physically rotate** with Cover Flow depth (scale/opacity/rotateY), 400ms default, `prefers-reduced-motion` instant.

---

## 2. Locked decisions

| Topic | Choice |
|-------|--------|
| Architecture | **Floating `displayIndex`** (float) + **per-slide DOM** positioned by `circularOffset` |
| Tap / swipe | Animate `displayIndex` to target integer over 400ms, then commit `committedIndex` |
| Drag | `displayIndex = committedIndex − dragPx / stridePx` (live follow) |
| Drag release | Animate `displayIndex` to snap target; commit after animation ends |
| 2 slides | Left/right mirror: render duplicate side peek for the non-center slide (same as `carouselTriple` mirror semantics) |
| 1 slide | Single centered card |
| Animation | Reuse `coverFlowTransform`; easing `cubic-bezier(0.34, 1.15, 0.64, 1)` |
| Reduced motion | 0ms; no `rotateY` |
| Focus hysteresis | `|offset| < 0.35` → center; optional 0.05 deadband on focus flip during animation |
| Dependencies | None (no framer-motion) |

---

## 3. State model

```text
committedIndex: number   // settled integer focus (0 .. n-1)
displayIndex: number     // render position, float during drag / transition
dragOffsetPx: number     // raw finger offset (0 when not dragging)
isDragging: boolean
isAnimating: boolean
reducedMotion: boolean
```

### 3.1 Lifecycle

| Event | `displayIndex` | `committedIndex` |
|-------|----------------|------------------|
| Idle at index 0 | 0 | 0 |
| Touch move | `committedIndex − dragPx / stridePx` | unchanged |
| Release (< 40px) | animate → `committedIndex` | unchanged |
| Release (≥ 40px left) | animate → `committedIndex + 1` | update on end |
| Release (≥ 40px right) | animate → `committedIndex − 1` | update on end |
| Tap left slot | animate → `committedIndex − 1` | update on end |
| Tap right slot | animate → `committedIndex + 1` | update on end |
| Tap center | open overlay | unchanged |

Wrap `committedIndex` with `wrapIndex` after each commit.

### 3.2 Animation driver

Use `requestAnimationFrame` lerp or a small `useSpringIndex` hook:

```ts
animateDisplayIndex(from, to, durationMs, easing, onComplete)
```

When `reducedMotion`: set `displayIndex = to` and `onComplete()` immediately.

---

## 4. Positioning math

### 4.1 `circularOffset(slideIndex, displayIndex, count)`

Returns shortest-path offset in approximately `[−1, 0, +1]` for visible slides:

```ts
function circularOffset(
  slideIndex: number,
  displayIndex: number,
  count: number,
): number {
  let raw = slideIndex - displayIndex;
  while (raw > count / 2) raw -= count;
  while (raw < -count / 2) raw += count;
  return raw;
}
```

For `count = 3`, integer `displayIndex` yields exactly −1, 0, +1 for the three slides.

### 4.2 Two-slide mirror

When `count === 2`, a single `circularOffset` per slide is insufficient for left+right peek of the non-center slide. Render strategy:

| `committedIndex` | Center slide | Left peek | Right peek |
|------------------|--------------|-----------|------------|
| 0 | slide 0 @ offset 0 | slide 1 @ offset −1 | slide 1 @ offset +1 |
| 1 | slide 1 @ offset 0 | slide 0 @ offset −1 | slide 0 @ offset +1 |

During fractional `displayIndex`, interpolate offsets for center and the off-center slide; duplicate DOM for left/right mirror (max 3 nodes: left clone, center, right clone).

### 4.3 Transform application

```ts
const motion = coverFlowTransform(offset, { reducedMotion });
// apply motion.transform, opacity, height, zIndex to slide wrapper
const focus = focusFromOffset(offset); // |offset| < 0.35 → center
```

`stridePx = viewportWidth × 0.34` — used for drag fraction only.

---

## 5. Layout

```text
viewport (overflow hidden, full width, perspective)
└─ track (relative, h-[118px], w-full)
   └─ slide nodes (absolute or flex with computed horizontal position)
      position-x from offset * slotWidth (center at 50% viewport)
```

- Remove fixed `slotLeft` / `slotCenter` / `slotRight` flex columns with content swap.
- Each slide wrapper positioned at:  
  `left: 50%; transform: translateX(calc(-50% + offset * stridePx))` **in addition to** `coverFlowTransform` scale/rotate — OR combine into single transform in `widgetCoverMotion` via new `slideLayoutTransform(offset, stridePx)`.

**Recommendation:** Extend `coverFlowTransform` to accept optional `translateXPx` from circular layout, producing one transform string:

`translateX(...) translateY(...) rotateY(...) scale(...)`

### 5.1 Visibility

Render slide when `|offset| ≤ 1.05`. For 3 slides at integer index, exactly 3 nodes visible.

---

## 6. Interaction (unchanged semantics)

| Action | Result |
|--------|--------|
| Tap center (`|offset| < 0.35`) | Open overlay for that slide |
| Tap side peek | Animate to that slide as center |
| Swipe without drag threshold | Same as tap side |
| During `isAnimating` | Ignore redundant side taps |
| ARIA | `aria-current="true"` on slide with `|offset| < 0.35` |

---

## 7. Architecture

### 7.1 Files

| File | Change |
|------|------|
| `lib/home/widgetCoverMotion.ts` | Add `circularOffset`, `slideLayoutTransform` (or extend `coverFlowTransform`); optional `lerpDisplayIndex` helper |
| `lib/home/widgetCoverMotion.test.ts` | Tests for `circularOffset` at integer/fractional indices; 2-slide offsets |
| `components/home/widgets/WidgetCoverCarousel.tsx` | Replace triple-slot map with per-slide render + `displayIndex` animation |
| `lib/ui/homeVisual.ts` | Replace slot flex tokens with `slideWrapper` absolute positioning tokens |

**Unchanged:** `widgetCarouselSlots.ts` (`wrapIndex`, `adjacentIndex`, `swipeDirection`), widget compute modules, `Tax*Widget.tsx`, `globals.css` reduced-motion rules.

### 7.2 Remove

- `slotOffset` usage in carousel (may keep function for tests or delete if unused)
- `carouselTriple` in carousel render path (keep in module for tests / 2-slide mirror reference)

---

## 8. Focus flicker mitigation

During animation, `focus` may oscillate near threshold. Apply **hysteresis**:

- Enter center focus when `|offset| < 0.30`
- Leave center focus when `|offset| > 0.40`
- Store per-slide `focus` in ref updated only on threshold cross

YAGNI: implement only if manual QA shows flicker; spec allows simple `focusFromOffset` first.

---

## 9. Testing

### 9.1 Unit

- `circularOffset(0, 0, 3) === 0`
- `circularOffset(2, 0, 3) === -1` (progress left of deadline)
- `circularOffset(1, 0.5, 3)` ≈ 0.5 (mid-animation)
- 2-slide mirror index mapping helper

### 9.2 Manual

| Case | Expected |
|------|----------|
| 3 slides, tap right peek | Cards rotate smoothly; no content flash |
| 3 slides, drag 50px release | Settle animation to next index |
| 3 slides, drag < 40px | Elastic return to current |
| 2 slides | Mirror peeks; smooth rotation |
| Reduce motion | Instant commit; static depth |

---

## 10. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-S1 | Tap side peek animates rotation — no instant content swap in fixed slots |
| AC-S2 | Drag-release snaps with visible settle animation (not one-frame jump) |
| AC-S3 | Drag follow remains continuous |
| AC-S4 | First paint: left and right peeks visible (no black gutters) — regression guard |
| AC-S5 | 2-slide mirror accepted behavior preserved |
| AC-S6 | 400ms easing; reduced motion 0ms |
| AC-S7 | Tap center opens overlay |
| AC-S8 | `npm run test:unit` passes |

---

## 11. Out of scope

- Auto-play
- framer-motion or new npm deps
- Widget data / copy changes
- Moving WidgetInsightsRail out of fixed chrome
