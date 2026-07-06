# SaaS Marketing Site + `/app` PWA Split — Design

**Date:** 2026-07-05  
**Status:** Approved (brainstorming + grill-me 2026-07-05)  
**Inputs:** `docs/saas/snaptax-site-arch.txt` · `docs/saas/snaptax-home.md` · `docs/ui/website-ui.0.2.png`  
**Canonical product:** `docs/product/PRODUCT-SPEC.md` · billing: `docs/legal/pricing.md`

---

## 1. Decision summary

| Topic | Decision |
|-------|----------|
| Routing | **A** — `/` marketing site; `/app` PWA (existing product) |
| Pricing narrative | **C → B** — “One-time per tax season, no monthly subscription”; **not** Lifetime all-years |
| Brand (marketing) | **SnapTax** on website / Paddle surfaces |
| Brand (PWA) | **Snap1099** in manifest until unified rebrand PR |
| Layouts | **Dual layout** — `(marketing)` vs `(app)` route groups |
| Pricing data | **Single source** — reuse `loadPricingPageLiveData()` + `/api/founder/program` patterns; no hardcoded tiers on marketing pages |

---

## 2. Problem

Today `/` renders the PWA shell (`LandingRouter` + `StartupShell` + `HomeScreen`). That blocks:

- Paddle Checkout review (public pricing narrative vs app shell)
- SEO (minimal indexable marketing copy)
- Ads landing (Hero / Features / FAQ funnel)
- Separation of marketing visual (UI v0.2 green) from PWA iron law (black / white / yellow)

---

## 3. Target architecture

```text
snaptax.lightxforge.com/
├── (marketing)/                    ← SSR/SSG, SEO, UI v0.2
│   ├── page.tsx                    ← Home (Hero, How it works, Features, Pricing preview, FAQ preview)
│   ├── pricing/page.tsx            ← Full pricing (Paddle audit focus)
│   ├── features/page.tsx           ← v1 Should
│   ├── faq/page.tsx                ← v1 Should
│   ├── contact/page.tsx            ← v1 Must (form + support email)
│   ├── blog/                       ← v1 Should (index + 2–3 posts)
│   └── layout.tsx                  ← MarketingHeader + Footer; NO PwaProvider shell overlap
│
├── (app)/app/                      ← Existing PWA
│   ├── page.tsx                    ← StartupShell (Landing optional) + HomeScreen
│   └── layout.tsx                  ← PwaProvider, viewport lock, black theme
│
├── privacy|terms|refund|…          ← Keep existing legal routes; restyle under marketing layout where applicable
├── manifest.ts                     ← start_url + scope → /app
├── sw.ts                           ← unchanged scope; offline fallback for /app navigations
├── robots.ts / sitemap.ts          ← expand paths
└── api/*                           ← unchanged
```

**CTA mapping**

| UI control | Target |
|------------|--------|
| Get Started (Hero / Pricing card) | `/app` |
| Sign In | `/app` (Google gate inside app as today) |
| View Pricing | `/pricing` |
| View all FAQ | `/faq` |

Checkout stays **in-app** (Paddle Overlay after export gate) — marketing pages do not embed Paddle.js v1.

---

## 4. Pricing & Paddle alignment

### 4.1 Truth model (existing code)

- Entitlement key: `snaptax_season_entitlements (userId, taxSeason)`
- Season label: `currentTaxSeason()` (Paddle sells e.g. season `2027` for calendar-year 2026 receipts)
- Founder: first 50 seats lock **tier price for future seasons**, not lifetime license
- Legal canonical: `docs/legal/pricing.md` — one-time **per tax season**, unlimited re-export **within that season**

### 4.2 Marketing copy rules

**Use**

- Pay once **per tax season**
- No monthly subscription
- Secure checkout powered by Paddle
- Taxes may apply at checkout
- Founder tiers lock your price for **future seasons** (while Founder status active)

**Do not use**

- Lifetime access (all tax years)
- Forever / all future years included
- Single payment covers every future filing year

### 4.3 UI v0.2 Pricing section adjustments

- Section title: **Simple Season Pricing** (not “Lifetime Pricing”)
- Each card: `$5` … `$29` with **`/ tax season`** sublabel
- Footer strip: one-time per season · Paddle · taxes at checkout
- Live **spots remaining** from founder API when SSR/data available; static fallback copy if API fails

### 4.4 Paddle audit checklist (v1 Must)

- [ ] Public `/pricing` with product name, tiers, included features
- [ ] Website prices match Checkout (Flag-driven live data)
- [ ] Taxes-at-checkout disclaimer
- [ ] Footer links: Privacy, Terms, Refund, Contact
- [ ] HTTPS (production)
- [ ] No subscription language unless Paddle product is subscription (it is not)

---

## 5. Visual system split

| Surface | Palette | Typography | Components |
|---------|---------|------------|------------|
| Marketing | UI v0.2: charcoal `#0B0F0E`, accent green `#22C55E` (approx), CTA yellow `#EAB308` | Geist / marketing scale | `components/marketing/*` |
| PWA `/app` | `#000` / `#FFF` / `#EAB308` per PRODUCT-SPEC | unchanged | `components/home/*`, existing |

Marketing pages **must not** import HomeScreen or camera flows.

---

## 6. Home page sections (map UI v0.2 → components)

| Section | Component | Notes |
|---------|-----------|-------|
| Header | `MarketingHeader` | Logo, Features, Pricing, FAQ, Contact, Sign In, Get Started |
| Hero | `MarketingHero` | Tagline pill, headline, checklist, CTAs, phone mock (static image v1) |
| How it works | `MarketingSteps` | 3 steps |
| Features grid | `MarketingFeatureGrid` | 6 tiles; Mileage = “Coming soon” |
| Pricing preview | `MarketingPricingPreview` | 4 cards + link to `/pricing` |
| FAQ preview | `MarketingFaqPreview` | 4–6 items + link to `/faq` |
| Footer | `MarketingFooter` | Product / Company / Legal / Support columns per PRD §16 |

Reuse content strings from `docs/saas/snaptax-home.md` with Lifetime wording corrected.

---

## 7. SEO (v1 Should)

### 7.1 Metadata

- Home: title `SnapTax — Expense Tracking for 1099 Contractors`, description from PRD Hero
- `/pricing`, `/features`, `/faq`: unique title + description
- Open Graph: `og:title`, `og:description`, `og:image` (marketing hero asset)
- Canonical: `NEXT_PUBLIC_APP_URL` → production `https://snaptax.lightxforge.com`

### 7.2 Structured data

- Home: `SoftwareApplication` + `Organization` JSON-LD
- Pricing: `Product` / `Offer` with `priceCurrency: USD` and **per-season** offer description (not lifetime)

### 7.3 Sitemap / robots

Extend `PUBLIC_PATHS` in `app/sitemap.ts`:

```text
/, /pricing, /features, /faq, /contact, /blog, /blog/*
+ existing legal paths
```

Do **not** index `/app` auth flows as primary landing (optional `noindex` on `/app` if duplicate content concern — default: index `/` only).

### 7.4 Blog v1

- `/blog` index
- 3 launch posts (markdown in `docs/legal/blog/` or `content/blog/`): plumber deductions, 1099 guide, receipt organization
- Categories per PRD §7

---

## 8. Legal & compliance pages

| Route | v1 | Action |
|-------|-----|--------|
| `/privacy` | Must | Existing markdown; marketing shell |
| `/terms` | Must | Existing |
| `/refund` | Must | Existing |
| `/contact` | Must | **New** — form → email or existing support address |
| `/security` | Should | Existing `/security` |
| `/data-retention` | Should | Existing |
| `/policies` | Keep | Hub |
| Cookie policy | Should | New markdown page or section in privacy |
| Disclaimer | Should | New short page (tax advice disclaimer) |
| Accessibility | Could v1.1 | Stub page per PRD §15 |

All legal pages use marketing footer for Paddle consistency.

---

## 9. PWA migration details

| Item | Current | After |
|------|---------|-------|
| `app/page.tsx` | PWA shell | Marketing Home |
| PWA entry | `/` | `/app` |
| `manifest.start_url` | `/` | `/app` |
| `manifest.scope` | `/` | `/app` |
| Serwist precache | `/` assets | Include `/app` shell; marketing routes network-first |
| Installed PWA opens | Home app | `/app` directly |
| Deep links | `/` | Bookmark `/app`; marketing CTAs point to `/app` |

**Regression risks**

- Users with old installed PWA (scope `/`) — one-time migration; document “re-add to home screen” in release notes if needed
- `InstallCaptureScript` — ensure `beforeinstallprompt` still fires on `/app`, not blocked on marketing `/`

---

## 10. Implementation phases

### Phase M0 — Route split (P0)

- Create `(marketing)` and `(app)` route groups
- Move PWA to `/app`; wire manifest + install prompt
- Minimal marketing Home (Hero + Footer + legal links) to unblock Paddle URL review

### Phase M1 — UI v0.2 Home (P0)

- Full Home sections per §6
- `/pricing` marketing shell + live pricing data
- Contact page

### Phase M2 — SEO & content (P1)

- `/features`, `/faq`, blog, sitemap/OG/schema
- Cookie + Disclaimer pages

### Phase M3 — Polish (P2)

- Phone mock asset pipeline, analytics (GSC, optional GA with cookie policy)
- Testimonials (PRD V2)

---

## 11. Out of scope (v1)

- Subdomain split (www vs app)
- Embedded Paddle on marketing pages
- Lifetime SKU or entitlement schema change
- Help Center / Status / Affiliate (PRD §19 V2)
- Replacing Snap1099 → SnapTax inside PWA strings (separate copy PR)

---

## 12. Success criteria

- Paddle reviewer can open `/`, `/pricing`, Privacy, Terms, Refund, Contact without logging in
- Pricing on site matches Checkout for current Founder seat tier
- Lighthouse SEO basics on Home (title, meta, h1, internal links)
- Existing PWA flows unchanged at `/app` (Ghost, capture, export, Paddle)
- PRODUCT-SPEC visual rules unchanged inside `/app`

---

## 13. References

- Site arch: `docs/saas/snaptax-site-arch.txt`
- PRD (correct Lifetime → season in implementation): `docs/saas/snaptax-home.md`
- UI: `docs/ui/website-ui.0.2.png`
- Live pricing legal: `docs/legal/pricing.md`
- Founder API: `app/api/founder/program/route.ts`, `lib/legal/pricingPageData.ts`
