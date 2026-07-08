---
name: snap1099-product
description: >-
  Implements Snap1099 MVP features per product spec — Ghost account, Google auth
  gates, receipt capture states, Paddle paywall, PWA offline/install. Use when
  building or reviewing Snap1099/snaptax UI, auth, payments, receipts, PWA,
  marketing CTAs, settings, or when the user mentions PRD, product spec, 1099,
  or Snap1099 product rules.
---

# Snap1099 Product Development

## Before coding

1. Read `docs/product/PRODUCT-SPEC.md` (canonical summary)
2. **PWA / install / manifest / marketing CTA:** read `docs/tech/13-pwa-install-architecture.md` + `.cursor/rules/snap1099-pwa.mdc`
3. For backend/API work, read `docs/tech/README.md` and relevant module
3. For database/schema changes, read `docs/tech/DB-DESIGN-SPEC.md` first (PG **and** IndexedDB `snaptax_*` stores)
4. For copy/interaction details, read `docs/prd/0.0.1.md` relevant section
5. Check §12 **实现状态** — backend/OpenAI/Google/Paddle 已落地；改功能前仍对照 spec
6. **MVP 落地顺序：** `docs/superpowers/plans/2026-06-07-mvp-master-implementation.md`
7. **省税：** `docs/superpowers/specs/2026-06-07-tax-savings-regional-design.md` · rule `snap1099-tax.mdc` — no client `×0.25`

## Decision tree: auth UI

> Onboarding canonical: `docs/superpowers/topics/onboarding-aha-design.md`

```
User action?
├─ Snap receipt → no login (Ghost)
├─ 3rd done receipt → TaxHeader nudge → Settings soft Google Sheet (optional tap)
├─ First settings visit → auto soft Google Sheet (dismiss once forever)
├─ Export IRS Tax Pack → hard Google → Paddle (if unpaid season) → share
└─ View on All Devices → hard Google → sync instructions
```

**No home-screen Google banner** (see `2026-06-07-home-remove-google-banner-design.md`).

## Decision tree: paywall

```
Export clicked + Google OK?
├─ Season unpaid → Paddle Overlay $49 + device-loss warning → share Excel
└─ Season paid → Export Again (no paywall) → share Excel
```

## Receipt state (client)

`processing` → (online) → `done` | `blurry`  
Offline: stay `processing` with `Uploading`; persist **compressed** photo (1280×960 JPEG 75%, ~200–300KB) — **OPFS bytes + IDB meta** (`snaptax_receipt_photos`).  
Online: `POST /api/receipts` → server OpenAI Vision (never client mock).

## IndexedDB (offline)

Database: **`snaptax`** (legacy `snap1099` migrated on first open). Object stores **must** use **`snaptax_` prefix** (aligned with PostgreSQL):

| Store | Purpose |
|-------|---------|
| `snaptax_receipts` | Receipt rows + sync fields |
| `snaptax_receipt_photos` | **Photo metadata only** (paths, sizes, purge flags) |
| `snaptax_system_meta` | Onboarding, tombstones, KV meta |
| `snaptax_crypto_meta` | Local encryption DEK |
| `snaptax_receipt_events` | Phase 2 lifecycle event queue only |

**Image bytes:** OPFS `snaptax/photos/{id}/` (encrypted). **Not** in IDB.

**Retention:** After **sync + 90 days**, delete OPFS full image; keep thumbnail; detail view uses signed URL.

**Capture compress:** Typical 4032×3024 (3–5MB) → max edge **1280** (~1280×960), **JPEG 75%**, target **200–300KB**. Thumb: 480px edge, JPEG 70%.

Canonical: `docs/tech/12-local-image-storage-design.md`

Legacy v4 names (`receipts`, `photos`, `system_meta`, `meta`) — migrate on `DB_VERSION = 5`; do not use in new code. Canonical constants: `lib/storage/idbStores.ts`.

## Onboarding (wired in HomeScreen)

- **T1:** 3rd `done` receipt → `GoogleBackupNudge` below TaxHeader
- **T2:** first Settings visit → auto soft Google Sheet (300ms)
- **Coach:** `SnapCoachBanner` (0 receipts) · `FirstReceiptCoach` (1 receipt)
- **Dismiss:** `GOOGLE_SOFT_DISMISSED_KEY` — global once for soft triggers

## Decision tree: PWA / install

> Canonical: `docs/tech/13-pwa-install-architecture.md`

```
Which route?
├─ Marketing / (not /app)
│   ├─ InstallCaptureScript (root) captures prompt
│   ├─ MarketingInstallShell → bar + MarketingInstallButton
│   └─ Get Started → native <a href="/app"> (Android Chrome WebAPK)
└─ Product /app
    ├─ standalone? → normal HomeScreen (no gate)
    ├─ mobile browser + eligible platform?
    │   ├─ After Landing → AppBrowserEntryGate (full-screen, skippable)
    │   └─ Skip session → header install only; no bottom bar
    └─ Android Edge / desktop → PwaInstallProvider bar/header only
```

**Rename install icon:** `manifest.short_name` + `appleWebApp.title` → **SnapTax** (not internal `snap1099_*` keys).

## Files to touch (typical)

| Feature | Location |
|---------|----------|
| Home flow | `components/home/HomeScreen.tsx` |
| Settings/export | `components/settings/SettingsScreen.tsx` |
| Camera | `components/camera/`, `lib/camera/`（含 `compressReceiptImage`） |
| Local queue | `lib/storage/receiptDb.ts`, `lib/storage/idbStores.ts`, `lib/storage/opfs/` |
| Onboarding | `lib/onboarding/onboardingStorage.ts`, `components/onboarding/` |
| PWA / install | `docs/tech/13-pwa-install-architecture.md`, `components/pwa/`, `lib/pwa/`, `app/manifest.ts`, `components/marketing/MarketingAppLink.tsx` |
| Marketing site | `app/(marketing)/`, `components/marketing/` |

## Additional resources

- Full checklist & KPIs: [reference.md](reference.md)
- **Tech docs:** `docs/tech/README.md`
- **Database spec:** `docs/tech/DB-DESIGN-SPEC.md`
- Design decisions: `docs/superpowers/specs/2026-06-05-*.md`
