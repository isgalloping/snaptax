# Preview PWA Display Name — Design

**Date:** 2026-07-29  
**Status:** Approved (brainstorming)  
**Scope:** PWA install name only — manifest, browser tab title, Apple web app title

---

## Problem

Preview deployments use `https://snaptax-pre.lightxforge.com`. When testers install the PWA alongside production (`SnapTax` on `snaptax.lightxforge.com`), both icons show the same name **SnapTax**, making them hard to distinguish on the home screen.

Production must remain **SnapTax** unchanged.

---

## Goals

| Environment | Domain | PWA display name |
|-------------|--------|------------------|
| Production | `snaptax.lightxforge.com` | `SnapTax` |
| Preview | `snaptax-pre.lightxforge.com` | `SnapTax-Pre` |
| Local dev | `localhost` (default URL fallback) | `SnapTax` |

**In scope**

- `manifest.name` / `manifest.short_name`
- Root `metadata.applicationName`, `title`, `appleWebApp.title`
- `(pwa)/app/layout.tsx` page title

**Out of scope**

- Marketing page titles and copy
- In-app i18n product strings (Snap1099 brand)
- Export filenames, Share titles, Settings UI
- Storage prefixes (`snaptax_*`, `snap1099_*`)

---

## Approach (selected)

**Domain derivation via existing `NEXT_PUBLIC_APP_URL`** — reuse `getPublicSiteUrl()` from `lib/site/publicSiteUrl.ts`.

Rejected alternatives:

- **`VERCEL_ENV === "preview"` blanket rule** — renames all branch preview URLs, not tied to the dedicated preview domain.
- **New env `NEXT_PUBLIC_PWA_DISPLAY_NAME`** — redundant with domain-based config; easy to misconfigure.

---

## Architecture

```
getPublicSiteUrl()
       │
       ▼
parse hostname
       │
       ├── hostname includes "snaptax-pre" → "SnapTax-Pre"
       └── otherwise                     → "SnapTax"
       │
       ▼
manifest.name / short_name
metadata.applicationName / title / appleWebApp.title
(pwa)/app/layout title
```

### New module: `lib/site/appDisplayName.ts`

```ts
import { getPublicSiteUrl } from "@/lib/site/publicSiteUrl";

const PROD_DISPLAY_NAME = "SnapTax";
const PREVIEW_DISPLAY_NAME = "SnapTax-Pre";

/** PWA install / tab / Apple web app title only — not in-app marketing copy. */
export function getAppDisplayName(): string {
  try {
    const hostname = new URL(getPublicSiteUrl()).hostname;
    if (hostname.includes("snaptax-pre")) {
      return PREVIEW_DISPLAY_NAME;
    }
  } catch {
    // invalid URL — fall through to production name
  }
  return PROD_DISPLAY_NAME;
}
```

### Consumers

| File | Change |
|------|--------|
| `app/manifest.ts` | `name` and `short_name` ← `getAppDisplayName()` |
| `app/layout.tsx` | Replace hardcoded `APP_NAME` with `getAppDisplayName()` |
| `app/(pwa)/app/layout.tsx` | `title` ← `getAppDisplayName()` |

Build-time note: `manifest.ts` and layouts are evaluated at **build time**. Vercel Preview must set `NEXT_PUBLIC_APP_URL=https://snaptax-pre.lightxforge.com` before build (already the intended Preview env config). Production build uses production URL → `SnapTax`.

---

## Vercel configuration

No new environment variables.

| Vercel env | `NEXT_PUBLIC_APP_URL` | Result |
|------------|----------------------|--------|
| Production | `https://snaptax.lightxforge.com` | `SnapTax` |
| Preview | `https://snaptax-pre.lightxforge.com` | `SnapTax-Pre` |
| Development / local | unset or local override | `SnapTax` (default fallback host) |

---

## Testing

### Unit tests

1. **`lib/site/appDisplayName.test.ts`** (new)
   - `NEXT_PUBLIC_APP_URL=https://snaptax-pre.lightxforge.com` → `SnapTax-Pre`
   - `NEXT_PUBLIC_APP_URL=https://snaptax.lightxforge.com` → `SnapTax`
   - unset env → `SnapTax`

2. **`app/manifest.test.ts`** (update)
   - Default test env → asserts `SnapTax`
   - With preview URL env → asserts `SnapTax-Pre`

Run: `npm run test:unit`

### Manual QA

1. Deploy Preview → open `snaptax-pre.lightxforge.com/app` → install PWA → home screen shows **SnapTax-Pre**.
2. Production install unchanged → **SnapTax**.
3. Browser tab title on `/app` matches install name per environment.

**Note:** OS does not rename already-installed PWAs; testers must reinstall after deploy to see the new label (documented in `docs/tech/13-pwa-install-architecture.md` §2).

---

## Documentation

Update `docs/tech/13-pwa-install-architecture.md` §2 table:

| Field | Production | Preview (`snaptax-pre.*`) |
|-------|------------|---------------------------|
| `name` / `short_name` | SnapTax | SnapTax-Pre |

---

## Error handling

Invalid or missing URL → safe fallback to `SnapTax` (production name). No runtime client exposure; server/build-time only.

---

## Success criteria

- [ ] Preview PWA install icon label is **SnapTax-Pre**
- [ ] Production remains **SnapTax**
- [ ] No new env vars
- [ ] In-app Snap1099 / marketing copy unchanged
- [ ] Unit tests pass
