# Android PWA Standalone Launch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden PWA manifest and install/launch UX so Android home-screen icon opens Snap1099 standalone (no Chrome URL bar), with guidance when users open a bookmark shortcut or browser tab instead.

**Architecture:** Manifest adds `display_override` and `start_url` query; i18n clarifies Install app vs shortcut; `LaunchFromHomeHint` shows once in browser tab when install sticky is set but not standalone.

**Tech Stack:** Next.js manifest route · Serwist PWA · React 19 · i18n locales

**Spec:** `docs/superpowers/specs/2026-06-19-android-pwa-standalone-launch-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `app/manifest.ts` | start_url, display_override |
| `components/pwa/LaunchFromHomeHint.tsx` | Tab-after-install banner |
| `components/pwa/PwaInstallProvider.tsx` | Show hint when eligible |
| `lib/i18n/locales/*.ts` | Install + hint copy |
| `lib/copy/userFacing.ts` | Fallback copy |

---

### Task 1: Manifest hardening

**Files:**
- Modify: `app/manifest.ts`

- [ ] **Step 1:** Set `start_url: "/?source=pwa"`.
- [ ] **Step 2:** Add `display_override: ["standalone", "minimal-ui"]`.
- [ ] **Step 3:** Run `npm run build` — confirm manifest route compiles.

---

### Task 2: i18n install copy

**Files:**
- Modify: `lib/i18n/locales/en-US.ts`
- Modify: `lib/i18n/locales/de-DE.ts`
- Modify: `lib/i18n/locales/fr-FR.ts`
- Modify: `lib/copy/userFacing.ts`

- [ ] **Step 1:** Add `pwa.installWebApkLead` (Install app, not bookmark shortcut).
- [ ] **Step 2:** Add `pwa.launchFromHomeHint` + `pwa.launchFromHomeGotIt`.
- [ ] **Step 3:** Update `manualSteps.chromiumAndroid` step 1 if needed for clarity.
- [ ] **Step 4:** Run `npm run test:unit -- lib/i18n/index.test.ts`.

---

### Task 3: LaunchFromHomeHint component

**Files:**
- Create: `components/pwa/LaunchFromHomeHint.tsx`
- Modify: `components/pwa/PwaInstallProvider.tsx`

- [ ] **Step 1:** Create dismissible banner using product colors (black/yellow).
- [ ] **Step 2:** Show when `stickyInstalled && !standalone && platform === chromium-android` and session flag unset.
- [ ] **Step 3:** Dismiss sets `sessionStorage` key; hide install bar when hint shown.
- [ ] **Step 4:** Wire into `PwaInstallProvider` render tree.

---

### Task 4: Manual install sheet lead

**Files:**
- Modify: `components/pwa/InstallManualSheet.tsx` (if separate lead prop needed)

- [ ] **Step 1:** Show `installWebApkLead` above steps for `chromium-android`.

---

### Task 5: Verification

- [ ] **Step 1:** Run `npm run test:unit`.
- [ ] **Step 2:** Manual Android — Install app → launcher → no URL bar.
- [ ] **Step 3:** Manual — bookmark shortcut → URL bar (expected); copy readable.

---

## Manual test checklist

- [ ] WebAPK install from Chrome ⋮ → Install app
- [ ] Launcher icon → full screen
- [ ] Open site in tab after install → hint once
- [ ] Lighthouse PWA installable
