# US Legal Compliance Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship US-ready legal/compliance copy — SnapTax rebrand, operator disclosure (Gang Huang, Hong Kong), canonical cookie/disclaimer docs, CPRA footer link, Paddle checklist — without a cookie wall.

**Architecture:** `docs/legal/*.md` remain canonical for full-page markdown routes; `lib/legal/locales.ts` stays the in-app Privacy/Terms summary (synced to same facts). Operator block uses first `## Operator & Contact` section (existing `parseLegalMarkdown` — no parser preamble changes). Technical `snap1099_*` cookie/IDB names unchanged.

**Tech Stack:** Next.js 16 App Router · `LegalMarkdownPage` · `LegalPageContent` · node:test · `docs/legal/` markdown

**Spec:** `docs/superpowers/specs/2026-07-08-us-legal-compliance-audit-design.md`

**Branch:** `cursor/us-legal-compliance-b9a9` off `main`

---

## File map

| File | Responsibility |
|------|----------------|
| `lib/legal/operator.ts` | `LEGAL_OPERATOR_NAME`, `LEGAL_MAILING_ADDRESS`, `LEGAL_BRAND_NAME` |
| `lib/legal/content.ts` | Re-export operator constants |
| `lib/legal/markdownDoc.ts` | Add `cookies.md`, `disclaimer.md` to union type |
| `docs/legal/*.md` | Canonical legal copy (SnapTax + operator section) |
| `docs/ops/us-compliance-checklist.md` | Paddle + manual sign-off |
| `app/(marketing)/cookies/page.tsx` | Render `cookies.md` |
| `app/(marketing)/disclaimer/page.tsx` | Render `disclaimer.md` |
| `components/legal/PoliciesHubContent.tsx` | Cookie + Disclaimer cards |
| `lib/marketing/copy.ts` | Footer Do Not Sell link |
| `app/manifest.ts` · `app/layout.tsx` | Display name SnapTax |
| `lib/legal/locales.ts` | In-app legal summaries SnapTax + operator line |
| `lib/i18n/locales/*.ts` · `lib/copy/userFacing.ts` | User-visible Snap1099 → SnapTax |

---

### Task 1: Legal operator constants

**Files:**
- Create: `lib/legal/operator.ts`
- Modify: `lib/legal/content.ts`
- Test: `lib/legal/operator.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/legal/operator.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LEGAL_BRAND_NAME,
  LEGAL_MAILING_ADDRESS,
  LEGAL_OPERATOR_NAME,
} from "./operator.ts";

describe("legal operator constants", () => {
  it("exports approved operator and brand", () => {
    assert.equal(LEGAL_OPERATOR_NAME, "Gang Huang");
    assert.equal(LEGAL_MAILING_ADDRESS, "Hong Kong");
    assert.equal(LEGAL_BRAND_NAME, "SnapTax");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- lib/legal/operator.test.ts`  
Expected: FAIL — module not found

- [ ] **Step 3: Implement constants**

```ts
// lib/legal/operator.ts
export const LEGAL_OPERATOR_NAME = "Gang Huang";
export const LEGAL_MAILING_ADDRESS = "Hong Kong";
export const LEGAL_BRAND_NAME = "SnapTax";
```

```ts
// lib/legal/content.ts — add re-exports
export {
  LEGAL_BRAND_NAME,
  LEGAL_MAILING_ADDRESS,
  LEGAL_OPERATOR_NAME,
} from "./operator";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- lib/legal/operator.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/legal/operator.ts lib/legal/operator.test.ts lib/legal/content.ts
git commit -m "feat(legal): add operator constants (Gang Huang, Hong Kong)"
```

---

### Task 2: Extend markdown loader for cookies + disclaimer

**Files:**
- Modify: `lib/legal/markdownDoc.ts`
- Modify: `lib/legal/markdownDoc.test.ts`

- [ ] **Step 1: Add files to union type**

In `lib/legal/markdownDoc.ts`, extend `LegalMarkdownFile`:

```ts
export type LegalMarkdownFile =
  | "data-retention.md"
  | "security-incident.md"
  | "pricing.md"
  | "refund.md"
  | "cookies.md"
  | "disclaimer.md";
```

- [ ] **Step 2: Add tests**

```ts
  it("loads cookies.md with essential cookies section", () => {
    const doc = parseLegalMarkdown(loadLegalMarkdown("cookies.md"));
    assert.equal(doc.title, "SnapTax Cookie Policy");
    assert.ok(doc.sections.some((s) => s.title === "Essential cookies"));
  });

  it("loads disclaimer.md", () => {
    const doc = parseLegalMarkdown(loadLegalMarkdown("disclaimer.md"));
    assert.equal(doc.title, "SnapTax Disclaimer");
    assert.ok(doc.sections.some((s) => s.title === "Tax estimates"));
  });
```

Update existing assertions:

```ts
assert.equal(doc.title, "SnapTax Refund Policy");
assert.equal(doc.title, "SnapTax Data Retention Policy");
```

- [ ] **Step 3: Create placeholder markdown** (minimal, Task 3 fills content)

Create `docs/legal/cookies.md` and `docs/legal/disclaimer.md` with `#` title + one `##` section so tests pass.

- [ ] **Step 4: Run tests**

Run: `npm run test:unit -- lib/legal/markdownDoc.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(legal): extend markdown loader for cookies and disclaimer"
```

---

### Task 3: Canonical cookies.md + disclaimer.md

**Files:**
- Create/Replace: `docs/legal/cookies.md`
- Create/Replace: `docs/legal/disclaimer.md`

- [ ] **Step 1: Write `docs/legal/cookies.md`**

```markdown
# SnapTax Cookie Policy

**Last Updated:** July 2026

## Operator & Contact

SnapTax is operated by Gang Huang, an individual sole proprietor ("we", "us", "our").

Contact: snaptax.lightxforge@gmail.com  
Mailing address: Hong Kong

## Essential cookies

We use only cookies required for the product to function at [/app](/app):

| Name | Purpose | Duration |
|------|---------|----------|
| snap1099_ghost | Anonymous Ghost session (httpOnly) | Session / persistent per server config |
| snap1099_session | Google signed-in session (httpOnly) | Session / persistent per server config |
| NEXT_LOCALE | Language preference (if set) | Per app config |

## Similar technologies

We use browser localStorage for PWA install state and preferences (for example snap1099_pwa_installed). These are not cookies but serve similar on-device storage roles.

## Analytics

We do **not** currently use analytics or advertising cookies. If we add them later, we will update this policy before enabling them.

## Related policies

- [Privacy Policy](/privacy)
- [All policies](/policies)
```

- [ ] **Step 2: Write `docs/legal/disclaimer.md`**

```markdown
# SnapTax Disclaimer

**Last Updated:** July 2026

## Operator & Contact

SnapTax is operated by Gang Huang, an individual sole proprietor ("we", "us", "our").

Contact: snaptax.lightxforge@gmail.com  
Mailing address: Hong Kong

## Not professional advice

SnapTax helps organize receipts and export reports for independent contractors and small businesses. It does not provide tax, legal, or accounting advice.

## Tax estimates

Calculations, categorizations, and "Est. Tax Saved" figures are estimates based on the information you provide and general tax rules. Always consult a qualified tax professional before filing.

## No government affiliation

SnapTax is not affiliated with the IRS or any government agency. Pricing and entitlements are described in our [Terms of Service](/terms) and [Pricing](/pricing) pages.
```

- [ ] **Step 3: Run tests**

Run: `npm run test:unit -- lib/legal/markdownDoc.test.ts`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git commit -m "docs(legal): add SnapTax cookies and disclaimer canonical copy"
```

---

### Task 4: Rebrand + patch English legal markdown

**Files:**
- Modify: `docs/legal/privacy.md`
- Modify: `docs/legal/terms.md`
- Modify: `docs/legal/refund.md`
- Modify: `docs/legal/data-retention.md`
- Modify: `docs/legal/security-incident.md`
- Modify: `docs/legal/pricing.md`

- [ ] **Step 1: Global replace in each file**

Replace all `Snap1099` → `SnapTax` in the seven files above.

- [ ] **Step 2: Add `## Operator & Contact` as first section** (after Last Updated) in every file:

```markdown
## Operator & Contact

SnapTax is operated by Gang Huang, an individual sole proprietor ("we", "us", "our").

Contact: snaptax.lightxforge@gmail.com  
Privacy requests: snaptax.lightxforge@gmail.com (subject: Privacy Request)  
Mailing address: Hong Kong

Services are offered to users in the United States. Customer data is processed and stored in the United States as described below.
```

- [ ] **Step 3: `privacy.md` specific patches**

- Rename `## 8. No Sale of Personal Information (CPRA)` → `## 8. No Sale` (anchor `#no-sale`)
- Add sentence under §2: receipt/financial data may be **sensitive personal information** under US state laws
- Expand §9 title to `## 9. Your Rights (US State Privacy & GDPR)`
- Update `Last Updated` to July 2026

- [ ] **Step 4: `terms.md` specific patches**

Add after §4 Payments:

```markdown
Payments are processed by **Paddle** as Merchant of Record. Paddle collects payment details and issues receipts.

Export Tax Pack is a **one-time purchase per tax season**. There is **no subscription** and **no automatic renewal**.
```

- [ ] **Step 5: `refund.md` specific patches**

Add new section `## US consumers` before EU section:

```markdown
## US consumers

If you have not downloaded or generated an Export Tax Pack for the purchased season, you may request a refund within **14 days** of purchase by emailing snaptax.lightxforge@gmail.com with your Paddle transaction ID.
```

- [ ] **Step 6: `security-incident.md`**

Add one sentence: We notify affected US users as required by applicable state breach notification laws.

- [ ] **Step 7: Commit**

```bash
git commit -m "docs(legal): SnapTax rebrand, operator block, US compliance patches"
```

---

### Task 5: Localized legal markdown (fr/de)

**Files:**
- Modify: `docs/legal/privacy.fr.md`, `privacy.de.md`, `terms.fr.md`, `terms.de.md`

- [ ] **Step 1:** Replace `Snap1099` → `SnapTax` in all four files
- [ ] **Step 2:** Add translated `## Operator & Contact` section (operator name **Gang Huang**, address **Hong Kong** kept in Latin script)
- [ ] **Step 3: Commit**

```bash
git commit -m "docs(legal): SnapTax rebrand + operator block in fr/de legal markdown"
```

---

### Task 6: In-app legal bundle (`lib/legal/locales.ts`)

**Files:**
- Modify: `lib/legal/locales.ts`

- [ ] **Step 1: Import operator constants**

```ts
import { LEGAL_BRAND_NAME, LEGAL_MAILING_ADDRESS, LEGAL_OPERATOR_NAME } from "./operator";
```

- [ ] **Step 2: Add operator preamble to each locale bundle**

New first privacy section for EN (mirror in FR/DE):

```ts
{
  title: "Operator & Contact",
  body: [
    `${LEGAL_BRAND_NAME} is operated by ${LEGAL_OPERATOR_NAME}, an individual sole proprietor.`,
    `Contact: ${LEGAL_CONTACT_EMAIL}. Mailing address: ${LEGAL_MAILING_ADDRESS}.`,
    "Customer data is processed and stored in the United States.",
  ],
},
```

- [ ] **Step 3: Rebrand user-visible strings**

- Terms Service body: `Snap1099` → `SnapTax`
- Rename section title `"No Sale (CPRA)"` → `"No Sale"` (footer anchor `#no-sale`)
- Expand `"Your Rights"` body to mention US state privacy rights
- `lastUpdatedLabel` → `Last Updated: July 2026 · GDPR & CPRA`

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(legal): sync in-app legal bundle to SnapTax + operator disclosure"
```

---

### Task 7: Migrate cookies + disclaimer routes

**Files:**
- Modify: `app/(marketing)/cookies/page.tsx`
- Modify: `app/(marketing)/disclaimer/page.tsx`

- [ ] **Step 1: Replace cookies page** (mirror `refund/page.tsx`):

```tsx
import { LegalMarkdownPage } from "@/components/legal/LegalMarkdownPage";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";
import { loadLegalMarkdown, parseLegalMarkdown } from "@/lib/legal/markdownDoc";

export const metadata = buildMarketingMetadata({
  title: "Cookie Policy — SnapTax",
  description: "How SnapTax uses cookies and similar technologies.",
  path: "/cookies",
});

export default function CookiesPage() {
  const doc = parseLegalMarkdown(loadLegalMarkdown("cookies.md"));
  return <LegalMarkdownPage doc={doc} embedded />;
}
```

- [ ] **Step 2: Replace disclaimer page** similarly with `disclaimer.md`

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(marketing): render cookies and disclaimer from canonical markdown"
```

---

### Task 8: Policies hub + CPRA footer link

**Files:**
- Modify: `components/legal/PoliciesHubContent.tsx`
- Modify: `lib/marketing/copy.ts`

- [ ] **Step 1: Add to `OTHER_POLICY_LINKS` in PoliciesHubContent.tsx**

```ts
{
  href: "/cookies",
  label: "Cookie Policy",
  description: "Essential cookies and local storage",
},
{
  href: "/disclaimer",
  label: "Disclaimer",
  description: "Not tax advice; estimates only",
},
```

- [ ] **Step 2: Add Do Not Sell to footer Legal column in `lib/marketing/copy.ts`**

```ts
{ href: "/privacy#no-sale", label: "Do Not Sell or Share" },
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(marketing): policies hub cookies/disclaimer + CPRA footer link"
```

---

### Task 9: App display name → SnapTax

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/(pwa)/app/layout.tsx`
- Modify: `app/manifest.ts`
- Modify: `app/manifest.test.ts`

- [ ] **Step 1: `app/layout.tsx`** — `const APP_NAME = "SnapTax";`

- [ ] **Step 2: `app/(pwa)/app/layout.tsx`** — `title: "SnapTax"`

- [ ] **Step 3: `app/manifest.ts`** — `name` and `short_name` → `"SnapTax"`

- [ ] **Step 4: Extend manifest test**

```ts
  it("uses SnapTax display name", () => {
    const data = manifest();
    assert.equal(data.name, "SnapTax");
    assert.equal(data.short_name, "SnapTax");
  });
```

- [ ] **Step 5: Run tests**

Run: `npm run test:unit -- app/manifest.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(brand): SnapTax app title and PWA manifest name"
```

---

### Task 10: i18n + userFacing SnapTax rebrand

**Files:**
- Modify: `lib/copy/userFacing.ts`
- Modify: `lib/i18n/locales/en-US.ts`
- Modify: `lib/i18n/locales/fr-FR.ts`
- Modify: `lib/i18n/locales/de-DE.ts`

**Scope rule:** Replace user-visible `Snap1099` → `SnapTax`. **Do not** rename:
- `onSnap1099` callbacks
- `snap1099_*` storage keys
- export filenames like `Snap1099-{year}-...` (optional follow-up)
- IRS form names `1099-NEC`

- [ ] **Step 1: `lib/copy/userFacing.ts`** — PWA install strings: all `Snap1099` → `SnapTax`

- [ ] **Step 2: `en-US.ts`** — replace user-visible `Snap1099` with `SnapTax` (pwa, home, settings, help, share strings)

- [ ] **Step 3: Repeat for `fr-FR.ts` and `de-DE.ts`**

- [ ] **Step 4: Verify scope**

Run: `rg 'Snap1099' lib/i18n lib/copy --glob '*.ts'`  
Expected: only form types (`1099-NEC`), technical keys, or zero matches

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(i18n): rebrand user-facing Snap1099 strings to SnapTax"
```

---

### Task 11: US compliance checklist

**Files:**
- Create: `docs/ops/us-compliance-checklist.md`

- [ ] **Step 1: Create checklist**

```markdown
# SnapTax US Compliance Checklist

**Operator:** Gang Huang · **Mailing:** Hong Kong · **Email:** snaptax.lightxforge@gmail.com  
**Last reviewed:** _date_

## Paddle vendor URLs

| Field | URL | Status |
|-------|-----|--------|
| Privacy | https://snaptax.lightxforge.com/privacy | [ ] |
| Terms | https://snaptax.lightxforge.com/terms | [ ] |
| Price | https://snaptax.lightxforge.com/pricing | [ ] |
| Refund | https://snaptax.lightxforge.com/refund | [ ] |
| Policies hub | https://snaptax.lightxforge.com/policies | [ ] |

## Copy sign-off

- [ ] Operator block on all `docs/legal/*.md`
- [ ] No Snap1099 in user-facing legal/marketing/app title
- [ ] Cookie page matches `snap1099_ghost` / `snap1099_session`
- [ ] Footer Do Not Sell → `/privacy#no-sale`
- [ ] No analytics scripts deployed
- [ ] Refund: 14-day US window documented
- [ ] Terms: Paddle MoR + no auto-renewal
```

- [ ] **Step 2: Commit**

```bash
git commit -m "docs(ops): add US compliance checklist for Paddle launch"
```

---

### Task 12: Final verification

- [ ] **Step 1: Unit tests**

Run: `npm run test:unit -- lib/legal/ app/manifest.test.ts`  
Expected: PASS (pre-existing unrelated failures OK if unchanged)

- [ ] **Step 2: Brand audit**

Run: `rg -i 'Snap1099' docs/legal app/(marketing) components/legal components/marketing app/layout.tsx app/manifest.ts lib/legal/locales.ts`  
Expected: **zero** matches (or only inside cookie name documentation in cookies.md)

- [ ] **Step 3: Dev smoke**

Run: `npm run dev` — open `/cookies`, `/disclaimer`, `/privacy#no-sale`, `/policies`

- [ ] **Step 4: Final commit + push + PR**

```bash
git push -u origin cursor/us-legal-compliance-b9a9
```

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| SnapTax rebrand | 4, 5, 6, 9, 10 |
| Gang Huang / Hong Kong | 1, 4, 5, 6, 11 |
| cookies.md + route | 2, 3, 7 |
| disclaimer.md + route | 2, 3, 7 |
| CPRA Do Not Sell link | 6, 8 |
| Policies hub | 8 |
| Refund US 14-day | 4 |
| Terms MoR / no renewal | 4, 6 |
| No analytics false claim | 3 |
| Paddle checklist | 11 |
| manifest SnapTax | 9 |

## Out of scope (per spec)

- LLC formation
- Rename `snap1099_*` technical cookies
- External counsel sign-off
- `@snaptax.com` email
