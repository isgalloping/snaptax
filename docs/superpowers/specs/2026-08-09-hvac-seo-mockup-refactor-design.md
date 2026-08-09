# HVAC SEO Mockup Refactor — Design

**Date:** 2026-08-09  
**Status:** Approved (brainstorming + grill-me 2026-08-09)  
**Inputs:**
- `docs/seo/hvac/hvac.0.0.1.prd.md`
- `docs/seo/hvac/hvac.0.0.1.png` (full-page UI — structural fidelity required)
- `docs/seo/hvac/hvac.0.0.1-hero.png`
- `docs/seo/hvac/hvac.0.0.1-mobile.png` (three-phone strip)
- `docs/seo/hvac/hvac.0.0.1-cta.png`
- Pattern reference: Landscaper / Roofer SEO
  (`docs/superpowers/specs/2026-08-09-landscaper-seo-landing-design.md`,
  `docs/superpowers/specs/2026-08-09-roofer-seo-landing-design.md`)
- Existing route + registry: `/tax-deductions/hvac`, `lib/marketing/seo/industries/hvac.ts`

PRD and UI mockup are **inputs, not canonical**. Where they conflict with product reality or grilled decisions, this design wins.

---

## 1. Decision summary

| Topic | Decision |
|-------|----------|
| Scope | **Refactor** existing HVAC landing to Roofer/Landscaper mockup parity (data-driven) |
| Approach | Data + assets + tests only; reuse `IndustrySeoPageView` mockup branches — no new page components |
| Copy split | **Title / Meta ← keep current live values**; **H1 / short CTAs / block structure ← UI** |
| Hero | `presentation: "mockup"` + `visualLayout: "spotlight"` (leave `composite` code path in `IndustryHero` unused) |
| Branch | From latest `main` → `feat/hvac-seo-mockup-refactor` |
| Peer layouts | Unchanged (electrician stacked; plumber/roofer/landscaper mockup) |
| Primary CTA | `MarketingAppLink` → `/app` (no query params) |
| Secondary CTA | In-page `#deductions` |
| Category honesty | Educational cards may use HVAC language; product copy uses real export categories only — **no “Smart HVAC Categories”** |
| Hero trust #2 | `Organize expenses by category` |
| BuiltFor #2 | `Expense categories` |
| Mileage | FAQ includes honest denial of full mileage tracker |
| How it Works visuals | `stepsBanner` from optimized mobile strip (transparent canvas) |
| FAQ | UI main questions **+ mileage** = **7**; no “View all questions” |
| Deduction cards | 8 cards; titles/examples follow new UI (e.g. Refrigerants & Chemicals) |
| Content rewrite | Full alignment to UI + Landscaper structure (HowItWorks / Problems / Checklist / BuiltFor / CTA) |
| Assets | Regenerate all `public/marketing/seo/hvac-*`; **delete** legacy `*-mobile.png` |
| Inbound | Route / index / Footer / sitemap / five-way relatedTrades already exist — no mesh change required |
| Ship | Push **preview** first, then open PR → main |
| JSON-LD | Existing `FAQPage` + `BreadcrumbList` only |
| Visual fidelity | High structural fidelity to `hvac.0.0.1.png` via mockup variants |

### Explicitly out of scope

- New route or cluster URLs
- Deleting `composite` from `IndustryHero` / `types.ts` (keep for now)
- Changing Title/Meta for SEO experiments
- “Smart HVAC Categories” in product copy
- FAQ “View all questions”
- CTA query params (`source=seo_hvac`)
- PDF checklist / analytics / Header Industries
- Pixel-perfect mockup / HVAC-only page components
- Changing electrician / plumber / roofer / landscaper layouts
- Expanding relatedTrades mesh (already five-way)

---

## 2. Problem

HVAC shipped earlier on `visualLayout: "composite"` with thinner mockup fidelity. New UI (`hvac.0.0.1.png`) matches the Plumber/Roofer/Landscaper mockup pattern. Refactor HVAC onto that path so all non-electrician trade landings share one presentation model, without inventing a sixth Hero mode.

---

## 3. Architecture

```text
Narrow change set:

lib/marketing/seo/industries/hvac.ts     ← mockup + spotlight + full copy rewrite
lib/marketing/seo/industries.test.ts     ← composite assertions → mockup/spotlight + honesty
public/marketing/seo/hvac-*              ← regenerate phone/steps/hero/og/cta; delete *-mobile.png
docs/seo/hvac/ASSETS.md                  ← document runtime mapping

Unchanged (already correct):
app/(marketing)/tax-deductions/hvac/page.tsx
lib/marketing/seo/industries.ts          ← already published
lib/marketing/seo/sitemapEntries.ts
lib/marketing/copy.ts                    ← Footer already links HVAC
components/marketing/seo/*               ← reuse mockup/spotlight branches; keep composite dead path
```

Data shape mirrors Landscaper/Roofer: `presentation: "mockup"`, `visualLayout: "spotlight"`, `highlights` (4), `stepsBanner`, `problemsClosing`, `examples: []`, `checklist`, `builtFor.features` (5), `faq` (7).

---

## 4. Page structure & copy locks

**Section order (UI):**  
Hero → DeductionCards (8) → HowItWorks (+ stepsBanner) → Problems (3) + green closer → Checklist → BuiltFor (5) → FAQ (7) → FinalCta → RelatedTrades → Footer

| Field | Lock |
|-------|------|
| Path | `/tax-deductions/hvac` |
| Title | `HVAC Tax Deductions: Expense Guide for Contractors \| SnapTax` (keep live) |
| Meta | Keep live description |
| H1 | `HVAC tax deductions, organized.` |
| Pill | `Built for HVAC Technicians & Contractors` |
| Trust | AI receipt scanning; Organize expenses by category; Export tax reports; Works offline |
| Highlights | Built for HVAC work; Tax-ready reports; Secure & private; One-time payment |
| Primary / secondary | `Track HVAC Expenses` → `/app`; `View Deductions` → `#deductions` |
| Deduction cards (8) | Tools & Equipment; Parts & Supplies; Refrigerants & Chemicals; Safety Gear; Vehicle Expenses; Training & Certifications; Licenses & Permits; Software & Services |
| Problems | Three cards aligned to UI (receipts disappear / mixed expenses / tax-time cleanup) + `problemsClosing` |
| HowItWorks | Capture Receipts → Review the Result → Organize & Export (real export categories in product copy) |
| BuiltFor #2 | `Expense categories` (not Smart HVAC Categories) |
| FAQ | UI-visible main questions + mileage honesty = **7**; no “View all” |
| Final CTA | Stop letting HVAC receipts disappear in your truck / Start Tracking Expenses |
| examples | `[]` |

---

## 5. Assets

| Runtime file | Source / notes |
|--------------|----------------|
| `hvac-tax-deductions-snaptax.png` | Optimize `hvac.0.0.1-hero.png` (~960w) |
| `hvac-tax-deductions-snaptax-phone.png` | Crop right device from `hvac.0.0.1-mobile.png`; corner flood-fill → alpha |
| `hvac-tax-deductions-snaptax-steps.png` | Optimize full mobile strip; same alpha knockout |
| `hvac-tax-deductions-snaptax-cta.webp` | Optimize `hvac.0.0.1-cta.png` |
| `hvac-tax-deductions-snaptax-og.jpg` | 1200×630 from hero |

**Delete:** `public/marketing/seo/hvac-tax-deductions-snaptax-mobile.png` (legacy composite asset).

Document in `docs/seo/hvac/ASSETS.md`. Reuse `scripts/seo-knockout-near-black.mjs`.

---

## 6. Inbound & cluster

No inbound changes required for this refactor:

- Route, index card, Footer Product link, sitemap entry, and five-way `relatedTrades` already include HVAC
- Do not expand cluster URLs

---

## 7. Acceptance

- `/tax-deductions/hvac` matches UI section structure; mockup spotlight Hero; no Smart HVAC Categories; mileage FAQ honest
- Primary → `/app`; secondary → `#deductions`
- phone + steps have alpha; electrician stacked unchanged; plumber/roofer/landscaper mockup unchanged
- Legacy `*-mobile.png` removed; `ASSETS.md` updated
- Unit tests green; preview visual QA vs `hvac.0.0.1.png`; then PR to main

---

## 8. Testing

- Registry: HVAC slug, `presentation: "mockup"`, `spotlight`, 8 cards, 3 steps + banner, 7 FAQs, checklist, builtFor×5, problemsClosing
- Copy: no `/Smart HVAC Categories/i`; trust includes Organize expenses by category
- Mileage FAQ: `/does not/i` and `/separate/i`
- Replace obsolete “hvac uses composite…” assertion with mockup/spotlight expectations
- Keep electrician non-composite assertion
- Alpha assertion for HVAC phone + steps
