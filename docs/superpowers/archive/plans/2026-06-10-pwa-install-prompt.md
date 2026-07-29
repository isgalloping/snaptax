# PWA Install Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Android Chrome install banner — early `beforeinstallprompt` capture, show after Landing, 7-day Not now dismiss.

**Architecture:** Module singleton `deferredInstall.ts` registers listener on import; `InstallPrompt` gates on `landing-done` + dismiss TTL; `LandingGate` dispatches `snap1099:landing-done`.

**Tech Stack:** Next.js 16 client components, localStorage, `beforeinstallprompt` API

**Spec:** `docs/superpowers/specs/2026-06-10-pwa-install-prompt-design.md`

---

### Task 1: deferredInstall module + unit tests

**Files:**
- Create: `lib/pwa/deferredInstall.ts`
- Create: `lib/pwa/deferredInstall.test.ts`

- [ ] Add capture singleton, dismiss helpers, `isDismissedWithinWindow` (testable)
- [ ] Run: `node --import tsx --test lib/pwa/deferredInstall.test.ts`

### Task 2: Landing done event

**Files:**
- Modify: `components/landing/LandingGate.tsx`

- [ ] Dispatch `snap1099:landing-done` in `finishExit`

### Task 3: InstallPrompt refactor

**Files:**
- Modify: `components/pwa/InstallPrompt.tsx`
- Modify: `components/pwa/PwaProvider.tsx`

- [ ] Side-effect import init; gates + z-50

### Task 4: Verify

- [ ] Run: `npm run build`
