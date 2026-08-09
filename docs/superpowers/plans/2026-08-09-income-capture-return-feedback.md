# 1099 Income Capture Return + Feedback — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After Snap 1099-NEC/K, return to home receipt list with two-phase capture feedback and single-shot camera.

**Architecture:** Income intent ref in HomeScreen drives single-shot camera, home navigation on success, `captureKind` on StoredReceipt, and receipt status watcher for phase-2 banner updates.

**Spec:** `docs/superpowers/specs/2026-08-09-income-capture-return-feedback-design.md`

## Global Constraints

- Core snap flow stays zero Modal; reuse yellow `receiptNotice` banner
- Normal SNAP RECEIPT batch camera unchanged
- English UI strings in i18n
- Hot zones unchanged

---

### Task 1: Feedback copy helpers + i18n

**Files:**
- Create: `lib/client/incomeCaptureFeedback.ts`
- Create: `lib/client/incomeCaptureFeedback.test.ts`
- Modify: `lib/i18n/types.ts`, `lib/i18n/locales/en-US.ts`

- [ ] **Step 1: Add i18n keys** under `home.incomeCapture`

- [ ] **Step 2: Implement pure functions**

```ts
export function incomeCapturePhase1Message(form: IncomeCaptureKind, copy: ...): string
export function incomeCapturePhase2SuccessMessage(receipt: Receipt, form: IncomeCaptureKind, copy: ...): string
export function incomeCapturePhase2BlurryMessage(form: IncomeCaptureKind, copy: ...): string
```

- [ ] **Step 3: Unit tests** for payer present/absent, NEC vs K

Run: `npm run test:unit -- lib/client/incomeCaptureFeedback.test.ts`

---

### Task 2: Persist captureKind at capture

**Files:**
- Modify: `lib/client/prepareReceiptCapture.ts` (optional `captureKind?: IncomeCaptureKind`)
- Modify: `components/home/HomeScreen.tsx` `handleCapture`

- [ ] **Step 1:** Pass `peekPendingIncomeCapture()` into prepare when creating receipt; set `captureKind` on row; clear session pending after bind

- [ ] **Step 2:** Verify `captureKindForUpload` reads row field in existing tests

Run: `npm run test:unit`

---

### Task 3: Single-shot camera + navigation

**Files:**
- Modify: `components/home/HomeScreen.tsx`
- Modify: `components/home/SnapButton.tsx`

- [ ] **Step 1:** Add `incomeCaptureIntentRef` + update `openIncomeCapture(kind)` to set it

- [ ] **Step 2:** Pass `incomeCaptureSingleShot?: boolean` (or ref) to SnapButton — when true, use single mode even without `resnapId`

- [ ] **Step 3:** On successful capture with intent: set `cameraReturnViewRef = "home"`; clear intent ref after capture

- [ ] **Step 4:** Cancel without shots: do not override returnView

Manual: Settings → 1099 → one shutter → home list; cancel → Settings

---

### Task 4: Two-phase banner + highlight watcher

**Files:**
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1:** After successful income capture, set phase 1 `receiptNotice`, `highlightReceiptId`, scroll into view

- [ ] **Step 2:** `useEffect` watching `receipts` for pending feedback id → on `done` (income) or `blurry`, update notice and reset 4s timer

- [ ] **Step 3:** Duplicate path: ensure `setView("home")` + existing duplicate notice

Manual: full phase 1 → phase 2 done and blurry paths

---

### Task 5: Regression + commit

- [ ] Run `npm run test:unit`
- [ ] Run `npm run lint` on touched files

```bash
git add lib/client/incomeCaptureFeedback.ts lib/client/incomeCaptureFeedback.test.ts \
  lib/client/prepareReceiptCapture.ts components/home/HomeScreen.tsx components/home/SnapButton.tsx \
  lib/i18n/types.ts lib/i18n/locales/en-US.ts \
  docs/superpowers/specs/2026-08-09-income-capture-return-feedback-design.md \
  docs/superpowers/plans/2026-08-09-income-capture-return-feedback.md
git commit -m "feat(home): 1099 capture returns to list with two-phase feedback"
```

---

## Plan self-review

All spec requirements mapped to Tasks 1–4. No placeholders.
