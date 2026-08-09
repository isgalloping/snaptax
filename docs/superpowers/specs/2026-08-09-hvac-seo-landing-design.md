# HVAC SEO Landing — Design

**Date:** 2026-08-09  
**Status:** Approved (brainstorming + grill-me 2026-08-09)  
**Inputs:**
- `docs/seo/hvac/hvac.0.0.1.prd.md` (authoritative when saved; was empty on disk during design — decisions below override conflicts)
- `docs/seo/hvac/hvac-seo.0.0.1.png` (full-page UI reference)
- `docs/seo/hvac/hvac.0.0.1-hero.png`
- `docs/seo/hvac/hvac.0.0.1-mobile.png`
- `docs/seo/hvac/hvac.0.0.1-cta.png`
- Prior template: `docs/superpowers/specs/2026-08-08-electrician-seo-landing-design.md`
- Live code: `lib/marketing/seo/*`, `components/marketing/seo/*`, `app/(marketing)/tax-deductions/*`

PRD and UI mockup are **inputs, not canonical**. Where they conflict with product reality or grilled decisions, this design wins.

---

## 1. Decision summary

| Topic | Decision |
|-------|----------|
| Scope | Design-mockup IA + PRD keywords; no PDF / analytics board / content-cluster child pages / new Header nav |
| Copy split | **Title / Meta / H1 ← PRD**; **block counts & short CTAs ← UI** (8 cards, 3 steps, 6 FAQs) |
| Architecture | Extend shared industry SEO template; register HVAC beside electrician |
| Primary CTA | `MarketingAppLink` → `/app` (no query params) |
| Secondary CTA | In-page `#deductions` |
| Category honesty | SEO educational cards OK; SnapTax-facing copy uses `US_EXPORT_CATEGORIES` only |
| Mileage | FAQ: SnapTax does **not** replace a full mileage log |
| Inbound | Index card + Footer + electrician ↔ HVAC related-trades + sitemap |
| Assets | Optimize hero / mobile / cta; SEO filenames under `public/marketing/seo/` |
| JSON-LD | `FAQPage` + `BreadcrumbList` only (no page-level WebPage/HowTo this round) |
| Visual fidelity | Medium — marketing tokens; not pixel-perfect |

### Explicitly out of scope

- PDF checklist download / lead capture
- Full PRD event dashboard / A/B framework
- Cluster URLs (`/tax-deductions/hvac/tools`, etc.)
- Header Tax Deductions / Industries nav
- CTA query (`source=seo_hvac`)
- Mileage tracker feature or “auto-tracks mileage” claims
- Plumbing / Roofing / other new trades
- Pixel-perfect mockup match
- Paddle embed on marketing pages

---

## 2. Problem

Electrician SEO landing exists and validates the industry-template pattern. HVAC is the next high-intent trade (`HVAC tax deductions`, contractor write-offs). Need a second registered industry page without forking a one-off page tree.

---

## 3. Architecture

Reuse `(marketing)` layout. Lightly extend the electrician SEO template.

```text
app/(marketing)/tax-deductions/
├── page.tsx                 ← index maps registry (Electrician + HVAC)
└── hvac/page.tsx            ← new

lib/marketing/seo/
├── types.ts                 ← IndustrySlug += "hvac"; optional checklist / relatedTrades
├── industries.ts            ← PUBLISHED = [electrician, hvac]
├── industries/hvac.ts       ← HVAC copy
└── sitemapEntries.ts        ← + /tax-deductions/hvac @ 0.7

components/marketing/seo/
├── IndustrySeoPage.tsx      ← order + conditional sections
├── DeductionCards.tsx       ← id="deductions"
├── RecordkeepingChecklist.tsx  ← new (optional)
├── RelatedTrades.tsx           ← new (optional; both trades)
└── existing Hero / HowItWorks / FAQ / FinalCta / …

public/marketing/seo/
├── hvac-tax-deductions-snaptax.png
├── hvac-tax-deductions-snaptax-og.jpg
└── hvac-tax-deductions-snaptax-cta.webp   ← optional Final CTA bg
```

### Type extensions

```ts
export type IndustrySlug = "electrician" | "hvac";

// additions on IndustrySeoPage:
checklist?: {
  title: string;
  items: string[];
};
relatedTrades?: {
  title: string;
  links: { href: string; label: string }[];
};
// examples may be [] → ExpenseExamples not rendered
```

`howItWorks.id` remains `"how-it-works"` for electrician secondary CTA; HVAC secondary uses `#deductions` via hero link (deduction section id), not how-it-works.

### Composer order (shared view)

1. Hero (+ breadcrumb)  
2. DeductionCards (`id="deductions"`)  
3. HowItWorks  
4. ProblemSolution  
5. RecordkeepingChecklist (if `checklist`)  
6. BuiltForBand  
7. ExpenseExamples (if `examples.length > 0`)  
8. IndustryFaq  
9. IndustryFinalCta  
10. RelatedTrades (if `relatedTrades`)  
11. Outbound links + SeoDisclaimer  

Electrician keeps Examples; both trades get RelatedTrades pointing at each other.

### Wiring

| Surface | Change |
|---------|--------|
| Footer Product | `HVAC Tax Deductions` → `/tax-deductions/hvac` |
| Electrician `outboundLinks` / `relatedTrades` | Link to HVAC |
| HVAC outbound | Electrician + `/features` `/faq` `/blog/how-to-organize-receipts` `/blog/1099-contractor-tax-guide` |
| Sitemap | HVAC `0.7` |
| Metadata | `buildMarketingMetadata` + HVAC OG image |

---

## 4. Page IA & copy

### Meta (locked)

- **Title:** `HVAC Tax Deductions: Expense Guide for Contractors | SnapTax`
- **Description:** `Explore common HVAC tax deductions and learn how to track tools, supplies, vehicle costs, certifications, and receipts with SnapTax.`
- **Path / canonical:** `/tax-deductions/hvac`

### Hero

- **H1 (PRD):** `Tax Deductions for HVAC Technicians and Contractors`
- **Body:** Track receipts, organize HVAC business expenses, prepare tax-ready reports without digging through the truck at tax time (PRD/UI aligned)
- **Primary CTA:** `Track HVAC Expenses` → `/app`
- **Secondary CTA:** `View Deductions` → `#deductions`
- **Trust:** No forced sign-up · Mobile-friendly · Built for independent contractors (or UI check-list equivalents that match real product: receipt scanning, tax-ready reports, offline — no false “Smart HVAC Categories” as product taxonomy)
- **Visual:** `hvac.0.0.1-hero.png` + `hvac.0.0.1-mobile.png` (optimized)

### Deduction cards (8 — UI)

1. Tools & Equipment  
2. Parts & Supplies  
3. Refrigerants  
4. Safety Gear  
5. Vehicle Expenses  
6. Training & Certifications  
7. Licenses & Permits  
8. Software & Services  

Examples pulled from PRD HVAC lists. Cards are educational — do not label as in-app category names.

### How it works (3 steps — UI)

1. Capture Receipts  
2. Organize Expenses — mention real US labels (Tools, Truck Gas, Supplies, Equipment, Materials, Other)  
3. Export & File — tax-ready report; do not claim Schedule C auto-filing  

### Problems (3 — UI)

Receipts disappear · Expenses get mixed · Tax-time cleanup takes hours  

### Checklist (new)

Static list (~8–10 items) from PRD recordkeeping checklist (photograph receipts, note purpose, separate personal/business, keep mileage separately, export summary, ask a tax pro, …). Not a downloadable PDF.

### Built for

Independent HVAC techs / contractors / small shops; boundary: expense organization tool, not payroll, full accounting, or tax filing.

### FAQ (6 — UI, PRD-safe answers)

1. What can HVAC technicians deduct?  
2. Can HVAC tools be written off?  
3. Can I deduct service truck expenses?  
4. Can I deduct EPA 608 certification?  
5. Does SnapTax track mileage? → **No full mileage log; organize vehicle receipts; keep separate trip log**  
6. Can I export reports for my accountant?  

Hedged language only (`may`, `depending on circumstances`).

### Final CTA

PRD/UI: “Stop letting HVAC receipts disappear in your truck” · Start Tracking Expenses → `/app` · optional cta background image.

### Related trades

Link to Electrician Tax Deductions (`/tax-deductions/electrician`).

---

## 5. SEO technical

- Canonical + OG/Twitter via `buildMarketingMetadata` with HVAC OG asset  
- JSON-LD `@graph`: FAQPage (6) + BreadcrumbList (Home → Tax Deductions → HVAC)  
- FAQ answers always in DOM (`hidden` when collapsed) — same rule as electrician fix  
- Sitemap priority HVAC `0.7`  
- Image filenames keyword-rich; alt describes scene, not keyword stuffing  
- No `noindex`; allow crawl  

---

## 6. Compliance

Bottom disclaimer (educational; not tax/legal/accounting advice; does not file returns) + link `/disclaimer`.

**Forbidden copy:** guaranteed deductions, bigger refund, IRS-approved, maximize savings, deduct every expense, never get audited, SnapTax determines deductibility.

**Required nuances:**
- Commute vs business travel distinguished  
- Tools: cost / useful life may affect treatment  
- Work clothes: protective/specialized only  
- Mixed-use: business-use portion  
- No free-export or unauthenticated cloud-sync promises  

---

## 7. Conversion

```text
Google → /tax-deductions/hvac
  → educational trust
  → Track HVAC Expenses → /app (Ghost)
  → snap receipts
  → season export → existing Paywall
```

---

## 8. Assets

| Source | Runtime |
|--------|---------|
| `hvac.0.0.1-hero.png` | `public/marketing/seo/hvac-tax-deductions-snaptax.png` (~≤960w, compressed) |
| (crop/derive) | `public/marketing/seo/hvac-tax-deductions-snaptax-og.jpg` (1200×630) |
| `hvac.0.0.1-cta.png` | `public/marketing/seo/hvac-tax-deductions-snaptax-cta.webp` (optional) |
| `hvac.0.0.1-mobile.png` | Used in hero phone stack (compressed) or composite into hero |
| `hvac-seo.0.0.1.png` | Design reference only — do not ship |

Do not commit multi‑MB unoptimized sources into `public/`.

---

## 9. Acceptance (Must)

- [ ] `/tax-deductions/hvac` renders under marketing layout; returns 200  
- [ ] Index shows HVAC card; Footer link; sitemap entry; electrician ↔ HVAC links  
- [ ] Title / Meta / H1 per §4; 8 cards / 3 steps / 6 FAQs  
- [ ] Primary CTA → `/app`; secondary → `#deductions`  
- [ ] FAQPage + BreadcrumbList JSON-LD; FAQ answers in initial HTML  
- [ ] Category honesty + mileage honesty  
- [ ] Optimized HVAC images load  
- [ ] Disclaimer → `/disclaimer`  
- [ ] Out-of-scope items not implemented  
- [ ] Electrician page still works after shared composer changes  

### Tests

- Unit: registry lists hvac; `getIndustryBySlug("hvac")`; sitemap entry; schema shape; empty examples skip  
- Manual: mobile layout, anchors, cross-links, no dead links  

---

## 10. Non-goals reminder

This page is a **knowledge + conversion entry** for HVAC tax/expense intent — not HVAC tax software, not a filing product, not a full accounting suite.
