# Export Logic Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix export pre-sync, server receipt scope, paid-cache staleness, and client/server tax-year count mismatch per `docs/superpowers/specs/2026-06-14-export-logic-hardening-design.md`.

**Architecture:** New `prepareExportSync` orchestrates flush uploads → flush deletes → immediate sync before opening ExportEngineSheet and again before generate. Server export reuses `userAccountReceiptFilter`. Paid state always mirrors API into localStorage.

**Tech Stack:** Next.js 16, React 19, Prisma, node:test

**Spec:** `docs/superpowers/specs/2026-06-14-export-logic-hardening-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `lib/client/exportPrepareFlow.ts` | Pre-export flush + sync orchestration |
| `lib/client/exportPrepareFlow.test.ts` | Call order + offline error |
| `lib/client/authStorage.test.ts` | `setSeasonPaid(false)` clears cache |
| `lib/client/useAuthSession.ts` | E5 refresh + signOut cache clear |
| `app/api/export/tax-pack/route.ts` | E2 bound-ghost query |
| `components/export/useTaxExportGate.tsx` | Gate prepare, paid resolve, busy state |
| `components/export/ExportEngineSheet.tsx` | Generate-time prepare |
| `components/home/HomeScreen.tsx` | Wire `handlePreExportPrepare`, `exportBusy` |

---

### Task 1: `exportPrepareFlow` + tests

- [ ] **Step 1:** Create `lib/client/exportPrepareFlow.ts` with `EXPORT_OFFLINE` throw and ordered flush/sync.
- [ ] **Step 2:** Create `lib/client/exportPrepareFlow.test.ts` asserting call order and offline throw.
- [ ] **Step 3:** Run `npm run test:unit -- lib/client/exportPrepareFlow.test.ts`

### Task 2: E5 paid cache

- [ ] **Step 1:** Fix `refreshSeasonPaid` to always `setSeasonPaid(season, paid)`.
- [ ] **Step 2:** Clear season paid on `signOut`.
- [ ] **Step 3:** Add `lib/client/authStorage.test.ts` for false clears key.
- [ ] **Step 4:** Run `npm run test:unit -- lib/client/authStorage.test.ts`

### Task 3: E2 server export scope

- [ ] **Step 1:** Import `userAccountReceiptFilter`; load binding by `userId`; widen `findMany` where clause.

### Task 4: Gate + sheet + HomeScreen wiring

- [ ] **Step 1:** Add `onPreExportPrepare`, `preparingExport`, `resolveSeasonPaid` to `useTaxExportGate`.
- [ ] **Step 2:** Add `onPreExportPrepare` to `ExportEngineSheet.handleGenerate`.
- [ ] **Step 3:** Add `handlePreExportPrepare` in `HomeScreen`; pass to gate; `exportBusy` includes `preparingExport`.

### Task 5: Verification

- [ ] **Step 1:** `npm run test:unit`
- [ ] **Step 2:** `npm run build`
