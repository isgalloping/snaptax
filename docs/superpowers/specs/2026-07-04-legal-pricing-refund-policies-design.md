# Legal Pricing, Refund & Policies Hub — Design

**Date:** 2026-07-04  
**Status:** Approved (implemented 2026-07-04)  
**References:** `docs/legal/terms.md` · `docs/product/PRODUCT-SPEC.md` §2.3 · `docs/superpowers/topics/founder-program-widget-design.md` · Paddle vendor URL requirements  
**Scope:** Public routes for Paddle/compliance URLs only — no Paywall or checkout flow changes.

## Summary

Snap1099 lacks standalone URLs for **Price**, **Refund policy**, and **Terms and policies** (Paddle vendor form fields). Today those topics are partially covered inside `/terms` §4 or only in-app. This design adds three public pages on `https://snaptax.lightxforge.com` while keeping `docs/legal/` as canonical copy and reusing existing legal page visuals.

## Problem

| Paddle / compliance field | Current URL | Gap |
|---------------------------|-------------|-----|
| Privacy policy | `/privacy` | OK |
| Terms of service | `/terms` | OK |
| Price | — | No route; price is Flag-driven in app |
| Terms and policies | — | No hub page; phrase not used in app |
| Refund policy (often required) | — | One sentence in Terms §4 only |

## Approaches considered

| # | Approach | Pros | Cons |
|---|----------|------|------|
| **A (recommended)** | `/pricing` + `/refund` + `/policies` hub | Maps 1:1 to Paddle fields; stable URLs; minimal overlap via cross-links | Three new routes |
| B | `/legal` single hub + anchors only | One URL to maintain | Paddle wants separate Price URL; long page |
| C | `/pricing` embeds refund; no `/refund` | Fewer pages | Refund policy URL still missing for Paddle |

**Recommendation:** **Approach A** — three focused pages, same pattern as `/data-retention` and `/security`.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Canonical copy | New markdown in `docs/legal/`: `pricing.md`, `refund.md`, `policies.md` |
| Page shell | Reuse `LegalMarkdownView` for `/refund`; hybrid for `/pricing`; custom hub for `/policies` |
| Live prices on `/pricing` | Server-rendered from existing `getSeasonOffer()` + `resolveFounderProgramConfig()` — **no new API** |
| Hardcode $49 | **No** — display Flag-driven USD; Terms §4 already says “unless otherwise shown in the App” |
| i18n (MVP) | **English-only** new pages (match `data-retention.md` / `security-incident.md` pattern) |
| App Settings | **No new rows** in Privacy & Data (avoid IA creep); hub discoverable via `/policies` and cross-links |
| Delete Account | Refund policy states **no automatic Paddle refund** on delete（见 [`topics/delete-account-design.md`](../topics/delete-account-design.md) §5 Out of scope） |
| Section anchors | Add `id` slugs on all legal `h2` sections (`LegalMarkdownView`, `LegalPageContent`) for deep links |

## Public URL map (production)

Base: `https://snaptax.lightxforge.com`

| Purpose | URL |
|---------|-----|
| **Price** | `https://snaptax.lightxforge.com/pricing` |
| **Refund policy** | `https://snaptax.lightxforge.com/refund` |
| **Terms and policies** (hub) | `https://snaptax.lightxforge.com/policies` |
| Terms of service | `https://snaptax.lightxforge.com/terms` |
| Privacy policy | `https://snaptax.lightxforge.com/privacy` |
| Data retention | `https://snaptax.lightxforge.com/data-retention` |
| Security | `https://snaptax.lightxforge.com/security` |

---

## Page 1: `/pricing`

### Purpose

Satisfy Paddle **Price URL**; explain one-time **per tax season** Export Tax Pack pricing without requiring login.

### Layout

Same black/yellow legal shell as `/data-retention`:

1. **Header** — title `Pricing` · Last Updated · Back to Snap1099  
2. **Live price block** (server component, above markdown body)  
3. **Markdown body** from `docs/legal/pricing.md`

### Live price block (dynamic)

Fetch on server (no client waterfall):

```ts
const offer = await getSeasonOffer(); // guest = global seat count
const config = await resolveFounderProgramConfig();
```

Display:

| Element | Rule |
|---------|------|
| **Current season** | `offer.taxSeason` (e.g. `2026`) |
| **Your price today** | `formatCurrency(offer.priceUsd)` — label: “Export Tax Pack · {season}” |
| **Billing model** | One-time per tax season; unlimited re-export that season after purchase |
| **Founder tiers table** | Show only if `config.enabled && claimedCount < 50` (from `getFounderProgramState()`) |

Founder table columns: Tier name · Seat range · Price (USD) · Notes (“Locked for life while subscription stays active” — short, no marketing fluff).

If Flags/API fail: show markdown static fallback sentence (“Open the app for current pricing”) — page still renders.

### `docs/legal/pricing.md` content (canonical)

Sections:

1. **What you pay for** — Export Tax Pack (PDF, TXF, CSV, CPA ZIP per current export spec); not a subscription to receipt capture  
2. **How pricing works** — One-time Paddle checkout per tax season; price may vary by Founder tier or promotions  
3. **Founder Program (summary)** — First 50 seats may lock lower season price; details in app; link to `/terms` §4  
4. **Taxes** — Paddle may add VAT/sales tax where required  
5. **Related policies** — Links: `/refund`, `/terms`, `/privacy`

Do **not** duplicate full Founder marketing copy from `marketing-0.0.1.md`.

### Metadata

`title: "Pricing · Snap1099"`

---

## Page 2: `/refund`

### Purpose

Standalone **Refund policy URL** for Paddle; expand Terms §4 one-liner into actionable policy.

### Implementation

- `app/refund/page.tsx` → `LegalMarkdownView` + `loadLegalMarkdown("refund.md")`  
- Extend `LegalMarkdownFile` union in `lib/legal/markdownDoc.ts`

### `docs/legal/refund.md` content (canonical)

Sections:

1. **Overview** — Export Tax Pack is a digital good per tax season; processed by **Paddle** (Merchant of Record)  
2. **Standard refunds** — Refunds follow [Paddle consumer terms](https://www.paddle.com/legal/invoiced-consumer-terms) and applicable law  
3. **EU / UK consumers** — 14-day withdrawal right for digital content **where applicable**; acknowledge that starting export/download may affect withdrawal (standard digital-goods wording — legal review recommended before publish)  
4. **What we do not refund automatically** — Delete Account does not trigger Paddle refund; mistaken duplicate purchase → contact support  
5. **How to request a refund** — Email **snaptax.lightxforge@gmail.com** with Paddle transaction ID; Paddle may also handle via receipt email  
6. **Season re-export** — Paid season includes unlimited re-export for that season (not a separate refund scenario)  
7. **Related** — `/terms` · `/pricing` · `/privacy`

### Terms cross-link

Update `docs/legal/terms.md` §4 to append:  
“See our [Refund Policy](/refund) and [Pricing](/pricing).”

Same link addition in `terms.fr.md` and `terms.de.md` (localized link labels OK; paths stay `/refund`, `/pricing`).

### Metadata

`title: "Refund Policy · Snap1099"`

---

## Page 3: `/policies`

### Purpose

Single **Terms and policies** hub URL for Paddle vendor form and external auditors.

### Layout

Legal shell header + **link list** (not long markdown prose):

| Link label | href | One-line description |
|------------|------|----------------------|
| Terms of Service | `/terms` | App use, payments summary, liability |
| Privacy Policy | `/privacy` | Data collection, US storage, GDPR rights |
| Pricing | `/pricing` | Export Tax Pack season pricing |
| Refund Policy | `/refund` | Refunds via Paddle |
| Data Retention | `/data-retention` | How long we keep data |
| Security & Incidents | `/security` | Security contact and incident response |

Footer line: Contact **snaptax.lightxforge@gmail.com**

Implementation: lightweight `PoliciesHubContent` component (or short `policies.md` parsed + link rows). Prefer **React link list** for consistent 64px tap targets if ever linked from in-app later.

### Metadata

`title: "Terms & Policies · Snap1099"`

---

## Section anchors (all legal pages)

Add helper `slugifyLegalHeading(title: string): string` → kebab-case `id` on every `h2` in:

- `LegalMarkdownView`
- `LegalPageContent`

Enables future deep links e.g. `/terms#subscriptions-payments` (optional follow-up in Terms markdown headings).

Out of scope for this phase: auto-generate TOC.

---

## Files

| Path | Action |
|------|--------|
| `docs/legal/pricing.md` | Create |
| `docs/legal/refund.md` | Create |
| `docs/legal/policies.md` | Create (optional if hub is React-only) |
| `docs/legal/terms.md` | Update §4 cross-links |
| `docs/legal/terms.fr.md` | Update §4 cross-links |
| `docs/legal/terms.de.md` | Update §4 cross-links |
| `docs/legal/data-retention.md` | Update Related line → add Pricing, Refund, Policies |
| `lib/legal/markdownDoc.ts` | Extend `LegalMarkdownFile` |
| `lib/legal/slugifyLegalHeading.ts` | Create + unit test |
| `app/pricing/page.tsx` | Create (server + dynamic block) |
| `app/refund/page.tsx` | Create |
| `app/policies/page.tsx` | Create |
| `components/legal/LegalMarkdownView.tsx` | Add `id` on `h2` |
| `components/legal/LegalPageContent.tsx` | Add `id` on `h2` |
| `components/legal/PricingPageContent.tsx` | Create (dynamic block + markdown) |
| `components/legal/PoliciesHubContent.tsx` | Create |

Optional (not MVP):

- Help page privacy section → add Policies link  
- `PRODUCT-SPEC.md` §2.3.3 bullet list update

---

## Error handling & offline

| Case | Behavior |
|------|----------|
| Server price fetch throws | Render markdown-only pricing page with static copy |
| User offline (PWA) | Cached legal routes via Serwist if precached; add `/pricing`, `/refund`, `/policies` to SW precache list if not already covered by `/_next/` static |
| Invalid locale | English markdown only for new pages |

---

## Testing

| Test | Type |
|------|------|
| `parseLegalMarkdown` loads new files | Unit |
| `slugifyLegalHeading` stable slugs | Unit |
| `/pricing` renders DEFAULT price from `resolveSeasonOfferFromState` | Unit (existing seasonOffer tests pattern) |
| Routes return 200 in dev | Manual |
| Paddle form URLs resolve publicly | Manual (after deploy) |

---

## Out of scope

- French/German translations for pricing/refund/policies pages  
- Settings Privacy & Data new rows  
- Paddle checkout or Paywall UI changes  
- Updating PRD `$49` mock copy (Terms already defers to App)  
- Subscription billing (still per-season one-time)  
- Automated Paddle refund on Delete Account  

---

## Success criteria

1. Paddle vendor form can be filled with stable URLs on `snaptax.lightxforge.com` (see table above).  
2. `/pricing` shows **current Flag-driven** season price without login.  
3. `/refund` contains a complete refund policy (not just Terms §4 one-liner).  
4. `/policies` lists all legal documents in one hub.  
5. Terms §4 cross-links Pricing and Refund.  
6. Visual consistency with existing legal pages (black / yellow / zinc, Back link).

---

## Legal review note

Before production publish, owner should review `refund.md` § EU 14-day withdrawal wording with counsel. Paddle MoR terms URL must stay current.
