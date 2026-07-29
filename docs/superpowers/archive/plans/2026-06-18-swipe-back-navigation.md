# Swipe-Back Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable bidirectional horizontal swipe-back on full-screen sub-flows by reusing existing `onBack` handlers.

**Architecture:** `useSwipeBack` hook detects horizontal touch gestures; `OverlayShell` and `SettingsSubPageShell` attach the hook to their root container. No navigation stack.

**Tech Stack:** React 19 · TypeScript · node:test

**Spec:** `docs/superpowers/specs/2026-06-18-swipe-back-navigation-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `lib/client/useSwipeBack.ts` | Touch gesture → `onBack` when threshold met |
| `lib/client/useSwipeBack.test.ts` | Pure helper tests (direction/threshold math) |
| `components/home/overlays/OverlayShell.tsx` | Wire hook to overlay root |
| `components/settings/SettingsSubPageShell.tsx` | Wire hook to settings sub-page root |

---

### Task 1: Gesture helper + hook (TDD)

**Files:**
- Create: `lib/client/useSwipeBack.ts`
- Create: `lib/client/useSwipeBack.test.ts`

- [ ] **Step 1:** Export pure `shouldTriggerSwipeBack({ dx, dy, thresholdPx })` for unit tests.
- [ ] **Step 2:** Write tests — `\|dx\|≥60` + horizontal dominant → true; vertical scroll → false; both ±dx → true.
- [ ] **Step 3:** Implement `useSwipeBack({ onBack, enabled, thresholdPx })` with ref callback attaching touch listeners; call `onBack` once on `touchend` when valid.
- [ ] **Step 4:** Run `npm run test:unit -- lib/client/useSwipeBack.test.ts`.

---

### Task 2: OverlayShell integration

**Files:**
- Modify: `components/home/overlays/OverlayShell.tsx`

- [ ] **Step 1:** Apply `useSwipeBack({ onBack })` to root full-screen container (`absolute inset-0` div).
- [ ] **Step 2:** Ensure vertical scroll in children still works (`touch-action` / no preventDefault on vertical moves).
- [ ] **Step 3:** Manual smoke — open privacy-trust overlay, swipe left and right → closes.

---

### Task 3: SettingsSubPageShell integration

**Files:**
- Modify: `components/settings/SettingsSubPageShell.tsx`

- [ ] **Step 1:** Same hook on sub-page root.
- [ ] **Step 2:** Verify `ExportCompletedPage` / `SampleExportPage` inherit via shell.
- [ ] **Step 3:** Manual smoke — Settings → Language, swipe → returns to main.

---

### Task 4: Regression checks

- [ ] **Step 1:** Home main — widget pager swipe still pages; no back triggered.
- [ ] **Step 2:** Missing deductions list → item → swipe back twice reaches Home (no loop).
- [ ] **Step 3:** Receipt detail sheet / camera — swipe does not dismiss (out of scope).
- [ ] **Step 4:** `npm run test:unit` full suite.

---

## Manual test checklist

- [ ] Home overlay: left swipe ≡ BACK
- [ ] Home overlay: right swipe ≡ BACK
- [ ] Missing item → list → Home via two swipes
- [ ] Settings sub-page → main via swipe
- [ ] Settings main: no swipe-back
- [ ] Widget pager: unaffected
