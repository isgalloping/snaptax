# Plumber SEO Landing — Design

**Date:** 2026-08-09  
**Status:** Approved (brainstorming + grill-me 2026-08-09)  
**Inputs:**
- `docs/seo/plumber/plumber.0.0.1.prd.md`
- `docs/seo/plumber/plumber.0.0.1.png` (full-page UI — visual/IA alignment required)
- `docs/seo/plumber/plumber.0.0.1-hero.png`
- `docs/seo/plumber/plumber.0.0.1-mobile.png` (three-phone strip for How it Works)
- `docs/seo/plumber/plumber.0.0.1-cta.png`
- Prior templates: electrician + HVAC SEO landings (`lib/marketing/seo/*`, `components/marketing/seo/*`)

PRD and UI mockup are **inputs, not canonical**. Where they conflict with product reality or grilled decisions, this design wins.

---

## 1. Decision summary

| Topic | Decision |
|-------|----------|
| Scope | Template MVP **aligned to UI mockup**; no PDF / analytics board / cluster child pages / Header Industries nav |
| Copy split | **Title / Meta ← PRD**; **H1 ← UI short line**; block counts & short CTAs ← UI |
| Architecture | Extend shared industry SEO template; register Plumber; **new `spotlight` Hero for Plumber only** |
| Electrician / HVAC | Keep existing stacked / composite layouts — **no visual changes** |
| Primary CTA | `MarketingAppLink` → `/app` (no query params) |
| Secondary CTA | In-page `#deductions` |
| Category honesty | Educational cards may use plumbing language; SnapTax-facing copy uses `US_EXPORT_CATEGORIES` only |
| Mileage | FAQ #7: SnapTax does **not** replace a full mileage log |
| How it Works visuals | Optional `stepsBanner` — **one** three-phone composite image (not three cropped files) |
| FAQ | UI six questions **+ mileage** = **7** |
| Inbound | Index card + Footer + sitemap + **three-way** `relatedTrades` (Electrician ↔ HVAC ↔ Plumber) |
| Assets | Optimize hero / phone / steps / cta / OG under `public/marketing/seo/` with SEO filenames |
| JSON-LD | `FAQPage` + `BreadcrumbList` only |
| Visual fidelity | Medium — match UI IA and spotlight composition; not pixel-perfect |

### Explicitly out of scope

- PDF checklist download / lead capture
- Full PRD event dashboard / A/B framework
- Cluster URLs (`/tax-deductions/plumber/tools`, etc.)
- Header Tax Deductions / Industries nav
- CTA query (`source=seo_plumber`)
- Mileage tracker feature or “auto-tracks mileage” claims
- Refactoring electrician or HVAC Hero to spotlight
- “Smart Plumbing Categories” / fake trade-only tax categories in product copy
- Pixel-perfect mockup match
- Paddle embed on marketing pages

---

## 2. Problem

Electrician and HVAC SEO landings validate the industry-template pattern. Plumber is the next high-intent trade. The provided UI introduces a **third Hero composition** (copy + single phone + worker/highlights) that must not force stacked/composite onto Plumber, and must not regress electrician/HVAC.

---

## 3. Architecture

Reuse `(marketing)` layout. Extend the shared industry SEO template.

```text
app/(marketing)/tax-deductions/
├── page.tsx                    ← index: Electrician + HVAC + Plumber
└── plumber/page.tsx            ← new

lib/marketing/seo/
├── types.ts                    ← IndustrySlug += "plumber"
│                                 visualLayout += "spotlight"
│                                 hero.highlights?
│                                 howItWorks.stepsBanner?
├── industries/plumber.ts       ← Plumber copy + asset paths
├── industries.ts               ← PUBLISHED = [electrician, hvac, plumber]
├── industries/electrician.ts   ← relatedTrades += Plumber
├── industries/hvac.ts          ← relatedTrades += Plumber
└── sitemapEntries.ts           ← + /tax-deductions/plumber @ 0.7

components/marketing/seo/
├── IndustryHero.tsx            ← spotlight branch (stacked/composite unchanged)
├── HowItWorks.tsx              ← optional stepsBanner under steps
└── existing DeductionCards / Checklist / FAQ / FinalCta / RelatedTrades / …

public/marketing/seo/
├── plumber-tax-deductions-snaptax.png         ← worker / hero scene (~960w+)
├── plumber-tax-deductions-snaptax-phone.png   ← Hero single-phone mock
├── plumber-tax-deductions-snaptax-steps.png   ← HowItWorks three-phone strip (~1200w)
├── plumber-tax-deductions-snaptax-og.jpg      ← 1200×630
└── plumber-tax-deductions-snaptax-cta.webp    ← Final CTA background
```

### Type additions

```ts
visualLayout?: "stacked" | "composite" | "spotlight";

hero.highlights?: { title: string; body: string }[]; // spotlight right column (4 items)

howItWorks: {
  id: "how-it-works";
  title: string;
  steps: { title: string; body: string }[];
  stepsBanner?: { src: string; alt: string };
};
```

- Plumber: `visualLayout: "spotlight"`, provide `phoneImage`, `workerImage`, `highlights` (4), `stepsBanner`.
- Electrician / HVAC: omit `spotlight` fields; layouts unchanged.

### Composer order (UI-aligned)

1. Breadcrumb  
2. Hero (`spotlight`)  
3. DeductionCards (`id="deductions"`)  
4. HowItWorks (+ `stepsBanner` when set)  
5. ProblemSolution  
6. RecordkeepingChecklist  
7. BuiltForBand  
8. ExpenseExamples — **only if** `examples.length > 0` (Plumber ships `examples: []`)  
9. IndustryFaq (7)  
10. IndustryFinalCta (`backgroundImage` from CTA asset)  
11. RelatedTrades  
12. outbound links + SeoDisclaimer → `/disclaimer`

---

## 4. Spotlight Hero

Desktop / large:

| Zone | Content |
|------|---------|
| Left | Green pill subtitle; short H1 with accent on `organized.`; body; primary + secondary CTAs; `trustItems` (4 checks) |
| Center | `phoneImage` — single product phone |
| Right | `workerImage` (scene) + `highlights` (4 titled rows) |

Narrow: stack copy → phone → worker/highlights (same content, no loss).

CTAs stay in the copy column (never covered by images).

---

## 5. Copy contract (locked)

### Meta / H1

| Field | Value |
|-------|--------|
| Title | `Plumber Tax Deductions: Expense Guide for Contractors \| SnapTax` |
| Meta description | `Explore common plumber tax deductions and learn how to track tools, supplies, vehicle costs, licenses, and receipts with SnapTax.` |
| H1 | `Plumbing tax deductions, organized.` |
| Pill / subtitle | `Built for Plumbers & Plumbing Contractors` |
| Hero body | `Track receipts, organize plumbing business expenses, and prepare tax-ready reports without digging through your service truck at tax time.` |
| Primary CTA | `Track Plumbing Expenses` → `/app` |
| Secondary CTA | `View Deductions` → `#deductions` |

### trustItems (left checks) — honest

1. AI receipt scanning  
2. Organize expenses by category *(not “Plumbing expense categories”)*  
3. Export tax reports  
4. Works offline  

### highlights (right four)

1. Built for plumbing work  
2. Tax-ready reports  
3. Secure & private  
4. One-time payment  

### Deduction cards (8)

Tools & Equipment · Parts & Supplies · Drain Cleaning Equipment · Safety Gear · Vehicle Expenses · Licenses & Permits · Training & Certifications · Software & Services  

Intro: ordinary-and-necessary / depends on use and situation (PRD tone).

### How it Works

Three steps: Capture Receipts → Organize Expenses → Export & File.  
Organize / product sentences name only real US export categories (Tools, Truck Gas, Supplies, Equipment, Materials, Other).  
`stepsBanner` = optimized three-phone strip from `plumber.0.0.1-mobile.png`.

### ProblemSolution (3)

Receipts disappear · Expenses get mixed together · Tax-time cleanup takes hours  

### Checklist (~8, UI)

Photograph every business receipt · Separate personal and business expenses · Record merchant, date, and amount · Add the customer, job, or business purpose · Keep mileage records separately · Review Needs Action items · Save license and permit records · Export your annual report  

### BuiltFor (5) — honest middle item

AI Receipt Scanner · **Expense categories** *(not “Smart Plumbing Categories”)* · Tax Reports · Offline Mode · Secure & Private  

### FAQ (7)

1. What can plumbers deduct on their taxes?  
2. Can plumbers write off tools?  
3. Can plumbing materials be deducted?  
4. Can I deduct my plumbing service truck?  
5. Can I deduct plumbing licenses and permits?  
6. Can I export reports for my accountant?  
7. Does SnapTax track mileage? — organize vehicle receipts; **does not** replace a complete mileage log; keep separate trip records  

Answers: may / depending. Answers remain in DOM (`hidden` allowed).

### Final CTA

Title: `Stop letting plumbing receipts disappear in your truck`  
Button: `Start Tracking Expenses` → `/app`  
Background: optimized CTA asset  

### relatedTrades

Each of electrician / hvac / plumber links to the **other two** trades.

---

## 6. SEO technical

- `buildMarketingMetadata` + Plumber OG (1200×630)  
- JSON-LD: `FAQPage` (7) + `BreadcrumbList`  
- Sitemap: `/tax-deductions/plumber` priority `0.7`  
- Keyword-rich filenames; alt describes scene (plumber / tools / pipes), no stuffing  
- Canonical path: `/tax-deductions/plumber` (singular `plumber`)

---

## 7. Compliance

- Footer/page disclaimer + link `/disclaimer`  
- Forbidden: guaranteed deductions / bigger refund / IRS-approved / maximize savings  
- Vehicle: commuting ≠ business travel  
- Tools: cost / useful life / business-use may affect treatment  
- Work clothes: not claimed as freely deductible ordinary clothing (no dedicated FAQ this round)  
- No free-export / cloud-sync-without-Google promises  

---

## 8. Conversion path

```text
Google → /tax-deductions/plumber
  → read deductions / checklist
  → Track → /app (Ghost)
  → capture receipt
  → tax season Export → existing Paywall
```

---

## 9. Acceptance (Must)

- [ ] `/tax-deductions/plumber` 200; Title / Meta / H1 per §5  
- [ ] Spotlight Hero: left copy + center phone + right worker/highlights  
- [ ] Eight cards, three steps + steps banner, checklist, BuiltFor×5, FAQ×7  
- [ ] Primary CTA → `/app`; secondary → `#deductions`  
- [ ] FAQ answers in initial HTML; mileage FAQ honest  
- [ ] Product-facing copy has no “Smart Plumbing Categories”  
- [ ] Electrician stacked + HVAC composite unchanged  
- [ ] Index / Footer / sitemap / three-way relatedTrades present  
- [ ] Disclaimer → `/disclaimer`  

---

## 10. Implementation notes

- Prefer branching inside `IndustryHero` / `HowItWorks` over a `PlumberHero` fork.  
- Reuse existing `RecordkeepingChecklist`, `RelatedTrades`, `DeductionCards` (`id="deductions"`).  
- Ship on a dedicated feature branch from `main` (do not mix with unrelated WIP).  
- Unit tests: registry slug `plumber`; `visualLayout === "spotlight"`; FAQ length 7; mileage denial; relatedTrades length 2 on each industry.  
