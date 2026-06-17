# Settings Page Redesign — Design

**Date:** 2026-06-17  
**Status:** Approved (design)  
**References:** `docs/prd/settings.md` · `docs/ui/snaptax-settings-ui.png`  
**Scope:** Settings visual hierarchy, Tax Overview panel, prominent export gate, referral UI, collapsed preferences; no referral backend or push notifications.

## Summary

Restructure the Settings screen to match `docs/prd/settings.md`: account pressure/compact states, black-gold Tax Overview trio, full-width $49 export CTA, simplified share/referral card, and low-frequency preferences collapsed at the bottom. Ghost users tapping Export in Settings get the D-scheme sample CSV (no Google/Paywall). Tax stats are passed from HomeScreen for consistency with the home dashboard.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Referral / Notification | UI only — new copy + grey card; Notification toggle disabled with "Coming soon" |
| Ghost Export (Settings) | D scheme — sample CSV via `downloadOnboardingSampleCsv`; no Google Sheet / Paywall |
| Logged-in Export | Existing `useTaxExportGate` — Paywall if unpaid, Export Again if paid |
| Home Export | **Unchanged** — still uses full export gate |
| Tax Overview data | Props from `HomeScreen` (same source as home header/widgets) |
| Signed-in account | Initials avatar + `googleUser.name`; Sign out moved to page footer |
| Implementation | **方案 1** — block component decomposition |

## Layout & information architecture

```
┌─ Header: < BACK | SETTINGS ─────────────────┐
├─ [1] Account Block ─────────────────────────┤
│   Unsigned: headline warning + CONTINUE WITH GOOGLE │
│   Signed-in: Avatar + Name + Season·Paid (compact)   │
├─ [2] Tax Overview (black-gold three columns) ────────┤
│   Est. Tax Saved | Receipts Tracked | Total Deductions │
├─ [3] EXPORT {season} IRS TAX PACK ($49) ─────────────┤
│   Full-width yellow CTA + lock; no "Tax Export" heading │
├─ [4] Share & Referral (minimal dark grey card) ──────┤
│   "Tell a fellow 1099 contractor to get 1 Year Free" │
├─ [5] Preferences ▾ (collapsed by default) ───────────┤
│   Language · Industry · Notifications (Coming soon) │
│   Help · Privacy & Data · Delete Account             │
├─ [6] SIGN OUT (signed-in only, page footer) ─────────┤
└──────────────────────────────────────────────────────┘
```

Block order is strict per PRD §1–5. Sign out is removed from the account card and placed in a dedicated footer.

### PRODUCT-SPEC update (§3 Settings IA)

Replace the flat settings list with the block order above. Note Settings Export ghost fast-lane (sample CSV) vs Home export gate.

## [1] Account Block

Replace `AccountStatusBlock` usage in Settings with `SettingsAccountBlock`.

### Unsigned (pressure state)

- Prominent headline: `Not signed in · Data lost if you change phones` (existing i18n `settings.account.notSignedIn`)
- Full-width yellow **Continue with Google** CTA, `min-h-16`, directly below headline
- De-emphasize or remove secondary backup hint paragraph (PRD prioritizes headline + CTA)
- Opens existing soft/hard `GoogleSignInSheet` on tap

### Signed-in (compact state)

- Horizontal row: **Avatar** (48px circle, initials from `googleUser.name`, yellow fill / black text) + text column
- Primary: `googleUser.name`
- Secondary (when `seasonPaid`): `{currentSeason} Tax Season · Paid ✓` in yellow
- No Sign out button in this block
- Transition: `transition-all duration-300` when switching unsigned → signed-in (height collapse ~pressure → ~72px)

### Avatar initials

- Split `name` on whitespace; take first char of first two tokens, uppercase (e.g. "John Contractor" → `JC`)
- Fallback: first char of email if name empty

## [2] Tax Overview Panel

**New component:** `TaxOverviewPanel`

### Visual

- Container: `bg-zinc-900`, subtle yellow border `border-yellow-500/30`, soft glow `shadow-[0_0_24px_rgba(234,179,8,0.08)]`, `rounded-2xl`
- Three equal columns: `grid grid-cols-3 divide-x divide-zinc-700`
- Each column: uppercase label `text-[10px]`, value `text-xl font-black`

| Column | Prop | Display | Color |
|--------|------|---------|-------|
| Est. Tax Saved | `taxSaved` | `formatCurrency` or `$—` if null | green-400 |
| Receipts Tracked | `receiptCount` | integer | blue-400 |
| Total Deductions | `totalDeductions` | `formatCurrency` | yellow-400 |

### Data source

Passed from `HomeScreen` — do not re-fetch IndexedDB in Settings:

```typescript
interface SettingsTaxStats {
  taxSaved: number | null;
  receiptCount: number;
  totalDeductions: number;
}
```

- `totalDeductions` = `taxYearDeductions(displayReceipts, currentCalendarYear, clientTimeZone)`
- `receiptCount` = length of display receipt list (same as home TaxHeader)
- `taxSaved` = same value as home Est. Tax Saved

## [3] Tax Export Gate

Refactor `TaxExportSection`:

- **Remove** section title (`Tax Export` / `h2`)
- Full-width yellow button immediately below Tax Overview:
  - Unpaid: `🔒 EXPORT {season} IRS TAX PACK ($49)` (lock icon + i18n `buttonLocked`)
  - Paid: `Export Again`
  - Busy: `Exporting…`
- Styling: `min-h-16`, `border-4 border-white`, `bg-yellow-500`, black uppercase text

### Click behavior (Settings only)

```
User taps Export in Settings
├─ Ghost (not signed in)
│   └─ D scheme:
│       ensureOnboardingDemoDone() → downloadOnboardingSampleCsv(demo)
│       (~1s client-side CSV download)
│       If user is in onboarding aha/stage_3 flow → also completeAhaCoach()
│       NO GoogleSignInSheet, NO PaywallSheet
├─ Signed in + season unpaid → existing Paywall / Google hard gate via useTaxExportGate
└─ Signed in + season paid → Export Again (existing)
```

**Home screen export** (TaxHeader, CPA Ready widget) continues to use `useTaxExportGate` without the ghost sample-CSV fast lane.

## [4] Share & Referral Card

Refactor `ShareAppSection`:

- Single dark grey card: `bg-zinc-900 border border-zinc-800 rounded-2xl p-4`
- Top CTA (white, bold): `Tell a fellow 1099 contractor to get 1 Year Free`
- Share row: WhatsApp / Facebook / More — unified `bg-zinc-800` tiles (remove per-button heavy borders)
- Optional footnote: `Share with 3 friends — reward program coming soon` (muted zinc-500)
- **No** referral count, **no** entitlement grant, **no** backend API

Existing share mechanics (`shareAppViaNative`, WhatsApp/Facebook URLs) unchanged.

## [5] Preferences (collapsed)

Keep `SettingsPreferencesSection` default `expanded = false`.

Add **Notifications** row inside expanded content:

- Label: `Notifications`
- Control: toggle **disabled**, label `Coming soon`
- No push permission request, no service worker notification logic

Unchanged when expanded: Language, Your Industry, Help, Privacy & Data, Delete Account.

## [6] Sign Out Footer

- Render only when `isSignedIn`
- Full-width button at bottom of scroll area (below Preferences)
- Reuse existing sign-out confirmation bottom sheet and offline/error handling
- Remove Sign out from account card

## Preserved behavior

- First-visit Settings soft Google Sheet (T2, `SETTINGS_VISITED_KEY`, 300ms delay)
- `requestSoftGoogleSheet` from home nudge
- PaywallSheet + Paddle $49 + device-loss warning
- Delete Account sheet (signed-in API / ghost local clear)
- Terms / Privacy Legal sheets
- Industry PATCH when signed in + online
- i18n (en-US required; fr/de mirror keys)

## Out of scope

- Referral backend, 3-person counter, free-year entitlement
- Real push notifications / PWA notification permission
- Google profile photo URL (initials avatar only)
- Flash Finish, Tax Tools menu, CPA PDF format picker (design mockup extras not in PRD)
- Changing Home export gate for ghost users

## Files

| Path | Action |
|------|--------|
| `components/settings/TaxOverviewPanel.tsx` | **New** |
| `components/settings/SettingsAccountBlock.tsx` | **New** |
| `components/settings/TaxExportSection.tsx` | Modify — no heading, button copy/style |
| `components/settings/ShareAppSection.tsx` | Modify — grey card, referral CTA |
| `components/settings/SettingsPreferencesSection.tsx` | Modify — Notification placeholder |
| `components/settings/SettingsScreen.tsx` | Reorder blocks, footer sign-out, ghost export branch |
| `components/home/HomeScreen.tsx` | Pass `SettingsTaxStats`; Settings export handler |
| `lib/ui/settingsVisual.ts` or extend `lib/ui/homeVisual.ts` | Overview tokens |
| `lib/i18n/types.ts` + locales | overview labels, referral CTA, notifications |
| `docs/product/PRODUCT-SPEC.md` | §3 Settings IA |

## Testing

1. Ghost taps Settings Export → sample CSV downloads; no Google/Paywall sheets
2. Signed-in unpaid → Paywall appears as today
3. Signed-in paid → Export Again works
4. Tax Overview numbers match Home header at time of navigation
5. Unsigned account shows pressure copy + Google CTA
6. Signed-in shows initials avatar, name, Paid line when applicable; Sign out at footer only
7. Preferences collapsed by default; Notification toggle disabled
8. First Settings visit still opens soft Google Sheet when eligible
9. Home Export behavior unchanged for ghost

## Success criteria

- Settings page block order and visual hierarchy match `docs/prd/settings.md`
- Tax Overview visible above export CTA with live stats from home
- Export CTA is the dominant yellow action (no buried section title)
- Share section uses minimal grey card with 1 Year Free messaging
- Low-frequency settings remain collapsed; Notification shows Coming soon
- Ghost Settings export delivers sample CSV without auth friction
