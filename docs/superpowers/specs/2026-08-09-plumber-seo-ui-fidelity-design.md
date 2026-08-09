# Plumber SEO UI Fidelity — Design

**Date:** 2026-08-09  
**Status:** Approved (brainstorming 2026-08-09)  
**Baseline UI:** `docs/seo/plumber/plumber.0.0.1.png`  
**Supersedes (Hero composition only):** spotlight description in `2026-08-09-plumber-seo-landing-design.md` §4 — that section treated `workerImage` as a right-column card; this design makes it a **full-bleed hero background**.  
**Keeps:** SEO copy locks, honesty rules, CTAs, FAQ×7 (incl. mileage), assets paths, plumber-only scope from the landing design.

---

## 1. Decision summary

| Topic | Decision |
|-------|----------|
| Scope | **Full-page structural** alignment to PNG (not Hero-only) |
| Fidelity | High structural fidelity; simplified SVG icons OK — no pixel-cropping icons from PNG |
| Surface | **Plumber only** via `presentation: "mockup"` (+ existing `visualLayout: "spotlight"`); electrician/HVAC unchanged |
| Hero background | `workerImage` → full-bleed `object-cover` background + dark scrim (~60–70% black) |
| Right column | Highlights only — **no** separate worker photo card |
| Left column order | pill → H1 (`organized.` accent) → body → **trust checks** → primary/secondary CTAs |
| Reference | Strict IA/composition match to `plumber.0.0.1.png` |

### Explicitly out of scope

- Changing electrician or HVAC layouts
- Pixel-perfect icon bitmaps extracted from the mock
- Changing locked Title / Meta / H1 / FAQ honesty / CTA targets
- Reintroducing “Smart Plumbing Categories” / fake trade tax categories
- New routes or content-cluster pages

---

## 2. Problem

Shipped Plumber spotlight Hero places `workerImage` as a rounded card in the right column on a flat black section. The approved UI uses that photo as the **entire Hero backdrop**, with copy, phone, and highlights layered on top. Below the fold, shared section defaults (3-col deduction cards, single-column FAQ, plain checklist) also diverge from the mock structure.

---

## 3. Architecture

Continue shared `IndustrySeoPageView` composer. Add presentation branching:

```ts
// types.ts
presentation?: "default" | "mockup";
```

- `plumber.ts`: `presentation: "mockup"`, keep `visualLayout: "spotlight"`.
- Electrician / HVAC: omit (`default`).

Components read `page.presentation === "mockup"` (prefer over `slug === "plumber"`).

| Component | Change when mockup |
|-----------|-------------------|
| `IndustryHero` | Rewrite spotlight: background + scrim + 3-zone foreground; drop worker card |
| `DeductionCards` | 4-col card grid; icon + title + short body; hide example bullets in mockup |
| `HowItWorks` | Keep `stepsBanner`; tighten title/spacing toward mock |
| `ProblemSolution` | Card treatment + green closing line |
| `RecordkeepingChecklist` | Large card; left icon well; two-column checks |
| `BuiltForBand` | Five-item horizontal flow with connector affordance |
| `IndustryFaq` | Two-column card grid; answers remain in DOM (`hidden` when collapsed) |
| `IndustryFinalCta` | Keep background image CTA; spacing/title weight toward mock |

---

## 4. Hero specification (spotlight + mockup)

```text
<section class="relative overflow-hidden …">
  <!-- background -->
  <img|decorative layer> workerImage absolute inset-0 h-full w-full object-cover object-[70%_center]
  <div scrim absolute inset-0 bg-black/65 aria-hidden />
  <!-- foreground -->
  <div relative z-10 mx-auto max-w-6xl px-… py-…>
     breadcrumb (light)
     grid lg: [copy | phone | highlights]
```

| Rule | Value |
|------|--------|
| Background source | Existing `hero.workerImage` |
| Scrim | `bg-black/60`–`/70` (tune for contrast) |
| Worker card | **Removed** |
| Center | `phoneImage`, rounded, shadow, over background |
| Right | 4 highlights; each with simple green-stroke SVG + title + body |
| Left order | pill → H1 → body → trustItems → CTAs |
| H1 accent | Trailing `organized.` in accent green |
| CTAs | Primary `MarketingAppLink` → `/app`; secondary → `#deductions` |
| Narrow | Keep background; stack copy → phone → highlights |

Site chrome (Header) stays global; page breadcrumb stays in Hero content layer.

---

## 5. Below-fold mockup variants

### DeductionCards
- Section title styling closer to mock (strong / centered OK).
- Grid: `lg:grid-cols-4` (2×4 for eight cards).
- Card: green line-icon (map title → simple SVG), title, short body.
- In mockup mode: **do not render** the per-card examples bullet list (keeps cards closer to PNG density).

### HowItWorks
- Retain three steps + optional `stepsBanner` image.
- Centered title; dashed step connectors on large screens when feasible.

### ProblemSolution
- Three problem cards with warm/orange accent icons (simplified).
- Closing sentence in accent green under the grid (add `problemsClosing?: string` on page data if not already expressible).

### RecordkeepingChecklist
- One large bordered panel.
- Left: oversized clipboard/check visual (SVG).
- Right: `sm:grid-cols-2` checklist with green checks.

### BuiltForBand
- Title per data.
- Five features in one row on `xl`; wrap on smaller breakpoints.
- Light dashed/arrow connectors between items (CSS), not a separate illustration asset.

### IndustryFaq
- `sm:grid-cols-2` of bordered cards; each row is question + `+`/`−`.
- Expanded answer uses existing pattern that keeps text in DOM for SEO (`hidden` class OK).
- Still **7** FAQs including mileage honesty.

### IndustryFinalCta
- Keep `finalCta.backgroundImage`.
- Layout weight toward mock banner (readable scrim if needed).

---

## 6. Copy / compliance (unchanged)

- Title / Meta / H1 locks from plumber SEO landing design remain.
- Trust / BuiltFor honest category wording remains.
- No guaranteed-deduction language; disclaimer → `/disclaimer`.
- Mileage FAQ still denies full tracker.

---

## 7. Acceptance (Must)

- [ ] Hero shows full-bleed plumber background + scrim; **no** right-column worker card
- [ ] Foreground reads as UI: left copy, center phone, right highlights
- [ ] Left order: pill → H1 → body → trust → CTAs
- [ ] Deduction cards 2×4 with icons; FAQ two-column cards; checklist two-column panel; BuiltFor five-up flow
- [ ] Side-by-side with `plumber.0.0.1.png`: same section story and Hero composition (structural)
- [ ] `/tax-deductions/electrician` and `/hvac` unchanged
- [ ] Primary → `/app`; secondary → `#deductions`; mileage FAQ honest; unit tests still pass

---

## 8. Implementation notes

- Prefer extending existing components with `presentation === "mockup"` branches over a parallel `plumber/` component tree.
- Ship on `feat/plumber-seo-landing` (updates open PR / preview) unless branch policy says otherwise.
- Optional data: `problemsClosing?: string` on `IndustrySeoPage` for the green closer under pain cards.
- Re-tune hero asset crop (`object-position`) if face/tools fall under the phone column.
