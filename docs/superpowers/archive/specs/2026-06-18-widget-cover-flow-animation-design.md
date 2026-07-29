# Widget Cover Flow Animation — Design

**Date:** 2026-06-18  
**Status:** Implemented  
**Scope:** Animate the Home `WidgetInsightsRail` three-card Cover Flow — iOS-style rotation with drag-follow, `prefers-reduced-motion` support. No new routes, no widget data changes, no new npm dependencies.

**References:** `components/home/widgets/WidgetCoverCarousel.tsx` · `lib/ui/homeVisual.ts` · `docs/product/PRODUCT-SPEC.md` §3 (WidgetInsightsRail)

**Brainstorming approved:** 2026-06-18 — Option 2 (single track + interpolated transforms); Cover Flow personality (scale/opacity/light rotateY); 400ms default / 0ms reduced motion; drag-follow included.

---

## 1. Problem

The current Cover Flow uses **three fixed DOM slots** (left / center / right). When `activeIndex` changes, widget **content swaps in place** while only flex ratio and height animate (`transition-all duration-300 ease-out`). The result feels abrupt:

- Cards do not physically slide; content “teleports” between slots.
- Side vs center inner styles (font size, ProgressArc, CTA lines) switch instantly.
- Swipe only fires on `touchEnd` with a 40px threshold — no finger tracking.

**Goal:** Deliver a recognizable **iOS Cover Flow** feel — side cards recede (scale + opacity + slight depth), center card is prominent, transitions rotate smoothly — while respecting Snap1099’s restrained black/yellow aesthetic and PWA mobile performance.

---

## 2. Locked decisions

| Topic | Choice |
|-------|--------|
| Visual style | iOS Cover Flow — **2D primary** (scale, opacity, translateX/Y) + light `rotateY` (±8° max) |
| Architecture | **Single horizontal track** + `translateX` centering + per-card transform interpolation |
| Duration | **400ms** default; `cubic-bezier(0.34, 1.15, 0.64, 1)` |
| Reduced motion | `prefers-reduced-motion: reduce` → **0ms** transitions; `rotateY` = 0; keep static scale/opacity depth |
| Drag-follow | **In scope** — `touchmove` offsets track; release snaps to nearest index |
| Dependencies | **None** — CSS `transform` + `opacity` only; no `framer-motion` |
| Widget data | Unchanged (`computeHomeWidgets`, slide list via `buildWidgetSlides`) |
| Interaction | Tap side → focus; tap center → open overlay; swipe L/R → next/prev (unchanged semantics) |

---

## 3. Animation model

### 3.1 Layout

```text
┌─ viewport (overflow:hidden, perspective ~900px) ─────┐
│  ┌─ track (display:flex, gap, translateX animated) ─┐ │
│  │  [slide₀] [slide₁?] [slide₂]                     │ │
│  └──────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

- **Viewport:** fixed height ~118px; retains `homeVisual.trustBar.heroFade` background.
- **Track:** holds one DOM node per slide (2 or 3 widgets). `translateX` positions the active slide at horizontal center.
- **Slide width:** derived from viewport — center card target ~36% of viewport width (max ~160px), with gap 6px (`gap-1.5`).

### 3.2 Per-card transform (offset from center)

`offset` = signed distance from focal slide: `0` = center, `-1` = left neighbor, `+1` = right neighbor. During drag, offset is fractional.

| Property | offset = 0 (center) | offset = ±1 (side) | Interpolation |
|----------|---------------------|---------------------|---------------|
| `scale` | 1.0 | 0.88 | linear |
| `opacity` | 1.0 | 0.55 | linear |
| `translateY` | 0 | +4px | linear |
| `rotateY` | 0° | −8° (left) / +8° (right) | linear; **0° when reduced motion** |
| `z-index` | 2 | 1 | step at \|offset\| < 0.5 |

All applied via a single `transform` string:  
`translateY(...) rotateY(...) scale(...)` with `transform-origin: center bottom` (cards grow from bottom edge like Cover Flow shelf).

### 3.3 Timing

| Mode | Transition duration | Easing |
|------|---------------------|--------|
| Default | 400ms | `cubic-bezier(0.34, 1.15, 0.64, 1)` |
| `prefers-reduced-motion: reduce` | 0ms | `linear` (instant) |

Properties transitioned: `transform`, `opacity` on slides; `transform` on track.

### 3.4 Focus variant for widget innards

Child widgets (`TaxDeadlineWidget`, `MissingDeductionsWidget`, `TaxYearProgressWidget`) keep `focus: "side" | "center"`:

- `|offset| < 0.35` → `"center"` (full layout, ProgressArc, CTA lines)
- else → `"side"` (compact type)

Parent passes focus derived from live offset to avoid mid-transition flicker.

---

## 4. Interaction

| Action | Behavior |
|--------|----------|
| Tap left visible card | Animate to previous slide (focus only) |
| Tap right visible card | Animate to next slide (focus only) |
| Tap center card | Open overlay: deadline-detail / missing-deductions / tax-year-detail |
| Swipe left | Next slide (existing `swipeDirection`, threshold 40px) |
| Swipe right | Previous slide |
| 1 slide | Single centered card; tap opens overlay |
| 2 slides | `carouselTriple` mirror sides (unchanged index math) |
| During animation | Ignore additional side-card taps (debounce until transition end or reduced-motion instant complete) |

### 4.1 Drag-follow

1. `touchstart` — record `startX`, `startY`, `startTranslateX`.
2. `touchmove` (horizontal dominant) — `dragOffsetPx = currentX - startX`; track `translateX = startTranslateX + dragOffsetPx`; recompute each slide’s fractional offset from geometry.
3. `touchend` — if `|dragOffsetPx| < 40px`, snap back to current index; else advance ±1 and animate to snapped `translateX`.
4. `preventDefault` not required unless passive listener issues arise; use `{ passive: true }` on start/move unless blocking scroll is needed (track has `touch-pan-x`).

---

## 5. Architecture

### 5.1 New module

**`lib/home/widgetCoverMotion.ts`** — pure functions, unit-tested:

```ts
coverFlowTransform(offset: number, options: { reducedMotion: boolean }): {
  transform: string;
  opacity: number;
  zIndex: number;
}

trackTranslateX(params: {
  activeIndex: number;
  slideCount: number;
  slideStridePx: number;
  dragOffsetPx: number;
}): number

focusFromOffset(offset: number): "side" | "center"
```

### 5.2 Modified files

| File | Change |
|------|--------|
| `components/home/widgets/WidgetCoverCarousel.tsx` | Track layout, drag state, motion hooks, `matchMedia` for reduced motion |
| `lib/ui/homeVisual.ts` | Replace `slotSide`/`slotCenter`/`cardSide`/`cardCenter` with `viewport`, `track`, `slide` tokens |
| `lib/home/widgetCoverMotion.ts` | **New** — interpolation + translate math |
| `lib/home/widgetCoverMotion.test.ts` | **New** — offset boundaries, reduced motion, translateX |
| `app/globals.css` | `@media (prefers-reduced-motion: reduce)` rules for `.widget-cover-*` transition overrides |

**Unchanged:** `widgetCarouselSlots.ts`, widget compute modules, overlay routing, `WidgetStack.tsx` API.

### 5.3 `homeVisual.widgetCover` tokens (target)

```ts
widgetCover: {
  shell: "shrink-0 touch-pan-x pb-1 pt-0.5",
  viewport: "relative mx-auto h-[118px] w-full overflow-hidden",
  track: "flex h-full items-end gap-1.5 px-2 will-change-transform",
  slide: "shrink-0 origin-bottom",
  slideButton:
    "block w-full overflow-hidden rounded-2xl text-left active:scale-[0.98]",
  transition: "transition-[transform,opacity] duration-[400ms] ease-[cubic-bezier(0.34,1.15,0.64,1)]",
  transitionReduced: "motion-reduce:transition-none motion-reduce:duration-0",
}
```

---

## 6. Accessibility & performance

### 6.1 Accessibility

- Keep `role="region"`, `aria-roledescription="carousel"`, `aria-label="Tax insights"`.
- `aria-current="true"` on the focal slide button only.
- Reduced motion: instant index changes; no loss of information (side vs center styling still communicates hierarchy statically).

### 6.2 Performance

- Animate **only** `transform` and `opacity` (GPU-friendly).
- Set `will-change: transform` on track during drag/transition; remove on `transitionend`.
- Slide count ≤ 3 — no virtualization needed.

---

## 7. Testing

### 7.1 Unit

- `widgetCoverMotion.test.ts`:
  - `offset 0` → scale 1, opacity 1, rotateY 0
  - `offset ±1` → scale 0.88, opacity 0.55, rotateY ∓8°
  - `reducedMotion: true` → rotateY always 0
  - `focusFromOffset(0.2)` → side; `focusFromOffset(0.4)` → center
  - `trackTranslateX` centers index 0/1/2 for 3 slides

### 7.2 Manual

- 3 slides (with Missing): swipe, tap sides, tap center → correct overlay.
- 2 slides (no Missing): sides mirror; no layout jump.
- 1 slide: centered; tap opens overlay.
- Enable **Reduce Motion** in OS: switches are instant; cards still show depth via scale/opacity.
- Low-end mobile: no visible jank during drag.

---

## 8. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-W1 | Switching slides animates horizontal track movement; content no longer teleports between fixed slots |
| AC-W2 | Side cards appear smaller, dimmer, and slightly lower than center (Cover Flow depth) |
| AC-W3 | Default transition 400ms with agreed easing |
| AC-W4 | `prefers-reduced-motion: reduce` → 0ms transition, no rotateY |
| AC-W5 | Horizontal drag follows finger; release snaps or returns per 40px threshold |
| AC-W6 | Tap side focuses; tap center opens existing overlay — behavior unchanged |
| AC-W7 | `npm run test:unit` passes including new motion tests |
| AC-W8 | No new npm dependencies |

---

## 9. Out of scope

- Auto-rotate / autoplay carousel
- Full 3D Cover Flow (`rotateY > 15°`, heavy perspective)
- Widget metric or copy changes
- Moving WidgetInsightsRail out of fixed chrome
- Framer Motion or other animation libraries
