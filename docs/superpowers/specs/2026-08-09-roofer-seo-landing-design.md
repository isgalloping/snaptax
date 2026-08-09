# Roofer SEO Landing — Design

**Date:** 2026-08-09  
**Status:** Approved (brainstorming + grill-me 2026-08-09)  
**Inputs:**
- `docs/seo/roofer/roofer.0.0.1.prd.md`
- `docs/seo/roofer/roofer.0.01.png` (full-page UI — structural fidelity required)
- `docs/seo/roofer/roofer.0.0.1-hero.png`
- `docs/seo/roofer/roofer.0.0.1-mobile.png` (three-phone strip for How it Works)
- `docs/seo/roofer/roofer.0.0.1-cta.png`
- Prior templates: electrician + HVAC + plumber SEO landings (`lib/marketing/seo/*`, `components/marketing/seo/*`)
- Plumber mockup path: `presentation: "mockup"` + spotlight Hero + phone chrome polish

PRD and UI mockup are **inputs, not canonical**. Where they conflict with product reality or grilled decisions, this design wins.

---

## 1. Decision summary

| Topic | Decision |
|-------|----------|
| Scope | Template MVP **aligned to UI mockup** via existing `presentation: "mockup"` path |
| Copy split | **Title / Meta ← PRD**; **H1 / short CTAs / block structure ← UI** |
| Architecture | Register Roofer on shared industry SEO template; no new Hero layout enum |
| Hero | `visualLayout: "spotlight"` + mockup full-bleed worker background (not right-column worker card) |
| Electrician / HVAC / Plumber layouts | Unchanged visually; **relatedTrades** expands to 3 links each |
| Primary CTA | `MarketingAppLink` → `/app` (no query params) |
| Secondary CTA | In-page `#deductions` |
| Category honesty | Educational cards may use roofing language; product-facing copy uses real export categories only — **no “Smart Roofing Categories”** |
| Hero trust #2 | `Organize expenses by category` (not “Roofing expense categories”) |
| Mileage | FAQ includes honest denial of full mileage tracker |
| How it Works visuals | `stepsBanner` from optimized mobile strip (transparent canvas) |
| FAQ | UI six questions **+ mileage** = **7**; no “View all questions” |
| Inbound | Index card + Footer + sitemap + **four-way** `relatedTrades` (each page → other 3) |
| Assets | Optimize under `public/marketing/seo/` with SEO filenames; crop Hero phone from full UI |
| JSON-LD | `FAQPage` + `BreadcrumbList` only |
| Visual fidelity | High structural fidelity to `roofer.0.01.png` via mockup variants (simplified icons OK) |

### Explicitly out of scope

- PDF checklist download / lead capture
- Full PRD event dashboard / A/B framework
- Cluster URLs (`/tax-deductions/roofer/...`)
- Header Tax Deductions / Industries nav
- CTA query (`source=seo_roofer`)
- Mileage tracker feature or “auto-tracks mileage” claims
- “Smart Roofing Categories” / fake trade-only tax categories in product copy
- FAQ “View all questions” expanding beyond the 7
- Pixel-perfect mockup match / new Roofer-only page components
- Paddle embed on marketing pages
- Changing electrician stacked or HVAC composite Hero composition

---

## 2. Problem

Electrician, HVAC, and Plumber landings validate the shared industry template. Roofer is the next high-intent trade with a full UI mockup that matches the Plumber mockup IA. Shipping Roofer should reuse the mockup presentation path rather than invent a fourth Hero mode or a one-off page.

---

## 3. Architecture

Reuse `(marketing)` layout and shared `IndustrySeoPage` composer.

```text
app/(marketing)/tax-deductions/
├── page.tsx                    ← index: + Roofer card
└── roofer/page.tsx             ← new

lib/marketing/seo/
├── types.ts                    ← IndustrySlug += "roofer"
├── industries/roofer.ts        ← Roofer copy + asset paths
├── industries.ts               ← PUBLISHED += roofer
├── industries/{electrician,hvac,plumber}.ts  ← relatedTrades += Roofer (3 links each)
└── sitemapEntries.ts           ← + /tax-deductions/roofer @ 0.7

lib/marketing/copy.ts           ← Footer Product += Roofer Tax Deductions

components/marketing/seo/       ← reuse mockup branches (no new layout mode)
```

Data shape mirrors Plumber: `presentation: "mockup"`, `visualLayout: "spotlight"`, `highlights` (4), `stepsBanner`, `problemsClosing`, `examples: []`, `checklist`, `builtFor.features` (5), `faq` (7).

---

## 4. Page structure & copy locks

**Section order (UI):**  
Hero → DeductionCards (8) → HowItWorks (+ stepsBanner) → Problems (3) + green closer → Checklist → BuiltFor (5) → FAQ (7) → FinalCta → RelatedTrades → Footer/disclaimer

| Field | Lock |
|-------|------|
| Path | `/tax-deductions/roofer` |
| Title | `Roofer Tax Deductions: Expense Guide for Contractors \| SnapTax` |
| Meta | PRD: explore common roofer tax deductions; track materials, tools, vehicle costs, equipment rentals, dump fees, and receipts |
| H1 | `Roofing tax deductions, organized.` |
| Pill | `Built for Roofers & Roofing Contractors` |
| Hero body | UI subtitle about truck / tax-ready reports |
| Trust | AI receipt scanning; Organize expenses by category; Export tax reports; Works offline |
| Highlights | Built for roofing work; Tax-ready reports; Secure & private; One-time payment |
| Primary / secondary CTA | `Track Roofing Expenses` → `/app`; `View Deductions` → `#deductions` |
| Deduction cards (8) | Roofing Materials; Tools & Equipment; Safety Equipment; Ladders & Scaffolding; Vehicle Expenses; Equipment Rental; Dump & Disposal Fees; Licenses & Permits |
| Problems title | UI short: roofing receipts are easy to lose |
| Problems closing | Green closer: SnapTax keeps every roofing receipt organized… |
| HowItWorks title | How SnapTax Works for Roofers |
| HowItWorks steps | Capture Receipts → Review the Result → Organize & Export (product categories = real export set) |
| BuiltFor #2 title | `Expense categories` (not Smart Roofing Categories) |
| FAQ | PRD Q1–Q6 + mileage (PRD Q8); answers from PRD, honest mileage |
| Final CTA | Stop letting roofing receipts disappear in your truck / Start Tracking Expenses |
| examples | `[]` (mockup hides examples table) |

---

## 5. Assets

Source under `docs/seo/roofer/`. Publish under `public/marketing/seo/`:

| Runtime file | Source / notes |
|--------------|----------------|
| `roofer-tax-deductions-snaptax.png` | Optimize `roofer.0.0.1-hero.png` (~960w) |
| `roofer-tax-deductions-snaptax-phone.png` | Crop center phone from `roofer.0.01.png`; corner flood-fill near-black → alpha |
| `roofer-tax-deductions-snaptax-steps.png` | Optimize `roofer.0.0.1-mobile.png`; same alpha knockout |
| `roofer-tax-deductions-snaptax-cta.webp` | Optimize `roofer.0.0.1-cta.png` |
| `roofer-tax-deductions-snaptax-og.jpg` | 1200×630 from hero |

Document in `docs/seo/roofer/ASSETS.md`. Reuse `scripts/seo-knockout-near-black.mjs` for phone/steps.

Hero phone / steps: no CSS border/shadow/rounded chrome in mockup path (silhouette from PNG alpha) — already implemented for mockup/spotlight.

---

## 6. Inbound & cluster

- Tax deductions index: fourth card for Roofer
- Footer Product: `Roofer Tax Deductions`
- Sitemap: `/tax-deductions/roofer` priority `0.7`
- `relatedTrades` on all four industries: links to the **other three**
- Update unit tests that currently assert three-industry / two-link meshes and `getIndustryBySlug("roofer") === undefined`

---

## 7. Acceptance

- `/tax-deductions/roofer` matches UI section structure; spotlight mockup Hero; no Smart Roofing Categories; mileage FAQ honest
- Primary → `/app`; secondary → `#deductions`
- phone + steps PNGs have alpha; electrician/HVAC/plumber Hero layouts unchanged
- Index + Footer + sitemap include Roofer; each relatedTrades has 3 links
- `npm run test:unit` green for industry/sitemap/footer suites
- Preview visual QA vs `roofer.0.01.png`

---

## 8. Testing

- Registry: slug, presentation mockup, spotlight, 8 cards, 3 steps + banner, 7 FAQs, checklist, builtFor×5
- Copy: no `/Smart Roofing Categories/i`
- relatedTrades four-way mesh
- Alpha assertion for roofer phone + steps (same pattern as plumber)
- Sitemap + footer include roofer path
