# PWA Cross-Context Installed Detection — Design

**Date:** 2026-06-10  
**Status:** Approved  
**Builds on:** `2026-06-10-pwa-cross-browser-install-design.md`, `2026-06-10-pwa-manual-install-ack-design.md`

## Problem

User installs Snap1099 as a PWA, then opens the site in a **browser tab** (same or different browser). Install bar / header button still appears — feels like a dead-end loop even though the app is already on the device.

**User goal (option C):** Hide all install UI whenever the app is installed, to the extent platform APIs allow. Document honest limits for cross-engine cases.

## Current behavior (bugs)

| Signal | Current | Issue |
|--------|---------|-------|
| `display-mode: standalone` | ✓ hides UI | Does not mark sticky flag for sibling tabs |
| `getInstalledRelatedApps()` | Used | Manifest lacks `related_applications` → often returns `[]` in Chromium tabs |
| `localStorage` sticky | Set on hit / `appinstalled` | **Cleared** when related apps returns `[]` — breaks Safari (no API) and flaky Chromium |

## Product rules (R4 extended)

| # | Condition | Install UI |
|---|-----------|-----|
| R4a | Running in standalone / iOS A2HS context | None |
| R4b | Chromium tab + same profile PWA installed (`getInstalledRelatedApps` hit) | None |
| R4c | Same browser profile previously detected installed (sticky `localStorage`) | None |
| R4d | None of above + eligible platform + landing done | Bar or header-button (existing R1–R3) |

Existing R1–R3 (bar → Not now / Got it → header-button) unchanged.

## Platform boundaries (documented, not bugs)

| Scenario | Expected UI |
|----------|-------------|
| Chrome PWA installed → Chrome browser tab (same profile) | Hidden |
| Chrome PWA installed → Edge or Safari | May still show — separate engine / install registry |
| Safari A2HS, user never launched from home screen → Safari tab | May still show — no `getInstalledRelatedApps` |
| Safari A2HS, user opened PWA at least once → Safari tab | Hidden (sticky flag, shared WebKit storage) |
| User uninstalls PWA on Chromium | Sticky cleared when API returns `[]`; install UI may return |

## Recommended approach: layered client detection

Rejected alternatives:

- **Server-side Ghost flag** — cross-browser sync but needs network, privacy/API scope; overkill for MVP.
- **localStorage-only** — misses Chromium tab detection and weak uninstall path.

### Detection flow

```
isPwaInstalledOnDevice():
  1. if standalone → markPwaInstalledLocally() → true
  2. if navigator.getInstalledRelatedApps exists (Chromium path):
       related = await query()
       if related.length > 0 → mark → true
       else → clearPwaInstalledLocally() → false   // uninstall recovery
  3. else (Safari / no API):
       return readPwaInstalledLocally()             // never clear here
```

Sticky flag sources:

- Standalone launch (step 1)
- Chromium `appinstalled` event (existing in `deferredInstall.ts`)
- Chromium `getInstalledRelatedApps` hit (step 2)

## Manifest change

Add self-referencing `related_applications` (required for Chromium tab detection):

```typescript
related_applications: [
  {
    platform: "webapp",
    url: "/manifest.webmanifest",
    id: "/",
  },
],
```

Keep `id: "/"` (already present). Do **not** set `prefer_related_applications: true`.

## Code touchpoints

| File | Change |
|------|--------|
| `app/manifest.ts` | Add `related_applications` |
| `lib/pwa/installedDetect.ts` | Layered detection; standalone marks sticky; Safari branch never clears sticky |
| `lib/pwa/installedDetect.test.ts` | Pure helper tests for resolve + new `evaluateInstalledState` helper if extracted |
| `docs/superpowers/specs/2026-06-10-pwa-cross-browser-install-design.md` | Update Installed detection section to reference this spec |

No changes to `PwaInstallProvider` logic beyond existing `visibilitychange` recheck.

## Testing

### Unit

- Standalone → installed + would mark
- Chromium: related apps non-empty → installed
- Chromium: related apps empty → not installed + clear sticky
- No API + sticky `1` → installed
- No API + no sticky → not installed
- `resolveInstallUiModeWithInstalled(true, …)` → `none`

### Manual (HTTPS production)

1. Android Chrome: install PWA → open site in browser tab → no bar, no header button.
2. Uninstall PWA → browser tab → install UI returns.
3. iOS Safari: A2HS → launch from home screen once → Safari tab → no install UI.
4. Chrome installed → Edge visit → accept possible install UI (documented limit).

## Non-goals

- Cross-engine install detection (Chrome ↔ Safari ↔ Edge)
- Server-persisted install state
- Changing bar / header / Not now / Got it rules

## Decision log

| Date | Decision |
|------|----------|
| 2026-06-10 | User chose scope C: best-effort + documented limits |
| 2026-06-10 | Layered client detection (manifest + sticky + Chromium API) |
| 2026-06-10 | Clear sticky only on Chromium path when related apps empty |
