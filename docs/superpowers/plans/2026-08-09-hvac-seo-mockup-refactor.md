# HVAC SEO Mockup Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `/tax-deductions/hvac` from legacy `composite` Hero to Roofer/Landscaper mockup parity (`presentation: "mockup"` + `visualLayout: "spotlight"`) with honest product copy and regenerated assets aligned to `hvac.0.0.1.png`.

**Architecture:** Data-driven rewrite of `industries/hvac.ts` plus runtime assets and tests. Reuse existing mockup/spotlight component branches. Do not delete the unused `composite` Hero code path. Do not change routes, sitemap, footer, or five-way relatedTrades mesh. Ship preview first, then PR to main.

**Tech Stack:** Next.js App Router, React, Tailwind 4, sharp, `scripts/seo-knockout-near-black.mjs`, node:test, existing `IndustrySeoPageView` / `buildMarketingMetadata` / `JsonLd`

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-09-hvac-seo-mockup-refactor-design.md`
- Title/Meta ← **keep live values**; H1 ← `HVAC tax deductions, organized.`
- Primary CTA → `/app` (no query); secondary → `#deductions`
- Educational cards OK; product copy uses real export categories only — **no “Smart HVAC Categories”**
- Hero trust #2 ← `Organize expenses by category`
- BuiltFor #2 ← `Expense categories`
- FAQ = UI main questions + mileage honesty = **7**; no “View all”
- `presentation: "mockup"` + `visualLayout: "spotlight"`
- Keep `composite` type/branch in `IndustryHero` (unused after this PR)
- Delete legacy `public/marketing/seo/hvac-tax-deductions-snaptax-mobile.png`
- Branch: `feat/hvac-seo-mockup-refactor` from latest `main` (design commit may already exist)
- **Ship order:** push/merge **preview** first, then open PR → main
- No new route / cluster / Header Industries / CTA query / Title rewrite

## File map

| File | Responsibility |
|------|----------------|
| `public/marketing/seo/hvac-*` | Regenerate phone/steps/hero/og/cta; delete `*-mobile.png` |
| `docs/seo/hvac/ASSETS.md` | Runtime asset index |
| `lib/marketing/seo/industries/hvac.ts` | Full mockup content rewrite |
| `lib/marketing/seo/industries.test.ts` | composite → mockup/spotlight + honesty + alpha |

Unchanged: `hvac/page.tsx`, `industries.ts`, sitemap, footer, peer industry files, `IndustryHero` composite branch.

---

### Task 1: Confirm branch + regenerate assets

**Files:**
- Create/overwrite under `public/marketing/seo/`:
  - `hvac-tax-deductions-snaptax.png`
  - `hvac-tax-deductions-snaptax-phone.png`
  - `hvac-tax-deductions-snaptax-steps.png`
  - `hvac-tax-deductions-snaptax-og.jpg`
  - `hvac-tax-deductions-snaptax-cta.webp`
- Delete: `public/marketing/seo/hvac-tax-deductions-snaptax-mobile.png`
- Modify: `docs/seo/hvac/ASSETS.md`

**Interfaces:**
- Consumes: `docs/seo/hvac/hvac.0.0.1-{hero,mobile,cta}.png`; `scripts/seo-knockout-near-black.mjs`
- Produces: runtime paths for rewritten `HVAC_SEO_PAGE`

- [ ] **Step 1: Confirm branch**

```bash
git fetch origin main
git checkout feat/hvac-seo-mockup-refactor
# if missing: git checkout -b feat/hvac-seo-mockup-refactor origin/main
git merge origin/main
node --import tsx -e "import {getIndustryBySlug} from './lib/marketing/seo/industries.ts'; const h=getIndustryBySlug('hvac'); console.log(h?.hero.visualLayout, h?.presentation);"
```

Expected before rewrite: `composite undefined` (or similar). Confirm landscaper/roofer still `mockup`.

- [ ] **Step 2: Generate optimized assets**

```bash
node <<'NODE'
const sharp = require("sharp");
const fs = require("fs");
const dir = "public/marketing/seo";
fs.mkdirSync(dir, { recursive: true });

(async () => {
  await sharp("docs/seo/hvac/hvac.0.0.1-hero.png")
    .resize({ width: 960, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toFile(`${dir}/hvac-tax-deductions-snaptax.png`);

  await sharp("docs/seo/hvac/hvac.0.0.1-mobile.png")
    .resize({ width: 1200, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toFile(`${dir}/hvac-tax-deductions-snaptax-steps.png`);

  const m = await sharp("docs/seo/hvac/hvac.0.0.1-mobile.png").metadata();
  const mw = m.width, mh = m.height;
  const left = Math.round(mw * 0.70);
  const width = mw - left;
  await sharp("docs/seo/hvac/hvac.0.0.1-mobile.png")
    .extract({ left, top: 0, width, height: mh })
    .resize({ width: 480, withoutEnlargement: true })
    .png()
    .toFile(`${dir}/hvac-tax-deductions-snaptax-phone.png`);

  await sharp("docs/seo/hvac/hvac.0.0.1-hero.png")
    .resize(1200, 630, { fit: "cover", position: "attention" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`${dir}/hvac-tax-deductions-snaptax-og.jpg`);

  await sharp("docs/seo/hvac/hvac.0.0.1-cta.png")
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(`${dir}/hvac-tax-deductions-snaptax-cta.webp`);

  console.log("wrote hvac assets", { left, width, mw, mh });
})();
NODE
```

Visually confirm phone crop is a single device (tune `0.70` if needed).

- [ ] **Step 3: Alpha knockout + delete legacy mobile**

```bash
node scripts/seo-knockout-near-black.mjs \
  public/marketing/seo/hvac-tax-deductions-snaptax-phone.png \
  public/marketing/seo/hvac-tax-deductions-snaptax-steps.png
rm -f public/marketing/seo/hvac-tax-deductions-snaptax-mobile.png
```

Expected: `hasAlpha=true` for phone and steps.

- [ ] **Step 4: Rewrite ASSETS.md**

```md
# HVAC SEO assets

Runtime images live under `public/marketing/seo/`:

- `hvac-tax-deductions-snaptax.png` — hero worker scene (~960w)
- `hvac-tax-deductions-snaptax-phone.png` — Hero single-phone (from mobile strip right device; transparent canvas alpha)
- `hvac-tax-deductions-snaptax-steps.png` — How it Works three-phone strip (~1200w, transparent canvas alpha)
- `hvac-tax-deductions-snaptax-og.jpg` — Open Graph (1200×630)
- `hvac-tax-deductions-snaptax-cta.webp` — CTA section background (~1600w)

Source exports: `hvac.0.0.1-hero.png`, `hvac.0.0.1-mobile.png`, `hvac.0.0.1-cta.png`, `hvac.0.0.1.png`.

Removed: `hvac-tax-deductions-snaptax-mobile.png` (legacy composite asset).
```

- [ ] **Step 5: Commit**

```bash
git add docs/seo/hvac/ASSETS.md \
  public/marketing/seo/hvac-tax-deductions-snaptax.png \
  public/marketing/seo/hvac-tax-deductions-snaptax-phone.png \
  public/marketing/seo/hvac-tax-deductions-snaptax-steps.png \
  public/marketing/seo/hvac-tax-deductions-snaptax-og.jpg \
  public/marketing/seo/hvac-tax-deductions-snaptax-cta.webp
git add -u public/marketing/seo/hvac-tax-deductions-snaptax-mobile.png
git commit -m "$(cat <<'EOF'
feat(seo): regenerate HVAC mockup assets and drop legacy mobile

EOF
)"
```

---

### Task 2: Failing tests for mockup HVAC

**Files:**
- Modify: `lib/marketing/seo/industries.test.ts`

**Interfaces:**
- Produces: failing expectations that HVAC is mockup/spotlight with honesty + alpha

- [ ] **Step 1: Replace composite HVAC tests**

Find and replace the obsolete HVAC composite block and update the plumber test that asserts HVAC `presentation` is undefined.

Replace:

```ts
  it("hvac uses composite hero visualLayout with phoneImage", () => {
    const page = getIndustryBySlug("hvac");
    assert.ok(page);
    assert.equal(page.hero.visualLayout, "composite");
    assert.ok(page.hero.phoneImage?.src);
    assert.match(page.hero.phoneImage.src, /hvac-tax-deductions-snaptax-mobile/);
  });
```

with:

```ts
  it("loads hvac with mockup spotlight, UI H1, and honesty locks", () => {
    const page = getIndustryBySlug("hvac");
    assert.ok(page);
    assert.equal(
      page.seo.title,
      "HVAC Tax Deductions: Expense Guide for Contractors | SnapTax",
    );
    assert.equal(page.hero.h1, "HVAC tax deductions, organized.");
    assert.equal(page.presentation, "mockup");
    assert.equal(page.hero.visualLayout, "spotlight");
    assert.equal(page.hero.secondaryHref, "#deductions");
    assert.equal(page.hero.highlights?.length, 4);
    assert.equal(page.deductionCards.length, 8);
    assert.equal(page.howItWorks.steps.length, 3);
    assert.ok(page.howItWorks.stepsBanner?.src);
    assert.match(
      page.howItWorks.stepsBanner.src,
      /hvac-tax-deductions-snaptax-steps/,
    );
    assert.match(page.hero.phoneImage!.src, /hvac-tax-deductions-snaptax-phone/);
    assert.equal(page.faq.length, 7);
    assert.equal(page.examples.length, 0);
    assert.equal(page.builtFor.features.length, 5);
    assert.ok(page.checklist);
    assert.ok(page.problemsClosing);
  });

  it("hvac product copy avoids Smart HVAC Categories", () => {
    const page = getIndustryBySlug("hvac");
    assert.ok(page);
    const blob = [
      page.hero.trustItems.join(" "),
      ...page.howItWorks.steps.map((s) => s.body),
      ...page.builtFor.features.map((f) => `${f.title} ${f.body}`),
      page.productCategoryNote,
    ].join(" ");
    assert.doesNotMatch(blob, /Smart HVAC Categories/i);
    assert.match(
      page.hero.trustItems.join(" "),
      /Organize expenses by category/i,
    );
    assert.equal(page.builtFor.features[1]?.title, "Expense categories");
  });

  it("hvac phone and steps assets have alpha channel", async () => {
    const root = process.cwd();
    for (const rel of [
      "public/marketing/seo/hvac-tax-deductions-snaptax-phone.png",
      "public/marketing/seo/hvac-tax-deductions-snaptax-steps.png",
    ]) {
      const meta = await sharp(path.join(root, rel)).metadata();
      assert.equal(meta.hasAlpha, true, `${rel} must have alpha`);
    }
  });
```

Also update the existing HVAC block-count test if it still expects `faq.length === 6` — set to `7`.

In the plumber mockup test, change:

```ts
    assert.equal(getIndustryBySlug("hvac")?.presentation, undefined);
```

to:

```ts
    assert.equal(getIndustryBySlug("hvac")?.presentation, "mockup");
```

Keep the existing mileage FAQ test for HVAC (already asserts `does not` + `separate`).

Keep:

```ts
  it("electrician keeps default stacked hero (no composite layout)", () => {
```

unchanged.

- [ ] **Step 2: Run tests — expect FAIL**

```bash
node --import tsx --test lib/marketing/seo/industries.test.ts
```

Expected: FAIL on new mockup/spotlight/H1/BuiltFor assertions (assets alpha from Task 1 should already pass).

- [ ] **Step 3: Commit tests**

```bash
git add lib/marketing/seo/industries.test.ts
git commit -m "$(cat <<'EOF'
test(seo): expect HVAC mockup spotlight and category honesty

EOF
)"
```

---

### Task 3: Rewrite `HVAC_SEO_PAGE`

**Files:**
- Modify: `lib/marketing/seo/industries/hvac.ts`

**Interfaces:**
- Produces: full Landscaper-parity `HVAC_SEO_PAGE`

- [ ] **Step 1: Replace file contents with exactly:**

```ts
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";

export const HVAC_SEO_PAGE: IndustrySeoPage = {
  slug: "hvac",
  presentation: "mockup",
  path: "/tax-deductions/hvac",
  label: "HVAC",
  indexBlurb:
    "Common tax deductions for tools, refrigerants, service trucks, and job supplies.",
  seo: {
    title: "HVAC Tax Deductions: Expense Guide for Contractors | SnapTax",
    description:
      "Explore common HVAC tax deductions and learn how to track tools, supplies, vehicle costs, certifications, and receipts with SnapTax.",
  },
  hero: {
    h1: "HVAC tax deductions, organized.",
    subtitle: "Built for HVAC Technicians & Contractors",
    body: "Track receipts, organize HVAC business expenses, and prepare tax-ready reports without digging through your truck at tax time.",
    primaryCta: "Track HVAC Expenses",
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
      src: "/marketing/seo/hvac-tax-deductions-snaptax.png",
      alt: "HVAC technician working on an outdoor air conditioning unit",
    },
    phoneImage: {
      src: "/marketing/seo/hvac-tax-deductions-snaptax-phone.png",
      alt: "SnapTax app showing HVAC supplier receipts and tax saved",
    },
    ogImage: {
      src: "/marketing/seo/hvac-tax-deductions-snaptax-og.jpg",
      alt: "HVAC tax deductions and expense tracking with SnapTax",
    },
    highlights: [
      {
        title: "Built for HVAC work",
        body: "Designed for how technicians actually work between jobs and in the service truck.",
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
  deductionsTitle: "Common HVAC Tax Deductions",
  deductionsIntro:
    "A business expense may be deductible when it is ordinary and necessary for your work. Eligibility depends on how the expense was used and your individual tax situation.",
  deductionCards: [
    {
      title: "Tools & Equipment",
      body: "Specialized tools used on HVAC jobs.",
      examples: ["Gauges", "Meters", "Drills", "Vacuum pumps"],
    },
    {
      title: "Parts & Supplies",
      body: "Job parts and consumables purchased for installs and repairs.",
      examples: ["Filters", "Capacitors", "Fittings", "Wiring"],
    },
    {
      title: "Refrigerants & Chemicals",
      body: "Refrigerant and related service chemicals for HVAC work.",
      examples: ["Refrigerant", "Cleaners", "Leak detection"],
    },
    {
      title: "Safety Gear",
      body: "Protective equipment required for field work.",
      examples: ["Gloves", "Goggles", "Respirators"],
    },
    {
      title: "Vehicle Expenses",
      body: "Business vehicle costs between job sites and suppliers.",
      examples: ["Fuel", "Tolls", "Eligible service-truck costs"],
    },
    {
      title: "Training & Certifications",
      body: "Training that supports your HVAC trade.",
      examples: ["EPA 608", "Code training", "Safety training"],
    },
    {
      title: "Licenses & Permits",
      body: "License renewals and local permit fees.",
      examples: ["Contractor licenses", "Local permits"],
    },
    {
      title: "Software & Services",
      body: "Tools you use to run the HVAC business.",
      examples: ["Scheduling", "Invoicing", "Cloud storage"],
    },
  ],
  problemsTitle: "HVAC receipts are easy to lose",
  problems: [
    {
      title: "Receipts disappear",
      body: "Supply-house and hardware-store receipts can fade, tear, or get lost in a service truck.",
      solution: "Snap the receipt before it leaves your hand.",
    },
    {
      title: "Expenses get mixed together",
      body: "Tools, parts, fuel, uniforms, and personal purchases often appear on the same card or account.",
      solution: "Categorize each purchase while the job is still fresh.",
    },
    {
      title: "Tax-time cleanup takes hours",
      body: "Waiting until tax season means searching through bank statements, emails, glove boxes, and tool bags.",
      solution: "Keep a running digital record all year.",
    },
  ],
  problemsClosing:
    "SnapTax keeps every HVAC receipt organized and ready for tax time.",
  howItWorks: {
    id: "how-it-works",
    title: "How SnapTax Works for HVAC",
    steps: [
      {
        title: "Capture Receipts",
        body: "Snap supplier, fuel, tool, and parts receipts as you work.",
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
      src: "/marketing/seo/hvac-tax-deductions-snaptax-steps.png",
      alt: "SnapTax capture, review, and home screens for HVAC expenses",
    },
  },
  examplesTitle: "Example HVAC expenses",
  examplesCategoryHeader: "Category",
  examples: [],
  productCategoryNote:
    "SnapTax organizes expenses using Tools, Truck Gas, Supplies, Equipment, Materials, and Other — the same categories used in US exports.",
  checklist: {
    title: "HVAC Expense Recordkeeping Checklist",
    items: [
      "Photograph every business receipt",
      "Separate personal and business expenses",
      "Record merchant, date, and amount",
      "Add the customer, project, or job",
      "Keep mileage records separately",
      "Save license and certification records",
      "Save EPA 608 and training receipts",
      "Review Needs Action items",
      "Export your annual report",
    ],
  },
  builtFor: {
    title: "Built for HVAC Contractors",
    body: "Receipt capture and expense organization for independent HVAC technicians — not a full accounting suite and not a tax-filing product.",
    features: [
      {
        title: "AI Receipt Scanner",
        body: "Extracts the merchant, date, amount, and other receipt details.",
      },
      {
        title: "Expense categories",
        body: "Helps organize tools, parts, refrigerants, vehicle costs, training, and supplies.",
      },
      {
        title: "Tax Reports",
        body: "Exports clean expense reports for your records or tax professional.",
      },
      {
        title: "Offline Mode",
        body: "Capture receipts on the job and sync when connectivity returns.",
      },
      {
        title: "Secure & Private",
        body: "Helps protect sensitive receipt and business expense information.",
      },
    ],
  },
  relatedTrades: {
    title: "Tax deductions for other trades",
    links: [
      { href: "/tax-deductions/electrician", label: "Electrician Tax Deductions" },
      { href: "/tax-deductions/plumber", label: "Plumber Tax Deductions" },
      { href: "/tax-deductions/roofer", label: "Roofer Tax Deductions" },
      { href: "/tax-deductions/landscaper", label: "Landscaper Tax Deductions" },
    ],
  },
  faq: [
    {
      question: "What can HVAC technicians deduct on their taxes?",
      answer:
        "Potential business expenses may include qualifying tools, equipment, parts, supplies, safety gear, licenses, training, insurance, business vehicle costs, software, advertising, and professional services. Deductibility depends on the nature of the expense, its business use, and your circumstances.",
    },
    {
      question: "Can HVAC tools be written off?",
      answer:
        "Tools purchased for HVAC work may qualify as business expenses. Tax treatment can depend on cost, useful life, and business-use percentage.",
    },
    {
      question: "Can I deduct my HVAC service truck expenses?",
      answer:
        "Business vehicle expenses may be deductible, but personal commuting and business travel must be distinguished. Keep records that support the business use of the vehicle.",
    },
    {
      question: "Can I deduct EPA 608 certification costs?",
      answer:
        "Certification, renewal, and training expenses related to skills used in an existing HVAC business may qualify, depending on the circumstances.",
    },
    {
      question: "Do I need to keep every HVAC receipt?",
      answer:
        "Keeping receipts and supporting records helps document the amount, date, vendor, and business purpose of an expense. Additional records may be needed for vehicle, equipment, and mixed-use expenses.",
    },
    {
      question: "Can I give my SnapTax report to my accountant?",
      answer:
        "Yes. You can export an organized expense report and use it when reviewing your records with an accountant or tax preparer.",
    },
    {
      question: "Does SnapTax track mileage?",
      answer:
        "SnapTax can help organize vehicle-related receipts, but it does not currently replace a complete mileage log. Keep a separate record of the date, destination, distance, and business purpose of each trip.",
    },
  ],
  finalCta: {
    title: "Stop letting HVAC receipts disappear in your truck",
    body: "Capture each receipt when you get it, organize the expense, and build a cleaner record for tax season.",
    button: "Start Tracking Expenses",
    noCardRequired: "No credit card required to start.",
    backgroundImage: {
      src: "/marketing/seo/hvac-tax-deductions-snaptax-cta.webp",
      alt: "",
    },
  },
  outboundLinks: [
    { href: "/features", label: "SnapTax features" },
    { href: "/faq", label: "FAQ" },
    {
      href: "/tax-deductions/electrician",
      label: "Electrician tax deductions",
    },
    {
      href: "/tax-deductions/plumber",
      label: "Plumber tax deductions",
    },
    {
      href: "/tax-deductions/roofer",
      label: "Roofer tax deductions",
    },
    {
      href: "/tax-deductions/landscaper",
      label: "Landscaper tax deductions",
    },
    {
      href: "/blog/how-to-organize-receipts",
      label: "How to organize receipts",
    },
    {
      href: "/blog/1099-contractor-tax-guide",
      label: "1099 contractor tax guide",
    },
  ],
  disclaimer:
    "For educational purposes only. Not tax advice. Confirm deductions with a qualified professional. See our disclaimer for details.",
};
```

- [ ] **Step 2: Run tests — expect PASS**

```bash
node --import tsx --test lib/marketing/seo/industries.test.ts
```

Expected: PASS (including HVAC mockup, honesty, mileage, alpha).

- [ ] **Step 3: Grep locks**

```bash
rg -n "Smart HVAC Categories|visualLayout: \"composite\"|hvac-tax-deductions-snaptax-mobile" lib/marketing/seo/industries/hvac.ts || echo "locks ok"
test ! -f public/marketing/seo/hvac-tax-deductions-snaptax-mobile.png && echo "legacy mobile removed"
```

Expected: `locks ok` and `legacy mobile removed`.

- [ ] **Step 4: Commit**

```bash
git add lib/marketing/seo/industries/hvac.ts
git commit -m "$(cat <<'EOF'
feat(seo): refactor HVAC landing to mockup spotlight template

EOF
)"
```

---

### Task 4: Acceptance → preview → PR

- [ ] **Step 1: Unit tests**

```bash
npm run test:unit
```

Expected: PASS (industry/SEO/alpha must pass).

- [ ] **Step 2: Push feature + merge preview first**

```bash
git push -u origin feat/hvac-seo-mockup-refactor
git fetch origin preview
git checkout preview
git pull origin preview
git merge feat/hvac-seo-mockup-refactor -m "$(cat <<'EOF'
merge: HVAC SEO mockup refactor into preview

EOF
)"
git push origin preview
git checkout feat/hvac-seo-mockup-refactor
```

- [ ] **Step 3: Open PR to main**

```bash
gh pr create --base main --head feat/hvac-seo-mockup-refactor \
  --title "feat(seo): refactor HVAC tax deductions landing to mockup" \
  --body "$(cat <<'EOF'
## Summary
- Refactor `/tax-deductions/hvac` from composite Hero to mockup + spotlight (Roofer/Landscaper parity)
- Honest product categories (no Smart HVAC Categories); FAQ = 6 UI + mileage
- Regenerate alpha phone/steps assets; remove legacy `*-mobile.png`

## Test plan
- [ ] `/tax-deductions/hvac` — Title kept; H1 `HVAC tax deductions, organized.`; mockup spotlight Hero
- [ ] Primary → `/app`; secondary → `#deductions`
- [ ] DeductionCards 2×4; HowItWorks strip; checklist; BuiltFor×5; FAQ×7
- [ ] No Smart HVAC Categories; mileage FAQ honest
- [ ] Legacy mobile asset gone; peer industry layouts unchanged
- [ ] Preview QA vs `docs/seo/hvac/hvac.0.0.1.png`
- [ ] `npm run test:unit`

EOF
)"
```

- [ ] **Step 4:** Ask user to visual-QA preview before merging main

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| mockup + spotlight data rewrite | Task 3 |
| Assets + alpha + ASSETS.md + delete mobile | Task 1 |
| Honest categories / trust / BuiltFor | Tasks 2–3 |
| FAQ 7 with mileage | Tasks 2–3 |
| Keep Title/Meta; UI H1 | Task 3 |
| Keep composite code path | (no change) |
| Tests replace composite assertions | Task 2 |
| Preview first, then PR | Task 4 |
| No inbound/mesh/route changes | (no change) |
