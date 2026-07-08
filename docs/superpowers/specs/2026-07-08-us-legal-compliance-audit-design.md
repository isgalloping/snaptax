# US Legal & Compliance Audit — Design

**Date:** 2026-07-08  
**Status:** Approved (brainstorming, revised)  
**Scope:** Paddle merchant review, US launch readiness (CPRA focus), federal + major state privacy alignment, marketing-site legal self-audit  
**Approach:** **A — Document-first** (sole proprietor disclosure; LLC upgrade path documented)  
**Not legal advice:** Engineering alignment and public copy only; counsel review recommended before production reliance.

## Summary

**SnapTax** operates without a formal US LLC today. Public legal pages exist for Privacy, Terms, Refund, Data Retention, and Security, but gaps remain for **operator disclosure**, **cookie transparency**, **brand consistency** (legacy **Snap1099** strings), **CPRA footer links**, and **Paddle discoverability**. This design hardens `docs/legal/` as canonical copy, migrates thin marketing-only pages to the same pattern, and adds a pre-launch checklist — without a cookie wall (per product rules).

## Goals (all confirmed)

| Goal | Success criteria |
|------|------------------|
| **A. Paddle audit** | `/privacy`, `/terms`, `/pricing`, `/refund`, `/policies` complete; Cookie + Disclaimer linked from hub/footer |
| **B. US launch (CPRA)** | Operator disclosure, Notice at Collection, Do Not Sell link, DSR contact path |
| **C. Federal + major state privacy** | Privacy §9 covers US state rights generically; no sale/share; sensitive financial data noted |
| **D. Marketing-site self-audit** | **SnapTax** only in user-facing copy; cookie list matches implementation; no false analytics claims |

## Locked decisions

| Topic | Choice |
|-------|--------|
| **Public brand** | **SnapTax** everywhere user-facing (legal, marketing, app title, PWA `name` / `short_name`) |
| **Legacy Snap1099** | Remove from public/legal/marketing copy; technical identifiers (`snap1099_*` cookies, DB stores) unchanged in v1 to avoid breaking changes |
| Legal structure (now) | **Sole proprietor** — **Gang Huang** |
| Operator name | **Gang Huang** |
| Mailing address | **Hong Kong** |
| Contact email | `snaptax.lightxforge@gmail.com` (`LEGAL_CONTACT_EMAIL`) |
| Cookie UI | **No cookie wall** (PRODUCT-SPEC / compliance rule) |
| Analytics | **None deployed** — remove speculative “may use analytics” until GA/PostHog ships |
| Paddle | **Merchant of Record** — disclosed in Terms + Refund |
| LLC | **Upgrade path** documented; not in scope for this phase |
| i18n | English canonical for new `cookies.md` / `disclaimer.md`; fr/de privacy/terms rebranded to SnapTax in same pass |

### Constants (single source for implementation)

Add to `lib/legal/content.ts` (or `lib/legal/operator.ts`):

```ts
export const LEGAL_OPERATOR_NAME = "Gang Huang";
export const LEGAL_MAILING_ADDRESS = "Hong Kong";
export const LEGAL_BRAND_NAME = "SnapTax";
```

## Operator disclosure block (all legal docs)

Insert after title / Last Updated on every public legal document:

```markdown
**Operator:** SnapTax is operated by Gang Huang,
an individual sole proprietor ("we", "us", "our").

**Contact:** snaptax.lightxforge@gmail.com  
**Privacy requests:** snaptax.lightxforge@gmail.com (subject: Privacy Request)  
**Mailing address:** Hong Kong
```

**Note:** Services are offered to users in the United States; customer data is processed and stored in the United States as described in the Privacy Policy. Operator mailing address is in Hong Kong.

When a US LLC is formed, replace the Operator block with entity name + registered agent address in one pass.

---

## Gap analysis (current → target)

| Area | Current | Gap | Action |
|------|---------|-----|--------|
| Operator identity | Email only | FTC / CPRA need identifiable controller | Operator block (Gang Huang, Hong Kong) |
| Brand | Snap1099 vs SnapTax mixed | Legal ambiguity | **SnapTax** only in all public copy |
| Cookie policy | Hardcoded `cookies/page.tsx` | Not canonical; no cookie table | New `docs/legal/cookies.md` + `LegalMarkdownPage` |
| Disclaimer | Hardcoded `disclaimer/page.tsx` | Not in `docs/legal/` | New `docs/legal/disclaimer.md` |
| CPRA Do Not Sell | Privacy §8 text only | CA practice: conspicuous link | Footer + `/privacy#no-sale` anchor |
| Refund (US) | Paddle-generic | Unclear US window | 14-day / undownloaded export rule in `refund.md` |
| Terms | Basic | MoR, no auto-renewal not explicit | Add § snippets |
| Policies hub | No Cookie/Disclaimer | Discoverability | Add cards + cross-links |
| Analytics claim | Cookie page mentions EU analytics | Misleading (not deployed) | Remove until implemented |

---

## Brand unification rules

| Surface | Before | After |
|---------|--------|-------|
| Legal markdown (`docs/legal/*.md`) | Snap1099 | **SnapTax** |
| Marketing site copy / metadata | Mixed | **SnapTax** |
| App `metadata.title`, manifest `name` | Snap1099 | **SnapTax** |
| i18n legal bundles (`lib/legal/locales.ts`) | Snap1099 | **SnapTax** |
| In-app strings (`USER_COPY`, settings) | Snap1099 where user-visible | **SnapTax** |
| Cookie / IDB / API prefixes (`snap1099_*`) | — | **Keep** (technical; disclose real names in cookies.md) |
| Repo / package name `snaptax` | — | Unchanged |

**Acceptance:** `rg -i 'snap1099' docs/legal app/(marketing) components/legal components/marketing` returns **zero** user-facing matches after implementation (exclude changelog/historical docs).

---

## Document inventory

### Modify (canonical markdown)

| File | Changes |
|------|---------|
| `docs/legal/privacy.md` | SnapTax rebrand; Operator block; `#no-sale` anchor; sensitive PI; US State Privacy Rights; `Last Updated` |
| `docs/legal/terms.md` | SnapTax rebrand; Operator block; Paddle MoR; no auto-renewal |
| `docs/legal/refund.md` | SnapTax rebrand; Operator block; US refund window |
| `docs/legal/data-retention.md` | SnapTax rebrand; Operator block |
| `docs/legal/security-incident.md` | SnapTax rebrand; Operator block; US breach notification summary |
| `docs/legal/pricing.md` | SnapTax rebrand; Operator line |
| `docs/legal/privacy.fr.md` · `terms.fr.md` · `privacy.de.md` · `terms.de.md` | SnapTax rebrand + Operator block (translated address line) |

### Create

| File | Purpose |
|------|---------|
| `docs/legal/cookies.md` | SnapTax; essential cookies table; localStorage note; no analytics |
| `docs/legal/disclaimer.md` | SnapTax; tax / Est. Tax Saved / non-IRS disclaimer |

### App routes & UI

| Route / file | Change |
|--------------|--------|
| `app/(marketing)/cookies/page.tsx` | `LegalMarkdownPage` + `cookies.md` |
| `app/(marketing)/disclaimer/page.tsx` | `LegalMarkdownPage` + `disclaimer.md` |
| `app/manifest.ts` | `name` / `short_name` → SnapTax |
| `app/layout.tsx` | `APP_NAME` → SnapTax |
| `components/legal/PoliciesHubContent.tsx` | Cookie + Disclaimer cards; SnapTax copy |
| `components/marketing/MarketingFooter.tsx` | Do Not Sell link → `/privacy#no-sale` |
| `lib/legal/locales.ts` | SnapTax + operator constants where needed |

### Ops

| File | Purpose |
|------|---------|
| `docs/ops/us-compliance-checklist.md` | Paddle URLs + sign-off; operator Gang Huang / Hong Kong recorded |

---

## Cookie inventory (must match implementation)

| Name | Type | Purpose | Duration |
|------|------|---------|----------|
| `snap1099_ghost` | HTTP (httpOnly) | Anonymous Ghost session | Session / persistent per server config |
| `snap1099_session` | HTTP (httpOnly) | Google signed-in session | Session / persistent per server config |
| `NEXT_LOCALE` | HTTP (if set) | Locale preference | Per Next.js / app config |

**localStorage (cookies.md §Similar technologies):** `snap1099_pwa_installed`, install dismiss keys, Ghost-related flags.

**Third parties:** Google OAuth, Paddle (checkout), OpenAI (server-side only).

---

## US compliance matrix

| Requirement | Status after implementation | Notes |
|-------------|----------------------------|-------|
| Paddle Privacy URL | ✅ `/privacy` | |
| Paddle Terms URL | ✅ `/terms` | |
| Paddle Price URL | ✅ `/pricing` | |
| Paddle Refund URL | ✅ `/refund` | |
| Paddle Policies hub | ✅ `/policies` | + cookie/disclaimer |
| CPRA Notice at Collection | ✅ Privacy §8 table | |
| CPRA Do Not Sell / Share | ✅ Link + §8 | No sale |
| Operator disclosure | ✅ Gang Huang, Hong Kong | Email + mailing address |
| COPPA under 13 | ✅ Privacy §11 | |
| FTC tax disclaimers | ✅ disclaimer.md + Terms | |
| CA auto-renewal | ✅ Terms — one-time season | |

---

## Implementation phases

### Phase L0 — Blockers ✅ Resolved

1. ~~Operator name~~ → **Gang Huang**
2. ~~Mailing address~~ → **Hong Kong**

### Phase L1 — Canonical docs (P0)

1. Create `cookies.md`, `disclaimer.md`
2. Patch all `docs/legal/*.md` — SnapTax rebrand + Operator block
3. Add `docs/ops/us-compliance-checklist.md`
4. Add `LEGAL_OPERATOR_NAME` / `LEGAL_MAILING_ADDRESS` constants

### Phase L2 — Routes & UI (P0)

1. Migrate cookies + disclaimer pages to `LegalMarkdownPage`
2. Policies hub + footer (Do Not Sell)
3. Manifest + root layout app name → SnapTax
4. Privacy §8 slug `no-sale` for anchor links

### Phase L3 — Verification (P0)

1. `rg` audit: no Snap1099 in user-facing legal/marketing/app title paths
2. Paddle URL smoke on production domain
3. No analytics scripts deployed

### Phase L4 — Out of scope

- LLC formation
- `@snaptax.com` email
- Rename `snap1099_*` technical cookies (breaking)
- External counsel sign-off

---

## Testing & acceptance

- [ ] All Paddle URLs return 200 on `https://snaptax.lightxforge.com`
- [ ] Every `docs/legal/*.md` has Operator block (Gang Huang, Hong Kong)
- [ ] No **Snap1099** in public legal/marketing/app display name
- [ ] Cookie page matches real cookie names
- [ ] Footer “Do Not Sell or Share” → `/privacy#no-sale`
- [ ] Refund: 14-day / undownloaded export policy stated
- [ ] Terms: Paddle MoR, no auto-renewal

---

## LLC upgrade path

When a US LLC is registered: replace Operator block, update Paddle vendor profile, re-run checklist.

---

## References

- `docs/legal/privacy.md` · `terms.md` · `refund.md`
- `docs/superpowers/specs/2026-06-05-compliance-privacy-design.md`
- `docs/superpowers/specs/2026-07-04-legal-pricing-refund-policies-design.md`
- `docs/ops/dsr-playbook.md`

## Changelog

| Date | Change |
|------|--------|
| 2026-07-08 | Initial design approved; Approach A |
| 2026-07-08 | Rebrand: Snap1099 → SnapTax (user-facing); operator **Gang Huang**; mailing **Hong Kong**; L0 blockers resolved |
