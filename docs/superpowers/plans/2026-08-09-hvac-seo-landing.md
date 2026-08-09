# HVAC SEO Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/tax-deductions/hvac` on the shared industry SEO template, with checklist + related-trades extensions, electrician cross-links, sitemap/footer wiring, and optimized HVAC assets.

**Architecture:** Extend `IndustrySeoPage` types and `IndustrySeoPageView` composer; add `industries/hvac.ts`; lightly update electrician data for related trades; reuse existing Hero/FAQ/JsonLd patterns. Secondary CTA becomes data-driven (`hero.secondaryHref`) so HVAC can target `#deductions`.

**Tech Stack:** Next.js App Router · React 19 · Tailwind 4 · existing marketing SEO helpers · sharp for asset optimize · node:test + tsx (`npm run test:unit`)

## Global Constraints

- Spec canonical: `docs/superpowers/specs/2026-08-09-hvac-seo-landing-design.md`
- Title: `HVAC Tax Deductions: Expense Guide for Contractors | SnapTax`
- Description: `Explore common HVAC tax deductions and learn how to track tools, supplies, vehicle costs, certifications, and receipts with SnapTax.`
- Path: `/tax-deductions/hvac`
- Primary CTA → `/app` via `MarketingAppLink` (no query params)
- Secondary CTA → `#deductions`
- 8 deduction cards · 3 how-it-works steps · 6 FAQs · empty `examples`
- Product-facing categories only from US export set; mileage FAQ must deny full tracker
- FAQ answers stay in DOM (`hidden` when collapsed)
- No PDF / analytics board / cluster child pages / Header Industries nav
- English UI strings only
- Commit after each task

## File map

| Path | Responsibility |
|------|----------------|
| `lib/marketing/seo/types.ts` | Add `hvac` slug; `secondaryHref`; `checklist?`; `relatedTrades?`; `finalCta.backgroundImage?` |
| `lib/marketing/seo/industries/hvac.ts` | HVAC page data |
| `lib/marketing/seo/industries/electrician.ts` | Add `relatedTrades` + `secondaryHref` |
| `lib/marketing/seo/industries.ts` | Register HVAC |
| `lib/marketing/seo/industries.test.ts` | Registry / honesty / HVAC shape tests |
| `lib/marketing/seo/sitemapEntries.ts` | Add HVAC URL |
| `lib/marketing/copy.ts` | Footer HVAC link |
| `components/marketing/seo/IndustryHero.tsx` | Use `hero.secondaryHref` |
| `components/marketing/seo/DeductionCards.tsx` | `id="deductions"` + `scroll-mt-24` |
| `components/marketing/seo/RecordkeepingChecklist.tsx` | New |
| `components/marketing/seo/RelatedTrades.tsx` | New |
| `components/marketing/seo/IndustryFinalCta.tsx` | Optional background image |
| `components/marketing/seo/IndustrySeoPage.tsx` | New composer order + conditionals |
| `app/(marketing)/tax-deductions/hvac/page.tsx` | Route + metadata + JsonLd |
| `public/marketing/seo/hvac-tax-deductions-snaptax*.{png,jpg,webp}` | Optimized assets |

---

### Task 1: Extend types + secondaryHref + electrician relatedTrades

**Files:**
- Modify: `lib/marketing/seo/types.ts`
- Modify: `lib/marketing/seo/industries/electrician.ts`
- Modify: `lib/marketing/seo/industries.test.ts`

**Interfaces:**
- Produces: `IndustrySlug = "electrician" | "hvac"`; `hero.secondaryHref: string`; optional `checklist`, `relatedTrades`; optional `finalCta.backgroundImage`

- [ ] **Step 1: Update failing/extended tests first**

Append to `lib/marketing/seo/industries.test.ts`:

```ts
  it("electrician exposes relatedTrades to HVAC and secondaryHref how-it-works", () => {
    const page = getIndustryBySlug("electrician");
    assert.ok(page);
    assert.equal(page.hero.secondaryHref, "#how-it-works");
    assert.ok(page.relatedTrades);
    assert.equal(page.relatedTrades.links[0]?.href, "/tax-deductions/hvac");
  });
```

Run: `npm run test:unit -- lib/marketing/seo/industries.test.ts`  
Expected: FAIL (missing fields / type errors once types change ahead of data)

- [ ] **Step 2: Extend `types.ts`**

Replace slug and hero/finalCta/related fields:

```ts
export type IndustrySlug = "electrician" | "hvac";

export type IndustrySeoPage = {
  slug: IndustrySlug;
  path: `/tax-deductions/${IndustrySlug}`;
  label: string;
  indexBlurb: string;
  seo: { title: string; description: string };
  hero: {
    h1: string;
    subtitle: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    /** In-page hash or path for secondary CTA (e.g. "#deductions"). */
    secondaryHref: string;
    trustItems: string[];
    workerImage: { src: string; alt: string };
    phoneImage?: { src: string; alt: string };
    ogImage: { src: string; alt: string };
  };
  deductionsTitle: string;
  deductionsIntro: string;
  deductionCards: { title: string; body: string; examples: string[] }[];
  problemsTitle: string;
  problems: { title: string; body: string; solution: string }[];
  howItWorks: {
    id: "how-it-works";
    title: string;
    steps: { title: string; body: string }[];
  };
  examplesTitle: string;
  examplesCategoryHeader: string;
  examples: { expense: string; category: string }[];
  productCategoryNote: string;
  checklist?: { title: string; items: string[] };
  builtFor: {
    title: string;
    body: string;
    features: { title: string; body: string }[];
  };
  relatedTrades?: {
    title: string;
    links: { href: string; label: string }[];
  };
  faq: { question: string; answer: string }[];
  finalCta: {
    title: string;
    body: string;
    button: string;
    noCardRequired: string;
    backgroundImage?: { src: string; alt: string };
  };
  outboundLinks: { href: string; label: string }[];
  disclaimer: string;
};
```

- [ ] **Step 3: Patch electrician data**

In `electrician.ts` hero add:

```ts
secondaryHref: "#how-it-works",
```

After `builtFor` (or before faq) add:

```ts
  relatedTrades: {
    title: "Tax deductions for other trades",
    links: [
      {
        href: "/tax-deductions/hvac",
        label: "HVAC Tax Deductions",
      },
    ],
  },
```

- [ ] **Step 4: Run tests**

Run: `npm run test:unit -- lib/marketing/seo/industries.test.ts`  
Expected: PASS (including new relatedTrades test; HVAC not registered yet)

- [ ] **Step 5: Commit**

```bash
git add lib/marketing/seo/types.ts lib/marketing/seo/industries/electrician.ts lib/marketing/seo/industries.test.ts
git commit -m "$(cat <<'EOF'
feat(seo): extend industry page types for HVAC template fields

EOF
)"
```

---

### Task 2: HVAC content module + registry

**Files:**
- Create: `lib/marketing/seo/industries/hvac.ts`
- Modify: `lib/marketing/seo/industries.ts`
- Modify: `lib/marketing/seo/industries.test.ts`

**Interfaces:**
- Consumes: updated `IndustrySeoPage`
- Produces: `HVAC_SEO_PAGE`, registry length 2

- [ ] **Step 1: Write failing tests**

```ts
  it("publishes electrician and hvac", () => {
    const list = listPublishedIndustries();
    assert.equal(list.length, 2);
    assert.deepEqual(
      list.map((p) => p.slug),
      ["electrician", "hvac"],
    );
  });

  it("loads hvac with PRD title/meta and UI block counts", () => {
    const page = getIndustryBySlug("hvac");
    assert.ok(page);
    assert.equal(
      page.seo.title,
      "HVAC Tax Deductions: Expense Guide for Contractors | SnapTax",
    );
    assert.match(page.seo.description, /HVAC tax deductions/i);
    assert.equal(page.path, "/tax-deductions/hvac");
    assert.equal(page.hero.secondaryHref, "#deductions");
    assert.equal(page.deductionCards.length, 8);
    assert.equal(page.howItWorks.steps.length, 3);
    assert.equal(page.faq.length, 6);
    assert.equal(page.examples.length, 0);
    assert.ok(page.checklist);
    assert.ok(page.checklist.items.length >= 8);
    assert.equal(
      page.relatedTrades?.links[0]?.href,
      "/tax-deductions/electrician",
    );
  });

  it("hvac how-it-works uses real US category names only", () => {
    const page = getIndustryBySlug("hvac");
    assert.ok(page);
    const organize = page.howItWorks.steps[1];
    assert.ok(organize);
    assert.match(organize.body, /Truck Gas/i);
    assert.doesNotMatch(organize.body, /Smart HVAC Categories/i);
  });

  it("hvac mileage FAQ denies full mileage tracker", () => {
    const page = getIndustryBySlug("hvac");
    assert.ok(page);
    const mileage = page.faq.find((f) => /mileage/i.test(f.question));
    assert.ok(mileage);
    assert.match(mileage.answer, /does not/i);
    assert.match(mileage.answer, /separate/i);
  });
```

Update the old “publishes electrician only” test to the new two-trade test (delete the old exclusive assertion).

Run tests → Expected FAIL until `hvac.ts` exists.

- [ ] **Step 2: Create `lib/marketing/seo/industries/hvac.ts`**

Implement full `HVAC_SEO_PAGE` object. Required locked values:

```ts
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";

export const HVAC_SEO_PAGE: IndustrySeoPage = {
  slug: "hvac",
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
    h1: "Tax Deductions for HVAC Technicians and Contractors",
    subtitle: "Built for HVAC Technicians & Contractors",
    body: "Track receipts, organize HVAC business expenses, and prepare tax-ready reports without digging through your truck at tax time.",
    primaryCta: "Track HVAC Expenses",
    secondaryCta: "View Deductions",
    secondaryHref: "#deductions",
    trustItems: [
      "No forced sign-up",
      "Receipt scanning",
      "Tax-ready reports",
      "Works offline",
    ],
    workerImage: {
      src: "/marketing/seo/hvac-tax-deductions-snaptax.png",
      alt: "HVAC technician working on an outdoor air conditioning unit",
    },
    phoneImage: {
      src: "/marketing/seo/hvac-tax-deductions-snaptax-mobile.png",
      alt: "SnapTax app showing HVAC supplier receipt tracking",
    },
    ogImage: {
      src: "/marketing/seo/hvac-tax-deductions-snaptax-og.jpg",
      alt: "HVAC tax deductions and expense tracking with SnapTax",
    },
  },
  deductionsTitle: "Common HVAC Tax Deductions",
  deductionsIntro:
    "A business expense may be deductible when it is ordinary and necessary for your work. Eligibility depends on how the expense was used and your individual tax situation.",
  deductionCards: [
    {
      title: "Tools & Equipment",
      body: "Specialized tools used on HVAC jobs.",
      examples: ["Gauges", "Drills", "Vacuum pumps", "Recovery machines"],
    },
    {
      title: "Parts & Supplies",
      body: "Job parts and consumables purchased for installs and repairs.",
      examples: ["Filters", "Capacitors", "Fittings", "Sealants"],
    },
    {
      title: "Refrigerants",
      body: "Refrigerant and related service chemicals for HVAC work.",
      examples: ["R-410A", "R-22", "R-32", "Coil cleaner"],
    },
    {
      title: "Safety Gear",
      body: "Protective equipment required for field work.",
      examples: ["Gloves", "Eye protection", "Respirators", "Hard hats"],
    },
    {
      title: "Vehicle Expenses",
      body: "Business vehicle costs between job sites and suppliers.",
      examples: ["Fuel", "Parking", "Tolls", "Eligible maintenance"],
    },
    {
      title: "Training & Certifications",
      body: "Training that supports your HVAC trade.",
      examples: ["EPA 608", "Safety courses", "Manufacturer training"],
    },
    {
      title: "Licenses & Permits",
      body: "License renewals and local permit fees.",
      examples: ["Contractor license", "Local permits", "Business fees"],
    },
    {
      title: "Software & Services",
      body: "Tools you use to run the HVAC business.",
      examples: ["Scheduling", "Invoicing", "Cloud storage"],
    },
  ],
  problemsTitle: "HVAC receipts are easy to lose—and expensive to forget",
  problems: [
    {
      title: "Receipts disappear",
      body: "Supply-house and hardware-store receipts can fade, tear, or get lost in a service truck.",
      solution: "Snap the receipt before it leaves your hand.",
    },
    {
      title: "Expenses get mixed together",
      body: "Tools, parts, fuel, uniforms, and personal purchases often appear on the same card or account.",
      solution: "Organize each receipt with a clear business purpose.",
    },
    {
      title: "Tax-time cleanup takes hours",
      body: "Waiting until tax season means searching through bank statements, emails, glove boxes, and tool bags.",
      solution: "Build a cleaner record throughout the year.",
    },
  ],
  howItWorks: {
    id: "how-it-works",
    title: "How SnapTax Works for HVAC",
    steps: [
      {
        title: "Capture Receipts",
        body: "Snap supplier, fuel, and tool receipts before they disappear.",
      },
      {
        title: "Organize Expenses",
        body: "Review details and organize into useful categories such as Tools, Truck Gas, Supplies, Equipment, Materials, and Other. Add a short job note when helpful.",
      },
      {
        title: "Export & File",
        body: "Create an organized tax-ready expense report for your records or tax professional. SnapTax does not file tax returns.",
      },
    ],
  },
  examplesTitle: "Examples of HVAC Expenses",
  examplesCategoryHeader: "SnapTax category",
  examples: [],
  productCategoryNote:
    "In SnapTax, expenses often map to Tools, Truck Gas, Supplies, Equipment, Materials, or Other.",
  checklist: {
    title: "HVAC Expense Recordkeeping Checklist",
    items: [
      "Photograph paper receipts as soon as possible",
      "Save email and online purchase receipts",
      "Record the merchant, date, and total",
      "Note the business purpose",
      "Add the customer or job when relevant",
      "Separate personal and business purchases",
      "Keep mileage records separately",
      "Review uncertain transactions regularly",
      "Export an annual expense summary",
      "Ask a qualified tax professional about uncertain deductions",
    ],
  },
  builtFor: {
    title: "Built for independent HVAC professionals",
    body: "SnapTax is an expense organization tool for technicians and small HVAC businesses. It is not payroll software, a full accounting platform, or a tax-filing service.",
    features: [
      {
        title: "Receipt Scanner",
        body: "Capture supplier and job-site receipts quickly.",
      },
      {
        title: "Expense Tracking",
        body: "Keep business purchases organized before tax season.",
      },
      {
        title: "Tax Reports",
        body: "Export structured records for your accountant.",
      },
    ],
  },
  relatedTrades: {
    title: "Tax deductions for other trades",
    links: [
      {
        href: "/tax-deductions/electrician",
        label: "Electrician Tax Deductions",
      },
    ],
  },
  faq: [
    {
      question: "What can HVAC technicians deduct?",
      answer:
        "Potential business expenses may include qualifying tools, equipment, parts, supplies, safety gear, licenses, training, insurance, business vehicle costs, software, advertising, and professional services. Deductibility depends on the nature of the expense, its business use, and your circumstances.",
    },
    {
      question: "Can HVAC tools be written off?",
      answer:
        "Tools purchased for HVAC work may qualify as business expenses. Tax treatment can depend on cost, useful life, and business-use percentage.",
    },
    {
      question: "Can I deduct service truck expenses?",
      answer:
        "Business vehicle expenses may be deductible, but personal commuting and business travel must be distinguished. Keep records that support the business use of the vehicle.",
    },
    {
      question: "Can I deduct EPA 608 certification?",
      answer:
        "Certification, renewal, and training expenses related to skills used in an existing HVAC business may qualify, depending on the circumstances.",
    },
    {
      question: "Does SnapTax track mileage?",
      answer:
        "SnapTax can help organize vehicle-related receipts, but it does not currently replace a complete mileage log. Keep a separate record of the date, destination, distance, and business purpose of each trip.",
    },
    {
      question: "Can I export reports for my accountant?",
      answer:
        "Yes. You can export an organized expense report and use it when reviewing your records with an accountant or tax preparer.",
    },
  ],
  finalCta: {
    title: "Stop letting HVAC receipts disappear in your truck",
    body: "Capture each receipt when you get it, organize the expense, and build a cleaner record for tax season.",
    button: "Start Tracking Expenses",
    noCardRequired: "No forced sign-up. No complicated accounting setup.",
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
      href: "/blog/how-to-organize-receipts",
      label: "How to organize receipts",
    },
    {
      href: "/blog/1099-contractor-tax-guide",
      label: "1099 contractor tax guide",
    },
  ],
  disclaimer:
    "SnapTax helps users organize receipts and business expense records. It does not provide tax, legal, or accounting advice and does not prepare or file tax returns. Tax rules vary by situation and may change. Consult a qualified tax professional regarding your specific circumstances.",
};
```

- [ ] **Step 3: Register HVAC**

```ts
import { ELECTRICIAN_SEO_PAGE } from "@/lib/marketing/seo/industries/electrician";
import { HVAC_SEO_PAGE } from "@/lib/marketing/seo/industries/hvac";

const PUBLISHED: readonly IndustrySeoPage[] = [
  ELECTRICIAN_SEO_PAGE,
  HVAC_SEO_PAGE,
];
```

- [ ] **Step 4: Run tests → PASS → Commit**

```bash
git add lib/marketing/seo/industries/hvac.ts lib/marketing/seo/industries.ts lib/marketing/seo/industries.test.ts
git commit -m "$(cat <<'EOF'
feat(seo): add HVAC industry SEO content registry

EOF
)"
```

---

### Task 3: Optimize and publish HVAC assets

**Files:**
- Create under `public/marketing/seo/`:
  - `hvac-tax-deductions-snaptax.png`
  - `hvac-tax-deductions-snaptax-mobile.png`
  - `hvac-tax-deductions-snaptax-og.jpg`
  - `hvac-tax-deductions-snaptax-cta.webp`
- Create/update: `docs/seo/hvac/ASSETS.md`

**Interfaces:**
- Consumes: `docs/seo/hvac/hvac.0.0.1-hero.png`, `hvac.0.0.1-mobile.png`, `hvac.0.0.1-cta.png`
- Produces: runtime paths referenced by `HVAC_SEO_PAGE`

- [ ] **Step 1: Generate optimized assets with sharp**

```bash
node <<'NODE'
const sharp = require('sharp');
const fs = require('fs');
const dir = 'public/marketing/seo';
fs.mkdirSync(dir, { recursive: true });

(async () => {
  await sharp('docs/seo/hvac/hvac.0.0.1-hero.png')
    .resize({ width: 960, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toFile(`${dir}/hvac-tax-deductions-snaptax.png`);

  await sharp('docs/seo/hvac/hvac.0.0.1-mobile.png')
    .resize({ width: 720, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 80 })
    .toFile(`${dir}/hvac-tax-deductions-snaptax-mobile.png`);

  await sharp('docs/seo/hvac/hvac.0.0.1-hero.png')
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`${dir}/hvac-tax-deductions-snaptax-og.jpg`);

  await sharp('docs/seo/hvac/hvac.0.0.1-cta.png')
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(`${dir}/hvac-tax-deductions-snaptax-cta.webp`);

  for (const f of fs.readdirSync(dir).filter((n) => n.startsWith('hvac-'))) {
    console.log(f, fs.statSync(`${dir}/${f}`).size);
  }
})();
NODE
```

Each output should be well under 500KB (prefer &lt;300KB for hero/mobile).

- [ ] **Step 2: Write `docs/seo/hvac/ASSETS.md`** listing runtime filenames (mirror electrician ASSETS style).

- [ ] **Step 3: Commit**

```bash
git add public/marketing/seo/hvac-tax-deductions-snaptax.png \
  public/marketing/seo/hvac-tax-deductions-snaptax-mobile.png \
  public/marketing/seo/hvac-tax-deductions-snaptax-og.jpg \
  public/marketing/seo/hvac-tax-deductions-snaptax-cta.webp \
  docs/seo/hvac/ASSETS.md
# Also add source materials if not tracked yet (prd when non-empty, design pngs)
git add docs/seo/hvac/hvac.0.0.1-hero.png docs/seo/hvac/hvac.0.0.1-mobile.png \
  docs/seo/hvac/hvac.0.0.1-cta.png docs/seo/hvac/hvac-seo.0.0.1.png \
  docs/seo/hvac/hvac.0.0.1.prd.md 2>/dev/null || true
git commit -m "$(cat <<'EOF'
feat(seo): add optimized HVAC landing image assets

EOF
)"
```

If `hvac.0.0.1.prd.md` is still 0 bytes, **do not** commit an empty PRD; leave a note in the task report.

---

### Task 4: Shared UI — hero secondaryHref, deductions id, checklist, related trades, final CTA bg, composer

**Files:**
- Modify: `components/marketing/seo/IndustryHero.tsx`
- Modify: `components/marketing/seo/DeductionCards.tsx`
- Modify: `components/marketing/seo/IndustryFinalCta.tsx`
- Modify: `components/marketing/seo/IndustrySeoPage.tsx`
- Create: `components/marketing/seo/RecordkeepingChecklist.tsx`
- Create: `components/marketing/seo/RelatedTrades.tsx`

**Interfaces:**
- Consumes: extended `IndustrySeoPage`
- Produces: updated shared composer used by electrician + HVAC

- [ ] **Step 1: Hero — use `page.hero.secondaryHref`; prefer `phoneImage` when set**

Change secondary anchor:

```tsx
<a href={page.hero.secondaryHref} ...>
```

If `page.hero.phoneImage` is set, use it for the phone stack `Image`/`img` instead of `MARKETING_HERO_SCREENS[0]` (electrician keeps fallback to marketing screen).

- [ ] **Step 2: DeductionCards — add section id**

```tsx
<section id="deductions" className="scroll-mt-24 border-t border-white/10">
```

- [ ] **Step 3: Create `RecordkeepingChecklist.tsx`**

```tsx
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

export function RecordkeepingChecklist({
  checklist,
}: {
  checklist: NonNullable<IndustrySeoPage["checklist"]>;
}) {
  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-black text-white sm:text-3xl">
          {checklist.title}
        </h2>
        <ul className="mt-8 grid list-none gap-3 sm:grid-cols-2">
          {checklist.items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200"
            >
              <span
                className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-black"
                style={{ backgroundColor: MARKETING_TOKENS.accentGreen }}
                aria-hidden
              >
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `RelatedTrades.tsx`**

```tsx
import Link from "next/link";
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

export function RelatedTrades({
  relatedTrades,
}: {
  relatedTrades: NonNullable<IndustrySeoPage["relatedTrades"]>;
}) {
  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-black text-white sm:text-2xl">
          {relatedTrades.title}
        </h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {relatedTrades.links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex min-h-11 items-center rounded-lg border border-white/15 px-4 text-sm font-bold text-zinc-200 hover:border-white/30 hover:text-white"
                style={{ borderColor: undefined }}
              >
                <span style={{ color: MARKETING_TOKENS.accentGreen }}>
                  {link.label} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Final CTA — optional background**

If `finalCta.backgroundImage` present, render a relative section with dimmed background `img`/`Image` and overlay content (keep text readable: dark scrim).

- [ ] **Step 6: Reorder `IndustrySeoPageView`**

Exact order from spec:

```tsx
<>
  <IndustryHero page={page} />
  <DeductionCards page={page} />
  <HowItWorks page={page} />
  <ProblemSolution page={page} />
  {page.checklist ? <RecordkeepingChecklist checklist={page.checklist} /> : null}
  <BuiltForBand page={page} />
  {page.examples.length > 0 ? <ExpenseExamples page={page} /> : null}
  <IndustryFaq items={page.faq} />
  <IndustryFinalCta page={page} />
  {page.relatedTrades ? <RelatedTrades relatedTrades={page.relatedTrades} /> : null}
  {/* outbound + disclaimer unchanged */}
</>
```

- [ ] **Step 7: Manual sanity**

Open `/tax-deductions/electrician` — still works; Related trades link visible; Examples still show; secondary CTA still `#how-it-works`.

- [ ] **Step 8: Commit**

```bash
git add components/marketing/seo/
git commit -m "$(cat <<'EOF'
feat(seo): extend industry landing composer for checklist and related trades

EOF
)"
```

---

### Task 5: HVAC route page

**Files:**
- Create: `app/(marketing)/tax-deductions/hvac/page.tsx`

**Interfaces:**
- Consumes: `getIndustryBySlug("hvac")`, `IndustrySeoPageView`, `buildIndustryJsonLd`, `buildMarketingMetadata`, `JsonLd`

- [ ] **Step 1: Implement page** (mirror electrician page)

```tsx
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/marketing/JsonLd";
import { IndustrySeoPageView } from "@/components/marketing/seo/IndustrySeoPage";
import { getIndustryBySlug } from "@/lib/marketing/seo/industries";
import { buildIndustryJsonLd } from "@/lib/marketing/seo/jsonLd";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

const page = getIndustryBySlug("hvac");

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
      path: "/tax-deductions/hvac",
    });

export default function HvacTaxDeductionsPage() {
  const industry = getIndustryBySlug("hvac");
  if (!industry) notFound();

  return (
    <>
      <JsonLd data={buildIndustryJsonLd(industry)} />
      <IndustrySeoPageView page={industry} />
    </>
  );
}
```

- [ ] **Step 2: Smoke**

`npm run dev` → `/tax-deductions/hvac` returns 200; View Deductions scrolls to `#deductions`; FAQ JSON-LD present; no Examples table.

- [ ] **Step 3: Commit**

```bash
git add app/\(marketing\)/tax-deductions/hvac/page.tsx
git commit -m "$(cat <<'EOF'
feat(seo): ship HVAC tax deductions landing page

EOF
)"
```

---

### Task 6: Sitemap + footer

**Files:**
- Modify: `lib/marketing/seo/sitemapEntries.ts`
- Modify: `lib/marketing/seo/sitemapEntries.test.ts`
- Modify: `lib/marketing/copy.ts`

**Interfaces:**
- Produces: discoverable HVAC URL + footer inbound link

- [ ] **Step 1: Update sitemap entries + test**

```ts
export const TAX_DEDUCTION_SITEMAP_ENTRIES = [
  { path: "/tax-deductions", priority: 0.6 },
  { path: "/tax-deductions/electrician", priority: 0.7 },
  { path: "/tax-deductions/hvac", priority: 0.7 },
] as const;
```

Update test `deepEqual` accordingly.

- [ ] **Step 2: Footer Product links**

Append after Electrician link:

```ts
{ href: "/tax-deductions/hvac", label: "HVAC Tax Deductions" },
```

- [ ] **Step 3: Run unit tests → Commit**

```bash
git add lib/marketing/seo/sitemapEntries.ts lib/marketing/seo/sitemapEntries.test.ts lib/marketing/copy.ts
git commit -m "$(cat <<'EOF'
feat(seo): sitemap and footer entry for HVAC landing

EOF
)"
```

---

### Task 7: Acceptance pass

- [ ] **Step 1: Walk Must checklist from spec §9**

Confirm both `/tax-deductions/electrician` and `/tax-deductions/hvac`, index two cards, footer both links, related trades both directions, sitemap three tax-deduction paths, mileage FAQ honesty, assets load, disclaimer link.

- [ ] **Step 2: Run**

```bash
npm run test:unit -- lib/marketing/seo/industries.test.ts lib/marketing/seo/jsonLd.test.ts lib/marketing/seo/sitemapEntries.test.ts lib/marketing/metadata.test.ts
```

Expected: PASS

- [ ] **Step 3: Final commit only if cleanup remains** (e.g. saved PRD content)

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| Types + secondaryHref + relatedTrades | Task 1 |
| HVAC registry content | Task 2 |
| Optimized assets | Task 3 |
| Composer / checklist / deductions id | Task 4 |
| `/tax-deductions/hvac` route + JSON-LD | Task 5 |
| Sitemap + footer | Task 6 |
| Acceptance | Task 7 |
| No PDF / analytics / cluster / query CTA | Out of scope — no tasks |

**Placeholder scan:** none intentional.  
**Type consistency:** `secondaryHref`, `checklist`, `relatedTrades`, `phoneImage`, `finalCta.backgroundImage` used uniformly.
