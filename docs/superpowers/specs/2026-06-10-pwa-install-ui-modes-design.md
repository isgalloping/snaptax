# PWA Install UI Modes — Design

**Date:** 2026-06-10  
**Status:** Approved (design)  
**Supersedes:** §3 Not now TTL in `2026-06-10-pwa-install-prompt-design.md` (7-day full suppress)  
**Platform:** Android Chrome / Edge browser tab

## Product rules

| # | Condition | UI |
|---|-----------|-----|
| **R1** | First visit, not installed, eligible | **Bottom bar** (Install + Not now) |
| **R2** | Non-first visit, not installed, never tapped Not now | **Bottom bar** |
| **R3** | Tapped **Not now** on bottom bar, still not installed | **Header install button only** (no bottom bar), until installed |
| **R4** | Installed (standalone) | **Nothing** |

**Not now (R3):** permanent switch to header button until user installs or clears site data (**Option A**).

## State machine

```
eligible = browser tab ∧ landing-done ∧ Android Chrome/Edge ∨ beforeinstallprompt
standalone → none

eligible ∧ dismissed_bar → header-button
eligible ∧ ¬dismissed_bar → bar
```

## Storage

| Key | Purpose |
|-----|---------|
| `snap1099_pwa_has_visited` | `"1"` after first `landing-done` (R1 vs R2 — same UI) |
| `snap1099_pwa_install_dismissed_at` | ISO timestamp when user taps Not now → header mode |

## UI placement

Header row (left → right): **Install** | Sync | Settings — matches product mockup red box.

Shared install action: native `prompt()` when captured; else show `USER_COPY.pwa.manualHint`.

## Architecture

- `lib/pwa/deferredInstall.ts` — `getInstallUiMode()`, `markPwaVisited()`, eligibility
- `components/pwa/PwaInstallProvider.tsx` — single React state + subscriptions
- `InstallPrompt` — renders only when `mode === 'bar'`
- `TaxHeader` — header button when `mode === 'header-button'`

## Non-goals

- iOS manual A2HS flow
- Re-show bottom bar after Not now
