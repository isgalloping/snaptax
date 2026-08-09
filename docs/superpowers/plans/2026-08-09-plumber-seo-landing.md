# Plumber SEO Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/tax-deductions/plumber` on the shared industry SEO template with a Plumber-only `spotlight` Hero, UI-aligned sections, honest product copy, and three-way related-trades linking.

**Architecture:** Extend `IndustrySlug` + registry with `plumber.ts`. Add `visualLayout: "spotlight"` and optional `hero.highlights` / `howItWorks.stepsBanner`. Branch `IndustryHero` and `HowItWorks` without changing electrician (stacked) or HVAC (composite). Optimize assets into `public/marketing/seo/`. Wire route, sitemap, footer, and relatedTrades.

**Tech Stack:** Next.js App Router, React, Tailwind 4, sharp, node:test, existing `buildMarketingMetadata` / `JsonLd` / `MarketingAppLink`

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-09-plumber-seo-landing-design.md`
- Title/Meta ← PRD; H1 ← `Plumbing tax deductions, organized.`
- Primary CTA → `/app` (no query); secondary → `#deductions`
- Educational cards OK; product copy uses real `US_EXPORT_CATEGORIES` only — no “Smart Plumbing Categories”
- FAQ = UI six + mileage honesty = **7**; answers stay in DOM
- `spotlight` **only** for Plumber; electrician/HVAC layouts must not regress
- How it Works uses **one** three-phone `stepsBanner` (not three crops as separate step images)
- Three-way relatedTrades; sitemap priority `0.7`; Footer Product link
- Ship on dedicated branch from `main` (e.g. `feat/plumber-seo-landing`)
- No PDF / analytics / cluster pages / Header Industries / CTA query

## File map

| File | Responsibility |
|------|----------------|
| `lib/marketing/seo/types.ts` | slug + spotlight fields |
| `lib/marketing/seo/industries/plumber.ts` | Plumber page data |
| `lib/marketing/seo/industries.ts` | Register plumber |
| `lib/marketing/seo/industries/electrician.ts` | relatedTrades → HVAC + Plumber |
| `lib/marketing/seo/industries/hvac.ts` | relatedTrades → Electrician + Plumber |
| `lib/marketing/seo/industries.test.ts` | Registry / honesty / layout tests |
| `lib/marketing/seo/sitemapEntries.ts` (+ test) | `/tax-deductions/plumber` |
| `lib/marketing/copy.ts` | Footer link |
| `components/marketing/seo/IndustryHero.tsx` | spotlight branch |
| `components/marketing/seo/HowItWorks.tsx` | stepsBanner |
| `components/marketing/seo/BuiltForBand.tsx` | grid for 5 features |
| `app/(marketing)/tax-deductions/plumber/page.tsx` | Route |
| `app/(marketing)/tax-deductions/page.tsx` | Index meta mentions plumber |
| `public/marketing/seo/plumber-*` | Optimized assets |
| `docs/seo/plumber/ASSETS.md` | Asset index |

---

### Task 1: Types for spotlight + stepsBanner

**Files:**
- Modify: `lib/marketing/seo/types.ts`
- Modify: `lib/marketing/seo/industries.test.ts` (type-facing smoke only after Task 2 — skip failing data tests here)

**Interfaces:**
- Produces: `IndustrySlug` includes `"plumber"`; `visualLayout` includes `"spotlight"`; `hero.highlights?`; `howItWorks.stepsBanner?`

- [ ] **Step 1: Update `types.ts`**

Replace slug and extend hero / howItWorks:

```ts
export type IndustrySlug = "electrician" | "hvac" | "plumber";

// inside hero:
    /**
     * stacked (default when omitted): worker + phone side-by-side.
     * composite: full-width phoneImage with workerImage as corner overlay.
     * spotlight: copy | phone | worker+highlights (Plumber UI).
     */
    visualLayout?: "stacked" | "composite" | "spotlight";
    /** Right-column highlight rows for spotlight layout. */
    highlights?: { title: string; body: string }[];

// howItWorks:
  howItWorks: {
    id: "how-it-works";
    title: string;
    steps: { title: string; body: string }[];
    /** Optional three-phone (or similar) banner under steps. */
    stepsBanner?: { src: string; alt: string };
  };
```

- [ ] **Step 2: Commit**

```bash
git add lib/marketing/seo/types.ts
git commit -m "$(cat <<'EOF'
feat(seo): extend industry types for plumber spotlight layout

EOF
)"
```

---

### Task 2: Plumber registry data + relatedTrades + tests

**Files:**
- Create: `lib/marketing/seo/industries/plumber.ts`
- Modify: `lib/marketing/seo/industries.ts`
- Modify: `lib/marketing/seo/industries/electrician.ts`
- Modify: `lib/marketing/seo/industries/hvac.ts`
- Modify: `lib/marketing/seo/industries.test.ts`

**Interfaces:**
- Produces: `PLUMBER_SEO_PAGE`; registry length 3; each industry `relatedTrades.links.length === 2`

- [ ] **Step 1: Write failing tests**

Append / update in `industries.test.ts`:

```ts
  it("publishes electrician, hvac, and plumber", () => {
    const list = listPublishedIndustries();
    assert.equal(list.length, 3);
    assert.deepEqual(
      list.map((p) => p.slug),
      ["electrician", "hvac", "plumber"],
    );
  });

  it("loads plumber with PRD title/meta, UI H1, and spotlight layout", () => {
    const page = getIndustryBySlug("plumber");
    assert.ok(page);
    assert.equal(
      page.seo.title,
      "Plumber Tax Deductions: Expense Guide for Contractors | SnapTax",
    );
    assert.match(page.seo.description, /plumber tax deductions/i);
    assert.equal(page.hero.h1, "Plumbing tax deductions, organized.");
    assert.equal(page.hero.secondaryHref, "#deductions");
    assert.equal(page.hero.visualLayout, "spotlight");
    assert.equal(page.hero.highlights?.length, 4);
    assert.ok(page.howItWorks.stepsBanner?.src);
    assert.equal(page.deductionCards.length, 8);
    assert.equal(page.howItWorks.steps.length, 3);
    assert.equal(page.faq.length, 7);
    assert.equal(page.examples.length, 0);
    assert.equal(page.builtFor.features.length, 5);
    assert.ok(page.checklist);
  });

  it("plumber product copy avoids fake plumbing categories", () => {
    const page = getIndustryBySlug("plumber");
    assert.ok(page);
    const blob = [
      page.hero.trustItems.join(" "),
      ...page.howItWorks.steps.map((s) => s.body),
      ...page.builtFor.features.map((f) => `${f.title} ${f.body}`),
      page.productCategoryNote,
    ].join(" ");
    assert.doesNotMatch(blob, /Smart Plumbing Categories/i);
    assert.doesNotMatch(blob, /Plumbing expense categories/i);
    assert.match(page.howItWorks.steps[1]!.body, /Truck Gas|Supplies|Tools/i);
  });

  it("plumber mileage FAQ denies full mileage tracker", () => {
    const page = getIndustryBySlug("plumber");
    assert.ok(page);
    const mileage = page.faq.find((f) => /mileage/i.test(f.question));
    assert.ok(mileage);
    assert.match(mileage.answer, /does not/i);
    assert.match(mileage.answer, /separate/i);
  });

  it("each industry relatedTrades links to the other two", () => {
    for (const slug of ["electrician", "hvac", "plumber"] as const) {
      const page = getIndustryBySlug(slug);
      assert.ok(page?.relatedTrades);
      assert.equal(page.relatedTrades.links.length, 2);
      const hrefs = page.relatedTrades.links.map((l) => l.href).sort();
      const expected = [
        "/tax-deductions/electrician",
        "/tax-deductions/hvac",
        "/tax-deductions/plumber",
      ].filter((h) => h !== `/tax-deductions/${slug}`).sort();
      assert.deepEqual(hrefs, expected);
    }
  });
```

Update/remove the old test that expects electrician relatedTrades only HVAC as `links[0]` if it conflicts — replace with the three-way test above.

Run: `npm run test:unit -- lib/marketing/seo/industries.test.ts`  
Expected: FAIL (plumber missing)

- [ ] **Step 2: Create `plumber.ts`**

Create `lib/marketing/seo/industries/plumber.ts` with the locked object (paths must match Task 3 filenames):

```ts
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";

export const PLUMBER_SEO_PAGE: IndustrySeoPage = {
  slug: "plumber",
  path: "/tax-deductions/plumber",
  label: "Plumber",
  indexBlurb:
    "Common tax deductions for tools, parts, drain equipment, and service-truck costs.",
  seo: {
    title: "Plumber Tax Deductions: Expense Guide for Contractors | SnapTax",
    description:
      "Explore common plumber tax deductions and learn how to track tools, supplies, vehicle costs, licenses, and receipts with SnapTax.",
  },
  hero: {
    h1: "Plumbing tax deductions, organized.",
    subtitle: "Built for Plumbers & Plumbing Contractors",
    body: "Track receipts, organize plumbing business expenses, and prepare tax-ready reports without digging through your service truck at tax time.",
    primaryCta: "Track Plumbing Expenses",
    secondaryCta: "View Deductions",
    secondaryHref: "#deductions",
    visualLayout: "spotlight",
    trustItems: [
      "AI receipt scanning",
      "Organize expenses by category",
      "Export tax reports",
      "Works offline",
    ],
    workerImage: {
      src: "/marketing/seo/plumber-tax-deductions-snaptax.png",
      alt: "Plumber using a pipe wrench on residential piping",
    },
    phoneImage: {
      src: "/marketing/seo/plumber-tax-deductions-snaptax-phone.png",
      alt: "SnapTax app showing plumbing supplier receipts and tax saved",
    },
    ogImage: {
      src: "/marketing/seo/plumber-tax-deductions-snaptax-og.jpg",
      alt: "Plumber tax deductions and expense tracking with SnapTax",
    },
    highlights: [
      {
        title: "Built for plumbing work",
        body: "Designed for how plumbers actually work on jobs and in the truck.",
      },
      {
        title: "Tax-ready reports",
        body: "Export organized expense reports when you need them.",
      },
      {
        title: "Secure & private",
        body: "Keep receipt and expense records protected on your device and in sync.",
      },
      {
        title: "One-time payment",
        body: "Pay once per tax season — no subscription required.",
      },
    ],
  },
  deductionsTitle: "Common Plumber Tax Deductions",
  deductionsIntro:
    "A business expense may be deductible when it is ordinary and necessary for your plumbing work. Eligibility depends on how the expense was used and your individual tax situation.",
  deductionCards: [
    {
      title: "Tools & Equipment",
      body: "Specialized tools used on plumbing jobs.",
      examples: ["Pipe wrenches", "Cutters", "Inspection cameras", "Torch kits"],
    },
    {
      title: "Parts & Supplies",
      body: "Materials purchased for installs and repairs.",
      examples: ["Pipes", "Fittings", "Valves", "Sealants"],
    },
    {
      title: "Drain Cleaning Equipment",
      body: "Equipment used to clear and inspect drains.",
      examples: ["Augers", "Snakes", "Jetting accessories", "Cameras"],
    },
    {
      title: "Safety Gear",
      body: "Protective gear required for plumbing work.",
      examples: ["Gloves", "Knee pads", "Safety glasses", "Respirators"],
    },
    {
      title: "Vehicle Expenses",
      body: "Eligible costs of getting to jobs and suppliers.",
      examples: ["Fuel", "Parking", "Tolls", "Repairs"],
    },
    {
      title: "Licenses & Permits",
      body: "Credentials and fees for plumbing work.",
      examples: ["Plumbing licenses", "Local permits", "Inspection fees"],
    },
    {
      title: "Training & Certifications",
      body: "Courses that keep your trade skills current.",
      examples: ["Code courses", "Safety training", "Trade continuing education"],
    },
    {
      title: "Software & Services",
      body: "Tools that help run a plumbing business.",
      examples: ["Scheduling", "Invoicing", "Cloud storage"],
    },
  ],
  problemsTitle: "Plumbing receipts are easy to lose",
  problems: [
    {
      title: "Receipts disappear",
      body: "Supply-house receipts fade, get wet, or disappear into a service truck.",
      solution: "Snap the receipt before you leave the counter.",
    },
    {
      title: "Expenses get mixed together",
      body: "Materials, tools, fuel, and personal purchases often appear on the same card.",
      solution: "Categorize each purchase while the job is still fresh.",
    },
    {
      title: "Tax-time cleanup takes hours",
      body: "Waiting until tax season means searching through statements, emails, and tool bags.",
      solution: "Keep a running digital record all year.",
    },
  ],
  howItWorks: {
    id: "how-it-works",
    title: "How SnapTax Works for Plumbers",
    steps: [
      {
        title: "Capture Receipts",
        body: "Snap supplier, fuel, tool, and permit receipts as you work.",
      },
      {
        title: "Organize Expenses",
        body: "Review real categories like Tools, Supplies, Truck Gas, Equipment, Materials, and Other — and add a short job note when it helps.",
      },
      {
        title: "Export & File",
        body: "Create a tax-ready expense report for your records or tax professional.",
      },
    ],
    stepsBanner: {
      src: "/marketing/seo/plumber-tax-deductions-snaptax-steps.png",
      alt: "SnapTax capture, organize, and home screens for plumbing expenses",
    },
  },
  examplesTitle: "Example plumbing expenses",
  examplesCategoryHeader: "Category",
  examples: [],
  productCategoryNote:
    "SnapTax organizes expenses using Tools, Truck Gas, Supplies, Equipment, Materials, and Other — the same categories used in US exports.",
  checklist: {
    title: "Plumbing Expense Recordkeeping Checklist",
    items: [
      "Photograph every business receipt",
      "Separate personal and business expenses",
      "Record merchant, date, and amount",
      "Add the customer, job, or business purpose",
      "Keep mileage records separately",
      "Review Needs Action items",
      "Save license and permit records",
      "Export your annual report",
    ],
  },
  builtFor: {
    title: "Built for Plumbing Contractors",
    body: "Receipt capture and expense organization for independent plumbers — not a full accounting suite and not a tax-filing product.",
    features: [
      {
        title: "AI Receipt Scanner",
        body: "Extracts the merchant, date, amount, and other receipt details.",
      },
      {
        title: "Expense categories",
        body: "Helps organize tools, supplies, vehicle costs, licenses, and other business expenses.",
      },
      {
        title: "Tax Reports",
        body: "Exports clean expense reports for your records or tax professional.",
      },
      {
        title: "Offline Mode",
        body: "Works in basements, job sites, and low-connectivity environments.",
      },
      {
        title: "Secure & Private",
        body: "Helps protect sensitive receipt and expense records.",
      },
    ],
  },
  relatedTrades: {
    title: "Tax deductions for other trades",
    links: [
      { href: "/tax-deductions/electrician", label: "Electrician Tax Deductions" },
      { href: "/tax-deductions/hvac", label: "HVAC Tax Deductions" },
    ],
  },
  faq: [
    {
      question: "What can plumbers deduct on their taxes?",
      answer:
        "Potential business expenses may include qualifying tools, equipment, parts, supplies, safety gear, licenses, permits, training, vehicle expenses, software, and professional services. Eligibility depends on the nature and business use of each expense.",
    },
    {
      question: "Can plumbers write off tools?",
      answer:
        "Tools purchased for plumbing work may qualify as business expenses. The tax treatment can depend on the cost, useful life, and business-use percentage of the tool.",
    },
    {
      question: "Can plumbing materials be deducted?",
      answer:
        "Pipes, fittings, valves, connectors, sealants, repair parts, and other materials purchased for plumbing jobs may qualify as business expenses when properly documented.",
    },
    {
      question: "Can I deduct my plumbing service truck?",
      answer:
        "Eligible business vehicle expenses may be deductible, but personal commuting and business travel must be distinguished. Keep records supporting the business use of the vehicle.",
    },
    {
      question: "Can I deduct plumbing licenses and permits?",
      answer:
        "License renewals, eligible permits, professional fees, and continuing education related to an existing plumbing business may qualify, depending on the circumstances.",
    },
    {
      question: "Can I export reports for my accountant?",
      answer:
        "Yes. You can export an organized expense report and use it when reviewing your records with an accountant or tax preparer.",
    },
    {
      question: "Does SnapTax track mileage?",
      answer:
        "SnapTax can organize vehicle-related receipts, but it does not currently replace a complete mileage log. Keep separate records of each trip’s date, destination, distance, and business purpose.",
    },
  ],
  finalCta: {
    title: "Stop letting plumbing receipts disappear in your truck",
    body: "Snap, organize, and export plumbing expenses in minutes. Stay ready for tax time, every time.",
    button: "Start Tracking Expenses",
    noCardRequired: "No credit card required to start.",
    backgroundImage: {
      src: "/marketing/seo/plumber-tax-deductions-snaptax-cta.webp",
      alt: "",
    },
  },
  outboundLinks: [
    { href: "/features", label: "SnapTax features" },
    { href: "/faq", label: "FAQ" },
    { href: "/tax-deductions/electrician", label: "Electrician tax deductions" },
    { href: "/tax-deductions/hvac", label: "HVAC tax deductions" },
    {
      href: "/blog/how-to-organize-receipts",
      label: "How to organize receipts",
    },
  ],
  disclaimer:
    "For educational purposes only. Not tax advice. Confirm deductions with a qualified professional. See our disclaimer for details.",
};
```

- [ ] **Step 3: Register + patch relatedTrades**

`industries.ts`:

```ts
import { PLUMBER_SEO_PAGE } from "@/lib/marketing/seo/industries/plumber";

const PUBLISHED: readonly IndustrySeoPage[] = [
  ELECTRICIAN_SEO_PAGE,
  HVAC_SEO_PAGE,
  PLUMBER_SEO_PAGE,
];
```

Electrician `relatedTrades.links`:

```ts
    links: [
      { href: "/tax-deductions/hvac", label: "HVAC Tax Deductions" },
      { href: "/tax-deductions/plumber", label: "Plumber Tax Deductions" },
    ],
```

HVAC `relatedTrades.links`:

```ts
    links: [
      { href: "/tax-deductions/electrician", label: "Electrician Tax Deductions" },
      { href: "/tax-deductions/plumber", label: "Plumber Tax Deductions" },
    ],
```

Also add plumber to electrician/HVAC `outboundLinks` if missing (plumber path), matching HVAC↔electrician pattern.

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:unit -- lib/marketing/seo/industries.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/marketing/seo/industries/plumber.ts \
  lib/marketing/seo/industries.ts \
  lib/marketing/seo/industries/electrician.ts \
  lib/marketing/seo/industries/hvac.ts \
  lib/marketing/seo/industries.test.ts
git commit -m "$(cat <<'EOF'
feat(seo): add Plumber industry SEO content registry

EOF
)"
```

---

### Task 3: Optimize and publish Plumber assets

**Files:**
- Create under `public/marketing/seo/`:
  - `plumber-tax-deductions-snaptax.png`
  - `plumber-tax-deductions-snaptax-phone.png`
  - `plumber-tax-deductions-snaptax-steps.png`
  - `plumber-tax-deductions-snaptax-og.jpg`
  - `plumber-tax-deductions-snaptax-cta.webp`
- Create: `docs/seo/plumber/ASSETS.md`

**Interfaces:**
- Consumes: `docs/seo/plumber/plumber.0.0.1-hero.png`, `-mobile.png`, `-cta.png`
- Produces: runtime paths referenced by `PLUMBER_SEO_PAGE`

- [ ] **Step 1: Confirm sources**

```bash
ls -la docs/seo/plumber/plumber.0.0.1-hero.png \
  docs/seo/plumber/plumber.0.0.1-mobile.png \
  docs/seo/plumber/plumber.0.0.1-cta.png
```

- [ ] **Step 2: Generate optimized assets**

```bash
node <<'NODE'
const sharp = require('sharp');
const fs = require('fs');
const dir = 'public/marketing/seo';
fs.mkdirSync(dir, { recursive: true });

(async () => {
  // Worker / scene
  await sharp('docs/seo/plumber/plumber.0.0.1-hero.png')
    .resize({ width: 960, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toFile(`${dir}/plumber-tax-deductions-snaptax.png`);

  // Steps banner = full three-phone strip
  await sharp('docs/seo/plumber/plumber.0.0.1-mobile.png')
    .resize({ width: 1200, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toFile(`${dir}/plumber-tax-deductions-snaptax-steps.png`);

  // Hero phone: crop rightmost third of mobile strip (dashboard phone)
  const mobile = sharp('docs/seo/plumber/plumber.0.0.1-mobile.png');
  const meta = await mobile.metadata();
  const w = meta.width || 1800;
  const h = meta.height || 900;
  const third = Math.floor(w / 3);
  await sharp('docs/seo/plumber/plumber.0.0.1-mobile.png')
    .extract({ left: third * 2, top: 0, width: w - third * 2, height: h })
    .resize({ width: 480, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toFile(`${dir}/plumber-tax-deductions-snaptax-phone.png`);

  await sharp('docs/seo/plumber/plumber.0.0.1-hero.png')
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`${dir}/plumber-tax-deductions-snaptax-og.jpg`);

  await sharp('docs/seo/plumber/plumber.0.0.1-cta.png')
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(`${dir}/plumber-tax-deductions-snaptax-cta.webp`);

  for (const f of fs.readdirSync(dir).filter((n) => n.startsWith('plumber-'))) {
    console.log(f, fs.statSync(`${dir}/${f}`).size);
  }
})();
NODE
```

Prefer each file &lt; 400KB. If phone crop looks wrong, adjust `left`/`width` once and regenerate.

- [ ] **Step 3: Write `docs/seo/plumber/ASSETS.md`**

```md
# Plumber SEO assets

Runtime images live under `public/marketing/seo/`:

- `plumber-tax-deductions-snaptax.png` — hero worker scene (~960w)
- `plumber-tax-deductions-snaptax-phone.png` — Hero single-phone mock
- `plumber-tax-deductions-snaptax-steps.png` — How it Works three-phone strip (~1200w)
- `plumber-tax-deductions-snaptax-og.jpg` — Open Graph (1200×630)
- `plumber-tax-deductions-snaptax-cta.webp` — CTA section background (~1600w)

Source exports: `plumber.0.0.1-hero.png`, `plumber.0.0.1-mobile.png`, `plumber.0.0.1-cta.png`, `plumber.0.0.1.png`.
```

- [ ] **Step 4: Commit**

```bash
git add public/marketing/seo/plumber-tax-deductions-snaptax.png \
  public/marketing/seo/plumber-tax-deductions-snaptax-phone.png \
  public/marketing/seo/plumber-tax-deductions-snaptax-steps.png \
  public/marketing/seo/plumber-tax-deductions-snaptax-og.jpg \
  public/marketing/seo/plumber-tax-deductions-snaptax-cta.webp \
  docs/seo/plumber/ASSETS.md
git commit -m "$(cat <<'EOF'
feat(seo): add optimized Plumber landing image assets

EOF
)"
```

---

### Task 4: IndustryHero spotlight + BuiltFor grid

**Files:**
- Modify: `components/marketing/seo/IndustryHero.tsx`
- Modify: `components/marketing/seo/BuiltForBand.tsx`

**Interfaces:**
- Consumes: `visualLayout === "spotlight"`, `phoneImage`, `workerImage`, `highlights`
- Produces: three-zone spotlight; stacked/composite unchanged

- [ ] **Step 1: Implement spotlight branch in `IndustryHero`**

Add:

```ts
  const useSpotlight =
    page.hero.visualLayout === "spotlight" &&
    Boolean(phoneImage) &&
    Boolean(page.hero.highlights?.length);
```

Grid when spotlight (lg): three columns, e.g.  
`lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.85fr)_minmax(0,0.9fr)]`  
(or `1fr 0.9fr 0.95fr`). Narrow: single column stack — copy, phone, worker+highlights.

**Left column:** existing breadcrumb stays above grid. Inside left:
- Render `subtitle` as green pill (`rounded-full`, accent border/bg subtle) when `useSpotlight`, else keep current subtitle `<p>`.
- H1: if `useSpotlight` and `h1` includes `organized.`, split so trailing `organized.` uses `MARKETING_TOKENS.accentGreen`; otherwise render full h1 as today.
- body, CTAs (`secondaryHref`), trustItems — reuse existing markup.

**Center:** phone image `w-full max-w-[16rem] mx-auto` (single phone).

**Right:**
```tsx
<div className="space-y-4">
  <div className="overflow-hidden rounded-2xl border border-white/10">
    <img src={page.hero.workerImage.src} alt={page.hero.workerImage.alt} className="h-auto w-full object-cover" />
  </div>
  <ul className="space-y-3">
    {page.hero.highlights!.map((item) => (
      <li key={item.title} className="...">
        <p className="font-bold text-white">{item.title}</p>
        <p className="text-sm text-zinc-400">{item.body}</p>
      </li>
    ))}
  </ul>
</div>
```

Keep `useComposite` and stacked `else` branches **byte-stable** aside from the new ternary arm.

- [ ] **Step 2: BuiltForBand grid for 5 features**

Replace fixed `sm:grid-cols-3` with:

```tsx
<ul className="mt-10 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
```

(Works for 3 or 5 features.)

- [ ] **Step 3: Manual check**

`npm run dev` → `/tax-deductions/plumber` spotlight; `/electrician` stacked; `/hvac` composite.

- [ ] **Step 4: Commit**

```bash
git add components/marketing/seo/IndustryHero.tsx \
  components/marketing/seo/BuiltForBand.tsx
git commit -m "$(cat <<'EOF'
feat(seo): add spotlight hero layout for Plumber landing

EOF
)"
```

---

### Task 5: HowItWorks stepsBanner

**Files:**
- Modify: `components/marketing/seo/HowItWorks.tsx`

- [ ] **Step 1: Render optional banner under steps**

After the `<ol>...</ol>`, add:

```tsx
        {howItWorks.stepsBanner ? (
          <div className="mt-12 overflow-hidden rounded-2xl border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={howItWorks.stepsBanner.src}
              alt={howItWorks.stepsBanner.alt}
              className="mx-auto h-auto w-full max-w-4xl object-contain"
            />
          </div>
        ) : null}
```

Electrician/HVAC omit `stepsBanner` → no change.

- [ ] **Step 2: Commit**

```bash
git add components/marketing/seo/HowItWorks.tsx
git commit -m "$(cat <<'EOF'
feat(seo): support optional HowItWorks steps banner image

EOF
)"
```

---

### Task 6: Plumber route page

**Files:**
- Create: `app/(marketing)/tax-deductions/plumber/page.tsx`

- [ ] **Step 1: Mirror HVAC page**

```tsx
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/marketing/JsonLd";
import { IndustrySeoPageView } from "@/components/marketing/seo/IndustrySeoPage";
import { getIndustryBySlug } from "@/lib/marketing/seo/industries";
import { buildIndustryJsonLd } from "@/lib/marketing/seo/jsonLd";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

const page = getIndustryBySlug("plumber");

export const metadata = page
  ? buildMarketingMetadata({
      title: page.seo.title,
      description: page.seo.description,
      path: page.path,
      imagePath: page.hero.ogImage.src,
      imageAlt: page.hero.ogImage.alt,
    })
  : buildMarketingMetadata({
      title: "Not found",
      description: "Not found",
      path: "/tax-deductions/plumber",
    });

export default function PlumberTaxDeductionsPage() {
  const industry = getIndustryBySlug("plumber");
  if (!industry) notFound();

  return (
    <>
      <JsonLd data={buildIndustryJsonLd(industry)} />
      <IndustrySeoPageView page={industry} />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(marketing\)/tax-deductions/plumber/page.tsx
git commit -m "$(cat <<'EOF'
feat(seo): ship Plumber tax deductions landing page

EOF
)"
```

---

### Task 7: Sitemap, Footer, index meta

**Files:**
- Modify: `lib/marketing/seo/sitemapEntries.ts`
- Modify: `lib/marketing/seo/sitemapEntries.test.ts`
- Modify: `lib/marketing/copy.ts`
- Modify: `app/(marketing)/tax-deductions/page.tsx`

- [ ] **Step 1: Sitemap**

```ts
export const TAX_DEDUCTION_SITEMAP_ENTRIES = [
  { path: "/tax-deductions", priority: 0.6 },
  { path: "/tax-deductions/electrician", priority: 0.7 },
  { path: "/tax-deductions/hvac", priority: 0.7 },
  { path: "/tax-deductions/plumber", priority: 0.7 },
] as const;
```

Update test `deepEqual` accordingly.

- [ ] **Step 2: Footer**

In `MARKETING_COPY.footer` Product column, after HVAC link add:

```ts
{ href: "/tax-deductions/plumber", label: "Plumber Tax Deductions" },
```

- [ ] **Step 3: Index meta**

Update `app/(marketing)/tax-deductions/page.tsx` description to mention electricians, HVAC technicians, and plumbers.

- [ ] **Step 4: Run tests**

```bash
npm run test:unit -- lib/marketing/seo/sitemapEntries.test.ts lib/marketing/seo/industries.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/marketing/seo/sitemapEntries.ts \
  lib/marketing/seo/sitemapEntries.test.ts \
  lib/marketing/copy.ts \
  app/\(marketing\)/tax-deductions/page.tsx
git commit -m "$(cat <<'EOF'
feat(seo): sitemap and footer entry for Plumber landing

EOF
)"
```

---

### Task 8: Acceptance pass

- [ ] **Step 1: Walk Must checklist from spec §9**

Confirm spotlight composition, 8/3/banner/5/7, CTAs, mileage FAQ, no Smart Plumbing Categories, electrician/HVAC unchanged, index/footer/sitemap/relatedTrades, disclaimer.

- [ ] **Step 2: Unit tests**

```bash
npm run test:unit -- lib/marketing/seo/industries.test.ts lib/marketing/seo/jsonLd.test.ts lib/marketing/seo/sitemapEntries.test.ts
```

Expected: PASS

- [ ] **Step 3: Commit only if cleanup remains**

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| Types spotlight / highlights / stepsBanner | Task 1 |
| Plumber registry + honesty + 7 FAQs | Task 2 |
| Three-way relatedTrades | Task 2 |
| Optimized assets + phone crop | Task 3 |
| Spotlight Hero + BuiltFor 5-col | Task 4 |
| HowItWorks banner | Task 5 |
| Route + JSON-LD | Task 6 |
| Sitemap / Footer / index meta | Task 7 |
| Acceptance | Task 8 |
| No PDF / cluster / query CTA / elec-HVAC refactor | Out of scope |

**Placeholder scan:** none intentional.  
**Type consistency:** `spotlight`, `highlights`, `stepsBanner` used uniformly in Tasks 1–5.
