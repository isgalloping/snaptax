# Home Header–Snap Spacing — Design

**Date:** 2026-06-17  
**Status:** Approved  
**Scope:** Restore TaxHeader hero photo with content-driven height; move TrustBar below Snap; align fixed chrome with `docs/ui/snaptax-home-ui.png`.

## Problem

Large perceived gap between TaxHeader and Snap button (~85–100px on typical phones). Root causes:

1. **TrustBar between Header and Snap** (~48–52px) — introduced in #56 for hero-fade衔接
2. **`min-h-[132px]` on TaxHeader** (~35–45px dead space below text content)
3. Hero photo itself does not add inter-component spacing

Removing hero alone (2684cd8) bundled min-height removal; gap reduction was mostly from height token, not photo removal.

## Decisions

| Topic | Choice |
|-------|--------|
| Hero photo | **Restore** — `/photo/hero.png` + overlay + tint per `2026-06-07-home-hero-photo-design.md` |
| Header height | **Content-driven** — remove `min-h-[132px] max-h-[24vh]` |
| Fixed chrome order | **TaxHeader → Snap → TrustBar → WidgetPager** (match home UI mockup) |
| TrustBar styling | Solid `bg-black` + hairline top border; remove `heroFade` gradient |
| Snap / WidgetPager | Unchanged |

## Layout

```
┌─ Fixed (no scroll) ─────────────────────────────┐
│ TaxHeader (hero bg, content height)              │
│ SnapButton (full-width yellow)                   │
│ TrustBar (slim privacy strip)                    │
│ WidgetPager                                      │
├─ Scroll: receipt list ────────────────────────────┤
```

## Files

| File | Change |
|------|--------|
| `components/home/TaxHeader.tsx` | Restore hero layers; drop min/max vh height |
| `components/home/HomeScreen.tsx` | TrustBar after Snap block |
| `components/home/OfflineHomeShell.tsx` | Same reorder |
| `components/home/TrustBar.tsx` | Plain black background |
| `docs/product/PRODUCT-SPEC.md` | Update fixed chrome order |

## Acceptance

- Snap yellow button sits directly under TaxHeader text (~8–12px padding gap)
- Hero worker portrait visible on right; left text legible
- TrustBar still visible on first screen below Snap
- Offline shell matches online order
