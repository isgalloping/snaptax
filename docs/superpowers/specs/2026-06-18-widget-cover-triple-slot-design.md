# Widget Cover Flow Triple-Slot Layout — Design

**Date:** 2026-06-18  
**Status:** Approved (design)  
**Scope:** Fix Home `WidgetInsightsRail` empty left/right gaps on first paint — always show three carousel slots (left peek · center focus · right peek) with cyclic widget rotation. Builds on [`2026-06-18-widget-cover-flow-animation-design.md`](./2026-06-18-widget-cover-flow-animation-design.md).

**References:** `components/home/widgets/WidgetCoverCarousel.tsx` · `lib/home/widgetCarouselSlots.ts` · `lib/home/widgetCoverMotion.ts`

**Brainstorming approved:** 2026-06-18 — Fixed triple-slot + `carouselTriple`; 2-slide mirror (option A); no empty side gutters.

---

## 1. Problem

After the track-based Cover Flow animation refactor, widgets are laid out in a **linear row** `[slide₀, slide₁, slide₂]` and centered with `trackTranslateX`. When `activeIndex === 0`, there is no slide to the left of index 0 in the row — the viewport shows **black empty space** on the left (Figure 1). Only the center and partial right card are visible.

**Expected (Figure 2):** At all times when `slides.length ≥ 2`, the user sees **three positions** filled: left peek · center focus · right peek, with cyclic wrap (e.g. when Deadline is centered, Progress peeks left and Missing peeks right).

**Root cause:** Linear indexing cannot represent circular adjacency without modulo positioning or a fixed triple-slot model.

---

## 2. Locked decisions

| Topic | Choice |
|-------|--------|
| Layout model | **Fixed triple slots** (left / center / right) with `carouselTriple(activeIndex, n)` |
| 2 slides (no Missing) | **Mirror side** — `carouselTriple` returns `[side, center, side]` (option A) |
| 1 slide | Single centered card; tap opens overlay |
| Animation | Reuse `coverFlowTransform` at offsets −1 / 0 / +1; 400ms easing; drag-follow |
| Reduced motion | Unchanged — 0ms transitions, no `rotateY` |
| Side gutters | **Remove** track horizontal padding that causes visible black gutters; slots use flex % of full viewport width |

---

## 3. Layout model

### 3.1 Structure

```text
viewport (w-full, overflow:hidden, perspective)
└─ track (flex, items-end, justify-center, w-full, NO px-2)
   ├─ slotLeft   — flex basis ~31%, offset −1
   ├─ slotCenter — flex basis ~36%, offset  0
   └─ slotRight  — flex basis ~31%, offset +1
```

Each slot renders **one button** whose content comes from `slides[carouselTriple(activeIndex, n)[slot]]`.

### 3.2 `carouselTriple` mapping (unchanged)

| `slides.length` | `activeIndex` | `[left, center, right]` indices |
|-----------------|---------------|----------------------------------|
| 3 | 0 | [2, 0, 1] |
| 3 | 1 | [0, 1, 2] |
| 3 | 2 | [1, 2, 0] |
| 2 | 0 | [1, 0, 1] |
| 2 | 1 | [0, 1, 0] |
| 1 | * | [0, 0, 0] |

### 3.3 Per-slot motion

Slot role maps directly to Cover Flow offset:

| Slot | Base offset | `coverFlowTransform` | `focusFromOffset` |
|------|-------------|----------------------|-------------------|
| left | −1 | side scale/opacity/rotateY | `"side"` |
| center | 0 | center | `"center"` |
| right | +1 | side (mirror) | `"side"` |

During drag, apply **fractional offset** to all three slots:  
`effectiveOffset = baseOffset + dragFraction` where `dragFraction = dragOffsetPx / stridePx` (clamped during drag only; snap on release).

### 3.4 Slide stride for drag math

`stridePx = viewportWidth * 0.34` (approximate center slot width) — used only for drag threshold and fractional offset, not for absolute positioning.

---

## 4. Interaction

| Action | Behavior |
|--------|----------|
| Tap left slot | `setActiveIndex(adjacentIndex(safeIndex, -1, n))` |
| Tap right slot | `setActiveIndex(adjacentIndex(safeIndex, 1, n))` |
| Tap center slot | Open overlay for `slides[safeIndex]` |
| Swipe / drag | Same as current: follow finger; 40px threshold; snap ±1 |
| `slides.length <= 1` | Center only; tap opens overlay |
| During animation | Ignore redundant side taps (`isAnimating` guard) |

**Remove:** linear `trackTranslateX` centering of the full row; optional keep `trackTranslateX` only if needed for drag visual — prefer **per-slot transform interpolation** via `effectiveOffset`.

---

## 5. Architecture

### 5.1 Modified files

| File | Change |
|------|--------|
| `components/home/widgets/WidgetCoverCarousel.tsx` | Revert to triple-slot render + `carouselTriple`; drag applies fractional offset to slot transforms |
| `lib/ui/homeVisual.ts` | Restore slot flex tokens (`slotLeft`, `slotCenter`, `slotRight`); remove track `px-2`; keep `slideMotion` / `slideButton` |
| `lib/home/widgetCoverMotion.ts` | Add `slotOffset(baseOffset, dragFraction)` helper (optional, testable) |

**Unchanged:** `widgetCarouselSlots.ts`, `WidgetStack.tsx`, widget compute modules, `Tax*Widget.tsx`, `globals.css` reduced-motion rules.

### 5.2 `homeVisual.widgetCover` target tokens

```ts
widgetCover: {
  shell: "widget-cover-shell shrink-0 touch-pan-x pb-1 pt-0.5",
  viewport:
    "widget-cover-viewport relative mx-auto h-[118px] w-full overflow-hidden [perspective:900px]",
  track: "widget-cover-track flex h-full w-full items-end justify-center gap-1.5",
  slotLeft:
    "widget-cover-slot-left min-w-0 max-w-[31%] flex-[0.88] origin-bottom",
  slotCenter:
    "widget-cover-slot-center min-w-0 max-w-[36%] flex-[1.12] origin-bottom",
  slotRight:
    "widget-cover-slot-right min-w-0 max-w-[31%] flex-[0.88] origin-bottom",
  slideButton:
    "widget-cover-slide-btn block h-full w-full overflow-hidden rounded-2xl text-left active:scale-[0.98]",
  slideMotion:
    "widget-cover-slide-motion transition-[transform,opacity,height] duration-[400ms] ease-[cubic-bezier(0.34,1.15,0.64,1)]",
}
```

Remove unused: `trackMotion`, linear `slide` width tokens.

---

## 6. Accessibility & performance

- `aria-current="true"` on center slot button only.
- `role="region"`, `aria-roledescription="carousel"`, `aria-label="Tax insights"` unchanged.
- Animate `transform` + `opacity` only; `will-change` during drag/transition.
- 2-slide mirror: both side slots may show same widget — only center gets `aria-current`; side slots are focus targets, not duplicate announcements (same slide content is acceptable for MVP).

---

## 7. Testing

### 7.1 Unit

- `slotOffset(-1, 0.5)` → −0.5 (if helper added)
- Existing `carouselTriple` tests remain sufficient for index mapping
- Existing `coverFlowTransform(±1|0)` tests unchanged

### 7.2 Manual

| Case | Expected |
|------|----------|
| 3 slides, `activeIndex=0` | Left: Progress peek · Center: Deadline · Right: Missing peek — **no left black gap** |
| 3 slides, swipe to index 1 | Cyclic rotation; always three filled slots |
| 2 slides (no Missing) | Mirror sides; no empty gutters |
| 1 slide | Centered single card |
| Reduce motion | Instant snap; static depth |

---

## 8. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-T1 | On first paint with 3 widgets, left and right slots show adjacent cards — no empty black column (matches Figure 2) |
| AC-T2 | Widget rotation is cyclic through all slides |
| AC-T3 | 2-slide mode mirrors side slot per `carouselTriple` |
| AC-T4 | Cover Flow scale/opacity/rotateY preserved on side vs center |
| AC-T5 | Drag-follow and 40px snap unchanged |
| AC-T6 | Tap side focuses; tap center opens overlay |
| AC-T7 | `npm run test:unit` passes |

---

## 9. Out of scope

- Auto-play carousel
- Changing widget metrics or copy
- Moving WidgetInsightsRail out of fixed chrome
- New npm dependencies
