# Landscaper SEO Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/tax-deductions/landscaper` on the shared industry SEO template with Roofer-parity mockup fidelity (`presentation: "mockup"` + spotlight Hero), honest product copy, and five-way related-trades linking.

**Architecture:** Extend `IndustrySlug` with `landscaper`, add `industries/landscaper.ts`, register in `PUBLISHED`, wire route/sitemap/footer/index meta. Reuse mockup component branches — no new Hero layout. Optimize + alpha-knockout assets. Expand every industry’s `relatedTrades` to the other four trades. Ship preview first, then PR to main.

**Tech Stack:** Next.js App Router, React, Tailwind 4, sharp, `scripts/seo-knockout-near-black.mjs`, node:test, existing `buildMarketingMetadata` / `JsonLd` / `IndustrySeoPageView`

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-09-landscaper-seo-landing-design.md`
- Title/Meta ← PRD; H1 ← `Landscaping tax deductions, organized.`
- Primary CTA → `/app` (no query); secondary → `#deductions`
- Educational cards OK; product copy uses real export categories only — **no “Smart Landscaping Categories”**
- Hero trust #2 ← `Organize expenses by category`
- FAQ = UI six + mileage honesty = **7**; no “View all”
- `presentation: "mockup"` + `visualLayout: "spotlight"`; electrician/HVAC Hero layouts must not regress
- Five-way relatedTrades (each page → other **4**); sitemap priority `0.7`; Footer Product link
- Base: `feat/roofer-seo-landing` (must include Roofer + mockup infra)
- Ship on `feat/landscaper-seo-landing`
- **Ship order:** push/merge **preview** first, then open PR → main
- No PDF / analytics / cluster pages / Header Industries / CTA query

## File map

| File | Responsibility |
|------|----------------|
| `lib/marketing/seo/types.ts` | `IndustrySlug` += `"landscaper"` |
| `lib/marketing/seo/industries/landscaper.ts` | Landscaper page data |
| `lib/marketing/seo/industries.ts` | Register landscaper |
| `lib/marketing/seo/industries/{electrician,hvac,plumber,roofer}.ts` | relatedTrades → 4 peers |
| `lib/marketing/seo/industries.test.ts` | Registry / honesty / mesh / alpha |
| `lib/marketing/seo/sitemapEntries.ts` (+ test) | `/tax-deductions/landscaper` |
| `lib/marketing/copy.ts` | Footer link |
| `app/(marketing)/tax-deductions/landscaper/page.tsx` | Route |
| `app/(marketing)/tax-deductions/page.tsx` | Index meta mentions landscapers |
| `public/marketing/seo/landscaper-*` | Optimized assets |
| `docs/seo/landscaper/ASSETS.md` | Asset index |

---

### Task 1: Branch + slug type

**Files:**
- Modify: `lib/marketing/seo/types.ts`

**Interfaces:**
- Produces: `IndustrySlug` includes `"landscaper"`

- [ ] **Step 1: Create branch**

```bash
git fetch origin feat/roofer-seo-landing
git checkout feat/roofer-seo-landing
git pull origin feat/roofer-seo-landing
git checkout -b feat/landscaper-seo-landing
```

Confirm `getIndustryBySlug("roofer")` works and `presentation: "mockup"` exists. If Roofer missing, stop.

- [ ] **Step 2: Extend slug**

```ts
export type IndustrySlug =
  | "electrician"
  | "hvac"
  | "plumber"
  | "roofer"
  | "landscaper";
```

- [ ] **Step 3: Commit**

```bash
git add lib/marketing/seo/types.ts
git commit -m "$(cat <<'EOF'
feat(seo): add landscaper to IndustrySlug

EOF
)"
```

---

### Task 2: Optimize and publish Landscaper assets

**Files:**
- Create under `public/marketing/seo/`:
  - `landscaper-tax-deductions-snaptax.png`
  - `landscaper-tax-deductions-snaptax-phone.png`
  - `landscaper-tax-deductions-snaptax-steps.png`
  - `landscaper-tax-deductions-snaptax-og.jpg`
  - `landscaper-tax-deductions-snaptax-cta.webp`
- Create: `docs/seo/landscaper/ASSETS.md`

**Interfaces:**
- Consumes: `docs/seo/landscaper/landscaper.0.0.1-{hero,mobile,cta}.png`; knockout script
- Produces: runtime paths for `LANDSCAPER_SEO_PAGE`

- [ ] **Step 1: Confirm sources**

```bash
ls -la docs/seo/landscaper/landscaper.0.0.1-hero.png \
  docs/seo/landscaper/landscaper.0.0.1-mobile.png \
  docs/seo/landscaper/landscaper.0.0.1-cta.png \
  scripts/seo-knockout-near-black.mjs
```

- [ ] **Step 2: Generate optimized assets**

```bash
node <<'NODE'
const sharp = require("sharp");
const fs = require("fs");
const dir = "public/marketing/seo";
fs.mkdirSync(dir, { recursive: true });

(async () => {
  await sharp("docs/seo/landscaper/landscaper.0.0.1-hero.png")
    .resize({ width: 960, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toFile(`${dir}/landscaper-tax-deductions-snaptax.png`);

  await sharp("docs/seo/landscaper/landscaper.0.0.1-mobile.png")
    .resize({ width: 1200, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toFile(`${dir}/landscaper-tax-deductions-snaptax-steps.png`);

  // Hero phone = right device from mobile strip (Roofer pattern)
  const m = await sharp("docs/seo/landscaper/landscaper.0.0.1-mobile.png").metadata();
  const mw = m.width, mh = m.height;
  const left = Math.round(mw * 0.70);
  const width = mw - left;
  await sharp("docs/seo/landscaper/landscaper.0.0.1-mobile.png")
    .extract({ left, top: 0, width, height: mh })
    .resize({ width: 480, withoutEnlargement: true })
    .png()
    .toFile(`${dir}/landscaper-tax-deductions-snaptax-phone.png`);

  await sharp("docs/seo/landscaper/landscaper.0.0.1-hero.png")
    .resize(1200, 630, { fit: "cover", position: "attention" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`${dir}/landscaper-tax-deductions-snaptax-og.jpg`);

  await sharp("docs/seo/landscaper/landscaper.0.0.1-cta.png")
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(`${dir}/landscaper-tax-deductions-snaptax-cta.webp`);

  console.log("wrote landscaper assets", { left, width, mw, mh });
})();
NODE
```

Visually confirm phone crop is a single device (tune `0.70` if needed).

- [ ] **Step 3: Alpha knockout**

```bash
node scripts/seo-knockout-near-black.mjs \
  public/marketing/seo/landscaper-tax-deductions-snaptax-phone.png \
  public/marketing/seo/landscaper-tax-deductions-snaptax-steps.png
```

Expected: `hasAlpha=true` for both.

- [ ] **Step 4: ASSETS.md**

```md
# Landscaper SEO assets

Runtime images live under `public/marketing/seo/`:

- `landscaper-tax-deductions-snaptax.png` — hero worker scene (~960w)
- `landscaper-tax-deductions-snaptax-phone.png` — Hero single-phone (from mobile strip right device; transparent canvas alpha)
- `landscaper-tax-deductions-snaptax-steps.png` — How it Works three-phone strip (~1200w, transparent canvas alpha)
- `landscaper-tax-deductions-snaptax-og.jpg` — Open Graph (1200×630)
- `landscaper-tax-deductions-snaptax-cta.webp` — CTA section background (~1600w)

Source exports: `landscaper.0.0.1-hero.png`, `landscaper.0.0.1-mobile.png`, `landscaper.0.0.1-cta.png`, `landscaper.0.0.1.png`.
```

- [ ] **Step 5: Commit**

```bash
git add docs/seo/landscaper/ASSETS.md \
  public/marketing/seo/landscaper-tax-deductions-snaptax.png \
  public/marketing/seo/landscaper-tax-deductions-snaptax-phone.png \
  public/marketing/seo/landscaper-tax-deductions-snaptax-steps.png \
  public/marketing/seo/landscaper-tax-deductions-snaptax-og.jpg \
  public/marketing/seo/landscaper-tax-deductions-snaptax-cta.webp
git commit -m "$(cat <<'EOF'
feat(seo): add optimized Landscaper landing image assets

EOF
)"
```

---

### Task 3: Landscaper registry + five-way relatedTrades + tests

**Files:**
- Create: `lib/marketing/seo/industries/landscaper.ts`
- Modify: `lib/marketing/seo/industries.ts`
- Modify: `lib/marketing/seo/industries/{electrician,hvac,plumber,roofer}.ts`
- Modify: `lib/marketing/seo/industries.test.ts`

**Interfaces:**
- Produces: `LANDSCAPER_SEO_PAGE`; published length **5**; each `relatedTrades.links.length === 4`

- [ ] **Step 1: Write failing tests**

Update / append in `industries.test.ts`:

```ts
  it("publishes electrician, hvac, plumber, roofer, and landscaper", () => {
    const list = listPublishedIndustries();
    assert.equal(list.length, 5);
    assert.deepEqual(
      list.map((p) => p.slug),
      ["electrician", "hvac", "plumber", "roofer", "landscaper"],
    );
  });

  it("each industry relatedTrades links to the other four", () => {
    const all = [
      "/tax-deductions/electrician",
      "/tax-deductions/hvac",
      "/tax-deductions/plumber",
      "/tax-deductions/roofer",
      "/tax-deductions/landscaper",
    ];
    for (const slug of [
      "electrician",
      "hvac",
      "plumber",
      "roofer",
      "landscaper",
    ] as const) {
      const page = getIndustryBySlug(slug);
      assert.ok(page?.relatedTrades);
      assert.equal(page.relatedTrades.links.length, 4);
      const hrefs = page.relatedTrades.links.map((l) => l.href).sort();
      const expected = all.filter((h) => h !== `/tax-deductions/${slug}`).sort();
      assert.deepEqual(hrefs, expected);
    }
  });

  it("loads landscaper with PRD title/meta, UI H1, and mockup spotlight", () => {
    const page = getIndustryBySlug("landscaper");
    assert.ok(page);
    assert.equal(
      page.seo.title,
      "Landscaper Tax Deductions: Expense Guide | SnapTax",
    );
    assert.match(page.seo.description, /landscaper tax deductions/i);
    assert.equal(page.hero.h1, "Landscaping tax deductions, organized.");
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

  it("landscaper product copy avoids Smart Landscaping Categories", () => {
    const page = getIndustryBySlug("landscaper");
    assert.ok(page);
    const blob = [
      page.hero.trustItems.join(" "),
      ...page.howItWorks.steps.map((s) => s.body),
      ...page.builtFor.features.map((f) => `${f.title} ${f.body}`),
      page.productCategoryNote,
    ].join(" ");
    assert.doesNotMatch(blob, /Smart Landscaping Categories/i);
    assert.match(
      page.hero.trustItems.join(" "),
      /Organize expenses by category/i,
    );
  });

  it("landscaper mileage FAQ denies full mileage tracker", () => {
    const page = getIndustryBySlug("landscaper");
    assert.ok(page);
    const mileage = page.faq.find((f) => /mileage/i.test(f.question));
    assert.ok(mileage);
    assert.match(mileage.answer, /does not/i);
    assert.match(mileage.answer, /separate/i);
  });

  it("landscaper phone and steps assets have alpha channel", async () => {
    const root = process.cwd();
    for (const rel of [
      "public/marketing/seo/landscaper-tax-deductions-snaptax-phone.png",
      "public/marketing/seo/landscaper-tax-deductions-snaptax-steps.png",
    ]) {
      const meta = await sharp(path.join(root, rel)).metadata();
      assert.equal(meta.hasAlpha, true, `${rel} must have alpha`);
    }
  });
```

Replace obsolete four-industry / three-link tests. Keep `unknown slug` using a non-published id (e.g. `handyman`).

- [ ] **Step 2: Run tests — expect FAIL**

```bash
node --import tsx --test lib/marketing/seo/industries.test.ts
```

- [ ] **Step 3: Create `landscaper.ts`**

Create `lib/marketing/seo/industries/landscaper.ts` with **exactly**:

```ts
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";

export const LANDSCAPER_SEO_PAGE: IndustrySeoPage = {
  slug: "landscaper",
  presentation: "mockup",
  path: "/tax-deductions/landscaper",
  label: "Landscaper",
  indexBlurb:
    "Common tax deductions for plants, equipment, fuel, repairs, trailers, and dump fees.",
  seo: {
    title: "Landscaper Tax Deductions: Expense Guide | SnapTax",
    description:
      "Explore common landscaper tax deductions and learn how to track plants, equipment, fuel, repairs, vehicle costs, rentals, and business receipts.",
  },
  hero: {
    h1: "Landscaping tax deductions, organized.",
    subtitle: "Built for Landscapers & Lawn Care Contractors",
    body: "Track receipts, organize landscaping business expenses, and prepare tax-ready reports without digging through your work truck at tax time.",
    primaryCta: "Track Landscaping Expenses",
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
      src: "/marketing/seo/landscaper-tax-deductions-snaptax.png",
      alt: "Landscaper operating a commercial mower in a residential yard",
    },
    phoneImage: {
      src: "/marketing/seo/landscaper-tax-deductions-snaptax-phone.png",
      alt: "SnapTax app showing landscaping supplier receipts and tax saved",
    },
    ogImage: {
      src: "/marketing/seo/landscaper-tax-deductions-snaptax-og.jpg",
      alt: "Landscaper tax deductions and expense tracking with SnapTax",
    },
    highlights: [
      {
        title: "Built for outdoor work",
        body: "Designed for how landscapers actually work between jobs and in the truck.",
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
  deductionsTitle: "Common Landscaper Tax Deductions",
  deductionsIntro:
    "A landscaping business expense may be deductible when it is ordinary and necessary for the work. Eligibility depends on how the expense was used and your individual tax situation.",
  deductionCards: [
    {
      title: "Plants & Materials",
      body: "Materials purchased for customer landscape jobs.",
      examples: ["Plants", "Trees", "Soil", "Mulch"],
    },
    {
      title: "Tools & Equipment",
      body: "Power and hand tools used on landscaping jobs.",
      examples: ["Mowers", "Trimmers", "Blowers", "Hand tools"],
    },
    {
      title: "Fuel & Lubricants",
      body: "Fuel and fluids for landscaping equipment.",
      examples: ["Gasoline", "Mixed fuel", "Oil"],
    },
    {
      title: "Repairs & Maintenance",
      body: "Parts and service that keep equipment running.",
      examples: ["Blades", "Belts", "Filters", "Repairs"],
    },
    {
      title: "Vehicle & Trailer",
      body: "Eligible costs of trucks and trailers for the business.",
      examples: ["Fuel", "Maintenance", "Registration", "Tolls"],
    },
    {
      title: "Safety Gear",
      body: "Protective gear for outdoor landscaping work.",
      examples: ["Gloves", "Goggles", "Hearing protection"],
    },
    {
      title: "Equipment Rental",
      body: "Short-term gear rented for landscaping projects.",
      examples: ["Loaders", "Trenchers", "Aerators"],
    },
    {
      title: "Dump & Disposal Fees",
      body: "Green waste and debris disposal costs.",
      examples: ["Green waste", "Debris hauling", "Dump fees"],
    },
  ],
  problemsTitle: "Landscaping receipts are easy to lose",
  problems: [
    {
      title: "Receipts disappear",
      body: "Nursery and supply-house receipts fade, get wet, or disappear into a work truck.",
      solution: "Snap the receipt before you leave the supplier.",
    },
    {
      title: "Expenses get mixed together",
      body: "Plants, fuel, repairs, rentals, and personal purchases often appear on the same card.",
      solution: "Categorize each purchase while the job is still fresh.",
    },
    {
      title: "Tax-time cleanup takes hours",
      body: "Waiting until tax season means searching through statements, emails, trucks, and job folders.",
      solution: "Keep a running digital record all year.",
    },
  ],
  problemsClosing:
    "SnapTax keeps every landscaping receipt organized and ready for tax time.",
  howItWorks: {
    id: "how-it-works",
    title: "How SnapTax Works for Landscapers",
    steps: [
      {
        title: "Capture Receipts",
        body: "Snap plant, fuel, tool, rental, and dump-fee receipts as you work.",
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
      src: "/marketing/seo/landscaper-tax-deductions-snaptax-steps.png",
      alt: "SnapTax capture, review, and home screens for landscaping expenses",
    },
  },
  examplesTitle: "Example landscaping expenses",
  examplesCategoryHeader: "Category",
  examples: [],
  productCategoryNote:
    "SnapTax organizes expenses using Tools, Truck Gas, Supplies, Equipment, Materials, and Other — the same categories used in US exports.",
  checklist: {
    title: "Landscaping Expense Recordkeeping Checklist",
    items: [
      "Photograph every business receipt",
      "Separate personal and business expenses",
      "Record merchant, date, and amount",
      "Add the customer, project, or job",
      "Keep mileage records separately",
      "Save equipment repair records",
      "Save dump and disposal receipts",
      "Review Needs Action items",
      "Export your annual report",
    ],
  },
  builtFor: {
    title: "Built for Landscaping Contractors",
    body: "Receipt capture and expense organization for independent landscapers — not a full accounting suite and not a tax-filing product.",
    features: [
      {
        title: "AI Receipt Scanner",
        body: "Extracts the merchant, date, amount, and other receipt details.",
      },
      {
        title: "Expense categories",
        body: "Helps organize materials, fuel, equipment, repairs, rentals, and disposal expenses.",
      },
      {
        title: "Tax Reports",
        body: "Exports clean expense reports for your records or tax professional.",
      },
      {
        title: "Offline Mode",
        body: "Capture receipts outdoors and sync when connectivity returns.",
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
      { href: "/tax-deductions/hvac", label: "HVAC Tax Deductions" },
      { href: "/tax-deductions/plumber", label: "Plumber Tax Deductions" },
      { href: "/tax-deductions/roofer", label: "Roofer Tax Deductions" },
    ],
  },
  faq: [
    {
      question: "What can landscapers deduct on their taxes?",
      answer:
        "Potential business expenses may include qualifying plants, materials, tools, equipment, fuel, repairs, vehicle costs, rentals, safety gear, licenses, insurance, disposal fees, advertising, and professional services. Eligibility depends on the nature and business use of each expense.",
    },
    {
      question: "Can landscapers write off equipment?",
      answer:
        "Equipment purchased for landscaping work may qualify as a business expense. Tax treatment may depend on its cost, expected useful life, and business-use percentage.",
    },
    {
      question: "Can I deduct mower and equipment fuel?",
      answer:
        "Fuel and operating fluids used for landscaping equipment may qualify as business expenses when properly documented and separated from personal use.",
    },
    {
      question: "Can landscaping materials be deducted?",
      answer:
        "Plants, trees, soil, mulch, gravel, irrigation parts, and other materials purchased for customer projects may qualify when supported by appropriate records.",
    },
    {
      question: "Can I deduct my landscaping truck and trailer?",
      answer:
        "Eligible business vehicle and trailer expenses may be deductible, but personal commuting and business travel must be distinguished. Keep records supporting the vehicle’s business use.",
    },
    {
      question: "Can landscapers deduct equipment repairs?",
      answer:
        "Routine servicing, replacement parts, blade sharpening, and qualifying equipment repairs may be business expenses when related to landscaping work.",
    },
    {
      question: "Does SnapTax track mileage?",
      answer:
        "SnapTax can organize vehicle-related receipts, but it does not currently replace a complete mileage log. Keep separate records of each trip’s date, destination, distance, and business purpose.",
    },
  ],
  finalCta: {
    title: "Stop letting landscaping receipts disappear in your truck",
    body: "Capture receipts as you work, organize landscaping expenses, and prepare a cleaner record for tax season.",
    button: "Start Tracking Expenses",
    noCardRequired: "No credit card required to start.",
    backgroundImage: {
      src: "/marketing/seo/landscaper-tax-deductions-snaptax-cta.webp",
      alt: "",
    },
  },
  outboundLinks: [
    { href: "/features", label: "SnapTax features" },
    { href: "/faq", label: "FAQ" },
    { href: "/tax-deductions/electrician", label: "Electrician tax deductions" },
    { href: "/tax-deductions/hvac", label: "HVAC tax deductions" },
    { href: "/tax-deductions/plumber", label: "Plumber tax deductions" },
    { href: "/tax-deductions/roofer", label: "Roofer tax deductions" },
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
import { LANDSCAPER_SEO_PAGE } from "@/lib/marketing/seo/industries/landscaper";

const PUBLISHED: readonly IndustrySeoPage[] = [
  ELECTRICIAN_SEO_PAGE,
  HVAC_SEO_PAGE,
  PLUMBER_SEO_PAGE,
  ROOFER_SEO_PAGE,
  LANDSCAPER_SEO_PAGE,
];
```

Each industry’s `relatedTrades.links` = the **other four** paths/labels. Also add Landscaper to peer `outboundLinks` where trade links are listed.

- [ ] **Step 5: Run tests — expect PASS**

```bash
node --import tsx --test lib/marketing/seo/industries.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add lib/marketing/seo/industries/landscaper.ts \
  lib/marketing/seo/industries.ts \
  lib/marketing/seo/industries/electrician.ts \
  lib/marketing/seo/industries/hvac.ts \
  lib/marketing/seo/industries/plumber.ts \
  lib/marketing/seo/industries/roofer.ts \
  lib/marketing/seo/industries.test.ts
git commit -m "$(cat <<'EOF'
feat(seo): add Landscaper industry SEO content registry

EOF
)"
```

---

### Task 4: Route + index meta

**Files:**
- Create: `app/(marketing)/tax-deductions/landscaper/page.tsx`
- Modify: `app/(marketing)/tax-deductions/page.tsx`

- [ ] **Step 1: Create page** (mirror Roofer route with slug `"landscaper"`)

- [ ] **Step 2: Update index meta** to mention landscapers alongside other trades

- [ ] **Step 3: Commit**

```bash
git add "app/(marketing)/tax-deductions/landscaper/page.tsx" \
  "app/(marketing)/tax-deductions/page.tsx"
git commit -m "$(cat <<'EOF'
feat(seo): ship Landscaper tax deductions landing page

EOF
)"
```

---

### Task 5: Sitemap + Footer

**Files:**
- Modify: `lib/marketing/seo/sitemapEntries.ts` (+ test)
- Modify: `lib/marketing/copy.ts`

- [ ] **Step 1:** Add `{ path: "/tax-deductions/landscaper", priority: 0.7 }` + test expectation

- [ ] **Step 2:** Footer Product += `{ href: "/tax-deductions/landscaper", label: "Landscaper Tax Deductions" }`

- [ ] **Step 3:** Run sitemap/footer tests — PASS

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(seo): sitemap and footer entry for Landscaper landing

EOF
)"
```

---

### Task 6: Acceptance → preview → PR

- [ ] **Step 1:** `npm run test:unit` — PASS (industry/sitemap/alpha must pass)

- [ ] **Step 2:** Grep — no `Smart Landscaping Categories` in `landscaper.ts`; route file exists

- [ ] **Step 3: Push feature + merge preview first**

```bash
git push -u origin feat/landscaper-seo-landing
git fetch origin preview
git checkout preview
git pull origin preview
git merge feat/landscaper-seo-landing -m "$(cat <<'EOF'
merge: landscaper SEO landing into preview

EOF
)"
git push origin preview
git checkout feat/landscaper-seo-landing
```

- [ ] **Step 4: Open PR to main**

```bash
gh pr create --base main --head feat/landscaper-seo-landing \
  --title "feat(seo): Landscaper tax deductions landing page" \
  --body "$(cat <<'EOF'
## Summary
- Ship `/tax-deductions/landscaper` with mockup + spotlight Hero aligned to `landscaper.0.0.1.png`
- Honest product categories (no Smart Landscaping Categories); FAQ = 6 UI + mileage
- Five-way relatedTrades; sitemap + Footer inbound; optimized alpha phone/steps assets

## Test plan
- [ ] `/tax-deductions/landscaper` — Title/Meta/H1; mockup spotlight Hero
- [ ] Primary → `/app`; secondary → `#deductions`
- [ ] DeductionCards 2×4; HowItWorks strip; checklist; BuiltFor×5; FAQ×7
- [ ] No Smart Landscaping Categories; mileage FAQ honest
- [ ] Index 5 cards; Footer 5 trade links; relatedTrades 4 each
- [ ] Peer industry layouts unchanged
- [ ] Preview QA vs `docs/seo/landscaper/landscaper.0.0.1.png`
- [ ] `npm run test:unit`

EOF
)"
```

- [ ] **Step 5:** Ask user to visual-QA preview before merging main

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| IndustrySlug + mockup/spotlight data | Tasks 1, 3 |
| Assets + alpha + ASSETS.md | Task 2 |
| Honest categories / trust copy | Task 3 |
| FAQ 7 with mileage | Task 3 |
| Five-way relatedTrades | Task 3 |
| Route + index meta | Task 4 |
| Sitemap + Footer | Task 5 |
| Preview first, then PR | Task 6 |
