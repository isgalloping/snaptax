# Home Widget Pager — Design

**Date:** 2026-06-18  
**Status:** Approved (design)  
**References:** `docs/superpowers/specs/2026-06-17-home-dashboard-redesign-design.md`  
**Scope:** Move widgets to fixed zone below Snap; paginated 3-across layout with swipe when >3 widgets; remove carousel animation and unequal sizing.

## Summary

Refactor the home dashboard widget area from a horizontally scrolling equal-width card track (inside the scroll region) to a **fixed pager** directly under Snap. Each page shows up to three widgets in a single row with equal column widths. When more than three widgets are visible, users swipe left/right between full pages. Receipt list scrolls independently below.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Widget zone scroll | **Fixed** below Snap; only receipt list scrolls |
| CPA Ready | Same pager; appears on page 2 when 4 widgets visible |
| 3 widgets on page | Equal **33.3%** width each |
| 2 widgets on page | Equal **50%** width each |
| 1 widget on page | **100%** width |
| ≤3 total widgets | Single page; **no swipe**, no page dots |
| >3 total widgets | Horizontal swipe between pages; page indicator dots |
| Animation | Remove `scroll-smooth` and per-card snap carousel; use instant page `scroll-snap` only when paginated |
| Unequal 30/40/30 layout | **Removed** — no center-emphasis sizing |

## Layout architecture

```
┌─ Fixed (no vertical scroll) ────────────────────┐
│ TaxHeader                                        │
│ TrustBar                                         │
│ SnapButton                                       │
│ WidgetPager  ← NEW fixed slot                    │
├─ Scroll (flex-1 min-h-0 overflow-y-auto) ───────┤
│ ReceiptFilterBar + ReceiptList                   │
└──────────────────────────────────────────────────┘
```

### PRODUCT-SPEC update

§2.1 fixed chrome becomes: **TaxHeader + TrustBar + Snap + WidgetPager**. Scroll region is **receipt list only** (filter bar remains at top of scroll region).

Onboarding overlays (SnapFocusRing, SnapTooltip) remain anchored to Snap; WidgetPager sits below Snap padding block.

## Widget inventory & order

Widgets are assembled in this fixed order before pagination:

1. **Tax Deadline** — always
2. **Missing Deductions** — only when `missing.length > 0`
3. **Tax Year Progress** — always
4. **CPA Ready** — only when `showCpaReady`

CTA behavior unchanged: each card opens its existing home overlay; CPA Ready **Export** uses `handleExportClick` / `useTaxExportGate`.

## Pagination rules

**Module:** `lib/home/buildWidgetPages.ts` (pure function, unit-tested)

- Chunk visible widgets into pages of **max 3**, preserving order.
- Examples:

| Visible widgets | Page 1 | Page 2 |
|-----------------|--------|--------|
| D + M + P | D, M, P @ 33% | — |
| D + P (no Missing) | D, P @ 50% | — |
| D + M + P + CPA | D, M, P @ 33% | CPA @ 100% |
| D + P + CPA | D, P @ 50% | CPA @ 100% |

Column width helper:

- `count === 1` → `flex: 1 1 100%`
- `count === 2` → `flex: 1 1 50%`
- `count === 3` → `flex: 1 1 33.333%`

## Interaction

| Condition | Behavior |
|-----------|----------|
| `pageCount === 1` | Static row; `overflow-x: hidden`; no dots |
| `pageCount > 1` | Horizontal scroll container, one page = `100%` track width, `scroll-snap-type: x mandatory`, `scroll-snap-align: start` on each page |
| Swipe | Native touch pan-x; **no** `scroll-smooth` |
| Page dots | Rendered below pager when `pageCount > 1`; active dot `#EAB308`, inactive `#52525b`, `6px` diameter |
| Active dot sync | `scroll` listener + `IntersectionObserver` or scroll position / page width math |

Card press feedback: keep `active:scale-[0.98]` on widget buttons.

## Visual tokens

Update `lib/ui/homeVisual.ts`:

- Deprecate `widgetCarousel.track` / `widgetCarousel.slide` fixed `38vw` sizing.
- Add `widgetPager`:

| Token | Value |
|-------|-------|
| `container` | `shrink-0 px-4 pb-2` |
| `viewport` | `overflow-x-auto overscroll-x-contain` (+ `snap-x snap-mandatory` when paginated) |
| `page` | `flex w-full shrink-0 snap-start gap-2` |
| `cardBase` | `h-[104px] rounded-2xl border p-3 min-w-0` |
| `dots` | flex row centered, `gap-1.5`, `mt-2` |

Widget color tokens (`homeVisual.widgets.*`) unchanged.

## Components

| Path | Action |
|------|--------|
| `lib/home/buildWidgetPages.ts` | **New** — page chunking + width class helper |
| `lib/home/buildWidgetPages.test.ts` | **New** |
| `components/home/widgets/WidgetPager.tsx` | **New** — replaces carousel layout in `WidgetStack` |
| `components/home/widgets/WidgetStack.tsx` | **Modify** — delegate to `WidgetPager` or merge |
| `components/home/widgets/*Widget.tsx` | **Modify** — remove `homeVisual.widgetCarousel.slide` width; accept flex from parent |
| `components/home/HomeScreen.tsx` | **Modify** — move widgets to fixed chrome below Snap |
| `components/home/HomeScrollRegion.tsx` | **Modify** — remove `header` prop |
| `lib/ui/homeVisual.ts` | **Modify** — pager tokens |
| `docs/product/PRODUCT-SPEC.md` | **Modify** — fixed vs scroll zones |

**Out of scope:** widget data computation, overlay flows, TrustBar position, Export gate.

## Edge cases

1. **Zero receipts:** widgets still render placeholder metrics; pager layout unaffected.
2. **Missing hidden:** page 1 uses 50/50 for Deadline + Progress.
3. **Only CPA on page 2:** single card at 100% width on page 2.
4. **Vertical scroll conflict:** pager is outside scroll region — no nested scroll fight with receipt list.
5. **OfflineHomeShell:** does not use `WidgetStack` today — no change required.

## Testing

### Unit (`buildWidgetPages`)

- 4 widgets → 2 pages (3 + 1)
- 3 widgets → 1 page
- 2 widgets (no Missing) → 1 page, width tier `half`
- Order preserved

### Manual smoke

1. Fixed chrome: scroll receipt list — widgets stay pinned under Snap.
2. Filing season with CPA Ready: swipe to page 2, Export works.
3. No Missing deductions: two widgets at 50% on page 1.
4. ≤3 widgets total: no dots, no horizontal scroll.
5. Page dots track active page on swipe.

## Success criteria

- Widgets visually anchored under Snap; list scrolls independently.
- No smooth-scroll carousel animation; no center-large card sizing.
- Pagination matches locked decision table.
- Existing widget CTAs and overlays unchanged.
