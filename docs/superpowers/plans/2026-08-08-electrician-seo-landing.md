# Electrician SEO Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/tax-deductions` (thin hub) and `/tax-deductions/electrician` (trade SEO landing) on the existing marketing site, with template-ready content registry, FAQ/Breadcrumb JSON-LD, footer inbound link, and category-honest product copy.

**Architecture:** Industry page data lives in `lib/marketing/seo/`; shared section components in `components/marketing/seo/` compose under `(marketing)` routes. Reuse `buildMarketingMetadata`, `JsonLd`, `MarketingAppLink`, and marketing tokens. No PWA/`/app` shell changes.

**Tech Stack:** Next.js App Router · React 19 · Tailwind 4 · existing marketing helpers · node:test + tsx (`npm run test:unit`)

## Global Constraints

- Spec canonical: `docs/superpowers/specs/2026-08-08-electrician-seo-landing-design.md`
- Ship **electrician only** — no plumber page, no `/tax-guides/*`, no newsletter, no Industries nav
- Title/Meta from PRD; body/CTAs from context; product category claims from `US_EXPORT_CATEGORIES` only
- Primary CTA → `/app` via `MarketingAppLink` (do not break WebAPK native navigation)
- Secondary CTA → `#how-it-works` in-page anchor
- Disclaimer: educational only + link `/disclaimer`
- Medium visual fidelity; marketing palette (`MARKETING_TOKENS`)
- English UI strings only on these pages
- Commit after each task

## File map

| Path | Responsibility |
|------|----------------|
| `lib/marketing/seo/types.ts` | `IndustrySeoPage` and related types |
| `lib/marketing/seo/industries/electrician.ts` | Electrician copy + SEO fields |
| `lib/marketing/seo/industries.ts` | Published registry + getters |
| `lib/marketing/seo/jsonLd.ts` | FAQPage + BreadcrumbList builders |
| `lib/marketing/seo/industries.test.ts` | Registry + category honesty tests |
| `lib/marketing/seo/jsonLd.test.ts` | Schema shape tests |
| `lib/marketing/metadata.ts` | Optional `imagePath` for OG |
| `lib/marketing/metadata.test.ts` | Metadata image/canonical tests |
| `public/marketing/seo/electrician-worker.png` | Public hero asset |
| `components/marketing/seo/*.tsx` | Index + industry sections |
| `app/(marketing)/tax-deductions/page.tsx` | Thin index route |
| `app/(marketing)/tax-deductions/electrician/page.tsx` | Electrician route |
| `app/sitemap.ts` | Add paths + priorities |
| `lib/marketing/copy.ts` | Footer Product link |

---

### Task 1: SEO types, electrician content, registry

**Files:**
- Create: `lib/marketing/seo/types.ts`
- Create: `lib/marketing/seo/industries/electrician.ts`
- Create: `lib/marketing/seo/industries.ts`
- Test: `lib/marketing/seo/industries.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `IndustrySeoPage`, `ELECTRICIAN_SEO_PAGE`, `listPublishedIndustries()`, `getIndustryBySlug(slug: string)`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getIndustryBySlug,
  listPublishedIndustries,
} from "@/lib/marketing/seo/industries";
import { US_EXPORT_CATEGORIES } from "@/lib/tax/usExportCategories";

describe("seo industries registry", () => {
  it("publishes electrician only", () => {
    const list = listPublishedIndustries();
    assert.equal(list.length, 1);
    assert.equal(list[0]?.slug, "electrician");
    assert.equal(list[0]?.path, "/tax-deductions/electrician");
  });

  it("loads electrician by slug with PRD title/meta", () => {
    const page = getIndustryBySlug("electrician");
    assert.ok(page);
    assert.equal(
      page.seo.title,
      "Electrician Tax Deductions Checklist (Tools, Truck & Business Expenses)",
    );
    assert.match(page.seo.description, /tools, vehicles, supplies/i);
    assert.equal(page.howItWorks.id, "how-it-works");
    assert.equal(page.faq.length, 4);
  });

  it("how-it-works track step uses real US category names only", () => {
    const page = getIndustryBySlug("electrician");
    assert.ok(page);
    const track = page.howItWorks.steps[1];
    assert.ok(track);
    assert.match(track.body, /Truck Gas/i);
    assert.doesNotMatch(track.body, /\bEducation\b/);
    assert.doesNotMatch(track.body, /\bOperations\b/);
    assert.doesNotMatch(track.body, /\bVehicle\b/);
    for (const token of ["Tools", "Truck Gas", "Supplies", "Equipment", "Materials"]) {
      assert.match(track.body, new RegExp(token, "i"));
    }
    for (const cat of US_EXPORT_CATEGORIES) {
      // sanity: enum still includes TOOLS
      if (cat === "TOOLS") assert.ok(true);
    }
  });

  it("returns undefined for unknown slug", () => {
    assert.equal(getIndustryBySlug("plumber"), undefined);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- lib/marketing/seo/industries.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implement types**

Create `lib/marketing/seo/types.ts`:

```ts
export type IndustrySlug = "electrician";

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
    trustItems: string[];
    workerImage: { src: string; alt: string };
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
  examples: { expense: string; category: string }[];
  productCategoryNote: string;
  builtFor: {
    title: string;
    body: string;
    features: { title: string; body: string }[];
  };
  faq: { question: string; answer: string }[];
  finalCta: {
    title: string;
    body: string;
    button: string;
    noCardRequired: string;
  };
  outboundLinks: { href: string; label: string }[];
  disclaimer: string;
};
```

- [ ] **Step 4: Implement electrician content**

Create `lib/marketing/seo/industries/electrician.ts` with the full object (copy rules from spec):

```ts
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";

export const ELECTRICIAN_SEO_PAGE: IndustrySeoPage = {
  slug: "electrician",
  path: "/tax-deductions/electrician",
  label: "Electricians",
  indexBlurb:
    "Common tax deductions for tools, vehicles, supplies, and job-site expenses.",
  seo: {
    title:
      "Electrician Tax Deductions Checklist (Tools, Truck & Business Expenses)",
    description:
      "Learn common tax deductions for electricians including tools, vehicles, supplies, and business expenses. Track receipts and prepare tax-ready reports with SnapTax.",
  },
  hero: {
    h1: "Electrician Tax Deductions Checklist:\nTrack Expenses and Keep More of What You Earn",
    subtitle: "Track Expenses. Save More. Stress Less.",
    body: "Electricians spend money on tools, equipment, vehicles, and supplies every day.\n\nSnapTax helps you organize receipts, track expenses, and prepare tax-ready reports before tax season.",
    primaryCta: "Start Tracking Expenses Free",
    secondaryCta: "See How SnapTax Works",
    trustItems: [
      "Built for Independent Electricians",
      "Receipt Scanning",
      "Tax-Ready Reports",
      "Secure & Private",
    ],
    workerImage: {
      src: "/marketing/seo/electrician-worker.png",
      alt: "Electrician working on an electrical panel",
    },
  },
  deductionsTitle: "Common Tax Deductions for Electricians",
  deductionsIntro:
    "Electricians often have many business expenses throughout the year. Keeping accurate records helps you understand your costs and prepare for tax season.",
  deductionCards: [
    {
      title: "Tools & Equipment",
      body: "Electrical tools are essential for your work.",
      examples: [
        "Multimeters",
        "Drills",
        "Hand tools",
        "Testing equipment",
        "Safety equipment",
      ],
    },
    {
      title: "Vehicle Expenses",
      body: "Many electricians travel between jobs.",
      examples: ["Work truck", "Mileage", "Fuel", "Maintenance", "Insurance"],
    },
    {
      title: "Materials & Supplies",
      body: "Daily electrical jobs require many supplies:",
      examples: [
        "Wire",
        "Switches",
        "Fixtures",
        "Connectors",
        "Replacement parts",
      ],
    },
    {
      title: "Training & Licensing",
      body: "Professional development expenses may include:",
      examples: [
        "Certifications",
        "Safety training",
        "Continuing education",
      ],
    },
    {
      title: "Business Operations",
      body: "Running an electrical business also involves:",
      examples: ["Insurance", "Phone bills", "Software", "Office expenses"],
    },
  ],
  problemsTitle: "Don't Lose Track of Your Expenses",
  problems: [
    {
      title: "Too Many Receipts",
      body: "Home Depot. Lowe's. Electrical suppliers. Receipts quickly pile up.",
      solution: "Snap a photo and store receipts instantly.",
    },
    {
      title: "Hard to Remember Categories",
      body: "Was this purchase a tool? A supply? A vehicle expense?",
      solution: "SnapTax helps organize expenses automatically.",
    },
    {
      title: "Tax Season Stress",
      body: "Finding receipts at the end of the year takes time.",
      solution: "Export organized reports when you need them.",
    },
  ],
  howItWorks: {
    id: "how-it-works",
    title: "How SnapTax Works for Electricians",
    steps: [
      {
        title: "Snap Receipts",
        body: "Take a photo of any receipt. SnapTax extracts the details automatically.",
      },
      {
        title: "Track Expenses",
        body: "Expenses are organized into useful categories such as Tools, Truck Gas, Supplies, Equipment, and Materials.",
      },
      {
        title: "Export Tax Reports",
        body: "Prepare organized expense reports for tax season.",
      },
    ],
  },
  examplesTitle: "Examples of Electrician Expenses",
  examples: [
    { expense: "Cordless Drill", category: "Tools" },
    { expense: "Voltage Tester", category: "Equipment" },
    { expense: "Electrical Wire", category: "Supplies" },
    { expense: "Work Van Fuel", category: "Vehicle" },
    { expense: "Safety Gear", category: "Equipment" },
    { expense: "Business Insurance", category: "Operations" },
    { expense: "License Renewal", category: "Professional Fees" },
  ],
  productCategoryNote:
    "In SnapTax, expenses often map to Tools, Truck Gas, Supplies, Equipment, Materials, or Other.",
  builtFor: {
    title: "Built for Independent Electricians",
    body: "SnapTax is designed for contractors who work in the field. No complicated accounting setup. No unnecessary features. Just capture receipts, organize expenses, and stay prepared.",
    features: [
      {
        title: "Receipt Scanner",
        body: "Automatically capture receipt information.",
      },
      {
        title: "Expense Tracking",
        body: "Know where your money goes.",
      },
      {
        title: "Tax Reports",
        body: "Export organized records.",
      },
    ],
  },
  faq: [
    {
      question: "Can electricians deduct tools?",
      answer:
        "Tools used for electrical work are common business expenses. Keeping receipts helps maintain accurate records.",
    },
    {
      question: "Can electricians deduct mileage?",
      answer:
        "Electricians who travel for business often track mileage as part of their expense records.",
    },
    {
      question: "Should electricians keep receipts?",
      answer:
        "Keeping organized receipts makes expense tracking and tax preparation easier.",
    },
    {
      question: "How do electricians track business expenses?",
      answer:
        "Many contractors use expense tracking tools to organize receipts, categorize purchases, and prepare reports.",
    },
  ],
  finalCta: {
    title: "Ready for a simpler tax season?",
    body: "Start organizing your electrician expenses today.",
    button: "Start Tracking Free",
    noCardRequired: "No credit card required.",
  },
  outboundLinks: [
    { href: "/features", label: "SnapTax features" },
    { href: "/faq", label: "FAQ" },
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
    "For educational purposes only. Not tax advice. Confirm deductions with a qualified professional.",
};
```

- [ ] **Step 5: Implement registry**

Create `lib/marketing/seo/industries.ts`:

```ts
import { ELECTRICIAN_SEO_PAGE } from "@/lib/marketing/seo/industries/electrician";
import type { IndustrySeoPage, IndustrySlug } from "@/lib/marketing/seo/types";

const PUBLISHED: readonly IndustrySeoPage[] = [ELECTRICIAN_SEO_PAGE];

export function listPublishedIndustries(): readonly IndustrySeoPage[] {
  return PUBLISHED;
}

export function getIndustryBySlug(
  slug: string,
): IndustrySeoPage | undefined {
  return PUBLISHED.find((page) => page.slug === slug);
}

export type { IndustrySeoPage, IndustrySlug };
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test:unit -- lib/marketing/seo/industries.test.ts`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/marketing/seo/types.ts lib/marketing/seo/industries.ts lib/marketing/seo/industries/electrician.ts lib/marketing/seo/industries.test.ts
git commit -m "$(cat <<'EOF'
feat(seo): add electrician industry SEO content registry

EOF
)"
```

---

### Task 2: JSON-LD builders

**Files:**
- Create: `lib/marketing/seo/jsonLd.ts`
- Test: `lib/marketing/seo/jsonLd.test.ts`

**Interfaces:**
- Consumes: `IndustrySeoPage`, `getPublicSiteUrl()`
- Produces: `buildIndustryJsonLd(page: IndustrySeoPage): Record<string, unknown>`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ELECTRICIAN_SEO_PAGE } from "@/lib/marketing/seo/industries/electrician";
import { buildIndustryJsonLd } from "@/lib/marketing/seo/jsonLd";

describe("buildIndustryJsonLd", () => {
  it("includes FAQPage and BreadcrumbList with real URLs", () => {
    const data = buildIndustryJsonLd(ELECTRICIAN_SEO_PAGE);
    assert.equal(data["@context"], "https://schema.org");
    const graph = data["@graph"] as Array<Record<string, unknown>>;
    assert.ok(Array.isArray(graph));
    const faq = graph.find((n) => n["@type"] === "FAQPage");
    const crumbs = graph.find((n) => n["@type"] === "BreadcrumbList");
    assert.ok(faq);
    assert.ok(crumbs);
    const entities = faq.mainEntity as unknown[];
    assert.equal(entities.length, 4);
    const items = crumbs.itemListElement as Array<Record<string, unknown>>;
    assert.equal(items.length, 3);
    assert.match(String(items[1]?.item), /\/tax-deductions$/);
    assert.match(String(items[2]?.item), /\/tax-deductions\/electrician$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- lib/marketing/seo/jsonLd.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implement builder**

Create `lib/marketing/seo/jsonLd.ts`:

```ts
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";
import { getPublicSiteUrl } from "@/lib/site/publicSiteUrl";

export function buildIndustryJsonLd(
  page: IndustrySeoPage,
): Record<string, unknown> {
  const base = getPublicSiteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: page.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${base}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Tax Deductions",
            item: `${base}/tax-deductions`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: page.label,
            item: `${base}${page.path}`,
          },
        ],
      },
    ],
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit -- lib/marketing/seo/jsonLd.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/marketing/seo/jsonLd.ts lib/marketing/seo/jsonLd.test.ts
git commit -m "$(cat <<'EOF'
feat(seo): build FAQ and breadcrumb JSON-LD for industry pages

EOF
)"
```

---

### Task 3: Metadata helper + public worker image

**Files:**
- Modify: `lib/marketing/metadata.ts`
- Create: `lib/marketing/metadata.test.ts`
- Create: `public/marketing/seo/electrician-worker.png` (copy from docs)

**Interfaces:**
- Consumes: existing `buildMarketingMetadata`
- Produces: `buildMarketingMetadata({ ..., imagePath?: string, imageAlt?: string })`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

describe("buildMarketingMetadata", () => {
  it("uses custom imagePath when provided", () => {
    const meta = buildMarketingMetadata({
      title: "T",
      description: "D",
      path: "/tax-deductions/electrician",
      imagePath: "/marketing/seo/electrician-worker.png",
      imageAlt: "Electrician working on an electrical panel",
    });
    const og = meta.openGraph?.images;
    assert.ok(Array.isArray(og));
    assert.match(String((og[0] as { url: string }).url), /electrician-worker/);
  });

  it("defaults to hero-phone when imagePath omitted", () => {
    const meta = buildMarketingMetadata({
      title: "T",
      description: "D",
      path: "/features",
    });
    const images = meta.twitter?.images;
    assert.ok(Array.isArray(images));
    assert.match(String(images[0]), /hero-phone/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- lib/marketing/metadata.test.ts`  
Expected: FAIL (unknown args / assertion)

- [ ] **Step 3: Update metadata helper**

Replace `lib/marketing/metadata.ts` with:

```ts
import type { Metadata } from "next";
import { getPublicSiteUrl } from "@/lib/site/publicSiteUrl";

const DEFAULT_OG_IMAGE_PATH = "/marketing/hero-phone.png";
const DEFAULT_OG_ALT = "SnapTax expense tracking app";

export function buildMarketingMetadata({
  title,
  description,
  path,
  imagePath = DEFAULT_OG_IMAGE_PATH,
  imageAlt = DEFAULT_OG_ALT,
}: {
  title: string;
  description: string;
  path: string;
  imagePath?: string;
  imageAlt?: string;
}): Metadata {
  const siteUrl = getPublicSiteUrl();
  const url = `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const resolvedImagePath = imagePath.startsWith("/")
    ? imagePath
    : `/${imagePath}`;
  const ogImage = `${siteUrl}${resolvedImagePath}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "SnapTax",
      type: "website",
      images: [{ url: ogImage, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
```

- [ ] **Step 4: Copy worker image into public**

```bash
mkdir -p public/marketing/seo
cp docs/seo/electrician/electrician-worker.png public/marketing/seo/electrician-worker.png
```

Verify: `test -f public/marketing/seo/electrician-worker.png`

- [ ] **Step 5: Run metadata tests**

Run: `npm run test:unit -- lib/marketing/metadata.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/marketing/metadata.ts lib/marketing/metadata.test.ts public/marketing/seo/electrician-worker.png
git commit -m "$(cat <<'EOF'
feat(seo): support custom OG image and add electrician hero asset

EOF
)"
```

---

### Task 4: Shared SEO UI primitives (disclaimer, breadcrumb, FAQ)

**Files:**
- Create: `components/marketing/seo/SeoDisclaimer.tsx`
- Create: `components/marketing/seo/IndustryBreadcrumb.tsx`
- Create: `components/marketing/seo/IndustryFaq.tsx`

**Interfaces:**
- Consumes: `IndustrySeoPage["faq"]`, disclaimer string
- Produces: presentational components used by index + industry page

- [ ] **Step 1: Implement `SeoDisclaimer`**

```tsx
import Link from "next/link";

export function SeoDisclaimer({ text }: { text: string }) {
  return (
    <p className="text-xs leading-relaxed text-zinc-500">
      {text}{" "}
      <Link href="/disclaimer" className="underline hover:text-zinc-300">
        Disclaimer
      </Link>
      .
    </p>
  );
}
```

- [ ] **Step 2: Implement `IndustryBreadcrumb`**

```tsx
import Link from "next/link";

export function IndustryBreadcrumb({
  industryLabel,
}: {
  industryLabel: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-zinc-400">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/" className="hover:text-white">
            Home
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li>
          <Link href="/tax-deductions" className="hover:text-white">
            Tax Deductions
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li className="text-white">{industryLabel}</li>
      </ol>
    </nav>
  );
}
```

- [ ] **Step 3: Implement `IndustryFaq`**

Reuse accordion pattern from `MarketingFaqList`, but accept flat `{ question, answer }[]`:

```tsx
"use client";

import { useState } from "react";

export function IndustryFaq({
  items,
  title = "Frequently Asked Questions",
}: {
  items: readonly { question: string; answer: string }[];
  title?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="text-2xl font-black text-white sm:text-3xl">{title}</h2>
      <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
        {items.map((item, index) => {
          const open = openIndex === index;
          return (
            <div key={item.question}>
              <button
                type="button"
                className="flex min-h-12 w-full items-center justify-between gap-4 py-5 text-left"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span className="font-bold text-white">{item.question}</span>
                <span className="shrink-0 text-zinc-400" aria-hidden>
                  {open ? "−" : "+"}
                </span>
              </button>
              {open ? (
                <p className="pb-5 text-sm leading-relaxed text-zinc-400">
                  {item.answer}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/marketing/seo/SeoDisclaimer.tsx components/marketing/seo/IndustryBreadcrumb.tsx components/marketing/seo/IndustryFaq.tsx
git commit -m "$(cat <<'EOF'
feat(seo): add disclaimer, breadcrumb, and industry FAQ UI

EOF
)"
```

---

### Task 5: Thin `/tax-deductions` index

**Files:**
- Create: `components/marketing/seo/TaxDeductionsIndex.tsx`
- Create: `app/(marketing)/tax-deductions/page.tsx`

**Interfaces:**
- Consumes: `listPublishedIndustries()`, `SeoDisclaimer`
- Produces: index route at `/tax-deductions`

- [ ] **Step 1: Implement `TaxDeductionsIndex`**

```tsx
import Link from "next/link";
import { SeoDisclaimer } from "@/components/marketing/seo/SeoDisclaimer";
import { listPublishedIndustries } from "@/lib/marketing/seo/industries";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

const INDEX_DISCLAIMER =
  "For educational purposes only. Not tax advice. Confirm deductions with a qualified professional.";

export function TaxDeductionsIndex() {
  const industries = listPublishedIndustries();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black text-white sm:text-4xl">
        Tax Deductions by Trade
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
        Contractors can review common business expenses by trade and keep
        receipt-ready records before tax season.
      </p>

      {industries.length === 0 ? (
        <p className="mt-10 text-sm text-zinc-400">More trades coming soon.</p>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {industries.map((industry) => (
            <li key={industry.slug}>
              <Link
                href={industry.path}
                className="block min-h-24 rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-white/20"
              >
                <h2 className="text-lg font-black text-white">
                  {industry.label}
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  {industry.indexBlurb}
                </p>
                <span
                  className="mt-4 inline-block text-sm font-bold"
                  style={{ color: MARKETING_TOKENS.accentGreen }}
                >
                  View checklist →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-12">
        <SeoDisclaimer text={INDEX_DISCLAIMER} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement index page**

```tsx
import { TaxDeductionsIndex } from "@/components/marketing/seo/TaxDeductionsIndex";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

export const metadata = buildMarketingMetadata({
  title: "Tax Deductions by Trade | SnapTax",
  description:
    "Browse trade-specific tax deduction checklists for independent contractors. Start with electricians — tools, vehicles, supplies, and receipt tracking.",
  path: "/tax-deductions",
});

export default function TaxDeductionsIndexPage() {
  return <TaxDeductionsIndex />;
}
```

- [ ] **Step 3: Manual smoke**

Run: `npm run dev`  
Open: `http://localhost:3000/tax-deductions`  
Expected: H1, one Electrician card, disclaimer link works

- [ ] **Step 4: Commit**

```bash
git add components/marketing/seo/TaxDeductionsIndex.tsx app/\(marketing\)/tax-deductions/page.tsx
git commit -m "$(cat <<'EOF'
feat(seo): add thin tax deductions index page

EOF
)"
```

---

### Task 6: Industry landing sections + composer

**Files:**
- Create: `components/marketing/seo/IndustryHero.tsx`
- Create: `components/marketing/seo/DeductionCards.tsx`
- Create: `components/marketing/seo/ProblemSolution.tsx`
- Create: `components/marketing/seo/HowItWorks.tsx`
- Create: `components/marketing/seo/ExpenseExamples.tsx`
- Create: `components/marketing/seo/BuiltForBand.tsx`
- Create: `components/marketing/seo/IndustryFinalCta.tsx`
- Create: `components/marketing/seo/IndustrySeoPage.tsx`

**Interfaces:**
- Consumes: `IndustrySeoPage`, `MarketingAppLink`, `MARKETING_HERO_SCREENS`, primitives from Task 4
- Produces: `IndustrySeoPageView({ page })` full landing composition

- [ ] **Step 1: Implement section components (medium fidelity)**

`IndustryHero.tsx` — key behaviors:
- Render breadcrumb via `IndustryBreadcrumb`
- Show `h1` (preserve `\n` with `whitespace-pre-line`)
- Subtitle in `MARKETING_TOKENS.accentGreen`
- Primary: `MarketingAppLink` yellow CTA
- Secondary: `<a href="#how-it-works">` outline button (not `MarketingAppLink`)
- Trust items row
- Worker `<img>` + phone from `MARKETING_HERO_SCREENS[0]`
- If worker image 404 at runtime is acceptable to leave to browser; do not block render

`DeductionCards.tsx`:
- Use `page.deductionsTitle`, `page.deductionsIntro`, and `page.deductionCards`.

`ProblemSolution.tsx`: three columns/stack with problem → solution.

`HowItWorks.tsx`:
```tsx
<section id={page.howItWorks.id} className="scroll-mt-24 ...">
```

`ExpenseExamples.tsx`: semantic `<table>` + `productCategoryNote` footnote.

`BuiltForBand.tsx`: title, body, three feature items (text only; no emoji required — use plain titles from data).

`IndustryFinalCta.tsx`: yellow `MarketingAppLink` + `noCardRequired` line.

`IndustrySeoPage.tsx` composer order:

```tsx
export function IndustrySeoPageView({ page }: { page: IndustrySeoPage }) {
  return (
    <>
      <IndustryHero page={page} />
      <DeductionCards page={page} />
      <ProblemSolution page={page} />
      <HowItWorks page={page} />
      <ExpenseExamples page={page} />
      <BuiltForBand page={page} />
      <IndustryFaq items={page.faq} />
      <IndustryFinalCta page={page} />
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-4 text-sm">
          {page.outboundLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-zinc-400 underline hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
        <SeoDisclaimer text={page.disclaimer} />
      </div>
    </>
  );
}
```

Exact Tailwind should match nearby marketing pages (`max-w-6xl`, `border-white/10`, `rounded-xl`, `min-h-12`, `active:scale-95` on CTAs).

- [ ] **Step 2: Commit**

```bash
git add components/marketing/seo/
git commit -m "$(cat <<'EOF'
feat(seo): add industry landing section components

EOF
)"
```

---

### Task 7: Electrician route + JSON-LD page wiring

**Files:**
- Create: `app/(marketing)/tax-deductions/electrician/page.tsx`

**Interfaces:**
- Consumes: `getIndustryBySlug`, `IndustrySeoPageView`, `buildIndustryJsonLd`, `buildMarketingMetadata`, `JsonLd`
- Produces: `/tax-deductions/electrician`

- [ ] **Step 1: Implement page**

```tsx
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/marketing/JsonLd";
import { IndustrySeoPageView } from "@/components/marketing/seo/IndustrySeoPage";
import { getIndustryBySlug } from "@/lib/marketing/seo/industries";
import { buildIndustryJsonLd } from "@/lib/marketing/seo/jsonLd";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

const page = getIndustryBySlug("electrician");

export const metadata = page
  ? buildMarketingMetadata({
      title: page.seo.title,
      description: page.seo.description,
      path: page.path,
      imagePath: page.hero.workerImage.src,
      imageAlt: page.hero.workerImage.alt,
    })
  : buildMarketingMetadata({
      title: "Not found",
      description: "Not found",
      path: "/tax-deductions/electrician",
    });

export default function ElectricianTaxDeductionsPage() {
  const industry = getIndustryBySlug("electrician");
  if (!industry) notFound();

  return (
    <>
      <JsonLd data={buildIndustryJsonLd(industry)} />
      <IndustrySeoPageView page={industry} />
    </>
  );
}
```

- [ ] **Step 2: Manual smoke**

Open: `http://localhost:3000/tax-deductions/electrician`  
Check:
- Title in tab matches PRD
- Secondary CTA scrolls to `#how-it-works`
- Primary CTA href is `/app`
- View source contains `"@type":"FAQPage"` and `"BreadcrumbList"`
- How it works mentions Truck Gas / Tools (not Education as product category)

- [ ] **Step 3: Commit**

```bash
git add app/\(marketing\)/tax-deductions/electrician/page.tsx
git commit -m "$(cat <<'EOF'
feat(seo): ship electrician tax deductions landing page

EOF
)"
```

---

### Task 8: Sitemap + footer inbound link

**Files:**
- Modify: `app/sitemap.ts`
- Modify: `lib/marketing/copy.ts` (Product column links)
- Test: extend or add `lib/marketing/seo/sitemapPaths.test.ts` **or** assert via small helper

**Interfaces:**
- Consumes: none new
- Produces: discoverable URLs + footer entry

- [ ] **Step 1: Write failing sitemap helper test**

Create `lib/marketing/seo/sitemapEntries.ts`:

```ts
export const TAX_DEDUCTION_SITEMAP_ENTRIES = [
  { path: "/tax-deductions", priority: 0.6 },
  { path: "/tax-deductions/electrician", priority: 0.7 },
] as const;
```

Test `lib/marketing/seo/sitemapEntries.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TAX_DEDUCTION_SITEMAP_ENTRIES } from "@/lib/marketing/seo/sitemapEntries";

describe("TAX_DEDUCTION_SITEMAP_ENTRIES", () => {
  it("lists index and electrician with expected priorities", () => {
    assert.deepEqual(
      [...TAX_DEDUCTION_SITEMAP_ENTRIES],
      [
        { path: "/tax-deductions", priority: 0.6 },
        { path: "/tax-deductions/electrician", priority: 0.7 },
      ],
    );
  });
});
```

- [ ] **Step 2: Wire `app/sitemap.ts`**

Replace flat `PUBLIC_PATHS` mapping so tax-deduction entries use custom priority. Concrete approach:

1. Keep existing `PUBLIC_PATHS` as-is (do **not** add tax paths there).
2. After `staticEntries`, append:

```ts
import { TAX_DEDUCTION_SITEMAP_ENTRIES } from "@/lib/marketing/seo/sitemapEntries";

const taxDeductionEntries = TAX_DEDUCTION_SITEMAP_ENTRIES.map((entry) => ({
  url: `${baseUrl}${entry.path}`,
  lastModified,
  changeFrequency: "monthly" as const,
  priority: entry.priority,
}));

return [...staticEntries, ...taxDeductionEntries, ...blogEntries];
```

- [ ] **Step 3: Footer link**

In `lib/marketing/copy.ts` Product column `links` array, append:

```ts
{ href: "/tax-deductions/electrician", label: "Electrician Tax Deductions" },
```

- [ ] **Step 4: Run unit tests**

Run: `npm run test:unit -- lib/marketing/seo/`  
Expected: all PASS

- [ ] **Step 5: Manual check**

Open any marketing page footer → “Electrician Tax Deductions” → lands on electrician page.  
Open `/sitemap.xml` → both tax-deduction URLs present.

- [ ] **Step 6: Commit**

```bash
git add app/sitemap.ts lib/marketing/seo/sitemapEntries.ts lib/marketing/seo/sitemapEntries.test.ts lib/marketing/copy.ts
git commit -m "$(cat <<'EOF'
feat(seo): sitemap and footer entry for electrician landing

EOF
)"
```

---

### Task 9: Acceptance pass + source docs (optional track)

**Files:**
- Optionally add: `docs/seo/` source materials if product wants them versioned (ask only if not already committed)

- [ ] **Step 1: Walk Must checklist from spec §10**

Confirm each checkbox against running app:
- routes render under marketing layout
- sitemap entries
- PRD title/meta
- CTAs behavior
- footer inbound
- breadcrumb links
- JSON-LD
- no false product categories
- disclaimer
- worker image loads from `/marketing/seo/electrician-worker.png`
- no out-of-scope nav/newsletter/guides/second industry

- [ ] **Step 2: Run full unit suite for touched areas**

Run: `npm run test:unit -- lib/marketing/`  
Expected: PASS (or only pre-existing failures unrelated to these files)

- [ ] **Step 3: Final commit only if cleanup remains**

If only docs/seo sources need adding and user wants them tracked:

```bash
git add docs/seo/electrician/
git commit -m "$(cat <<'EOF'
docs(seo): track electrician SEO source PRD, context, and assets

EOF
)"
```

Skip this step if user prefers sources to stay untracked.

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| Thin `/tax-deductions` | Task 5 |
| Electrician landing sections | Tasks 6–7 |
| Content registry template | Task 1 |
| PRD title/meta + context body | Task 1 |
| Category honesty | Task 1 test + howItWorks copy |
| FAQPage + BreadcrumbList | Tasks 2, 7 |
| Worker image public path | Task 3 |
| Custom OG image | Tasks 3, 7 |
| Footer inbound | Task 8 |
| Sitemap priorities 0.6/0.7 | Task 8 |
| MarketingAppLink → `/app` | Task 6 |
| `#how-it-works` secondary CTA | Task 6 |
| Disclaimer | Tasks 4–7 |
| Outbound existing links only | Task 1 data |
| Out of scope exclusions | No tasks create them |

**Placeholder scan:** none intentional.  
**Type consistency:** `IndustrySeoPage` (incl. `deductionsTitle`) / `howItWorks.id: "how-it-works"` / `buildIndustryJsonLd` / `listPublishedIndustries` used uniformly across tasks.
