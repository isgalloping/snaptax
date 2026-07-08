# App Navigation History Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync in-app sub-flow navigation with browser History so swipe, BACK button, and Android system back return one level instead of exiting the PWA.

**Architecture:** Pure helpers in `appNavigationHistory.ts`; `useAppNavigation` hook bootstraps trap, pushes state on forward nav, and applies `popstate` to React. HomeScreen and SettingsScreen replace direct `setState` back paths with `navigateBack()`.

**Tech Stack:** React 19 · TypeScript · node:test

**Spec:** `docs/superpowers/specs/2026-06-19-app-navigation-history-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `lib/client/appNavigationHistory.ts` | State key encode/decode, dedupe, trap helpers |
| `lib/client/appNavigationHistory.test.ts` | Unit tests for pure helpers |
| `lib/client/useAppNavigation.ts` | Bootstrap, pushScreen, navigateBack, popstate |
| `components/home/HomeScreen.tsx` | Overlay + view History sync |
| `components/settings/SettingsScreen.tsx` | viewState History sync |
| `components/home/overlays/OverlayShell.tsx` | onBack → navigateBack |
| `components/settings/SettingsSubPageShell.tsx` | onBack → navigateBack |

---

### Task 1: Pure navigation history helpers (TDD)

**Files:**
- Create: `lib/client/appNavigationHistory.ts`
- Create: `lib/client/appNavigationHistory.test.ts`

- [ ] **Step 1:** Define `SnapNavKey` union type and `encodeNavState` / `decodeNavState`.
- [ ] **Step 2:** Write tests — overlay keys, settings keys, missing-item hintId round-trip.
- [ ] **Step 3:** Implement `shouldPushNavState(current, next)` dedupe helper.
- [ ] **Step 4:** Implement `mapPopStateToHomeAction` / `mapPopStateToSettingsAction` pure mappers.
- [ ] **Step 5:** Run `npm run test:unit -- lib/client/appNavigationHistory.test.ts`.

---

### Task 2: useAppNavigation hook

**Files:**
- Create: `lib/client/useAppNavigation.ts`

- [ ] **Step 1:** `bootstrapNavTrap()` — replaceState + pushState `{ snap1099: "home" }`.
- [ ] **Step 2:** `pushScreen(key)` — skip if dedupe says same key.
- [ ] **Step 3:** `navigateBack()` — `history.back()`.
- [ ] **Step 4:** `popstate` listener with `navigatingRef` guard; expose `onPopState` callback for screens.
- [ ] **Step 5:** Return `{ pushScreen, navigateBack, bootstrapNavTrap }` from hook.

---

### Task 3: HomeScreen integration

**Files:**
- Modify: `components/home/HomeScreen.tsx`
- Modify: `components/home/overlays/HomeOverlayHost.tsx` (if back props need navigateBack)

- [ ] **Step 1:** Call `bootstrapNavTrap()` once on mount.
- [ ] **Step 2:** When `setHomeOverlay(non-null)` or `setView("settings")`, call `pushScreen` with matching key.
- [ ] **Step 3:** `popstate` handler updates `homeOverlay` / `view` from decoded key.
- [ ] **Step 4:** Replace overlay `onClose` / `onNavigate` back paths to use `navigateBack()` for back direction; keep forward as setState + push.
- [ ] **Step 5:** Pass `navigateBack` to `OverlayShell` via overlay pages (or context).

---

### Task 4: SettingsScreen integration

**Files:**
- Modify: `components/settings/SettingsScreen.tsx`
- Modify: `components/settings/SettingsHeader.tsx`

- [ ] **Step 1:** On `viewState` change forward, `pushScreen("settings:…")`.
- [ ] **Step 2:** `handleHeaderBack` → `navigateBack()` (export-completed side effects in popstate mapper).
- [ ] **Step 3:** Settings main back → pops to Home (via History stack from Task 3).
- [ ] **Step 4:** Wire `SettingsSubPageShell` `onBack` to `navigateBack`.

---

### Task 5: Swipe-back wiring

**Files:**
- Modify: `components/home/overlays/OverlayShell.tsx`
- Modify: `components/settings/SettingsSubPageShell.tsx`

- [ ] **Step 1:** Accept `onBack` that already calls `navigateBack` from parent (no direct setState in Shell).
- [ ] **Step 2:** Keep `useSwipeBack({ onBack })` unchanged at Shell layer.

---

### Task 6: Verification

- [ ] **Step 1:** Run `npm run test:unit`.
- [ ] **Step 2:** Manual smoke on Android Chrome PWA — overlay back does not exit app (document in PR).
- [ ] **Step 3:** Confirm Widget pager and Sheets unaffected.

---

## Manual test checklist

- [ ] privacy overlay → system back → Home, app open
- [ ] missing list → item → back ×2 → Home
- [ ] Settings → Language → back ×2 → Home
- [ ] Home trap: first back no exit
