# Widget Cover Flow Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed three-slot widget carousel with a single-track iOS Cover Flow animation (scale/opacity/translate + drag-follow), respecting `prefers-reduced-motion`.

**Architecture:** Pure motion math lives in `lib/home/widgetCoverMotion.ts` (unit-tested). `WidgetCoverCarousel` renders one slide per widget, positions the track via `translateX`, and applies per-slide transforms from fractional offset. Visual tokens move to `homeVisual.widgetCover`; reduced-motion overrides in `globals.css`.

**Tech Stack:** Next.js 16 · React 19 · Tailwind 4 · CSS `transform`/`opacity` · Node test runner (`node --test`)

**Spec:** [`docs/superpowers/specs/2026-06-18-widget-cover-flow-animation-design.md`](../specs/2026-06-18-widget-cover-flow-animation-design.md)

---

## File map

| File | Responsibility |
|------|----------------|
| `lib/home/widgetCoverMotion.ts` | `coverFlowTransform`, `trackTranslateX`, `slideOffsetFromCenter`, `focusFromOffset` |
| `lib/home/widgetCoverMotion.test.ts` | Unit tests for motion math |
| `lib/ui/homeVisual.ts` | Updated `widgetCover` tokens (`viewport`, `track`, `slide`, transitions) |
| `app/globals.css` | `.widget-cover-*` reduced-motion transition overrides |
| `components/home/widgets/WidgetCoverCarousel.tsx` | Track layout, drag-follow, `matchMedia`, tap/snap interaction |

**Unchanged:** `widgetCarouselSlots.ts`, `WidgetStack.tsx`, widget compute modules, `Tax*Widget.tsx` props.

---

### Task 1: Motion math module (TDD)

**Files:**
- Create: `lib/home/widgetCoverMotion.ts`
- Create: `lib/home/widgetCoverMotion.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  coverFlowTransform,
  focusFromOffset,
  slideOffsetFromCenter,
  trackTranslateX,
} from "./widgetCoverMotion";

describe("widgetCoverMotion", () => {
  it("coverFlowTransform at center", () => {
    const r = coverFlowTransform(0, { reducedMotion: false });
    assert.equal(r.opacity, 1);
    assert.equal(r.zIndex, 2);
    assert.match(r.transform, /scale\(1\)/);
    assert.match(r.transform, /rotateY\(0deg\)/);
    assert.equal(r.height, 112);
  });

  it("coverFlowTransform at side offsets", () => {
    const left = coverFlowTransform(-1, { reducedMotion: false });
    assert.equal(left.opacity, 0.55);
    assert.equal(left.zIndex, 1);
    assert.match(left.transform, /scale\(0\.88\)/);
    assert.match(left.transform, /rotateY\(-8deg\)/);
    assert.equal(left.height, 92);

    const right = coverFlowTransform(1, { reducedMotion: false });
    assert.match(right.transform, /rotateY\(8deg\)/);
  });

  it("coverFlowTransform disables rotateY when reduced motion", () => {
    const r = coverFlowTransform(-1, { reducedMotion: true });
    assert.match(r.transform, /rotateY\(0deg\)/);
    assert.equal(r.opacity, 0.55);
  });

  it("focusFromOffset threshold", () => {
    assert.equal(focusFromOffset(0), "center");
    assert.equal(focusFromOffset(0.2), "side");
    assert.equal(focusFromOffset(0.4), "center");
    assert.equal(focusFromOffset(-0.5), "side");
  });

  it("trackTranslateX centers active slide", () => {
    const viewport = 390;
    const slideW = 140;
    const gap = 6;
    const stride = slideW + gap;
    const t0 = trackTranslateX({
      viewportWidthPx: viewport,
      slideWidthPx: slideW,
      gapPx: gap,
      activeIndex: 0,
      dragOffsetPx: 0,
    });
    assert.equal(t0, viewport / 2 - slideW / 2);

    const t1 = trackTranslateX({
      viewportWidthPx: viewport,
      slideWidthPx: slideW,
      gapPx: gap,
      activeIndex: 1,
      dragOffsetPx: 0,
    });
    assert.equal(t1, viewport / 2 - (stride + slideW / 2));
  });

  it("slideOffsetFromCenter is zero for focal slide", () => {
    const viewport = 390;
    const slideW = 140;
    const gap = 6;
    const tx = trackTranslateX({
      viewportWidthPx: viewport,
      slideWidthPx: slideW,
      gapPx: gap,
      activeIndex: 1,
      dragOffsetPx: 0,
    });
    const offset = slideOffsetFromCenter({
      slideIndex: 1,
      slideWidthPx: slideW,
      gapPx: gap,
      viewportWidthPx: viewport,
      trackTranslateX: tx,
    });
    assert.ok(Math.abs(offset) < 0.001);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- lib/home/widgetCoverMotion.test.ts`

Expected: FAIL — cannot find module `./widgetCoverMotion`

- [ ] **Step 3: Implement motion module**

```typescript
const SIDE_SCALE = 0.88;
const SIDE_OPACITY = 0.55;
const SIDE_TRANSLATE_Y_PX = 4;
const SIDE_ROTATE_Y_DEG = 8;
const CENTER_HEIGHT_PX = 112;
const SIDE_HEIGHT_PX = 92;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Math.abs(value)));
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function coverFlowTransform(
  offset: number,
  options: { reducedMotion: boolean },
): { transform: string; opacity: number; zIndex: number; height: number } {
  const t = clamp01(offset);
  const scale = lerp(1, SIDE_SCALE, t);
  const opacity = lerp(1, SIDE_OPACITY, t);
  const translateY = lerp(0, SIDE_TRANSLATE_Y_PX, t);
  const rotateDeg =
    options.reducedMotion || offset === 0
      ? 0
      : (offset < 0 ? -1 : 1) * lerp(0, SIDE_ROTATE_Y_DEG, t);
  const height = lerp(CENTER_HEIGHT_PX, SIDE_HEIGHT_PX, t);
  const transform = `translateY(${translateY}px) rotateY(${rotateDeg}deg) scale(${scale})`;
  const zIndex = Math.abs(offset) < 0.5 ? 2 : 1;
  return { transform, opacity, zIndex, height };
}

export function focusFromOffset(offset: number): "side" | "center" {
  return Math.abs(offset) < 0.35 ? "center" : "side";
}

export function trackTranslateX(params: {
  viewportWidthPx: number;
  slideWidthPx: number;
  gapPx: number;
  activeIndex: number;
  dragOffsetPx: number;
}): number {
  const stride = params.slideWidthPx + params.gapPx;
  const slideCenter = params.activeIndex * stride + params.slideWidthPx / 2;
  return params.viewportWidthPx / 2 - slideCenter + params.dragOffsetPx;
}

export function slideOffsetFromCenter(params: {
  slideIndex: number;
  slideWidthPx: number;
  gapPx: number;
  viewportWidthPx: number;
  trackTranslateX: number;
}): number {
  const stride = params.slideWidthPx + params.gapPx;
  const slideCenterInViewport =
    params.slideIndex * stride +
    params.slideWidthPx / 2 +
    params.trackTranslateX;
  return (
    (slideCenterInViewport - params.viewportWidthPx / 2) / stride
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit -- lib/home/widgetCoverMotion.test.ts`

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/home/widgetCoverMotion.ts lib/home/widgetCoverMotion.test.ts
git commit -m "feat(home): add widget cover flow motion math"
```

---

### Task 2: Visual tokens

**Files:**
- Modify: `lib/ui/homeVisual.ts` (widgetCover block ~lines 68–77)

- [ ] **Step 1: Replace `widgetCover` tokens**

Replace the existing `widgetCover` object with:

```typescript
  widgetCover: {
    shell: "widget-cover-shell shrink-0 touch-pan-x pb-1 pt-0.5",
    viewport:
      "widget-cover-viewport relative mx-auto h-[118px] w-full overflow-hidden [perspective:900px]",
    track:
      "widget-cover-track flex h-full items-end gap-1.5 px-2",
    slide: "widget-cover-slide shrink-0 origin-bottom",
    slideButton:
      "widget-cover-slide-btn block w-full overflow-hidden rounded-2xl text-left active:scale-[0.98]",
    slideMotion:
      "widget-cover-slide-motion transition-[transform,opacity,height] duration-[400ms] ease-[cubic-bezier(0.34,1.15,0.64,1)]",
    trackMotion:
      "widget-cover-track-motion transition-transform duration-[400ms] ease-[cubic-bezier(0.34,1.15,0.64,1)]",
  },
```

Remove obsolete keys: `slotSide`, `slotCenter`, `cardBase`, `cardSide`, `cardCenter`.

- [ ] **Step 2: Grep for removed token names**

Run: `rg "slotSide|slotCenter|cardBase|cardSide|cardCenter" --glob '*.{ts,tsx}'`

Expected: Only `WidgetCoverCarousel.tsx` (fixed in Task 4) — no other references

- [ ] **Step 3: Commit**

```bash
git add lib/ui/homeVisual.ts
git commit -m "refactor(ui): update widgetCover tokens for track layout"
```

---

### Task 3: Reduced-motion CSS

**Files:**
- Modify: `app/globals.css` (inside existing `@media (prefers-reduced-motion: reduce)` block)

- [ ] **Step 1: Add widget-cover overrides**

Append inside the existing `@media (prefers-reduced-motion: reduce) { ... }` block:

```css
  .widget-cover-slide-motion,
  .widget-cover-track-motion {
    transition: none !important;
  }
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "a11y(home): disable widget cover transitions for reduced motion"
```

---

### Task 4: WidgetCoverCarousel refactor

**Files:**
- Modify: `components/home/widgets/WidgetCoverCarousel.tsx` (full rewrite of render + gesture logic)

- [ ] **Step 1: Replace component implementation**

Key implementation requirements:

1. **Refs/state:**
   - `viewportRef` — measure `clientWidth`
   - `activeIndex`, `dragOffsetPx`, `isDragging`, `isAnimating`
   - `reducedMotion` from `window.matchMedia("(prefers-reduced-motion: reduce)")` + `change` listener
   - `touchStartX`, `touchStartY`, `touchStartDragOffset` refs

2. **Layout constants:**
   - `GAP_PX = 6`
   - `slideWidthPx = Math.min(160, Math.round(viewportWidth * 0.36))`

3. **Render:**
   - Outer `cover.shell` with hero fade background, touch handlers, ARIA attrs (unchanged)
   - `cover.viewport` ref wrapper
   - `cover.track` with inline `transform: translateX(${tx}px)`, classes `cover.trackMotion` + `isDragging || isAnimating ? "will-change-transform" : ""`
   - Map `slides` array → one `cover.slide` per index (key = slide id + index)
   - Each slide: compute `offset = slideOffsetFromCenter(...)`, `motion = coverFlowTransform(offset, { reducedMotion })`, `focus = focusFromOffset(offset)`
   - Slide wrapper: inline `style={{ width: slideWidthPx, height: motion.height, opacity: motion.opacity, zIndex: motion.zIndex, transform: motion.transform }}`, class `cover.slideMotion cover.slide`
   - Button: `cover.slideButton`, `aria-current={focus === "center" ? "true" : undefined}`, `onClick={() => handleSlidePress(index, offset)}`
   - `renderSlide(slides[index], focus)` — same switch as today

4. **`handleSlidePress(index, offset)`:**
   - If `isAnimating` return
   - If `slides.length <= 1` → `openDetails(slides[0])`
   - If `Math.abs(offset) < 0.35` → `openDetails(slides[index])`
   - Else → `setActiveIndex(index)` (tap side card focuses it)

5. **Touch handlers:**
   - `onTouchStart`: record x/y, set `isDragging` false, store `touchStartDragOffset = dragOffsetPx`
   - `onTouchMove`: if `slides.length <= 1` return; compute dx/dy; if `|dx| < |dy|` return; set `isDragging` true; `setDragOffsetPx(touchStartDragOffset + dx)`
   - `onTouchEnd`: if not dragging, fall back to existing swipeDirection on total dx; else if `|dragOffsetPx - touchStartDragOffset| < 40` snap `dragOffsetPx` to 0; else advance index ±1 via `swipeDirection`, reset `dragOffsetPx` to 0; set `isAnimating` true until `transitionend` on track (or instant if reduced motion)

6. **`useEffect` on `activeIndex`:** reset `dragOffsetPx` to 0 when index changes programmatically

7. **Remove:** `carouselTriple`, `Slot` type, three-slot map

Skeleton (integrate with existing imports/callbacks):

```tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HomeWidgetsData } from "@/lib/home/computeHomeWidgets";
import {
  adjacentIndex,
  buildWidgetSlides,
  swipeDirection,
  type WidgetSlideId,
} from "@/lib/home/widgetCarouselSlots";
import {
  coverFlowTransform,
  focusFromOffset,
  slideOffsetFromCenter,
  trackTranslateX,
} from "@/lib/home/widgetCoverMotion";
import { homeVisual } from "@/lib/ui/homeVisual";
import { TaxDeadlineWidget } from "./TaxDeadlineWidget";
import { MissingDeductionsWidget } from "./MissingDeductionsWidget";
import { TaxYearProgressWidget } from "./TaxYearProgressWidget";

const GAP_PX = 6;

// ... props interface unchanged ...

export function WidgetCoverCarousel({ data, onDeadlineDetails, onMissingReview, onProgressDetails }: WidgetCoverCarouselProps) {
  const cover = homeVisual.widgetCover;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartDragOffset = useRef(0);

  const showMissing = data.missing.missing.length > 0;
  const slides = useMemo(() => buildWidgetSlides(showMissing), [showMissing]);
  const safeIndex = slides.length > 0 ? activeIndex % slides.length : 0;
  const slideWidthPx =
    viewportWidth > 0 ? Math.min(160, Math.round(viewportWidth * 0.36)) : 140;

  // measure viewport, matchMedia, slides.length clamp, openDetails, renderSlide — as spec

  const tx = trackTranslateX({
    viewportWidthPx: viewportWidth || 390,
    slideWidthPx,
    gapPx: GAP_PX,
    activeIndex: safeIndex,
    dragOffsetPx,
  });

  return (
    <div className={cover.shell} style={{ background: homeVisual.trustBar.heroFade }} /* touch + a11y */>
      <div ref={viewportRef} className={cover.viewport}>
        <div
          className={`${cover.track} ${cover.trackMotion}${isDragging || isAnimating ? " will-change-transform" : ""}`}
          style={{ transform: `translateX(${tx}px)` }}
          onTransitionEnd={() => setIsAnimating(false)}
        >
          {slides.map((id, index) => {
            const offset = slideOffsetFromCenter({
              slideIndex: index,
              slideWidthPx,
              gapPx: GAP_PX,
              viewportWidthPx: viewportWidth || 390,
              trackTranslateX: tx,
            });
            const motion = coverFlowTransform(offset, { reducedMotion });
            const focus = focusFromOffset(offset);
            return (
              <div
                key={`${id}-${index}`}
                className={`${cover.slide} ${cover.slideMotion}`}
                style={{
                  width: slideWidthPx,
                  height: motion.height,
                  opacity: motion.opacity,
                  zIndex: motion.zIndex,
                  transform: motion.transform,
                }}
              >
                <button
                  type="button"
                  className={cover.slideButton}
                  style={{ height: motion.height }}
                  aria-current={focus === "center" ? "true" : undefined}
                  onClick={() => handleSlidePress(index, offset)}
                >
                  {renderSlide(id, focus)}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

Fill in: `useLayoutEffect` + `ResizeObserver` on viewport for width; `handleSlidePress`; complete touch handlers; `openDetails`; `renderSlide`.

- [ ] **Step 2: Run full unit suite**

Run: `npm run test:unit`

Expected: PASS (219+ tests, 0 fail)

- [ ] **Step 3: Run lint on touched files**

Run: `npm run lint -- --max-warnings=0 components/home/widgets/WidgetCoverCarousel.tsx lib/home/widgetCoverMotion.ts 2>&1 | tail -20`

Expected: No new errors in touched files (pre-existing repo warnings elsewhere are OK)

- [ ] **Step 4: Manual smoke (dev server)**

Run: `npm run dev` → open Home on mobile viewport (~390px)

Checklist:
- [ ] 3 widgets: drag follows finger; release snaps; side cards smaller/dimmer
- [ ] Tap center opens overlay; tap side focuses
- [ ] 2 widgets (no missing deductions): no layout jump
- [ ] OS "Reduce motion" on: instant switch, no rotateY

- [ ] **Step 5: Commit**

```bash
git add components/home/widgets/WidgetCoverCarousel.tsx
git commit -m "feat(home): animate widget cover flow with drag-follow"
```

---

### Task 5: Spec status + PRODUCT-SPEC note (optional)

**Files:**
- Modify: `docs/superpowers/specs/2026-06-18-widget-cover-flow-animation-design.md` (status line)
- Modify: `docs/product/PRODUCT-SPEC.md` §12 implementation row (one line)

- [ ] **Step 1: Update spec status**

Change header `Status:` to `Implemented`.

- [ ] **Step 2: Add PRODUCT-SPEC §12 row** (if §12 table exists for home widgets)

Add or update row: `WidgetInsightsRail Cover Flow animation | Done | track + drag-follow`

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-06-18-widget-cover-flow-animation-design.md docs/product/PRODUCT-SPEC.md
git commit -m "docs: mark widget cover flow animation implemented"
```

---

## Spec coverage checklist

| Spec section | Task |
|--------------|------|
| §3 Animation model (track + transforms) | Task 1, 4 |
| §3.3 Timing 400ms | Task 2 (`slideMotion`/`trackMotion`), Task 3 |
| §3.4 Focus threshold 0.35 | Task 1 (`focusFromOffset`), Task 4 |
| §4 Interaction (tap/snap) | Task 4 |
| §4.1 Drag-follow | Task 4 |
| §5.1 `widgetCoverMotion.ts` | Task 1 |
| §5.2 File changes | Tasks 1–5 |
| §5.3 Tokens | Task 2 |
| §6 a11y | Task 3, 4 (ARIA preserved) |
| §6.2 Performance (transform only, will-change) | Task 4 |
| §7 Tests | Task 1, 4 step 2 |
| AC-W1–AC-W8 | Tasks 1–4 |

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-18-widget-cover-flow-animation.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — implement tasks in this session with checkpoints

Which approach?
