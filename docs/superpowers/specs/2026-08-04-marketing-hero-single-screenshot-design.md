# Marketing Hero — Single App Screenshot — Design

**Date:** 2026-08-04  
**Status:** Approved (brainstorming)  
**Scope:** Replace dual phone mockups in marketing hero center column with one PWA home screenshot

---

## Problem

The marketing landing hero (`/`) shows two overlapping phone mockups (home + export) in the center column. The current home screenshot is outdated relative to the shipped PWA UI (Est. Tax Saved header, widget pager, receipt list with filters).

Goal: replace the red-box area (center column phone mockups) with a single screenshot of the current app home screen. All other hero content stays unchanged.

---

## Goals

| Area | Change |
|------|--------|
| Hero center column | Single phone screenshot (current PWA home) |
| Hero left column | No change (headline, checklist, CTAs, trust strip) |
| Hero right column | No change (4 value props) |
| Background / header | No change |

**Out of scope**

- OG image (`/marketing/hero-phone.png`)
- Pricing page or other marketing routes
- Live-rendered React screenshot of `/app` (static PNG only)
- Removing `hero-app-export.png` from repo (file may remain; hero stops referencing it)

---

## Approach (selected)

**Replace asset + simplify hero to single image** (Scheme A).

Rejected:

- **New filename keeping old asset** — unnecessary duplicate unless rollback needed
- **Swap PNG only, keep dual layout** — contradicts single-screenshot requirement

---

## Visual & layout

```
[Left: copy/CTA]  |  [Single screenshot]  |  [Right: value props]
                         ↑
                    former red-box area
```

- Centered single `Image` with existing green glow blur (`accentGreen`)
- Keep `rounded-[1.35rem] border border-white/10 shadow-2xl`
- Remove second phone, dual `flex`, `translate-y-8/10`, and yellow ring on export phone
- Width: `max-w-[24rem] sm:max-w-[26rem] xl:max-w-[27rem]` (adjust only if needed for balance; do not change 3-column grid)

---

## Implementation

### Asset

| Item | Value |
|------|-------|
| Source | User-provided PWA home screenshot (Est. Tax Saved $460.57, SNAP RECEIPT, widgets, receipt list) |
| Target path | `public/marketing/hero-app-home.png` (overwrite) |
| `alt` | Describe current home UI: estimated tax saved, receipt capture, widgets, recent receipts |

Record actual pixel `width` / `height` in `heroScreens.ts` after replacing the file.

### Code

**`lib/marketing/heroScreens.ts`**

```ts
export const MARKETING_HERO_SCREENS = [
  {
    id: "home",
    src: "/marketing/hero-app-home.png",
    alt: "SnapTax home screen showing estimated tax saved, widgets, and recent receipts",
    width: <actual>,
    height: <actual>,
  },
] as const;
```

Remove `export` screen entry.

**`components/marketing/MarketingHero.tsx`**

- Replace dual-phone block with single centered `Image` using `MARKETING_HERO_SCREENS[0]`
- Preserve outer glow wrapper and column positioning

**`lib/marketing/hero.test.ts`**

- Assert `MARKETING_HERO_SCREENS.map(s => s.id)` equals `["home"]`
- Assert home `src` matches `/hero-app-home\.png$/`
- Remove export screen assertions

---

## Testing

| Type | Command / action |
|------|------------------|
| Unit | `npm run test:unit -- lib/marketing/hero.test.ts` |
| Manual | `/` on desktop, tablet, mobile — single phone centered; left/right columns unchanged |

---

## Success criteria

- [ ] Hero center shows one screenshot matching current PWA home UI
- [ ] No second export phone in hero
- [ ] Left headline, checklist, CTAs, trust strip unchanged
- [ ] Right four value props unchanged
- [ ] Hero background and site header unchanged
- [ ] Unit tests pass
