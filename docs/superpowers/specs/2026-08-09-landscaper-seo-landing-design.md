# Landscaper SEO Landing — Design

**Date:** 2026-08-09  
**Status:** Approved (brainstorming + grill-me 2026-08-09)  
**Inputs:**
- `docs/seo/landscaper/landscaper.0.0.1-prd.md`
- `docs/seo/landscaper/landscaper.0.0.1.png` (full-page UI — structural fidelity required)
- `docs/seo/landscaper/landscaper.0.0.1-hero.png`
- `docs/seo/landscaper/landscaper.0.0.1-mobile.png` (three-phone strip)
- `docs/seo/landscaper/landscaper.0.0.1-cta.png`
- Pattern reference: Roofer SEO (`docs/superpowers/specs/2026-08-09-roofer-seo-landing-design.md`)
- Shared template: electrician + HVAC + plumber + roofer (`lib/marketing/seo/*`, `components/marketing/seo/*`)

PRD and UI mockup are **inputs, not canonical**. Where they conflict with product reality or grilled decisions, this design wins.

---

## 1. Decision summary

| Topic | Decision |
|-------|----------|
| Scope | Template MVP **aligned to UI mockup** via existing `presentation: "mockup"` path (Roofer parity) |
| Copy split | **Title / Meta ← PRD**; **H1 / short CTAs / block structure ← UI** |
| Architecture | Register Landscaper on shared industry SEO template; no new Hero layout enum |
| Hero | `visualLayout: "spotlight"` + mockup full-bleed worker background |
| Branch | From `feat/roofer-seo-landing` → `feat/landscaper-seo-landing` |
| Peer layouts | Unchanged visually; **relatedTrades** expands to **5-way** (each page → other 4) |
| Primary CTA | `MarketingAppLink` → `/app` (no query params) |
| Secondary CTA | In-page `#deductions` |
| Category honesty | Educational cards may use landscaping language; product copy uses real export categories only — **no “Smart Landscaping Categories”** |
| Hero trust #2 | `Organize expenses by category` |
| Mileage | FAQ includes honest denial of full mileage tracker |
| How it Works visuals | `stepsBanner` from optimized mobile strip (transparent canvas) |
| FAQ | UI six questions **+ mileage** = **7**; no “View all questions” |
| Inbound | Index card + Footer + sitemap + five-way `relatedTrades` |
| Assets | Optimize under `public/marketing/seo/`; Hero phone from mobile strip right device; worker from hero.png |
| Ship | Push **preview** first, then open PR → main |
| JSON-LD | `FAQPage` + `BreadcrumbList` only |
| Visual fidelity | High structural fidelity to `landscaper.0.0.1.png` via mockup variants |

### Explicitly out of scope

- PDF checklist / lead capture
- PRD analytics / A/B framework
- Cluster URLs (`/tax-deductions/landscaper/...`)
- Header Industries nav
- CTA query (`source=seo_landscaper`)
- Mileage tracker feature claims
- “Smart Landscaping Categories” in product copy
- FAQ “View all questions”
- Pixel-perfect mockup / Landscaper-only page components
- Paddle embed on marketing pages
- Changing electrician stacked or HVAC composite Hero composition

---

## 2. Problem

Roofer validates the fifth-trade pattern on the shared mockup template. Landscaper is the next high-intent outdoor trade with a full UI isomorphic to Roofer/Plumber. Ship by registering content + assets, not inventing new layout modes.

---

## 3. Architecture

```text
app/(marketing)/tax-deductions/
├── page.tsx                         ← index meta + Landscaper card
└── landscaper/page.tsx              ← new

lib/marketing/seo/
├── types.ts                         ← IndustrySlug += "landscaper"
├── industries/landscaper.ts         ← page data
├── industries.ts                    ← PUBLISHED += landscaper
├── industries/{electrician,hvac,plumber,roofer}.ts  ← relatedTrades → 4 peers
└── sitemapEntries.ts                ← + /tax-deductions/landscaper @ 0.7

lib/marketing/copy.ts                ← Footer Product += Landscaper Tax Deductions
components/marketing/seo/            ← reuse mockup branches
```

Data shape mirrors Roofer: `presentation: "mockup"`, `visualLayout: "spotlight"`, `highlights` (4), `stepsBanner`, `problemsClosing`, `examples: []`, `checklist`, `builtFor.features` (5), `faq` (7).

---

## 4. Page structure & copy locks

**Section order (UI):**  
Hero → DeductionCards (8) → HowItWorks (+ stepsBanner) → Problems (3) + green closer → Checklist → BuiltFor (5) → FAQ (7) → FinalCta → RelatedTrades → Footer

| Field | Lock |
|-------|------|
| Path | `/tax-deductions/landscaper` |
| Title | `Landscaper Tax Deductions: Expense Guide \| SnapTax` |
| Meta | Explore common landscaper tax deductions and learn how to track plants, equipment, fuel, repairs, vehicle costs, rentals, and business receipts. |
| H1 | `Landscaping tax deductions, organized.` |
| Pill | `Built for Landscapers & Lawn Care Contractors` |
| Trust | AI receipt scanning; Organize expenses by category; Export tax reports; Works offline |
| Highlights | Built for outdoor work; Tax-ready reports; Secure & private; One-time payment |
| Primary / secondary | `Track Landscaping Expenses` → `/app`; `View Deductions` → `#deductions` |
| Deduction cards (8) | Plants & Materials; Tools & Equipment; Fuel & Lubricants; Repairs & Maintenance; Vehicle & Trailer; Safety Gear; Equipment Rental; Dump & Disposal Fees |
| Problems title | Landscaping receipts are easy to lose (UI short) |
| HowItWorks | Capture Receipts → Review the Result → Organize & Export (real export categories in product copy) |
| BuiltFor #2 | `Expense categories` (not Smart Landscaping Categories) |
| FAQ | PRD Q1–Q6 + mileage (PRD Q8) |
| Final CTA | Stop letting landscaping receipts disappear in your truck / Start Tracking Expenses |
| examples | `[]` |

---

## 5. Assets

| Runtime file | Source / notes |
|--------------|----------------|
| `landscaper-tax-deductions-snaptax.png` | Optimize `landscaper.0.0.1-hero.png` (~960w) |
| `landscaper-tax-deductions-snaptax-phone.png` | Crop right device from `landscaper.0.0.1-mobile.png`; corner flood-fill → alpha |
| `landscaper-tax-deductions-snaptax-steps.png` | Optimize full mobile strip; same alpha knockout |
| `landscaper-tax-deductions-snaptax-cta.webp` | Optimize `landscaper.0.0.1-cta.png` |
| `landscaper-tax-deductions-snaptax-og.jpg` | 1200×630 from hero |

Document in `docs/seo/landscaper/ASSETS.md`. Reuse `scripts/seo-knockout-near-black.mjs`.

---

## 6. Inbound & cluster

- Index: fifth card for Landscaper
- Footer Product: `Landscaper Tax Deductions`
- Sitemap: `/tax-deductions/landscaper` priority `0.7`
- `relatedTrades` on all five industries: links to the **other four**
- Update tests that assert four-industry / three-link meshes

---

## 7. Acceptance

- `/tax-deductions/landscaper` matches UI section structure; mockup spotlight Hero; no Smart Landscaping Categories; mileage FAQ honest
- Primary → `/app`; secondary → `#deductions`
- phone + steps have alpha; peer Hero layouts unchanged
- Index + Footer + sitemap include Landscaper; each relatedTrades has 4 links
- Unit tests green; preview visual QA vs `landscaper.0.0.1.png`; then PR to main

---

## 8. Testing

- Registry: slug, mockup, spotlight, 8 cards, 3 steps + banner, 7 FAQs, checklist, builtFor×5
- Copy: no `/Smart Landscaping Categories/i`
- relatedTrades five-way mesh
- Alpha assertion for landscaper phone + steps
- Sitemap + footer include landscaper path
