# Legal Pricing, Refund & Policies — Implementation Plan

**Design:** `docs/superpowers/specs/2026-07-04-legal-pricing-refund-policies-design.md`

## Wave 1 — Foundation

1. `lib/legal/slugifyLegalHeading.ts` + unit test
2. Extend `lib/legal/markdownDoc.ts` (`pricing.md`, `refund.md`)
3. Create `docs/legal/pricing.md`, `refund.md`
4. Update `docs/legal/terms*.md`, `data-retention.md`

## Wave 2 — Components & routes

5. Anchor `id` on `LegalMarkdownView`, `LegalPageContent`
6. `lib/legal/pricingPageData.ts` — server loader
7. `PricingPageContent`, `PoliciesHubContent`
8. `app/pricing/page.tsx`, `app/refund/page.tsx`, `app/policies/page.tsx`

## Wave 3 — Verify

9. Unit tests: slugify, markdown parse, pricingPageData tier rows
10. `npm run test:unit`
