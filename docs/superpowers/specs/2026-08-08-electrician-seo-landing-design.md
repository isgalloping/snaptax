# Electrician SEO Landing — Design

**Date:** 2026-08-08  
**Status:** Approved (brainstorming + grill-me 2026-08-08)  
**Inputs:**
- `docs/seo/electrician/0.0.1.prd.md`
- `docs/seo/electrician/0.0.1.context.md`
- `docs/seo/electrician/electrician-0.0.1.png`
- `docs/seo/electrician/electrician-worker.png`
- Existing marketing site: `app/(marketing)/`, `components/marketing/*`, `lib/marketing/*`
- Related: `docs/superpowers/specs/2026-07-05-saas-marketing-site-design.md`

PRD and context are **inputs, not canonical**. Where they conflict with product reality or each other, this design wins.

---

## 1. Decision summary

| Topic | Decision |
|-------|----------|
| Scope | Ship **electrician only**; no plumber / second trade |
| Architecture | Industry content registry + shared SEO sections (template-ready) |
| Copy split | **Title/Meta ← PRD**; **body/CTAs ← context**; product category claims ← `US_EXPORT_CATEGORIES` |
| Visual fidelity | Medium — section IA from context/design; density matches existing marketing |
| Routes | `/tax-deductions` (thin index) + `/tax-deductions/electrician` |
| Inbound link | Footer Product column → electrician page |
| Outbound links | Existing site paths only (`/features`, `/faq`, `/blog/...`) |
| Secondary CTA | In-page anchor `#how-it-works` |
| Primary CTA | `MarketingAppLink` → `/app` |
| Hero image | `electrician-worker.png` (served from `public/marketing/seo/`) + existing app phone screen |
| JSON-LD | `FAQPage` + `BreadcrumbList` |
| Disclaimer | Short educational line + link `/disclaimer` |
| Categories | SEO five cards for education; product-facing copy uses real US categories only |

### Explicitly out of scope

- Header Industries / Resources / Blog nav
- Newsletter capture
- Footer Industries column / major footer redesign
- Product video; Paddle embed on marketing pages
- `/tax-guides/*`, `/receipt-tracker`
- Second industry page (keep `docs/seo/plumber/` empty)
- Pixel-perfect match to design mockup

---

## 2. Problem

SnapTax marketing site indexes product pages (`/`, `/features`, `/pricing`, blog) but has **no trade-intent SEO entry** for high-value queries like `electrician tax deductions`.

Goals:

1. Own an educational landing URL that matches search intent without competing as “tax software.”
2. Convert readers into Ghost `/app` usage (snap receipts), then existing season paywall at export.
3. Establish a reusable pattern for future trades without shipping them now.

---

## 3. Architecture

Hang under existing `(marketing)` layout (Header, Footer, install shell). Do not touch `/app` PWA shell.

```text
app/(marketing)/tax-deductions/
├── page.tsx                         ← thin index
└── electrician/
    └── page.tsx                     ← electrician landing

lib/marketing/seo/
├── types.ts                         ← IndustrySeoPage, registry types
├── industries.ts                    ← published industries (electrician only)
└── industries/
    └── electrician.ts               ← page copy + FAQ + cards + examples

components/marketing/seo/
├── TaxDeductionsIndex.tsx
├── IndustrySeoPage.tsx              ← composes sections
├── IndustryHero.tsx
├── DeductionCards.tsx
├── ProblemSolution.tsx
├── HowItWorks.tsx                   ← id="how-it-works"
├── ExpenseExamples.tsx
├── IndustryFaq.tsx
├── IndustryFinalCta.tsx
└── SeoDisclaimer.tsx

public/marketing/seo/
└── electrician-worker.png           ← copy/optimize from docs asset
```

### Wiring

| Integration | Change |
|-------------|--------|
| `app/sitemap.ts` | Add `/tax-deductions`, `/tax-deductions/electrician` |
| `lib/marketing/copy.ts` footer | Product column: “Electrician Tax Deductions” → `/tax-deductions/electrician` |
| Metadata | `buildMarketingMetadata({ title, description, path })` |
| JSON-LD | Reuse `components/marketing/JsonLd` |
| App CTA | Reuse `MarketingAppLink` (no `preventDefault` on native `/app` navigation) |

---

## 4. Page IA

### 4.1 `/tax-deductions` (thin index)

1. H1: `Tax Deductions by Trade`
2. One supporting sentence: contractors can review common business expenses by trade and keep receipt-ready records before tax season
3. Single card/link: Electrician → `/tax-deductions/electrician`
4. `SeoDisclaimer`

No multi-trade placeholders, no long hub essay.

**Index metadata (locked):**
- Title: `Tax Deductions by Trade | SnapTax`
- Description: `Browse trade-specific tax deduction checklists for independent contractors. Start with electricians — tools, vehicles, supplies, and receipt tracking.`
- Electrician page owns the primary keyword `electrician tax deductions`; index stays hub-generic.

### 4.2 `/tax-deductions/electrician`

| # | Section | Notes |
|---|---------|--------|
| 0 | Breadcrumb UI | `Home > Tax Deductions > Electrician` — all links real |
| 1 | Hero | Context H1/body; dual CTAs; 4 trust items; worker image + existing phone screen |
| 2 | Deduction cards | Five SEO cards (Tools & Equipment, Vehicle, Materials & Supplies, Training & Licensing, Business Operations). Do **not** label the last two as in-app category names |
| 3 | Problem → solution | Three pains from context |
| 4 | How SnapTax works | `id="how-it-works"`; Track step lists **real** categories: Tools, Truck Gas, Supplies, Equipment, Materials, Other (as relevant) |
| 5 | Expense examples table | Educational category labels; footnote mapping to real US categories |
| 6 | Built for independents | Short block from context §6 (scanner / tracking / reports); keep to one compact band |
| 7 | FAQ | Four questions from context; hedged language |
| 8 | Final CTA | Start Tracking Free → `/app`; optional “No credit card required” |
| 9 | Disclaimer | Educational only + `/disclaimer` |

Outbound internal links (existing only): `/features`, `/faq`, relevant `/blog/...` (e.g. organize receipts, 1099 guide). No links to unbuilt guide URLs from the PRD.

---

## 5. Copy & data contract

### 5.1 Source rules

| Field | Source |
|-------|--------|
| `seo.title` | PRD: `Electrician Tax Deductions Checklist (Tools, Truck & Business Expenses)` |
| `seo.description` | PRD meta description |
| Hero H1, body, CTAs, cards, problems, how-it-works, examples, FAQ, final CTA | `0.0.1.context.md` |
| Product category claims | `lib/tax/usExportCategories.ts` (`US_EXPORT_CATEGORIES`) |
| Design-only short lines | Allowed as Hero subtitle polish (e.g. “Track Expenses. Save More. Stress Less.”) without overriding PRD title |

### 5.2 Category honesty

**Product US categories today:**  
`TRUCK GAS` · `TOOLS` · `SUPPLIES` · `EQUIPMENT` · `MATERIALS` · `MEALS` · `PERSONAL` · `OTHER`

SEO five cards remain for search/education. Any sentence that implies “SnapTax categorizes as X” must use real categories. Expense table may use educational labels with an explicit mapping note, e.g. expenses often map to Tools, Truck Gas, Supplies, Equipment, Materials, or Other.

### 5.3 Type shape

```ts
type IndustrySeoPage = {
  slug: "electrician";
  path: "/tax-deductions/electrician";
  label: string; // index card title
  seo: { title: string; description: string };
  hero: {
    h1: string;
    subtitle?: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    trustItems: string[];
    workerImage: { src: string; alt: string };
  };
  deductionCards: { title: string; body: string; examples: string[] }[];
  problems: { title: string; body: string; solution: string }[];
  howItWorks: {
    id: "how-it-works";
    steps: { title: string; body: string }[];
  };
  examples: { expense: string; category: string }[];
  productCategoryNote: string;
  faq: { question: string; answer: string }[];
  finalCta: { title: string; body: string; button: string };
  outboundLinks: { href: string; label: string }[];
};
```

`industries.ts` exports the published list used by the thin index. Adding a future trade = new data module + registry entry + route; no need to fork section components.

---

## 6. SEO technical

- Canonical via `buildMarketingMetadata`
- Open Graph: prefer electrician worker image if suitable dimensions; else existing marketing OG (`/marketing/hero-phone.png`)
- JSON-LD `@graph`:
  - `FAQPage` from page FAQ
  - `BreadcrumbList`: Home → Tax Deductions → Electrician (all URLs exist)
- Sitemap priorities: electrician page slightly above typical marketing children (e.g. `0.7`); index `0.6`
- No fabricated schema parents or HowTo markup in v1

---

## 7. Conversion & compliance

```text
Google → electrician page
  → read deductions (trust)
  → Start Tracking Free → /app (Ghost, zero gate)
  → snap receipts
  → season export → existing Paywall (not on this page)
```

Compliance:

- Footer-adjacent short disclaimer: educational purposes only; not tax advice; link `/disclaimer`
- No guaranteed deductibility claims
- No free-export promise; no unauthenticated “cloud sync” promise
- Marketing CTAs must not break Android Chrome `/app` WebAPK behavior

---

## 8. Visual system

Reuse marketing tokens (`MARKETING_TOKENS`: dark bg, accent green, CTA yellow). Medium fidelity:

- New section components under `components/marketing/seo/`
- Match existing marketing spacing/type scale; do not rebuild header/footer to mockup
- Responsive: single column on mobile; cards grid on desktop
- Hero: worker photo + existing app screenshot asset from `public/marketing/`
- Image fallback: if worker image missing at runtime build, degrade to phone-only / copy-first hero

---

## 9. Error / empty states

| Case | Behavior |
|------|----------|
| Registry empty | Index still renders with “More trades coming soon” (should not happen in v1; electrician is registered) |
| Worker image missing | Hero without industry photo; keep phone screen and CTAs |
| Broken outbound path | Only link paths that already exist in sitemap/blog |

---

## 10. Acceptance criteria

### Must

- [ ] `/tax-deductions` and `/tax-deductions/electrician` render under marketing layout
- [ ] Both paths in `sitemap.xml`
- [ ] Title/Meta match PRD; body structure matches context (+ category honesty rules)
- [ ] Primary CTA → `/app`; secondary CTA scrolls to `#how-it-works`
- [ ] Footer inbound link present
- [ ] UI breadcrumb three levels, all clickable
- [ ] FAQPage + BreadcrumbList JSON-LD present and valid
- [ ] No false in-app category labels (Education / Operations as product categories)
- [ ] Short disclaimer → `/disclaimer`
- [ ] Worker image from provided asset under `public/marketing/seo/`
- [ ] Out-of-scope items from §1 not implemented

### Post-launch observe (not implementation Must)

- Indexing in Google / Search Console queries
- CTA click if analytics already available; otherwise manual check

### Test suggestions

- Unit: registry lists electrician; metadata paths; FAQ schema shape
- Manual: mobile layout, anchor scroll, footer link, no dead internal links

---

## 11. Non-goals reminder

This page sells a **knowledge entry** for electrician tax deductions, then introduces SnapTax as the tracker — not “Electrician Tax Software.” Do not position against TurboTax/H&R Block style tax-prep SERPs.
