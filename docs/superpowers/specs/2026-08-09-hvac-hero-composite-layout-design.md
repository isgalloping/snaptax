# HVAC Hero Composite Layout — Design

**Date:** 2026-08-09  
**Status:** Approved (brainstorming + grill-me 2026-08-09)  
**Related:** `docs/superpowers/specs/2026-08-09-hvac-seo-landing-design.md`  
**Branch context:** follow-up to HVAC SEO landing (`/tax-deductions/hvac`)

## 1. Problem

HVAC `phoneImage` is a **landscape three-phone composite** (~3:2). `IndustryHero` renders it in a **portrait single-phone slot** (`w-[55%] max-w-[16–18rem]`), so the right visual column looks sparse: the red-box area is mostly empty and the product mock is too small relative to the H1 block.

## 2. Locked decisions

| Topic | Decision |
|-------|----------|
| Composition | Keep worker photo **and** three-phone composite |
| Scale | Three-phone near **full width of right column**; visual height roughly aligns with left copy block (H1 → trust row) |
| Worker treatment | **Small overlay** at bottom-left / slightly behind the composite (not side-by-side 40/55) |
| Scope | **HVAC only** via explicit `hero.visualLayout` — electrician unchanged |
| Narrow screens | Same composite + overlay; three-phone `w-full` |
| Assets | Re-export mobile PNG to ~**1200w** from source; keep runtime path |
| Desktop grid (composite) | About `1fr \| 1fr` (not the default `1.1fr \| 0.9fr`) |
| Approach | Data-driven `"stacked" \| "composite"` (default stacked when omitted) |

## 3. Architecture

### Types — `lib/marketing/seo/types.ts`

```ts
hero: {
  // ...existing fields...
  /**
   * stacked (default): worker + phone side-by-side (electrician).
   * composite: full-width phoneImage with workerImage as corner overlay (HVAC).
   */
  visualLayout?: "stacked" | "composite";
};
```

### Data

- `industries/hvac.ts`: set `visualLayout: "composite"` (requires existing `phoneImage` + `workerImage`).
- `industries/electrician.ts`: omit field → stacked behavior.

### Component — `components/marketing/seo/IndustryHero.tsx`

- Branch on `page.hero.visualLayout === "composite"`.
- **Stacked (default):** keep current markup/CSS.
- **Composite:**
  - Outer grid at `lg`: `grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`.
  - Right column: single relative container, `w-full` (no `max-w-[16rem]` / `18rem` on the phone).
  - Base layer: `phoneImage` full width of container.
  - Overlay: `workerImage` absolutely positioned `bottom` + `left` with inset, width **~28–34%** of container (~30% desktop), rounded border + shadow matching current worker card, higher z-index than phone.
- No new page/route components. No `slug === "hvac"` hardcode.

### Assets

- Source: `docs/seo/hvac/hvac.0.0.1-mobile.png` (1536×1024 when present).
- Output (overwrite): `public/marketing/seo/hvac-tax-deductions-snaptax-mobile.png` at ~**1200** width, optimized PNG.
- `hvac.ts` `phoneImage.src` path **unchanged**.
- Update `docs/seo/hvac/ASSETS.md` note if width guidance changes.

## 4. Responsive

| Breakpoint | Behavior |
|------------|----------|
| `< lg` | Copy above visual; phone `w-full`; worker overlay still bottom-left |
| `≥ lg` | Two columns ~equal; phone fills right column; overlay ~30% width |

CTA row stays in the left (copy) column — overlay must not cover CTAs.

## 5. Accessibility

- Keep meaningful `alt` on both images (existing HVAC strings).
- Decorative blur/glow behind phone (if retained) stays `aria-hidden`.
- No new interactive overlays or focus traps.

## 6. Out of scope

- Copy / SEO title-meta-H1 / FAQ / other sections
- Electrician default hero redesign
- Plumber or other trades until they opt into `composite`
- Replacing the three-phone asset with a single portrait phone

## 7. Acceptance

- [ ] `/tax-deductions/hvac`: three-phone mock clearly larger; right column not dominated by empty space
- [ ] Worker thumb readable at bottom-left; does not obscure critical phone UI
- [ ] `/tax-deductions/electrician` pixel-equivalent side-by-side layout vs pre-change
- [ ] Runtime mobile asset ~1200w at existing filename
- [ ] Narrow viewport: full-width phone + same overlay pattern

## 8. Implementation notes

- Prefer a small conditional in `IndustryHero` over a second hero component.
- Optional: unit/smoke assert `getIndustryBySlug("hvac")?.hero.visualLayout === "composite"` and electrician omits / is not composite.
- Ship as follow-up on HVAC SEO branch or a short fix PR against the same landing.
