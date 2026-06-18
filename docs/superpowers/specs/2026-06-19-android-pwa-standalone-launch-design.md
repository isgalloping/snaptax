# Android PWA Standalone Launch — Design

**Date:** 2026-06-19  
**Status:** Approved (design)  
**Builds on:** `2026-06-10-pwa-cross-browser-install-design.md`, `2026-06-10-pwa-cross-context-installed-design.md`  
**Scope:** Ensure Android home-screen launch opens Snap1099 as a **standalone PWA window** (no Chrome URL bar), and guide users away from bookmark shortcuts.

## Problem

On Android, tapping the home-screen icon opens **Chrome browser tab** (address bar visible) instead of an installed **WebAPK / standalone** window.

**Common causes:**

| Cause | Type |
|-------|------|
| User added a **bookmark shortcut**, not "Install app" WebAPK | User action |
| PWA installability criteria not met (manifest / SW / icons) | Technical |
| User opens site in Chrome tab after install instead of launcher icon | UX |

Code cannot force WebAPK creation if the OS installed a shortcut only. We **harden manifest**, **verify installability**, and **improve install + launch guidance**.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Approach | **Manifest hardening + install/launch UX** (no TWA/APK wrapper) |
| `start_url` | `/?source=pwa` (scope remains `/`) |
| `display_override` | `["standalone", "minimal-ui"]` |
| `related_applications` | Keep self-reference; **do not** set `prefer_related_applications: true` |
| Tab-after-install hint | Show once when `stickyInstalled && !standalone` in browser tab |
| Copy | Emphasize **Install app** vs bookmark shortcut on Android |

## Manifest changes

`app/manifest.ts`:

```typescript
start_url: "/?source=pwa",
display: "standalone",
display_override: ["standalone", "minimal-ui"],
// id, scope, related_applications, icons unchanged
```

Verify existing:

- `id: "/"`
- `scope: "/"`
- Icons 192 + 512 (any + maskable)
- Serwist SW at `/serwist/sw.js` registered via `PwaProvider`

## Install UX changes

### Android manual sheet (`chromium-android`)

Add lead line (i18n en/de/fr):

> Use **Install app** — not a bookmark shortcut. The app opens full-screen from your home screen.

Existing step list stays; step 1 clarifies ⋮ → **Install app** (not "Add to Home screen" shortcut when both shown).

### Post-install tab detection

When all true:

- `readPwaInstalledLocally() === true` OR `getInstalledRelatedApps()` hit
- `!isStandaloneDisplayMode()`
- `getInstallPlatform() === "chromium-android"`
- Not dismissed this session (`sessionStorage` flag)

Show lightweight banner or one-time sheet:

> Open Snap1099 from your **home screen icon**, not inside Chrome.

Dismiss: "Got it" → set session flag; no permanent block.

## Files

| Path | Action |
|------|--------|
| `app/manifest.ts` | **Modify** — `start_url`, `display_override` |
| `lib/i18n/locales/en-US.ts` | **Modify** — install copy keys |
| `lib/i18n/locales/de-DE.ts` | **Modify** — same |
| `lib/i18n/locales/fr-FR.ts` | **Modify** — same |
| `lib/copy/userFacing.ts` | **Modify** — fallback strings if used |
| `components/pwa/LaunchFromHomeHint.tsx` | **New** — tab-after-install hint |
| `components/pwa/PwaInstallProvider.tsx` | **Modify** — mount hint when conditions met |
| `docs/superpowers/specs/2026-06-10-pwa-cross-browser-install-design.md` | **Modify** — cross-ref standalone launch spec |

## Testing

### Automated

- Manifest test or snapshot: `start_url`, `display_override` present
- Existing `installPlatform.test.ts` unchanged

### Manual (Android Chrome)

1. Clear site data → visit → Landing → Install app → launcher icon → **no URL bar**
2. Add bookmark shortcut only → launcher → **has URL bar** (expected) → hint copy accurate
3. Install app → open URL in Chrome tab → hint appears once
4. Lighthouse → PWA installable + maskable icon pass

## Success criteria

- Production manifest meets Chrome installability checklist
- Android install copy clearly distinguishes WebAPK vs shortcut
- Users who open installed app in tab see actionable hint
- QA confirms WebAPK path launches standalone

## Out of scope

- Trusted Web Activity (TWA) / Play Store APK
- Forcing Chrome uninstall or blocking browser tab usage
- Cross-engine detection (Chrome install → Edge tab)

## Non-goals

- Changing install bar / Not now / header-button rules
- Server-side install tracking
