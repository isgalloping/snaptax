# Receipt List Bad-State Delete — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visible one-tap DELETE on list cards for blurry / processing / paused / photo-missing receipts without opening detail.

**Architecture:** `ReceiptListCard` renders DELETE for eligible `receipt.status` (+ sync/photo flags); propagates `onDelete(id)` to existing `HomeScreen.handleDeleteReceipt`.

**Tech Stack:** React 19 · TypeScript · i18n locales

**Spec:** `docs/superpowers/specs/2026-06-19-receipt-list-bad-delete-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `components/home/ReceiptListCard.tsx` | DELETE button + stopPropagation |
| `components/home/ReceiptList.tsx` | Pass through `onDelete` |
| `components/home/HomeScreen.tsx` | Wire `handleDeleteReceipt` |
| `lib/i18n/types.ts` + locales | `delete` label |

---

### Task 1: i18n

**Files:**
- Modify: `lib/i18n/types.ts`, `en-US.ts`, `de-DE.ts`, `fr-FR.ts`

- [ ] **Step 1:** Add `home.receiptList.delete: "Delete"` (and de/fr equivalents).
- [ ] **Step 2:** Run `npm run test:unit -- lib/i18n/index.test.ts`.

---

### Task 2: ReceiptListCard DELETE affordance

**Files:**
- Modify: `components/home/ReceiptListCard.tsx`

- [ ] **Step 1:** Add `onDelete: (id: string) => void` prop.
- [ ] **Step 2:** Extract shared `DeleteButton` sub-component (`min-h-12`, red, uppercase).
- [ ] **Step 3:** blurry branch: render `[RESNAP] [DELETE]`.
- [ ] **Step 4:** processing / paused / photo-missing branches: render `[DELETE]` before chevron.
- [ ] **Step 5:** All DELETE clicks `e.stopPropagation()` + `onDelete(receipt.id)`.
- [ ] **Step 6:** done branch — no DELETE.

---

### Task 3: Wire list → HomeScreen

**Files:**
- Modify: `components/home/ReceiptList.tsx`
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1:** Add `onDelete` to `ReceiptListProps`; pass to each `ReceiptListCard`.
- [ ] **Step 2:** HomeScreen pass `onDelete={(id) => void handleDeleteReceipt(id)}`.
- [ ] **Step 3:** If `OfflineHomeShell` uses `ReceiptList`, pass noop or omit (offline-only receipts).

---

### Task 4: Verification

- [ ] **Step 1:** Run `npm run test:unit`.
- [ ] **Step 2:** Manual smoke — blurry + processing DELETE from list.
- [ ] **Step 3:** Confirm done card has no list DELETE.

---

## Manual checklist

- [ ] blurry: DELETE + RESNAP both work
- [ ] processing: DELETE only removes; card body opens detail
- [ ] done: delete only via detail confirm sheet
