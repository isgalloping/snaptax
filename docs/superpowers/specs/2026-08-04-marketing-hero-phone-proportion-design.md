# Marketing Hero — Phone Mockup Proportion Fix — Design

**Date:** 2026-08-04  
**Status:** Approved (brainstorming)  
**Scope:** Adjust center-column single phone mockup width and alignment to match pre-dual-removal visual balance

---

## Problem

After replacing dual phone mockups with a single PWA home screenshot (#198), the hero center column feels visually unbalanced: the phone appears too narrow with excess side padding. The red-box area no longer matches the coordinated footprint of the previous dual-phone layout.

Screenshot asset is correct; layout CSS is the issue.

---

## Goals

| Item | Change |
|------|--------|
| Center phone width | Increase max-width breakpoints |
| Center phone alignment | Restore `ml-auto` (right-biased, toward value props) |
| Screenshot asset | No change |
| Left/right columns, background, header | No change |
| Dual-phone layout | Not restored |

---

## Approach (selected)

**Scheme A — Scale up + restore old alignment**

Increase single-phone `max-w` and replace `mx-auto` with `ml-auto` on the inner image container, matching the previous dual-phone column’s right bias and visual mass.

Rejected:

- **Scale only, stay centered** — still leaves awkward side gaps in the middle grid column
- **~52% container width (one old phone)** — narrower, worsens the stated problem

---

## Implementation

**File:** `components/marketing/MarketingHero.tsx` (center column only)

Replace inner image wrapper:

```tsx
// Before (current)
<div className="relative mx-auto w-full max-w-[24rem] sm:max-w-[26rem] xl:max-w-[27rem]">

// After
<div className="relative ml-auto w-full max-w-[28rem] sm:max-w-[30rem] xl:max-w-[32rem]">
```

Keep unchanged:
- Outer column wrapper (`lg:justify-self-end`, green glow blur)
- `Image` props, `rounded-[1.35rem] border shadow-2xl`
- Three-column grid and all copy/CTA blocks

Optional fine-tune after deploy: ±1rem on xl if preview still feels tight.

---

## Testing

| Type | Action |
|------|--------|
| Manual desktop | `/` — phone right-aligned; width comparable to old dual-phone cluster |
| Manual mobile | Stacked hero; image scales down, no horizontal overflow |
| Unit | No new tests (CSS-only) |

---

## Success criteria

- [ ] Center phone visually fills the former red-box area better on desktop
- [ ] Phone aligns right within middle column (`ml-auto`)
- [ ] Single screenshot content unchanged
- [ ] Left/right hero content unchanged
