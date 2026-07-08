# TaxHeader Hero Card — Design

**Date:** 2026-06-18  
**Status:** Approved (brainstorming)  
**Scope:** Replace v2 black-card + shield hero with photo background inside the existing rounded card shell. No changes to Snap, privacy, widgets, filters, or export gates.

**Supersedes (partial):** `docs/superpowers/specs/2026-06-17-home-v2-first-screen-design.md` §1 (black card + shield → photo hero card).

**Reuses:** `docs/superpowers/specs/2026-06-07-home-hero-photo-design.md` (asset, overlay stack, `bg-[85%_center]`).

---

## Summary

Restore `/photo/hero.png` as the **background inside** the v2 `rounded-2xl` TaxHeader card. Remove the decorative shield icon. Keep CPA/IRS Ready + Settings in the top-right. Height remains **content-driven** (no `min-h-[132px]` / `max-h-[24vh]`).

---

## Decisions

| Topic | Choice |
|-------|--------|
| Layout | **A** — Card-contained hero (v2 shell + photo bg) |
| Overlay | **A** — Full three layers: photo → black vignette → yellow brand tint |
| Shield | **Remove** — no `TaxShieldIcon` in header |
| Height | Content-driven (`py-3`); no fixed min/max vh |
| Asset | `/photo/hero.png` (public, offline-safe) |
| Image position | `bg-cover bg-no-repeat bg-[85%_center]` — face on right |
| Actions | CPA/IRS Ready + Settings unchanged; Sync/Filter stay removed |

---

## Visual structure

```
┌─ heroCard (rounded-2xl, overflow-hidden, border-zinc-800) ─────┐
│ [z-0] Layer 1 — hero.png (bg-cover, 85% center)                │
│ [z-0] Layer 2 — heroOverlay (left dark + bottom fade)          │
│ [z-0] Layer 3 — heroTint (brand yellow wash)                   │
│ [z-10] Content row (relative)                                  │
│   Left:  ESTIMATED TAX SAVED · $amount · receipts • tracked    │
│   Right: CPA/IRS Ready · Settings (optional Install)           │
└────────────────────────────────────────────────────────────────┘
```

Left text must remain legible on all supported phones. Worker portrait visible on the right; shield column removed entirely.

---

## `homeVisual` tokens

Consolidate under `heroCard`; un-deprecate photo tokens.

| Token | Purpose |
|-------|---------|
| `heroImage` | `"/photo/hero.png"` |
| `heroOverlay` | Left vignette + bottom fade (existing gradient string) |
| `heroTint` | Brand yellow tint (existing gradient string) |
| `heroCard.shell` | `mx-4 mt-2 shrink-0 relative overflow-hidden rounded-2xl border border-zinc-800` — **no** `bg-zinc-900` |
| `heroCard.image` | Tailwind classes for cover + position |

**Remove:** `heroCard.shield` (and all shield color references).

---

## Component changes

| File | Change |
|------|--------|
| `lib/ui/homeVisual.ts` | Un-deprecate `heroImage`, `heroOverlay`, `heroTint`; update `heroCard.shell`; drop `shield` |
| `components/home/TaxHeader.tsx` | Three absolute background layers + `relative z-10` content; remove `TaxShieldIcon` import/render |
| `components/icons/TaxShieldIcon.tsx` | **Delete** (no other consumers) |
| `docs/product/PRODUCT-SPEC.md` | §3 fixed chrome: TaxHeader = photo hero card, no shield |
| `docs/superpowers/specs/2026-06-17-home-v2-first-screen-design.md` | §1 note: superseded by this spec for hero treatment |

**Unchanged:** `HomeScreen`, `OfflineHomeShell` structure (both already render `TaxHeader`); export gate, Aha coach overlay, PWA install button.

---

## Out of scope

- Snap button, InlinePrivacyNote, WidgetPager, receipt list
- New hero asset or crop
- Header Sync / Filter restoration
- `next/image` migration (CSS background sufficient for PWA offline public path)

---

## Acceptance criteria

1. TaxHeader card shows hero photo with worker portrait on the right.
2. Left column: title, yellow amount, receipts • tracked — readable with overlay stack.
3. No shield icon anywhere in TaxHeader.
4. CPA/IRS Ready + Settings buttons remain top-right with v2 styling.
5. Card height follows content; no empty min-height band below text.
6. Offline shell matches online hero appearance.
7. `/photo/hero.png` loads without network (public asset).

---

## Spec self-review

- **Placeholders:** None.
- **Consistency:** Aligns with card layout A + overlay A from brainstorming; height rule matches `2026-06-17-home-header-snap-spacing-design.md`.
- **Scope:** Single component + tokens + doc touch-ups; one implementation task batch.
- **Ambiguity:** Background uses CSS `background-image` inline style or Tailwind arbitrary value with `heroImage` URL — implementer picks; both valid.
