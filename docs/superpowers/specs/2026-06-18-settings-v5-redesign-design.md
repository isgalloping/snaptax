# Settings v5 Redesign — Design

**Date:** 2026-06-18  
**Status:** Approved (design)  
**References:** `docs/ui/snaptax-setting-ui-v5.png` · `docs/superpowers/specs/2026-06-17-settings-v3-redesign-design.md` · `docs/product/PRODUCT-SPEC.md`  
**Scope:** Settings main-screen visual upgrade per v5 mockup — Summary outdoor readability, Export card five-state machine, Referral/Preferences v5 styling. Header, Profile, Footer unchanged. Product rules preserved (Snap1099, Excel not PDF, EN/FR/DE, initials avatar).

## Summary

Upgrade Settings from v3 implementation to v5 visual spec while keeping existing interaction architecture (`viewState` sub-pages, Ghost sample export Path A, Paywall, export banners). User-approved deltas: v5 Summary layout and semantic colors, rich Export card with five user-state variants, v5-toned Share section (avatars + three share buttons), v5 Preferences list (72pt rows, colored icons). Header, account block, sign-out footer remain as-is.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Header | Keep — `< BACK` + centered `SETTINGS` + `EN \| FR \| DE` segment |
| Profile / account block | Keep — unsigned pressure + Google CTA; signed-in initials + name + email + Paid/Coverage |
| Summary | v5 — larger numerals, semantic green/grey, `Est. Tax Saved` / `Receipts` / `Deductions`, `{n} Snapped`; no privacy footer |
| Export card | v5 chrome + five-state machine (below); marketing copy **Excel + CSV** (not PDF) |
| Filing deadline P0 threshold | **7 days** before Apr 15 of `currentSeason` |
| Referral / Share | 3 avatars + WhatsApp / Facebook / More; v5 dark card tone; optional `Learn how it works` link |
| Preferences | v5 — grouped card, 72pt rows, colored icons, green `{n} on` pill for notifications |
| Footer | Keep — full-width Sign out + confirm sheet; no version string |
| PWA Before/After chrome | Out of scope (separate PWA polish) |
| Implementation | **Scheme A** — refactor four block components + `seasonExportState` helper |

## Main screen layout

Order unchanged from PRODUCT-SPEC §3:

1. `SettingsHeader`  
2. `SettingsAccountBlock`  
3. `TaxOverviewPanel` (v5)  
4. `TaxExportCard` (v5, replaces `TaxExportSection`)  
5. `ExportStatusBanner` (green/red — preserved)  
6. `ShareAppSection` (v5 tone)  
7. `SettingsPreferencesList` (v5)  
8. Sign out button (signed-in only)

`view === "settings"` remains the only second logical page. No new routes.

## § Summary card (`TaxOverviewPanel`)

### Layout

- Three equal columns inside existing black-gold card container (`border-yellow-500/30`, subtle yellow glow).
- Column labels (uppercase, zinc-400, `text-[10px]` or `text-xs`): **Est. Tax Saved** · **Receipts** · **Deductions**.
- Numerals: **`text-2xl`–`text-3xl` `font-black`** (outdoor readability vs current `text-lg`).

### Values

| Column | Display |
|--------|---------|
| Est. Tax Saved | `formatCurrency(taxSaved)`; null → `$—` |
| Receipts | `{receiptCount} Snapped` (including `0 Snapped`) |
| Deductions | `formatCurrency(totalDeductions)` |

### Semantic color (v5)

Apply to **numeral only** (not labels):

| Condition | Color |
|-----------|-------|
| Value **> 0** (Saved/Deductions) or count **> 0** (Receipts) | `#22C55E` (`text-green-500`) |
| Zero or null / `$—` | `#E5E7EB` (`text-zinc-200`) |

Extend `lib/ui/settingsVisual.ts` with `summaryPositive` / `summaryNeutral` tokens; remove per-column fixed colors (blue/yellow) for numerals.

### Data source

Props from `HomeScreen` — same `SettingsTaxStats` as today (`taxSaved`, `receiptCount`, `totalDeductions`).

## § Export Tax Pack card (`TaxExportCard`)

New component replacing `TaxExportSection`. Preserves all export gate wiring from `SettingsScreen` / `useTaxExportGate`.

### Visual (v5)

```
┌─ rounded-2xl, thin gold/yellow border ──────────────────────────┐
│ [lock/unlock icon]  TITLE                           [badges]    │
│     TurboTax & H&R Block Compatible (blue, text-xs)             │
│     IRS-ready Excel + CSV                         $49 (unpaid)  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │              PRIMARY CTA (full-width yellow)                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ✓ Used by thousands of self-employed pros (anon/unpaid optional)│
└─────────────────────────────────────────────────────────────────┘
```

- **Most Popular** blue pill + right-aligned **$49**: show only for **anonymous** and **signed-in unpaid**.
- Hide price/badge for paid states.
- CTA: `min-h-16`, yellow-500, black text, `active:scale-95`.
- `exportBusy`: disable CTA, show exporting label.

### Five-state machine

Evaluate in priority order (first match wins):

| Priority | Condition | Card title | Button label | Action |
|----------|-----------|------------|--------------|--------|
| **P0** | Signed-in + `seasonPaid` + `daysUntilApr15(currentSeason) ≤ 7` | `Final Tax Pack Ready` | `Export Final Tax Pack` | Open `ExportEngineSheet` (same as P3/P4) |
| P1 | Not signed-in | `Unlock IRS Tax Pack` | `Preview Sample Export` | `viewState → sample-export` |
| P2 | Signed-in + not `seasonPaid` | `Export {season} IRS Tax Pack` | `Unlock for $49` | `onRequestExport()` → Paywall gate |
| P3 | Signed-in + `seasonPaid` + not exported this season | `{season} IRS Tax Pack Unlocked` | `Download Tax Pack` | Open `ExportEngineSheet` (skip Paywall) |
| P4 | Signed-in + `seasonPaid` + exported this season | `Tax Filing Ready` | `Export Again` | Open `ExportEngineSheet` |

**P0** overrides P3/P4 only. P1/P2 unchanged when near deadline.

### Filing deadline helper

New `lib/settings/filingDeadline.ts`:

```ts
/** Days from now until Apr 15 of season year (US, weekend-adjusted optional MVP: fixed Apr 15 UTC). */
export function daysUntilFilingDeadline(season: string, now?: Date): number

export function isWithinFinalTaxPackWindow(season: string, now?: Date): boolean
// true when daysUntilFilingDeadline <= 7
```

Reuse season year from `currentTaxSeason()` / `season` prop. MVP: fixed Apr 15 (align with `seasonCoverageEndLabel`).

### Season export tracking

New `lib/settings/seasonExportState.ts`:

- Key: `snap1099_tax_pack_exported_{season}` in `localStorage`, value `'1'`.
- `markSeasonExportDone(season)` — call from `ExportEngineSheet` `onExported` success path (Settings + Home export).
- `hasSeasonExportDone(season)` — drives P3 vs P4.
- New season entitlement → new key naturally resets to “not exported”.

### Preserved export flows

| Flow | Behavior |
|------|----------|
| Ghost Path A | `sample-export` → Download CSV → `export-completed` → main + green banner |
| Signed-in unpaid | Paywall → Maybe later → red `ExportStatusBanner` |
| Paid | ExportEngineSheet → share/download; **Export Again** unlimited per season |
| Home Export | Unchanged — separate gate from Settings |

## § Share & Referral (`ShareAppSection`)

- Dark grey grouped card (`rounded-2xl border-zinc-800 bg-zinc-900 p-4`) — v5 tone.
- **Keep:** 3 overlapping avatar circles (JD / MK / RS).
- **Keep:** grid of three share tiles — WhatsApp, Facebook, More sharing.
- Tile hot zone: **`min-h-[4.5rem]`** (72px).
- **Remove:** large top referral headline (`Tell a fellow 1099 contractor…`).
- **Optional:** small yellow underlined `Learn how it works` → existing `ReferralLearnSheet`.
- Share handlers unchanged (`shareApp.ts`).

## § Preferences list (`SettingsPreferencesList`)

- Section title: `PREFERENCES` (uppercase zinc-500) above grouped card.
- Single card wrapping four rows with dividers.
- Row: **`min-h-[4.5rem]`**, colored left icon, label, trailing preview, chevron.
- Icons: Language (globe, blue) · Industry (helmet, amber) · Notifications (bell, yellow) · Privacy (shield, purple).
- Notifications preview: **green pill** `{n} on` (from `countEnabledPrefs`).
- Navigation: unchanged `viewState` → Language / Industry / Notifications / Privacy sub-pages.

## § Unchanged blocks

### SettingsHeader

Left `< BACK` to home; center `SETTINGS`; right `EN | FR | DE` synced with Language sub-page.

### SettingsAccountBlock

Unsigned: yellow headline + full-width Continue with Google.  
Signed-in: 48px initials avatar, name, masked email, `{season} Tax Season · Paid ✓`, coverage line when paid.

### Footer

Full-width Sign out button + offline guard + confirm sheet. No app version line.

### viewState sub-pages

`language` · `industry` · `notifications` · `privacy-center` · `sample-export` · `export-completed` — all preserved.

### Export status banners

Below Export card on main view only:

| Condition | Banner |
|-----------|--------|
| Ghost + sample done | Green: sample ready + download again |
| Signed-in unpaid + paywall dismissed | Red: export blocked + dismiss |

## Architecture

```
SettingsScreen
├── SettingsHeader (unchanged)
├── main view
│   ├── SettingsAccountBlock (unchanged)
│   ├── TaxOverviewPanel (v5 visual)
│   ├── TaxExportCard (new — replaces TaxExportSection)
│   ├── ExportStatusBanner
│   ├── ShareAppSection (v5 tone)
│   ├── SettingsPreferencesList (v5)
│   └── Sign out
├── viewState sub-pages (unchanged)
├── export flow pages (unchanged)
└── GoogleSignInSheet / PaywallSheet (unchanged)
```

## Files

| Path | Action |
|------|--------|
| `components/settings/TaxExportCard.tsx` | **New** — v5 card + state machine UI |
| `components/settings/TaxOverviewPanel.tsx` | Modify — v5 layout + semantic colors |
| `components/settings/ShareAppSection.tsx` | Modify — v5 card, 72pt tiles, trim headline |
| `components/settings/SettingsPreferencesList.tsx` | Modify — grouped card, icons, 72pt, green pill |
| `components/settings/SettingsScreen.tsx` | Wire `TaxExportCard`, export-state props |
| `components/settings/TaxExportSection.tsx` | Remove or deprecate after migration |
| `lib/ui/settingsVisual.ts` | Extend summary + export + share tokens |
| `lib/settings/filingDeadline.ts` | **New** |
| `lib/settings/seasonExportState.ts` | **New** |
| `lib/settings/filingDeadline.test.ts` | **New** |
| `lib/settings/seasonExportState.test.ts` | **New** |
| `components/export/ExportEngineSheet.tsx` or gate | Call `markSeasonExportDone` on success |
| `components/home/HomeScreen.tsx` | Pass season export flag if needed for card refresh |
| `lib/i18n/locales/*.ts` | New export card strings (five states + marketing lines) |
| `docs/product/PRODUCT-SPEC.md` | §3 Settings block — v5 visual + export states |

## Out of scope

- PWA standalone Before/After browser chrome
- Profile clickable row / profile sub-page
- Privacy footer on Summary card
- PDF export copy; ES locale; SnapTax branding
- Google profile photo
- Referral backend / free-year entitlement API
- Web Push notifications

## Testing

1. Summary: zero stats → grey numerals; positive stats → green; Receipts shows `N Snapped`.
2. Export P1 ghost: card title/button copy; tap → sample-export flow unchanged.
3. Export P2 unpaid: `$49` badge visible; tap → Paywall; Maybe later → red banner.
4. Export P3 paid never exported: unlocked copy; tap → ExportEngine without Paywall.
5. Export P4 paid exported: `Tax Filing Ready` / `Export Again`; after export, P4 persists on reload.
6. Export P0: mock date ≤7 days before Apr 15 + paid → `Final Tax Pack Ready` overrides P3/P4.
7. P0 does not apply to unsigned or unpaid users.
8. Share: three buttons work; Learn sheet opens if link kept.
9. Preferences: 72pt rows, icons, notification pill, sub-page BACK → main.
10. Header / account / sign-out unchanged; EN/FR/DE sync.
11. Home Export gate regression-free.

## Success criteria

- Settings main screen matches approved v5 visual hierarchy and export state table.
- Outdoor-readable Summary numerals with v5 semantic colors.
- Export card drives correct gate per user state including 7-day filing deadline override.
- No regression in Paddle, Google gates, Ghost sample export, or tax stats source.
