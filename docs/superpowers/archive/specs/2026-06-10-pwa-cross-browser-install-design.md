# PWA Cross-Browser Install — Design

**Date:** 2026-06-10  
**Status:** Approved (design)  
**Scope:** iOS Safari, macOS Safari, Android/Desktop Chromium (Chrome + Edge)  
**Builds on:** `2026-06-10-pwa-install-ui-modes-design.md`, `2026-06-10-pwa-install-prompt-design.md`

## Goal

Extend install UI (bottom bar → Not now → header button) to **Safari and Edge** on all target platforms, with platform-correct manual install steps when native `beforeinstallprompt` is unavailable.

## Product rules (unchanged)

| # | Condition | UI |
|---|-----------|-----|
| R1 | First visit, not installed, eligible | Bottom bar |
| R2 | Return visit, not Not now, not installed | Bottom bar |
| R3 | Not now tapped, not installed | Header install button only (until installed) |
| R4 | Installed | Nothing |

## Platform matrix

| Platform ID | Detection | Native prompt | Manual sheet |
|-------------|-----------|---------------|--------------|
| `chromium-android` | Android + Chrome/EdgA | `beforeinstallprompt` if fired | ⋮ → Install app |
| `chromium-desktop` | Desktop Edg/ or Chrome (not mobile) | `beforeinstallprompt` if fired | ⋮ → Apps → Install |
| `ios-safari` | iPhone/iPad Safari (not CriOS/FxiOS/EdgiOS) | Never | Share → Add to Home Screen |
| `macos-safari` | Mac Safari (not Chrome) | Never | Share → Add to Dock |
| `none` | Firefox, etc. | — | No install UI |

Desktop Chrome uses same path as Desktop Edge (`chromium-desktop`).

## Installed detection

See **`2026-06-10-pwa-cross-context-installed-design.md`** for full rules.

Summary:

- Standalone / iOS A2HS → installed
- Chromium tab → `getInstalledRelatedApps()` + manifest `related_applications`
- Safari → sticky `localStorage` after standalone launch or Chromium `appinstalled`
- Cross-engine (Chrome ↔ Safari ↔ Edge) → not detectable; install UI may remain

## Eligibility

```typescript
eligible =
  landing-done
  && !isInstalled
  && platform !== 'none'
```

Chromium: eligible even without `beforeinstallprompt` (manual fallback).  
Safari: always manual; eligible in browser tab only.

## Install action

1. **Chromium:** `getDeferredInstallPrompt()` → `prompt()` on user gesture; on miss/failure → `InstallManualSheet` with platform steps.
2. **Safari:** `install()` opens `InstallManualSheet` directly (no prompt attempt).

## Architecture

| File | Role |
|------|------|
| `lib/pwa/installPlatform.ts` | Pure UA → platform + manual copy keys |
| `lib/pwa/deferredInstall.ts` | `isInstalled()`, `isInstallEligible()` uses platform |
| `components/pwa/InstallManualSheet.tsx` | Renders steps from platform |
| `lib/copy/userFacing.ts` | Per-platform step strings |
| `lib/pwa/installPlatform.test.ts` | UA fixture tests |

## Non-goals

- Firefox-specific flows
- Changing Not now permanence or bar/header rules
- In-app detection of Chrome「在应用中打开」chip

## Acceptance

1. iOS Safari tab: bar after landing; Not now → header button; Install → iOS sheet.
2. Desktop Edge: bar; Install → prompt or desktop sheet.
3. Android Edge: same as Android Chrome.
4. Standalone / Add to Home Screen launch: no install UI.
5. `npm run build` + platform unit tests pass.

## Decision log

| Date | Decision |
|------|----------|
| 2026-06-10 | Scope A: iOS + Android Edge + Desktop Edge (+ Desktop Chrome via chromium-desktop) |
| 2026-06-10 | Safari always manual sheet; Chromium prompt-first |
