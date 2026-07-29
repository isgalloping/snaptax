# Home Hero Photo Background — Design

**Date:** 2026-06-07  
**Status:** Approved  

## Summary

Replace CSS-only wealth hero gradient with `public/photo/hero.png` + overlay matching UI mockup. Left text legible; worker portrait visible on right; bottom fades to black.

## Decisions

| Topic | Choice |
|-------|--------|
| Asset | `/photo/hero.png` |
| Overlay | Left dark vignette + bottom fade (not yellow wash) |
| Image position | `bg-[85%_center]` — face on right |
| Header height | `min-h-[132px] max-h-[24vh]` |

## Layers

1. Photo — `heroImage` (`/photo/hero.png`)
2. Black vignette — `heroOverlay` (left + bottom fade)
3. Brand yellow tint — `heroTint` (stacked above overlay, option C)
4. Content — Tax Saved + actions

## Decisions (update)

| Topic | Choice |
|-------|--------|
| Gradient stack | **C** — photo + black vignette + yellow brand tint |

## Files

- `lib/ui/homeVisual.ts` — `heroImage`, `heroOverlay`
- `components/home/TaxHeader.tsx` — dual-layer background

## Acceptance

- Matches reference mockup: photo + readable left text
- Offline loads from public/
- `npx next build` passes
