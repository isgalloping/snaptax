# Settings v3 Redesign — Design

**Date:** 2026-06-17  
**Status:** Approved (design)  
**References:** `docs/ui/snaptax-settings-ui.v3.png` · `docs/prd/settings.md`  
**Scope:** Full v3 interaction alignment — viewState sub-pages, export Path A/B flows, Paywall visual upgrade, notification localStorage prefs, header language switch.

## Summary

Upgrade the Settings screen from the v1 PRD implementation to match `snaptax-settings-ui.v3.png` interactions. Settings uses in-page `viewState` navigation (no new routes) for Preferences sub-pages and ghost export flows. Existing tax overview, block order, and Paddle paywall backend remain; UI and flows are extended per v3.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Scope | **B** — full v3 interaction alignment |
| Preferences nav | **viewState** full-screen sub-pages + `< BACK` (within Settings) |
| Header language | **EN · FR · DE** — existing `en-US` / `fr-FR` / `de-DE` locales |
| Ghost VIEW STATUS | Return to main + green status bar under Export |
| Notifications | **localStorage** toggles + “alerts coming soon” footnote; no Web Push |
| Implementation | **方案 1** — SettingsShell + viewState hosts |

## Architecture

```
SettingsScreen
├── SettingsHeader (BACK + title + EN|FR|DE segment)
├── viewState === main → SettingsMainView
│   ├── SettingsAccountBlock (enhanced)
│   ├── TaxOverviewPanel
│   ├── TaxExportSection + ExportStatusBanner (green/red)
│   ├── ShareAppSection (avatars + Learn sheet)
│   ├── SettingsPreferencesList (4 chevron rows)
│   └── Sign out footer
├── viewState sub-pages → SettingsSubPageHost
│   ├── language | industry | notifications | privacy-center
├── export flow pages → ExportFlowHost
│   ├── sample-export | export-completed
├── GoogleSignInSheet / PaywallSheet (upgraded UI)
└── Sign-out confirm sheet (unchanged)
```

`view === "settings"` remains the only second logical page. No `/settings/*` routes.

## viewState table

| State | Trigger | Dismiss |
|-------|---------|---------|
| `main` | default | — |
| `language` | Preferences → Language | `< BACK` → main |
| `industry` | Preferences → Your Industry | `< BACK` |
| `notifications` | Preferences → Notification Settings | `< BACK` |
| `privacy-center` | Preferences → Privacy & Security Center | `< BACK` or **Got it** |
| `sample-export` | Ghost taps Export | `< BACK` or flow complete |
| `export-completed` | After sample download | **View status** → main |

## Main screen layout

Order unchanged from PRD:

1. Account block  
2. Tax Overview (three columns)  
3. Export CTA + status banners  
4. Share & Referral  
5. Preferences list (row entries, not accordion)  
6. Sign out (signed-in only, footer)

### SettingsHeader

- Left: existing `< BACK` to home  
- Center: `SETTINGS`  
- Right: segmented control `EN | FR | DE` — highlights active locale, calls `setLocale`  
- Synced with Language sub-page radio selection

### Account block enhancements

**Unsigned:** yellow headline + full-width yellow Continue with Google (unchanged pressure pattern).

**Signed-in:**

- Initials avatar (48px) + **name** (primary)  
- **Masked email** (secondary, zinc-400)  
- When `seasonPaid`: `{season} Tax Season · Paid ✓` (yellow)  
- When `seasonPaid`: `Coverage ends Apr 15, {season}` — computed via `seasonCoverageEndLabel(season)` (US filing deadline for that calendar year)  
- No Sign out in this block

### Tax Overview

Unchanged — props from `HomeScreen` (`taxSaved`, `receiptCount`, `totalDeductions`).

### Export status banners (`ExportStatusBanner`)

Shown on **main** view only, directly below Export button:

| Condition | Banner |
|-----------|--------|
| `snap1099_settings_sample_export_done` and ghost | Green: `✓ Sample export ready` + optional “Download again” link |
| Paywall dismissed without pay (`exportBlockedDismissed` session/local) | Red: `⚠️ Export blocked. Premium license required to download official IRS documents.` + dismiss × |

Banners are mutually independent; red takes visual priority if both could apply (logged-in unpaid only for red).

## Path A — Ghost sample export flow

Replaces instant CSV download from Settings Export for **unsigned** users.

### `sample-export` page

- Title: `Here's your sample tax export`  
- File card: `Snap1099-SAMPLE-TurboTax-{year}.csv`  
- **Download CSV** (yellow) → `ensureOnboardingDemoDone()` → `downloadOnboardingSampleCsv(demo)` → navigate `export-completed`  
- **Continue with Google** (white outline) → open `GoogleSignInSheet` (hard or soft per existing gate context)  
- If onboarding `stage_3` / `stage_aha`: Download also runs `completeAhaCoach()`

### `export-completed` page

- Success icon + `Export Completed`  
- **View status** → `main` + set `snap1099_settings_sample_export_done = '1'` + show green banner

### Signed-in users

Settings Export continues to call `useTaxExportGate` (Google → Paywall → export). No sample-export pages.

## Path B — Paywall upgrade (signed-in, unpaid)

Refactor `PaywallSheet` visual layer only; keep Paddle `Checkout.open` and webhook flow.

### Offer phase UI

- Balance scale illustration (SVG/CSS): left tax documents, right green shield  
- Headline: `Unlock Your Full Tax Pack — $49`  
- One-time season subtitle (existing i18n pattern)  
- Feature checklist (5 bullets — Excel tax pack, not PDF)  
- Primary: `UNLOCK NOW — $49` (yellow)  
- Secondary: `Maybe later` (text)  
- Device-loss warning (existing copy) preserved

### On `Maybe later` / close without payment

- Set `exportBlockedActive` flag (sessionStorage or localStorage with dismiss)  
- Return to Settings `main`  
- Show red Export blocked banner

### Confirming phase

Unchanged — payment confirming sheet.

## Share & Referral

- Keep grey card + `Tell a fellow 1099 contractor to get 1 Year Free`  
- Add decorative avatar strip (3 static initials circles)  
- **Learn how it works** → Bottom Sheet explaining referral program (**coming soon**, no counter/backend)  
- WhatsApp / Facebook / More unchanged

## Preferences list (`SettingsPreferencesList`)

Replace accordion `SettingsPreferencesSection` on main view with four tappable rows:

| Row | Trailing preview | Navigates to |
|-----|------------------|--------------|
| Language | Current language name | `language` |
| Your Industry | Current industry label | `industry` |
| Notification Settings | e.g. `3 on` | `notifications` |
| Privacy & Security Center | — | `privacy-center` |

Chevron right; `min-h-14`; dark grey row style.

## Sub-pages

### Language

- Full-screen sub-page with `< BACK`  
- Radio list: English, Français, Deutsch  
- Green check on selected; tap updates locale immediately

### Industry

- Single-column list of six industries  
- Green check on selected; tap updates industry

### Notifications

Four toggles with defaults:

| Key | Label | Default |
|-----|-------|---------|
| `snap1099_notif_deadlines` | Quarterly Tax Deadlines | on |
| `snap1099_notif_deductions` | New Deduction Opportunities | on |
| `snap1099_notif_receipts` | Receipt Processing | on |
| `snap1099_notif_marketing` | Marketing Updates | off |

Module: `lib/settings/notificationPrefs.ts` — read/write boolean flags.

Footnote: `Alerts coming soon — your choices are saved for when we enable notifications.`

### Privacy & Security Center

Four icon rows (reuse trust/privacy copy from home overlay where possible):

1. 100% Private  
2. Secure in the U.S.  
3. We Don't Sell Data  
4. You're in Control  

Inline links: Privacy Policy, Terms, Delete Account (existing sheets).  
Bottom yellow **Got it** → `main`.

## Preserved behavior

- First Settings visit soft Google Sheet (T2)  
- `requestSoftGoogleSheet` from home  
- Home Export gate (not ghost sample fast-lane)  
- Delete Account, industry PATCH, sign-out confirm sheet  
- Tax stats from HomeScreen props  
- Paddle entitlement + Export Again when paid

## Out of scope

- Web Push notifications  
- Referral 3-person counter / free-year entitlement API  
- PDF/CSV format picker, ES/zh locales  
- New URL routes  
- Google profile photo URL

## Files

| Path | Action |
|------|--------|
| `components/settings/SettingsHeader.tsx` | **New** |
| `components/settings/SettingsMainView.tsx` | **New** |
| `components/settings/SettingsPreferencesList.tsx` | **New** |
| `components/settings/subpages/LanguageSubpage.tsx` | **New** |
| `components/settings/subpages/IndustrySubpage.tsx` | **New** |
| `components/settings/subpages/NotificationsSubpage.tsx` | **New** |
| `components/settings/subpages/PrivacyCenterSubpage.tsx` | **New** |
| `components/settings/export/SampleExportPage.tsx` | **New** |
| `components/settings/export/ExportCompletedPage.tsx` | **New** |
| `components/settings/ExportStatusBanner.tsx` | **New** |
| `components/settings/ReferralLearnSheet.tsx` | **New** |
| `components/settings/SettingsAccountBlock.tsx` | Modify — email, coverage |
| `components/settings/PaywallSheet.tsx` | Modify — scale UI, checklist |
| `components/settings/ShareAppSection.tsx` | Modify — avatars, learn link |
| `components/settings/SettingsScreen.tsx` | viewState orchestration |
| `components/home/HomeScreen.tsx` | Wire ghost export → open sample-export |
| `lib/settings/notificationPrefs.ts` | **New** |
| `lib/settings/exportSampleState.ts` | **New** |
| `lib/settings/seasonCoverage.ts` | **New** |
| `lib/i18n/*` | New strings |
| `docs/product/PRODUCT-SPEC.md` | §3 v3 flows |

Deprecate/remove accordion body from `SettingsPreferencesSection` or fold into sub-pages only.

## Testing

1. Ghost: Export → sample page → Download → completed → View status → green banner on main  
2. Ghost: Continue with Google from sample page opens sheet  
3. Signed-in unpaid: Paywall new UI → Maybe later → red banner  
4. Paid: Coverage ends line visible; Export Again works  
5. EN/FR/DE header syncs with Language sub-page  
6. Notification toggles persist across reload  
7. All sub-pages BACK returns to main list  
8. Home Export unchanged for ghost  
9. Soft Google Sheet on first Settings visit still works

## Success criteria

- Settings interactions match v3 board: sub-page prefs, sample export flow, paywall upgrade, status banners  
- No regression in Paddle, Google gates, or tax overview data  
- Notification and referral remain honest placeholders without fake backend
