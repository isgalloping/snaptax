---
name: snap1099-product
description: >-
  Implements Snap1099 MVP features per product spec — Ghost account, Google auth
  gates, receipt capture states, Paddle paywall, PWA offline. Use when building
  or reviewing Snap1099/snaptax UI, auth, payments, receipts, settings, or when
  the user mentions PRD, product spec, 1099, or Snap1099 product rules.
---

# Snap1099 Product Development

## Before coding

1. Read `docs/product/PRODUCT-SPEC.md` (canonical summary)
2. For backend/API work, read `docs/tech/README.md` and relevant module
3. For database/schema changes, read `docs/tech/DB-DESIGN-SPEC.md` first
4. For copy/interaction details, read `docs/prd/0.0.1.md` relevant section
5. Check §11 **实现状态** — do not assume Google/Paddle/API already exist in code
6. **MVP 落地顺序：** `docs/superpowers/plans/2026-06-07-mvp-master-implementation.md`
7. **省税：** `docs/superpowers/specs/2026-06-07-tax-savings-regional-design.md` · rule `snap1099-tax.mdc` — no client `×0.25`

## Decision tree: auth UI

> Onboarding canonical: `docs/superpowers/specs/2026-06-12-new-user-onboarding-design.md`

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
Offline: stay `processing` with `Uploading`; persist photo in IndexedDB.

## Files to touch (typical)

| Feature | Location |
|---------|----------|
| Home flow | `components/home/HomeScreen.tsx` |
| Settings/export | `components/settings/SettingsScreen.tsx` |
| Camera | `components/camera/`, `lib/camera/` |
| Local queue | `lib/storage/receiptDb.ts` |
| PWA | `app/sw.ts`, `components/pwa/` |

## PRD alignment gaps (fix when implementing auth/pay)

- Remove `RegisterBanner` / `RegisterSheet` (phone) → Google sheets
- Replace mock pay with Paddle Overlay + season entitlement
- Add §2.4.0 account status block in Settings

## Additional resources

- Full checklist & KPIs: [reference.md](reference.md)
- **Tech docs:** `docs/tech/README.md`
- **Database spec:** `docs/tech/DB-DESIGN-SPEC.md`
- Design decisions: `docs/superpowers/specs/2026-06-05-*.md`
