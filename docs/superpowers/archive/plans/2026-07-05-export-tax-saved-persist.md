# Export 后 Est. Tax Saved 保持累计 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 导出小票后首屏与 Settings 的 Est. Tax Saved 保持本税年累计值，新拍小票继续累加。

**Architecture:** 将 `snaptax_receipts_summary.unfiledTaxSaved` 重命名为 `totalTaxSaved`，delta 公式去掉 `isReceiptFiled` 过滤；UI 经 `resolveHeaderTaxSaved` 读 summary；`RECEIPT_SUMMARY_SCHEMA_VERSION` 升至 2 触发 rebuild。

**Tech Stack:** IndexedDB summary store · TypeScript · node:test

**Spec:** `docs/superpowers/specs/2026-07-05-export-tax-saved-persist-design.md`

---

### Task 1: Summary types + delta formula

**Files:**
- Modify: `lib/storage/receiptSummaryTypes.ts`
- Modify: `lib/storage/receiptSummaryDelta.ts`
- Test: `lib/storage/receiptSummaryDelta.test.ts`

- [ ] Rename `unfiledTaxSaved` → `totalTaxSaved`; bump schema version 1→2
- [ ] `totalTaxSavedContribution`: `status===done` → `taxAmount` (ignore filed)
- [ ] Update tests: filed counts; export transition delta=0

### Task 2: Summary CRUD + rebuild

**Files:**
- Modify: `lib/storage/receiptSummary.ts`
- Test: `lib/storage/receiptSummary.test.ts`
- Test: `lib/storage/receiptDbClearLocalData.test.ts`

- [ ] Rename all summary field references; `readCurrentSeasonTotalTaxSaved()`
- [ ] `buildSeasonSummaryFromReceipts` filed receipt included in total

### Task 3: Header resolver + UI

**Files:**
- Modify: `lib/client/resolveHeaderTaxSaved.ts`
- Modify: `lib/client/resolveHeaderTaxSaved.test.ts`
- Modify: `components/home/HomeScreen.tsx`
- Modify: `components/home/OfflineHomeShell.tsx`

- [ ] `seasonTotalTaxSaved` param; wire `summary.totalTaxSaved`

### Task 4: Docs

**Files:**
- Modify: `docs/tech/08-export.md` §8.6

- [ ] filed 用于审计/幂等，非 UI 扣减

### Task 5: Verify + commit

- [ ] `node --import tsx --test lib/storage/receiptSummaryDelta.test.ts lib/storage/receiptSummary.test.ts lib/client/resolveHeaderTaxSaved.test.ts lib/storage/receiptDbClearLocalData.test.ts`
