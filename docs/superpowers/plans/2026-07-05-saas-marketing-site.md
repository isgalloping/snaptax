# SaaS Marketing Site + `/app` PWA Split — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split public marketing site (`/`) from PWA product (`/app`), ship UI v0.2 Home + Paddle-ready pricing, and preserve existing Snap1099 capture/export flows.

**Architecture:** Next.js App Router route groups — `(marketing)` for SSR public pages with green/yellow marketing layout; `(pwa)/app` for existing `StartupShell` + `HomeScreen`. Manifest scope moves to `/app`. Pricing copy uses per-tax-season model via existing `loadPricingPageLiveData()`.

**Tech Stack:** Next.js 16 · React 19 · Tailwind 4 · Serwist PWA · existing legal markdown · node:test

**Spec:** [`docs/superpowers/specs/2026-07-05-saas-marketing-site-design.md`](../specs/2026-07-05-saas-marketing-site-design.md)

**Suggested branch:** `0.5.0.saas-site`

---

## File map

| File | Action |
|------|--------|
| `app/(marketing)/layout.tsx` | **Create** — marketing shell, tokens, header/footer slots |
| `app/(marketing)/page.tsx` | **Create** — Home (M0 minimal → M1 full) |
| `app/(marketing)/contact/page.tsx` | **Create** — M1 |
| `app/(marketing)/features/page.tsx` | **Create** — M2 |
| `app/(marketing)/faq/page.tsx` | **Create** — M2 |
| `app/(marketing)/blog/page.tsx` | **Create** — M2 |
| `app/(marketing)/blog/[slug]/page.tsx` | **Create** — M2 |
| `app/(marketing)/pricing/page.tsx` | **Move** from `app/pricing/page.tsx` |
| `app/(marketing)/privacy/page.tsx` | **Move** from `app/privacy/page.tsx` |
| `app/(marketing)/terms/page.tsx` | **Move** from `app/terms/page.tsx` |
| `app/(marketing)/refund/page.tsx` | **Move** from `app/refund/page.tsx` |
| `app/(marketing)/policies/page.tsx` | **Move** from `app/policies/page.tsx` |
| `app/(marketing)/security/page.tsx` | **Move** from `app/security/page.tsx` |
| `app/(marketing)/data-retention/page.tsx` | **Move** from `app/data-retention/page.tsx` |
| `app/(marketing)/help/page.tsx` | **Move** from `app/help/page.tsx` |
| `app/(marketing)/disclaimer/page.tsx` | **Create** — M2 |
| `app/(marketing)/cookies/page.tsx` | **Create** — M2 |
| `app/(pwa)/app/layout.tsx` | **Create** — PwaProvider + InstallCaptureScript + black theme |
| `app/(pwa)/app/page.tsx` | **Create** — move current `app/page.tsx` body |
| `app/page.tsx` | **Delete** — replaced by `(marketing)/page.tsx` |
| `app/layout.tsx` | **Modify** — strip PwaProvider; fonts + I18n only |
| `app/manifest.ts` | **Modify** — `start_url` + `scope` → `/app` |
| `app/sitemap.ts` | **Modify** — add marketing paths |
| `app/offline/page.tsx` | **Modify** — CTA → `/app` |
| `lib/marketing/tokens.ts` | **Create** — colors, copy constants |
| `lib/marketing/copy.ts` | **Create** — Hero, FAQ, features (season pricing wording) |
| `lib/marketing/metadata.ts` | **Create** — titles, OG helpers |
| `lib/marketing/pricingPreview.ts` | **Create** — wrap `loadPricingPageLiveData` for Home |
| `lib/marketing/pricingPreview.test.ts` | **Create** |
| `lib/legal/pricingPageData.ts` | **Modify** — fix “Locked for life” → season tier lock |
| `components/marketing/MarketingHeader.tsx` | **Create** |
| `components/marketing/MarketingFooter.tsx` | **Create** |
| `components/marketing/MarketingHero.tsx` | **Create** |
| `components/marketing/MarketingSteps.tsx` | **Create** |
| `components/marketing/MarketingFeatureGrid.tsx` | **Create** |
| `components/marketing/MarketingPricingPreview.tsx` | **Create** |
| `components/marketing/MarketingFaqPreview.tsx` | **Create** |
| `components/marketing/MarketingPricingPage.tsx` | **Create** — wraps existing `PricingPageContent` |
| `components/marketing/JsonLd.tsx` | **Create** — M2 schema |
| `components/legal/LegalFullPageShell.tsx` | **Modify** — close → `/` not PWA |
| `components/help/HelpPageContent.tsx` | **Modify** — back → `/` |
| `content/blog/*.md` | **Create** — 3 launch posts M2 |
| `public/marketing/hero-phone.webp` | **Create** — static mock asset (export from UI or placeholder) |

---

## Task 1: Marketing tokens + copy (TDD for pricing helper)

**Files:**
- Create: `lib/marketing/tokens.ts`
- Create: `lib/marketing/copy.ts`
- Create: `lib/marketing/pricingPreview.test.ts`
- Create: `lib/marketing/pricingPreview.ts`
- Modify: `lib/legal/pricingPageData.ts`

- [ ] **Step 1: Write failing test for season-safe founder note**

```typescript
// lib/marketing/pricingPreview.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFounderRows } from "@/lib/legal/pricingPageData";

describe("buildFounderRows", () => {
  it("does not promise lifetime all-years access", () => {
    const rows = buildFounderRows({
      FOUNDER_LEVEL_SUPER: { seatRange: [1, 10], priceUsd: 5, paddlePriceId: "p1" },
      EARLY: { seatRange: [11, 30], priceUsd: 10, paddlePriceId: "p2" },
      FOUNDER: { seatRange: [31, 50], priceUsd: 15, paddlePriceId: "p3" },
      DEFAULT: { seatRange: null, priceUsd: 29, paddlePriceId: "p4" },
    });
    for (const row of rows) {
      assert.doesNotMatch(row.note.toLowerCase(), /lifetime/);
      assert.doesNotMatch(row.note.toLowerCase(), /for life/);
    }
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm run test:unit -- lib/marketing/pricingPreview.test.ts`

- [ ] **Step 3: Fix founder row notes in `pricingPageData.ts`**

Replace note strings:

```typescript
const note =
  tier === "DEFAULT"
    ? "After Founder Program seats are filled or status lapses"
    : "Locks this tier price for future tax seasons while Founder status stays active";
```

- [ ] **Step 4: Add `lib/marketing/copy.ts` season pricing strings**

```typescript
export const MARKETING_COPY = {
  brand: "SnapTax",
  hero: {
    pill: "Built for 1099 Contractors & Small Businesses",
    title: "Keep more of what you earn.",
    subtitle:
      "SnapTax makes it easy to track expenses, organize receipts, and create tax-ready reports in minutes.",
    primaryCta: "Get Started",
    secondaryCta: "View Pricing",
  },
  pricing: {
    sectionTitle: "Simple Season Pricing",
    perSeason: "/ tax season",
    footer:
      "One-time payment per tax season · Secure checkout powered by Paddle · Taxes may apply at checkout",
  },
} as const;
```

- [ ] **Step 5: Re-run test — expect PASS**

Run: `npm run test:unit -- lib/marketing/pricingPreview.test.ts`

- [ ] **Step 6: Commit**

```bash
git add lib/marketing lib/legal/pricingPageData.ts
git commit -m "feat(marketing): add copy tokens and fix founder pricing notes"
```

---

## Task 2: Route split — PWA to `/app` (M0)

**Files:**
- Create: `app/(pwa)/app/layout.tsx`
- Create: `app/(pwa)/app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/manifest.ts`
- Modify: `app/offline/page.tsx`
- Delete: `app/page.tsx` (after marketing page exists in Task 3)

- [ ] **Step 1: Create PWA layout**

```tsx
// app/(pwa)/app/layout.tsx
import { InstallCaptureScript } from "@/components/pwa/InstallCaptureScript";
import { PwaProvider } from "@/components/pwa/PwaProvider";

export const metadata = {
  title: "Snap1099",
};

export default function PwaAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PwaProvider>
      <InstallCaptureScript />
      <div className="flex h-full min-h-0 flex-1 flex-col bg-black">{children}</div>
    </PwaProvider>
  );
}
```

- [ ] **Step 2: Move current home PWA to `/app`**

Copy entire contents of current `app/page.tsx` into `app/(pwa)/app/page.tsx` unchanged.

- [ ] **Step 3: Slim root layout — remove PwaProvider**

```tsx
// app/layout.tsx — body children only I18nProvider, NO PwaProvider/InstallCaptureScript
<I18nProvider>{children}</I18nProvider>
```

- [ ] **Step 4: Update manifest**

```typescript
// app/manifest.ts
start_url: "/app",
scope: "/app",
id: "/app",
related_applications: [{ platform: "webapp", url: "/manifest.webmanifest", id: "/app" }],
```

- [ ] **Step 5: Update offline fallback link**

```tsx
// app/offline/page.tsx — href="/app"
```

- [ ] **Step 6: Manual smoke**

Run: `npm run dev`
- `http://localhost:3000/app` → PWA home (Snap button visible after landing exit)
- Confirm manifest at `/manifest.webmanifest` shows `start_url: "/app"`

- [ ] **Step 7: Commit**

```bash
git add app/(pwa) app/layout.tsx app/manifest.ts app/offline/page.tsx
git commit -m "feat(pwa): move product shell to /app route"
```

---

## Task 3: Marketing layout + M0 Home (Paddle unblock)

**Files:**
- Create: `app/(marketing)/layout.tsx`
- Create: `app/(marketing)/page.tsx`
- Create: `components/marketing/MarketingHeader.tsx`
- Create: `components/marketing/MarketingFooter.tsx`
- Create: `components/marketing/MarketingHero.tsx` (minimal M0)
- Delete: `app/page.tsx`

- [ ] **Step 1: Marketing layout**

```tsx
// app/(marketing)/layout.tsx
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#0B0F0E] text-white">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
```

- [ ] **Step 2: Header with CTAs**

```tsx
// components/marketing/MarketingHeader.tsx
const NAV = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];
// Sign In → /app , Get Started → /app (Link from next/link)
```

- [ ] **Step 3: Footer with Paddle-required legal links**

Columns: Product (Features, Pricing, FAQ) · Company (Contact) · Legal (Privacy, Terms, Refund, Cookies) · Support (Security, Help)

- [ ] **Step 4: M0 Home page**

```tsx
// app/(marketing)/page.tsx
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

export const metadata = buildMarketingMetadata({
  title: "SnapTax — Expense Tracking for 1099 Contractors",
  description:
    "Simple expense tracking and tax preparation for independent contractors. Pay once per tax season.",
  path: "/",
});

export default function MarketingHomePage() {
  return <MarketingHero variant="minimal" />;
}
```

- [ ] **Step 5: Minimal hero**

Hero includes: pill, h1, subtitle, checklist (4 bullets), primary CTA `/app`, secondary `/pricing`, one-line Paddle trust strip.

- [ ] **Step 6: Remove old `app/page.tsx`**

- [ ] **Step 7: Manual smoke**

- `/` → marketing page (not black PWA overlay)
- `/app` → product unchanged
- Header/footer links resolve (404 OK for not-yet-built pages)

- [ ] **Step 8: Commit**

```bash
git add app/(marketing) components/marketing lib/marketing
git commit -m "feat(marketing): add public home and marketing layout (M0)"
```

---

## Task 4: Move legal routes under `(marketing)`

**Files:**
- Move: `app/pricing` → `app/(marketing)/pricing`
- Move: `app/privacy`, `terms`, `refund`, `policies`, `security`, `data-retention`, `help` → under `(marketing)/`

- [ ] **Step 1: Move directories** (git mv)

```bash
git mv app/pricing app/(marketing)/pricing
git mv app/privacy app/(marketing)/privacy
git mv app/terms app/(marketing)/terms
git mv app/refund app/(marketing)/refund
git mv app/policies app/(marketing)/policies
git mv app/security app/(marketing)/security
git mv app/data-retention app/(marketing)/data-retention
git mv app/help app/(marketing)/help
```

- [ ] **Step 2: Wrap legal pages — remove duplicate black shell where redundant**

For pages using `LegalFullPageShell`, optionally switch to prose inside marketing layout OR keep full-page black legal reader with marketing footer hidden — **prefer**: keep `LegalMarkdownPage` body only inside `(marketing)` layout (drop duplicate black header; use marketing header + markdown content).

- [ ] **Step 3: Update `LegalFullPageShell` default close**

```typescript
router.push("/"); // marketing home, not PWA
```

- [ ] **Step 4: Run unit tests + dev smoke on `/pricing`, `/privacy`**

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor(marketing): colocate public legal routes under marketing layout"
```

---

## Task 5: Pricing page — Paddle audit shell (M1)

**Files:**
- Create: `components/marketing/MarketingPricingPage.tsx`
- Modify: `app/(marketing)/pricing/page.tsx`
- Modify: `components/legal/PricingPageContent.tsx` (optional: accept `showMarketingChrome` prop)

- [ ] **Step 1: Enhance pricing page metadata**

```typescript
export const metadata = buildMarketingMetadata({
  title: "Pricing — SnapTax",
  description:
    "One-time payment per tax season. No monthly subscription. Founder tiers from $5–$29.",
  path: "/pricing",
});
```

- [ ] **Step 2: Server component loads live data**

```tsx
export default async function PricingPage() {
  const live = await loadPricingPageLiveData().catch(() => null);
  const doc = parseLegalMarkdown(loadLegalMarkdown("pricing.md"));
  return <MarketingPricingPage doc={doc} live={live} />;
}
```

- [ ] **Step 3: Marketing wrapper adds**

- H1: Simple Pricing. No Subscription. Pay Once Per Season.
- Live founder table from `live.founderRows` with `/ tax season` suffix
- Included features bullet list (from PRD §4)
- Payment methods row (Visa, MC, Amex icons as text/svg)
- Paddle + taxes disclaimer (from `MARKETING_COPY.pricing.footer`)

- [ ] **Step 4: Verify live API failure fallback**

When `loadPricingPageLiveData` throws, page still renders static markdown + “open app for current price” note.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(marketing): Paddle-ready pricing page with live founder tiers"
```

---

## Task 6: Full Home UI v0.2 sections (M1)

**Files:**
- Create: `components/marketing/MarketingSteps.tsx`
- Create: `components/marketing/MarketingFeatureGrid.tsx`
- Create: `components/marketing/MarketingPricingPreview.tsx`
- Create: `components/marketing/MarketingFaqPreview.tsx`
- Modify: `app/(marketing)/page.tsx`

- [ ] **Step 1: Compose full home**

```tsx
export default async function MarketingHomePage() {
  const pricing = await loadPricingPageLiveData().catch(() => null);
  return (
    <>
      <MarketingHero variant="full" />
      <MarketingSteps />
      <MarketingFeatureGrid />
      <MarketingPricingPreview live={pricing} />
      <MarketingFaqPreview />
    </>
  );
}
```

- [ ] **Step 2: Feature grid** — 6 tiles per UI v0.2; Mileage tile shows “Coming soon” badge

- [ ] **Step 3: FAQ preview** — 6 accordions; link to `/faq`

- [ ] **Step 4: Add hero phone mock**

Place `public/marketing/hero-phone.webp`; `next/image` with priority on hero.

- [ ] **Step 5: Visual QA against `docs/ui/website-ui.0.2.png`**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(marketing): full home sections per UI v0.2"
```

---

## Task 7: Contact page (M1 Must)

**Files:**
- Create: `app/(marketing)/contact/page.tsx`
- Create: `components/marketing/ContactForm.tsx`

- [ ] **Step 1: Static contact page**

Display:
- Email: `snaptax.lightxforge@gmail.com` (from PRODUCT-SPEC)
- Hours: Mon–Fri 9:00–17:00 UTC
- Response: within one business day

- [ ] **Step 2: Optional mailto form (v1)**

Simple form: name, email, message → `mailto:` link client-side (no backend v1) OR POST to future API — **use mailto for M1**.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(marketing): add contact page for Paddle review"
```

---

## Task 8: SEO — sitemap, metadata, JSON-LD (M2)

**Files:**
- Modify: `app/sitemap.ts`
- Create: `lib/marketing/metadata.ts`
- Create: `components/marketing/JsonLd.tsx`
- Modify: marketing pages metadata

- [ ] **Step 1: Extend sitemap paths**

```typescript
const PUBLIC_PATHS = [
  "/",
  "/pricing",
  "/features",
  "/faq",
  "/contact",
  "/blog",
  "/privacy",
  "/terms",
  "/refund",
  "/policies",
  "/security",
  "/data-retention",
  "/help",
  "/disclaimer",
  "/cookies",
] as const;
```

- [ ] **Step 2: `buildMarketingMetadata` helper** — title, description, openGraph, canonical via `getPublicSiteUrl()`

- [ ] **Step 3: Home JSON-LD**

```tsx
<JsonLd data={{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SnapTax",
  applicationCategory: "FinanceApplication",
  offers: { "@type": "Offer", priceCurrency: "USD", description: "Per tax season export pack" },
}} />
```

- [ ] **Step 4: Set `NEXT_PUBLIC_APP_URL=https://snaptax.lightxforge.com` in production**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(seo): marketing metadata, sitemap, and JSON-LD"
```

---

## Task 9: Features, FAQ, Blog, Cookie, Disclaimer (M2)

**Files:**
- Create: `app/(marketing)/features/page.tsx`
- Create: `app/(marketing)/faq/page.tsx`
- Create: `app/(marketing)/blog/page.tsx`
- Create: `app/(marketing)/blog/[slug]/page.tsx`
- Create: `app/(marketing)/cookies/page.tsx`
- Create: `app/(marketing)/disclaimer/page.tsx`
- Create: `content/blog/*.md` (3 posts)
- Create: `lib/marketing/blog.ts` — load markdown slugs

- [ ] **Step 1: Features page** — expand PRD §5 sections (6 feature blocks)

- [ ] **Step 2: FAQ page** — full accordion list from PRD §6

- [ ] **Step 3: Blog index + 3 posts**

Slugs:
- `best-tax-deductions-for-plumbers`
- `1099-contractor-tax-guide`
- `how-to-organize-receipts`

- [ ] **Step 4: Cookie + Disclaimer markdown pages** (short legal copy; link from footer)

- [ ] **Step 5: Add blog URLs to sitemap dynamically**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(marketing): features, faq, blog, cookie and disclaimer pages"
```

---

## Task 10: Regression + verification

**Files:**
- Modify: any remaining `href="/"` that should open PWA → `/app` inside product components only

- [ ] **Step 1: Grep and fix app-internal links**

```bash
rg 'href="/"' components/home components/export components/settings
# Update "return to app" links to /app where appropriate
```

- [ ] **Step 2: Run unit tests**

Run: `npm run test:unit`

- [ ] **Step 3: Run lint**

Run: `npm run lint`

- [ ] **Step 4: Manual Paddle checklist**

- [ ] `/` loads without login
- [ ] `/pricing` shows tiers + per-season wording + Paddle disclaimer
- [ ] Footer: Privacy, Terms, Refund, Contact
- [ ] `/app` capture + export still works
- [ ] Installed PWA opens `/app`

- [ ] **Step 5: Commit any link fixes**

```bash
git commit -m "fix: align post-migration routes and PWA entry links"
```

---

## Spec coverage self-review

| Spec section | Task |
|--------------|------|
| Route split `/` vs `/app` | Task 2, 3 |
| Per-season pricing copy | Task 1, 5 |
| UI v0.2 Home sections | Task 6 |
| Pricing Paddle audit | Task 5 |
| Contact Must | Task 7 |
| Legal under marketing footer | Task 4 |
| SEO sitemap/metadata/schema | Task 8 |
| Features/FAQ/Blog M2 | Task 9 |
| Manifest scope | Task 2 |
| Out of scope (embedded Paddle, lifetime SKU) | Not planned |

---

## Execution handoff

Plan saved to `docs/superpowers/plans/2026-07-05-saas-marketing-site.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — one subagent per task, review between tasks  
2. **Inline Execution** — implement Tasks 1→10 in this session with checkpoints after M0/M1

Which approach?
