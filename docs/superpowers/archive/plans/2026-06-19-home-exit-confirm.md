# Home Exit Confirm — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Confirm before exiting the PWA from Home main via edge swipe or system back at exit boundary.

**Architecture:** Pure helpers + `useHomeExitGuard` hook; `ExitConfirmSheet` in HomeScreen when guard fires.

**Spec:** `docs/superpowers/specs/2026-06-19-home-exit-confirm-design.md`

---

### Task 1: Pure helpers (TDD)

**Files:** `lib/client/homeExitGuard.ts`, `lib/client/homeExitGuard.test.ts`

- [ ] `isEdgeTouchStart(x, width, edgePx=24)`
- [ ] `shouldTriggerEdgeExitSwipe(dx, dy, threshold, ratio)` — reuse swipe math
- [ ] `shouldConfirmExitPopState(state, atHomeRoot)` 
- [ ] Unit tests

---

### Task 2: ExitConfirmSheet + i18n

**Files:** `components/home/ExitConfirmSheet.tsx`, locales, `lib/i18n/types.ts`

- [ ] Sheet UI (black/yellow, STAY / EXIT, ≥64px buttons)
- [ ] Keys: `home.exitConfirm.title`, `body`, `stay`, `exit`

---

### Task 3: useHomeExitGuard hook

**Files:** `lib/client/useHomeExitGuard.ts`

- [ ] Props: `enabled`, `onRequestExitConfirm`
- [ ] Edge touch listeners on container ref
- [ ] `popstate` listener when enabled — re-push trap + callback on exit boundary

---

### Task 4: HomeScreen wiring

**Files:** `components/home/HomeScreen.tsx`

- [ ] Compute `exitGuardEnabled` from view/overlay/sheets
- [ ] STAY: close sheet + restore trap
- [ ] EXIT: history.back / close

---

### Task 5: Verification

- [ ] `npm run test:unit`
- [ ] Manual: edge swipe vs widget swipe on device

---

## Related tweak (same PR optional)

- Detail DELETE +20% on current size: `homeVisual.reviewControl.deleteSize` → `h-[5.04rem] w-[5.04rem]`, icon `text-3xl`
