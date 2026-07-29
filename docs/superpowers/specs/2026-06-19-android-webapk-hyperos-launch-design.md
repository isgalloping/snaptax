# Android WebAPK HyperOS Launch — Design

**Date:** 2026-06-19  
**Status:** Approved  
**Builds on:** [`archive/specs/2026-06-19-android-pwa-standalone-launch-design.md`](../archive/specs/2026-06-19-android-pwa-standalone-launch-design.md), [`archive/specs/2026-06-10-pwa-cross-browser-install-design.md`](../archive/specs/2026-06-10-pwa-cross-browser-install-design.md) · canonical: [`docs/tech/13-pwa-install-architecture.md`](../../tech/13-pwa-install-architecture.md)  
**Scope:** Fix HyperOS/MIUI launch failure when user denies Chrome permission; reduce WebAPK desync; guide users through pre/post install.

## Problem

On **Xiaomi HyperOS / MIUI**, after correct WebAPK install (via in-app header install button → `beforeinstallprompt` → Chrome **Install app**), tapping the home-screen icon shows a **system dialog**:

> **启动应用** — Snap1099 想要打开 Chrome，是否允许？  
> **拒绝** | **始终允许**

If the user taps **拒绝 (Deny)**, the app **cannot start** (stuck on splash). This dialog fires **before any web JavaScript runs** — it cannot be intercepted or replaced in code.

**Root cause:** Android WebAPK (`org.chromium.webapk.*`) delegates rendering to Chrome. HyperOS adds an **app-jump permission** layer requiring explicit consent to open Chrome.

**Confirmed user path:** Top-right header install button (phone+ icon) → native WebAPK install — **not** a bookmark shortcut.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Approach | **Manifest hardening + pre/post install Bottom Sheets** (no TWA/APK) |
| `start_url` | Revert to **`"/"`** (align with `id: "/"`; reduce WebAPK update desync) |
| `display_override` | Keep `["standalone", "minimal-ui"]` |
| `related_applications` | Keep (supports `getInstalledRelatedApps`) |
| `launch_handler` | Add `{ client_mode: "navigate-existing" }` (Chrome 97+) |
| Pre-install sheet | Show on **chromium-android** before `deferredPrompt.prompt()` when prompt available |
| Post-install sheet | Show on **`appinstalled`** event while still in browser tab |
| Manual install path | Append Chrome-permission step to `manualSteps.chromiumAndroid` |
| OEM targeting | Copy applies to **all Android Chrome** (not MIUI-only detection) |
| HyperOS dialog | **Cannot eliminate** — educate user to tap **Always allow / 始终允许** |

## Manifest changes

`app/manifest.ts`:

```typescript
start_url: "/",
display: "standalone",
display_override: ["standalone", "minimal-ui"],
launch_handler: { client_mode: "navigate-existing" },
// id, scope, related_applications, icons unchanged
```

If Next.js `MetadataRoute.Manifest` lacks `launch_handler`, use a typed spread or module augmentation — runtime manifest must include the field.

## UX flows

### Pre-install (before native prompt)

```
User taps Install (bar or header button)
  → WebApkLaunchGuideSheet variant="pre-install"
  → User taps "Continue install"
  → deferredPrompt.prompt()
  → Chrome native install dialog
```

When `beforeinstallprompt` is unavailable, skip pre-install sheet → open `InstallManualSheet` (existing path).

### Post-install (after accept)

```
appinstalled event fires
  → WebApkLaunchGuideSheet variant="post-install"
  → User taps "Got it"
  → User goes to home screen → taps icon → taps 始终允许 if prompted
```

### Manual install sheet

Add final step to `manualSteps.chromiumAndroid`:

> On first launch from your home screen, if your phone asks to open Chrome, tap **Always allow**. Denying will prevent the app from opening.

## Copy keys (i18n en/de/fr)

| Key | Purpose |
|-----|---------|
| `pwa.webApkGuide.preInstallTitle` | Pre-install sheet title |
| `pwa.webApkGuide.preInstallBody` | Chrome permission warning |
| `pwa.webApkGuide.continueInstall` | Primary CTA → triggers prompt |
| `pwa.webApkGuide.postInstallTitle` | Post-install sheet title |
| `pwa.webApkGuide.postInstallSteps` | Numbered steps (string[]) |
| `pwa.webApkGuide.gotIt` | Dismiss post-install |

Existing `installWebApkLead` and `launchFromHomeHint` remain unchanged.

## Files

| Path | Action |
|------|--------|
| `app/manifest.ts` | **Modify** — `start_url`, `launch_handler` |
| `components/pwa/WebApkLaunchGuideSheet.tsx` | **New** — pre/post variants |
| `components/pwa/PwaInstallProvider.tsx` | **Modify** — gate install + post-install sheet |
| `components/pwa/InstallManualSheet.tsx` | **Modify** — optional (step in i18n only) |
| `lib/i18n/types.ts` | **Modify** — `webApkGuide` keys |
| `lib/i18n/locales/en-US.ts` | **Modify** |
| `lib/i18n/locales/de-DE.ts` | **Modify** |
| `lib/i18n/locales/fr-FR.ts` | **Modify** |
| `lib/copy/userFacing.ts` | **Modify** — fallback if referenced |
| [`archive/specs/2026-06-19-android-pwa-standalone-launch-design.md`](../archive/specs/2026-06-19-android-pwa-standalone-launch-design.md) | Historical — `start_url` superseded; see [`docs/tech/13-pwa-install-architecture.md`](../../tech/13-pwa-install-architecture.md) |

## Testing

### Automated

- i18n shape test passes (`lib/i18n/index.test.ts`)
- Optional: manifest snapshot test for `start_url: "/"` and `launch_handler`

### Manual (Xiaomi HyperOS)

1. Uninstall existing Snap1099 shortcut/WebAPK
2. Clear Chrome site data for domain
3. Open site → tap header install → **pre-install sheet** → Continue → Chrome install
4. After install → **post-install sheet** → Got it
5. Home screen icon → system Chrome dialog → **始终允许** → app opens standalone (no URL bar)
6. Repeat install → deny on step 5 → app stuck (expected); reinstall with 始终允许 fixes

## Success criteria

- Pre/post install sheets appear on Android Chrome install path
- Manifest `start_url` is `/` with `launch_handler`
- Manual Android steps include Chrome permission guidance
- Unit tests and `npx next build` pass

## Out of scope

- TWA / Play Store APK wrapper
- Runtime detection of denied permission (JS never runs)
- Deep-link into HyperOS system settings
- Eliminating the HyperOS system dialog

## Non-goals

- Changing install bar / Not now / header-button eligibility rules
- Replacing `LaunchFromHomeHint` (complementary, not removed)
