# Roofer SEO Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/tax-deductions/roofer` on the shared industry SEO template with Plumber-parity mockup fidelity (`presentation: "mockup"` + spotlight Hero), honest product copy, and four-way related-trades linking.

**Architecture:** Extend `IndustrySlug` with `roofer`, add `industries/roofer.ts`, register in `PUBLISHED`, wire route/sitemap/footer/index meta. Reuse existing mockup component branches — no new Hero layout. Optimize + alpha-knockout assets into `public/marketing/seo/`. Expand every industry’s `relatedTrades` to the other three trades.

**Tech Stack:** Next.js App Router, React, Tailwind 4, sharp, `scripts/seo-knockout-near-black.mjs`, node:test, existing `buildMarketingMetadata` / `JsonLd` / `IndustrySeoPageView`

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-09-roofer-seo-landing-design.md`
- Title/Meta ← PRD; H1 ← `Roofing tax deductions, organized.`
- Primary CTA → `/app` (no query); secondary → `#deductions`
- Educational cards OK; product copy uses real export categories only — **no “Smart Roofing Categories”**
- Hero trust #2 ← `Organize expenses by category`
- FAQ = UI six + mileage honesty = **7**; no “View all”
- `presentation: "mockup"` + `visualLayout: "spotlight"`; electrician/HVAC Hero layouts must not regress
- Four-way relatedTrades (each page → other 3); sitemap priority `0.7`; Footer Product link
- Base branch must include Plumber mockup infrastructure (prefer `main` after PR #227 merges; otherwise branch from `feat/plumber-seo-landing`)
- Ship on `feat/roofer-seo-landing`
- No PDF / analytics / cluster pages / Header Industries / CTA query

## File map

| File | Responsibility |
|------|----------------|
| `lib/marketing/seo/types.ts` | `IndustrySlug` += `"roofer"` |
| `lib/marketing/seo/industries/roofer.ts` | Roofer page data |
| `lib/marketing/seo/industries.ts` | Register roofer |
| `lib/marketing/seo/industries/{electrician,hvac,plumber}.ts` | relatedTrades → 3 peers |
| `lib/marketing/seo/industries.test.ts` | Registry / honesty / mesh / alpha |
| `lib/marketing/seo/sitemapEntries.ts` (+ test) | `/tax-deductions/roofer` |
| `lib/marketing/copy.ts` (+ footer test if needed) | Footer link |
| `app/(marketing)/tax-deductions/roofer/page.tsx` | Route |
| `app/(marketing)/tax-deductions/page.tsx` | Index meta mentions roofers |
| `public/marketing/seo/roofer-*` | Optimized assets |
| `docs/seo/roofer/*` | Source PRD/UI/assets + `ASSETS.md` |

---

### Task 1: Branch + slug type

**Files:**
- Modify: `lib/marketing/seo/types.ts`

**Interfaces:**
- Produces: `IndustrySlug` includes `"roofer"`
- Consumes: base branch with mockup/spotlight already present

- [ ] **Step 1: Create branch**

```bash
# If plumber mockup is on main:
git fetch origin main
git checkout -b feat/roofer-seo-landing origin/main

# Else (PR #227 still open):
git fetch origin feat/plumber-seo-landing
git checkout -b feat/roofer-seo-landing origin/feat/plumber-seo-landing
```

Confirm `presentation?: "default" | "mockup"` and `visualLayout` includes `"spotlight"` exist in `types.ts`. If missing, stop and rebase onto the plumber branch.

- [ ] **Step 2: Extend slug**

In `lib/marketing/seo/types.ts`:

```ts
export type IndustrySlug = "electrician" | "hvac" | "plumber" | "roofer";
```

Update the comment on `presentation` if it still says “Plumber only” — change to “mockup = UI-fidelity section variants (Plumber, Roofer, …)”.

- [ ] **Step 3: Commit**

```bash
git add lib/marketing/seo/types.ts
git commit -m "$(cat <<'EOF'
feat(seo): add roofer to IndustrySlug

EOF
)"
```

---

### Task 2: Optimize and publish Roofer assets

**Files:**
- Create under `public/marketing/seo/`:
  - `roofer-tax-deductions-snaptax.png`
  - `roofer-tax-deductions-snaptax-phone.png`
  - `roofer-tax-deductions-snaptax-steps.png`
  - `roofer-tax-deductions-snaptax-og.jpg`
  - `roofer-tax-deductions-snaptax-cta.webp`
- Create: `docs/seo/roofer/ASSETS.md`
- Add (if untracked): `docs/seo/roofer/roofer.0.0.1.prd.md`, `roofer.0.01.png`, `roofer.0.0.1-hero.png`, `roofer.0.0.1-mobile.png`, `roofer.0.0.1-cta.png`

**Interfaces:**
- Consumes: source PNGs under `docs/seo/roofer/`; `scripts/seo-knockout-near-black.mjs`
- Produces: runtime paths for `ROOFER_SEO_PAGE`

- [ ] **Step 1: Confirm sources + knockout script**

```bash
ls -la docs/seo/roofer/roofer.0.0.1-hero.png \
  docs/seo/roofer/roofer.0.0.1-mobile.png \
  docs/seo/roofer/roofer.0.0.1-cta.png \
  docs/seo/roofer/roofer.0.01.png \
  scripts/seo-knockout-near-black.mjs
```

Expected: all exist. If knockout script missing, cherry-pick from plumber branch.

- [ ] **Step 2: Generate optimized assets**

```bash
node <<'NODE'
const sharp = require("sharp");
const fs = require("fs");
const dir = "public/marketing/seo";
fs.mkdirSync(dir, { recursive: true });

(async () => {
  await sharp("docs/seo/roofer/roofer.0.0.1-hero.png")
    .resize({ width: 960, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toFile(`${dir}/roofer-tax-deductions-snaptax.png`);

  await sharp("docs/seo/roofer/roofer.0.0.1-mobile.png")
    .resize({ width: 1200, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toFile(`${dir}/roofer-tax-deductions-snaptax-steps.png`);

  // Hero phone: crop center device from full-page UI (748×2103).
  // Tune extract if the crop includes non-phone chrome — open the PNG and adjust.
  const ui = sharp("docs/seo/roofer/roofer.0.01.png");
  const meta = await ui.metadata();
  const w = meta.width ?? 748;
  const h = meta.height ?? 2103;
  // Approximate Hero phone band (center column, upper third)
  const left = Math.round(w * 0.34);
  const top = Math.round(h * 0.075);
  const width = Math.round(w * 0.30);
  const height = Math.round(h * 0.22);
  await sharp("docs/seo/roofer/roofer.0.01.png")
    .extract({ left, top, width, height })
    .resize({ width: 480, withoutEnlargement: true })
    .png()
    .toFile(`${dir}/roofer-tax-deductions-snaptax-phone.png`);

  await sharp("docs/seo/roofer/roofer.0.0.1-hero.png")
    .resize(1200, 630, { fit: "cover", position: "attention" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`${dir}/roofer-tax-deductions-snaptax-og.jpg`);

  await sharp("docs/seo/roofer/roofer.0.0.1-cta.png")
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(`${dir}/roofer-tax-deductions-snaptax-cta.webp`);

  console.log("wrote roofer assets", { left, top, width, height });
})();
NODE
```

Visually open `…-phone.png`. If crop is wrong, re-run with adjusted fractions until a single phone fills the frame with minimal extra UI.

- [ ] **Step 3: Alpha knockout phone + steps**

```bash
node scripts/seo-knockout-near-black.mjs \
  public/marketing/seo/roofer-tax-deductions-snaptax-phone.png \
  public/marketing/seo/roofer-tax-deductions-snaptax-steps.png
```

Expected: `hasAlpha=true` for both. Spot-check in-screen dark UI intact.

- [ ] **Step 4: Write ASSETS.md**

Create `docs/seo/roofer/ASSETS.md`:

```md
# Roofer SEO assets

Runtime images live under `public/marketing/seo/`:

- `roofer-tax-deductions-snaptax.png` — hero worker scene (~960w)
- `roofer-tax-deductions-snaptax-phone.png` — Hero single-phone mock (transparent canvas alpha)
- `roofer-tax-deductions-snaptax-steps.png` — How it Works three-phone strip (~1200w, transparent canvas alpha)
- `roofer-tax-deductions-snaptax-og.jpg` — Open Graph (1200×630)
- `roofer-tax-deductions-snaptax-cta.webp` — CTA section background (~1600w)

Source exports: `roofer.0.0.1-hero.png`, `roofer.0.0.1-mobile.png`, `roofer.0.0.1-cta.png`, `roofer.0.01.png`.
```

- [ ] **Step 5: Commit**

```bash
git add \
  docs/seo/roofer/ \
  public/marketing/seo/roofer-tax-deductions-snaptax.png \
  public/marketing/seo/roofer-tax-deductions-snaptax-phone.png \
  public/marketing/seo/roofer-tax-deductions-snaptax-steps.png \
  public/marketing/seo/roofer-tax-deductions-snaptax-og.jpg \
  public/marketing/seo/roofer-tax-deductions-snaptax-cta.webp
git commit -m "$(cat <<'EOF'
feat(seo): add optimized Roofer landing image assets

EOF
)"
```

---

### Task 3: Roofer registry data + relatedTrades mesh + tests

**Files:**
- Create: `lib/marketing/seo/industries/roofer.ts`
- Modify: `lib/marketing/seo/industries.ts`
- Modify: `lib/marketing/seo/industries/electrician.ts`
- Modify: `lib/marketing/seo/industries/hvac.ts`
- Modify: `lib/marketing/seo/industries/plumber.ts`
- Modify: `lib/marketing/seo/industries.test.ts`

**Interfaces:**
- Produces: `ROOFER_SEO_PAGE`; `listPublishedIndustries().length === 4`; each `relatedTrades.links.length === 3`

- [ ] **Step 1: Write failing tests**

Update / append in `lib/marketing/seo/industries.test.ts`:

```ts
  it("publishes electrician, hvac, plumber, and roofer", () => {
    const list = listPublishedIndustries();
    assert.equal(list.length, 4);
    assert.deepEqual(
      list.map((p) => p.slug),
      ["electrician", "hvac", "plumber", "roofer"],
    );
  });

  it("loads roofer with PRD title/meta, UI H1, and mockup spotlight", () => {
    const page = getIndustryBySlug("roofer");
    assert.ok(page);
    assert.equal(
      page.seo.title,
      "Roofer Tax Deductions: Expense Guide for Contractors | SnapTax",
    );
    assert.match(page.seo.description, /roofer tax deductions/i);
    assert.equal(page.hero.h1, "Roofing tax deductions, organized.");
    assert.equal(page.presentation, "mockup");
    assert.equal(page.hero.visualLayout, "spotlight");
    assert.equal(page.hero.secondaryHref, "#deductions");
    assert.equal(page.hero.highlights?.length, 4);
    assert.equal(page.deductionCards.length, 8);
    assert.equal(page.howItWorks.steps.length, 3);
    assert.ok(page.howItWorks.stepsBanner?.src);
    assert.equal(page.faq.length, 7);
    assert.equal(page.examples.length, 0);
    assert.equal(page.builtFor.features.length, 5);
    assert.ok(page.checklist);
    assert.ok(page.problemsClosing);
  });

  it("roofer product copy avoids Smart Roofing Categories", () => {
    const page = getIndustryBySlug("roofer");
    assert.ok(page);
    const blob = [
      page.hero.trustItems.join(" "),
      ...page.howItWorks.steps.map((s) => s.body),
      ...page.builtFor.features.map((f) => `${f.title} ${f.body}`),
      page.productCategoryNote,
    ].join(" ");
    assert.doesNotMatch(blob, /Smart Roofing Categories/i);
    assert.match(page.hero.trustItems.join(" "), /Organize expenses by category/i);
  });

  it("roofer mileage FAQ denies full mileage tracker", () => {
    const page = getIndustryBySlug("roofer");
    assert.ok(page);
    const mileage = page.faq.find((f) => /mileage/i.test(f.question));
    assert.ok(mileage);
    assert.match(mileage.answer, /does not/i);
    assert.match(mileage.answer, /separate/i);
  });

  it("each industry relatedTrades links to the other three", () => {
    const all = [
      "/tax-deductions/electrician",
      "/tax-deductions/hvac",
      "/tax-deductions/plumber",
      "/tax-deductions/roofer",
    ];
    for (const slug of ["electrician", "hvac", "plumber", "roofer"] as const) {
      const page = getIndustryBySlug(slug);
      assert.ok(page?.relatedTrades);
      assert.equal(page.relatedTrades.links.length, 3);
      const hrefs = page.relatedTrades.links.map((l) => l.href).sort();
      const expected = all.filter((h) => h !== `/tax-deductions/${slug}`).sort();
      assert.deepEqual(hrefs, expected);
    }
  });

  it("roofer phone and steps assets have alpha channel", async () => {
    const root = process.cwd();
    for (const rel of [
      "public/marketing/seo/roofer-tax-deductions-snaptax-phone.png",
      "public/marketing/seo/roofer-tax-deductions-snaptax-steps.png",
    ]) {
      const meta = await sharp(path.join(root, rel)).metadata();
      assert.equal(meta.hasAlpha, true, `${rel} must have alpha`);
    }
  });
```

Remove or rewrite obsolete tests that assert:
- `getIndustryBySlug("roofer") === undefined`
- published length `3`
- relatedTrades length `2` / “other two”

Ensure `import path from "node:path"` and `import sharp from "sharp"` exist at top of the test file.

- [ ] **Step 2: Run tests — expect FAIL**

```bash
node --import tsx --test lib/marketing/seo/industries.test.ts
```

Expected: FAIL on missing roofer / mesh length.

- [ ] **Step 3: Create `roofer.ts`**

Create `lib/marketing/seo/industries/roofer.ts` with **exactly** this module:

```ts
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";

export const ROOFER_SEO_PAGE: IndustrySeoPage = {
  slug: "roofer",
  presentation: "mockup",
  path: "/tax-deductions/roofer",
  label: "Roofer",
  indexBlurb:
    "Common tax deductions for roofing materials, tools, safety gear, rentals, and dump fees.",
  seo: {
    title: "Roofer Tax Deductions: Expense Guide for Contractors | SnapTax",
    description:
      "Explore common roofer tax deductions and learn how to track roofing materials, tools, vehicle costs, equipment rentals, dump fees, and receipts.",
  },
  hero: {
    h1: "Roofing tax deductions, organized.",
    subtitle: "Built for Roofers & Roofing Contractors",
    body: "Track receipts, organize roofing business expenses, and prepare tax-ready reports without digging through your work truck at tax time.",
    primaryCta: "Track Roofing Expenses",
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
      src: "/marketing/seo/roofer-tax-deductions-snaptax.png",
      alt: "Roofer in a safety harness installing shingles on a residential roof",
    },
    phoneImage: {
      src: "/marketing/seo/roofer-tax-deductions-snaptax-phone.png",
      alt: "SnapTax app showing roofing supplier receipts and tax saved",
    },
    ogImage: {
      src: "/marketing/seo/roofer-tax-deductions-snaptax-og.jpg",
      alt: "Roofer tax deductions and expense tracking with SnapTax",
    },
    highlights: [
      {
        title: "Built for roofing work",
        body: "Designed for how roofers actually work on roofs and in the truck.",
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
  deductionsTitle: "Common Roofer Tax Deductions",
  deductionsIntro:
    "A roofing business expense may be deductible when it is ordinary and necessary for the work. Eligibility depends on how the expense was used and your individual tax situation.",
  deductionCards: [
    {
      title: "Roofing Materials",
      body: "Materials purchased for roof installs and repairs.",
      examples: ["Shingles", "Underlayment", "Flashing", "Sealants"],
    },
    {
      title: "Tools & Equipment",
      body: "Tools used on roofing jobs.",
      examples: ["Nail guns", "Compressors", "Saws", "Hand tools"],
    },
    {
      title: "Safety Equipment",
      body: "Fall protection and protective gear for roof work.",
      examples: ["Harnesses", "Anchors", "Helmets", "Gloves"],
    },
    {
      title: "Ladders & Scaffolding",
      body: "Access equipment for roofs and elevations.",
      examples: ["Ladders", "Platforms", "Scaffolding", "Temporary access"],
    },
    {
      title: "Vehicle Expenses",
      body: "Eligible costs of getting to jobs and suppliers.",
      examples: ["Fuel", "Tolls", "Parking", "Truck costs"],
    },
    {
      title: "Equipment Rental",
      body: "Short-term gear rented for roofing projects.",
      examples: ["Lifts", "Trailers", "Compressors", "Dumpsters"],
    },
    {
      title: "Dump & Disposal Fees",
      body: "Debris and landfill costs from roof work.",
      examples: ["Landfill fees", "Hauling", "Transfer station"],
    },
    {
      title: "Licenses & Permits",
      body: "Credentials and fees for roofing work.",
      examples: ["Contractor licenses", "Local permits", "Inspection fees"],
    },
  ],
  problemsTitle: "Roofing receipts are easy to lose",
  problems: [
    {
      title: "Receipts disappear",
      body: "Supply-house receipts fade, tear, get wet, or disappear into a work truck.",
      solution: "Snap the receipt before you leave the supplier.",
    },
    {
      title: "Expenses get mixed together",
      body: "Materials, tools, fuel, rentals, and personal purchases often appear on the same card.",
      solution: "Categorize each purchase while the job is still fresh.",
    },
    {
      title: "Tax-time cleanup takes hours",
      body: "Waiting until tax season means searching through statements, emails, trucks, and job folders.",
      solution: "Keep a running digital record all year.",
    },
  ],
  problemsClosing:
    "SnapTax keeps every roofing receipt organized and ready for tax time.",
  howItWorks: {
    id: "how-it-works",
    title: "How SnapTax Works for Roofers",
    steps: [
      {
        title: "Capture Receipts",
        body: "Snap material, fuel, tool, rental, and dump-fee receipts as you work.",
      },
      {
        title: "Review the Result",
        body: "Check the merchant, amount, and category — using Tools, Supplies, Truck Gas, Equipment, Materials, and Other — plus the Schedule C line when shown.",
      },
      {
        title: "Organize & Export",
        body: "Review ready items and create a tax-ready expense report for your records or tax professional.",
      },
    ],
    stepsBanner: {
      src: "/marketing/seo/roofer-tax-deductions-snaptax-steps.png",
      alt: "SnapTax capture, review, and home screens for roofing expenses",
    },
  },
  examplesTitle: "Example roofing expenses",
  examplesCategoryHeader: "Category",
  examples: [],
  productCategoryNote:
    "SnapTax organizes expenses using Tools, Truck Gas, Supplies, Equipment, Materials, and Other — the same categories used in US exports.",
  checklist: {
    title: "Roofing Expense Recordkeeping Checklist",
    items: [
      "Photograph every business receipt",
      "Separate personal and business expenses",
      "Record merchant, date, and amount",
      "Add the customer, project, or job",
      "Keep mileage records separately",
      "Save equipment rental agreements",
      "Save dump and disposal receipts",
      "Review Needs Action items",
      "Export your annual report",
    ],
  },
  builtFor: {
    title: "Built for Roofing Contractors",
    body: "Receipt capture and expense organization for independent roofers — not a full accounting suite and not a tax-filing product.",
    features: [
      {
        title: "AI Receipt Scanner",
        body: "Extracts the merchant, date, amount, and other receipt details.",
      },
      {
        title: "Expense categories",
        body: "Helps organize materials, tools, rentals, vehicles, and disposal expenses.",
      },
      {
        title: "Tax Reports",
        body: "Exports clean expense reports for your records or tax professional.",
      },
      {
        title: "Offline Mode",
        body: "Capture expenses from job sites and sync when connectivity returns.",
      },
      {
        title: "Secure & Private",
        body: "Helps protect sensitive receipt and expense information.",
      },
    ],
  },
  relatedTrades: {
    title: "Tax deductions for other trades",
    links: [
      { href: "/tax-deductions/electrician", label: "Electrician Tax Deductions" },
      { href: "/tax-deductions/hvac", label: "HVAC Tax Deductions" },
      { href: "/tax-deductions/plumber", label: "Plumber Tax Deductions" },
    ],
  },
  faq: [
    {
      question: "What can roofers deduct on their taxes?",
      answer:
        "Potential business expenses may include qualifying roofing materials, tools, safety equipment, vehicle costs, rentals, disposal fees, licenses, permits, insurance, software, advertising, and professional services. Eligibility depends on the nature and business use of each expense.",
    },
    {
      question: "Can roofers write off tools and equipment?",
      answer:
        "Tools and equipment purchased for roofing work may qualify as business expenses. The tax treatment can depend on the cost, expected useful life, and business-use percentage.",
    },
    {
      question: "Can roofing materials be deducted?",
      answer:
        "Shingles, underlayment, flashing, fasteners, sealants, membranes, and other materials purchased for roofing jobs may qualify as business expenses when properly documented.",
    },
    {
      question: "Can roofers deduct safety equipment?",
      answer:
        "Safety harnesses, anchors, helmets, gloves, eye protection, respirators, and other protective equipment required for roofing work may qualify, depending on the circumstances.",
    },
    {
      question: "Can I deduct my roofing work truck?",
      answer:
        "Eligible business vehicle expenses may be deductible, but personal commuting and business travel must be distinguished. Keep records supporting the vehicle’s business use.",
    },
    {
      question: "Can roofers deduct dump fees?",
      answer:
        "Dump, landfill, debris hauling, and related disposal fees paid for roofing projects may qualify as business expenses when supported by appropriate records.",
    },
    {
      question: "Does SnapTax track mileage?",
      answer:
        "SnapTax can organize vehicle-related receipts, but it does not currently replace a complete mileage log. Keep separate records of each trip’s date, destination, distance, and business purpose.",
    },
  ],
  finalCta: {
    title: "Stop letting roofing receipts disappear in your truck",
    body: "Capture receipts as you work, organize roofing expenses, and prepare a cleaner record for tax season.",
    button: "Start Tracking Expenses",
    noCardRequired: "No credit card required to start.",
    backgroundImage: {
      src: "/marketing/seo/roofer-tax-deductions-snaptax-cta.webp",
      alt: "",
    },
  },
  outboundLinks: [
    { href: "/features", label: "SnapTax features" },
    { href: "/faq", label: "FAQ" },
    { href: "/tax-deductions/electrician", label: "Electrician tax deductions" },
    { href: "/tax-deductions/hvac", label: "HVAC tax deductions" },
    { href: "/tax-deductions/plumber", label: "Plumber tax deductions" },
    {
      href: "/blog/how-to-organize-receipts",
      label: "How to organize receipts",
    },
  ],
  disclaimer:
    "For educational purposes only. Not tax advice. Confirm deductions with a qualified professional. See our disclaimer for details.",
};
```

- [ ] **Step 4: Register + patch relatedTrades on all peers**

`industries.ts`:

```ts
import { ELECTRICIAN_SEO_PAGE } from "@/lib/marketing/seo/industries/electrician";
import { HVAC_SEO_PAGE } from "@/lib/marketing/seo/industries/hvac";
import { PLUMBER_SEO_PAGE } from "@/lib/marketing/seo/industries/plumber";
import { ROOFER_SEO_PAGE } from "@/lib/marketing/seo/industries/roofer";

const PUBLISHED: readonly IndustrySeoPage[] = [
  ELECTRICIAN_SEO_PAGE,
  HVAC_SEO_PAGE,
  PLUMBER_SEO_PAGE,
  ROOFER_SEO_PAGE,
];
```

Set each industry’s `relatedTrades.links` to the **other three** (alphabetical by label is fine):

Electrician → HVAC, Plumber, Roofer  
HVAC → Electrician, Plumber, Roofer  
Plumber → Electrician, HVAC, Roofer  
Roofer → already set in module

Also add Roofer to electrician/hvac/plumber `outboundLinks` where peer trades are listed.

- [ ] **Step 5: Run tests — expect PASS**

```bash
node --import tsx --test lib/marketing/seo/industries.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/marketing/seo/industries/roofer.ts \
  lib/marketing/seo/industries.ts \
  lib/marketing/seo/industries/electrician.ts \
  lib/marketing/seo/industries/hvac.ts \
  lib/marketing/seo/industries/plumber.ts \
  lib/marketing/seo/industries.test.ts
git commit -m "$(cat <<'EOF'
feat(seo): add Roofer industry SEO content registry

EOF
)"
```

---

### Task 4: Route + index meta

**Files:**
- Create: `app/(marketing)/tax-deductions/roofer/page.tsx`
- Modify: `app/(marketing)/tax-deductions/page.tsx`

**Interfaces:**
- Consumes: `getIndustryBySlug("roofer")`
- Produces: live route rendering `IndustrySeoPageView`

- [ ] **Step 1: Create page**

Mirror plumber route — create `app/(marketing)/tax-deductions/roofer/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/marketing/JsonLd";
import { IndustrySeoPageView } from "@/components/marketing/seo/IndustrySeoPage";
import { getIndustryBySlug } from "@/lib/marketing/seo/industries";
import { buildIndustryJsonLd } from "@/lib/marketing/seo/jsonLd";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

const page = getIndustryBySlug("roofer");

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
      path: "/tax-deductions/roofer",
    });

export default function RooferTaxDeductionsPage() {
  const industry = getIndustryBySlug("roofer");
  if (!industry) notFound();

  return (
    <>
      <JsonLd data={buildIndustryJsonLd(industry)} />
      <IndustrySeoPageView page={industry} />
    </>
  );
}
```

- [ ] **Step 2: Update index meta description**

In `app/(marketing)/tax-deductions/page.tsx`, extend description to mention roofers (index cards come from `listPublishedIndustries()` automatically):

```ts
  description:
    "Browse trade-specific tax deduction checklists for independent contractors — including electricians, HVAC technicians, plumbers, and roofers — covering tools, vehicles, supplies, and receipt tracking.",
```

- [ ] **Step 3: Commit**

```bash
git add app/(marketing)/tax-deductions/roofer/page.tsx \
  app/(marketing)/tax-deductions/page.tsx
git commit -m "$(cat <<'EOF'
feat(seo): ship Roofer tax deductions landing page

EOF
)"
```

---

### Task 5: Sitemap + Footer

**Files:**
- Modify: `lib/marketing/seo/sitemapEntries.ts`
- Modify: `lib/marketing/seo/sitemapEntries.test.ts`
- Modify: `lib/marketing/copy.ts`
- Modify: `lib/marketing/footer.test.ts` (only if it asserts Product link list)

**Interfaces:**
- Produces: sitemap path `/tax-deductions/roofer` @ `0.7`; Footer Product label `Roofer Tax Deductions`

- [ ] **Step 1: Update sitemap**

`sitemapEntries.ts` add:

```ts
  { path: "/tax-deductions/roofer", priority: 0.7 },
```

Update `sitemapEntries.test.ts` expected array to include the same entry.

- [ ] **Step 2: Update Footer Product links**

In `lib/marketing/copy.ts` Product column links, add after Plumber:

```ts
{ href: "/tax-deductions/roofer", label: "Roofer Tax Deductions" },
```

If `footer.test.ts` asserts hrefs, update it.

- [ ] **Step 3: Run focused tests**

```bash
node --import tsx --test \
  lib/marketing/seo/sitemapEntries.test.ts \
  lib/marketing/footer.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add lib/marketing/seo/sitemapEntries.ts \
  lib/marketing/seo/sitemapEntries.test.ts \
  lib/marketing/copy.ts \
  lib/marketing/footer.test.ts
git commit -m "$(cat <<'EOF'
feat(seo): sitemap and footer entry for Roofer landing

EOF
)"
```

---

### Task 6: Acceptance + preview

**Files:** none required (verify + ship)

- [ ] **Step 1: Full unit suite**

```bash
npm run test:unit
```

Expected: all PASS (or unchanged pre-existing failures only). Industry / sitemap / footer / alpha tests must PASS.

- [ ] **Step 2: Grep honesty + route**

```bash
rg -n "Smart Roofing Categories" lib/marketing/seo/industries/roofer.ts
test -f app/\(marketing\)/tax-deductions/roofer/page.tsx && echo route_ok
```

Expected: no Smart Roofing Categories matches; `route_ok`.

- [ ] **Step 3: Push + merge preview**

```bash
git push -u origin feat/roofer-seo-landing
git fetch origin preview
git checkout preview
git pull origin preview
git merge feat/roofer-seo-landing -m "$(cat <<'EOF'
merge: roofer SEO landing into preview

EOF
)"
git push origin preview
git checkout feat/roofer-seo-landing
```

- [ ] **Step 4: Open / update PR to main**

```bash
gh pr create --base main --head feat/roofer-seo-landing \
  --title "feat(seo): Roofer tax deductions landing page" \
  --body "$(cat <<'EOF'
## Summary
- Ship `/tax-deductions/roofer` with mockup + spotlight Hero aligned to `roofer.0.01.png`
- Honest product categories (no Smart Roofing Categories); FAQ = 6 UI + mileage
- Four-way relatedTrades; sitemap + Footer inbound; optimized alpha phone/steps assets

## Test plan
- [ ] `/tax-deductions/roofer` — Title/Meta/H1; mockup spotlight Hero; larger phone without CSS chrome
- [ ] Primary → `/app`; secondary → `#deductions`
- [ ] DeductionCards 2×4; HowItWorks strip; checklist; BuiltFor×5; FAQ×7
- [ ] No Smart Roofing Categories; mileage FAQ honest
- [ ] Index 4 cards; Footer 4 trade links; relatedTrades 3 each
- [ ] Electrician/HVAC/Plumber layouts unchanged
- [ ] Preview QA vs `docs/seo/roofer/roofer.0.01.png`
- [ ] `npm run test:unit`

EOF
)"
```

If a PR already exists, update its body instead.

- [ ] **Step 5: Hand off visual QA**

Ask user to verify preview `/tax-deductions/roofer` against `docs/seo/roofer/roofer.0.01.png`. Do not merge to main until confirmed.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| IndustrySlug + mockup/spotlight data | Tasks 1, 3 |
| Assets + alpha knockout + ASSETS.md | Task 2 |
| Honest categories / trust copy | Task 3 |
| FAQ 7 with mileage | Task 3 |
| Four-way relatedTrades | Task 3 |
| Route + index meta | Task 4 |
| Sitemap + Footer | Task 5 |
| Preview + PR | Task 6 |
| No new Hero mode / no electrician-HVAC layout rewrite | All tasks |
