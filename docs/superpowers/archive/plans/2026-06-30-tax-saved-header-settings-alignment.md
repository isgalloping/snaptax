# Est. Tax Saved 首屏 ↔ Settings 对齐 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 首屏与 Settings 的 Est. Tax Saved 使用同一展示公式（当前税季本地 summary + onboarding 覆盖），在线 sync 不再被服务端 `taxSavedEstimate` 覆盖。

**Architecture:** 抽取纯函数 `resolveHeaderTaxSaved` 供首屏与 Settings 共用；`refreshTaxAndSummary` 始终从 `readCurrentSeasonSummary()` 写 state；`ProcessingReceiptWatcher` 在 processing settle 时触发 summary 刷新而非传递 API aggregate。

**Tech Stack:** Next.js 16 · React 19 · IndexedDB (`snaptax_receipts_summary`) · node:test + tsx

**Spec:** [`docs/superpowers/specs/2026-06-30-tax-saved-header-settings-alignment-design.md`](../specs/2026-06-30-tax-saved-header-settings-alignment-design.md)

---

## File map

| File | Responsibility |
|------|----------------|
| `lib/client/resolveHeaderTaxSaved.ts` | 纯函数：onboarding 覆盖 + summary fallback |
| `lib/client/resolveHeaderTaxSaved.test.ts` | 单元测试 |
| `components/home/HomeScreen.tsx` | 移除 apiEstimate UI 路径；统一 settingsTaxStats |
| `lib/client/processingReceiptWatcher.ts` | settle 时 `onSummaryRefresh` 替代 `onTaxSaved(estimate)` |
| `lib/client/processingReceiptWatcher.test.ts` | 更新 callback 断言 |
| `components/home/OfflineHomeShell.tsx` | 核对已仅用 summary（无 estimate 路径） |

---

### Task 1: `resolveHeaderTaxSaved` 纯函数

**Files:**
- Create: `lib/client/resolveHeaderTaxSaved.ts`
- Create: `lib/client/resolveHeaderTaxSaved.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveHeaderTaxSaved } from "./resolveHeaderTaxSaved";

describe("resolveHeaderTaxSaved", () => {
  it("prefers onboarding display override", () => {
    assert.equal(
      resolveHeaderTaxSaved({ displayTaxSaved: 42, seasonUnfiledTaxSaved: 10, taxSavedFallback: 5 }),
      42,
    );
  });

  it("uses season summary when no override", () => {
    assert.equal(
      resolveHeaderTaxSaved({ displayTaxSaved: null, seasonUnfiledTaxSaved: 10, taxSavedFallback: 5 }),
      10,
    );
  });

  it("falls back to taxSaved state when summary missing", () => {
    assert.equal(
      resolveHeaderTaxSaved({ displayTaxSaved: null, seasonUnfiledTaxSaved: null, taxSavedFallback: 5 }),
      5,
    );
  });

  it("returns null when all inputs nullish", () => {
    assert.equal(
      resolveHeaderTaxSaved({ displayTaxSaved: null, seasonUnfiledTaxSaved: null, taxSavedFallback: null }),
      null,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- lib/client/resolveHeaderTaxSaved.test.ts`  
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

```typescript
export type ResolveHeaderTaxSavedInput = {
  displayTaxSaved: number | null | undefined;
  seasonUnfiledTaxSaved: number | null | undefined;
  taxSavedFallback: number | null | undefined;
};

/** Shared Est. Tax Saved display value for TaxHeader + Settings TaxOverviewPanel. */
export function resolveHeaderTaxSaved(input: ResolveHeaderTaxSavedInput): number | null {
  if (input.displayTaxSaved != null) return input.displayTaxSaved;
  if (input.seasonUnfiledTaxSaved != null) return input.seasonUnfiledTaxSaved;
  return input.taxSavedFallback ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- lib/client/resolveHeaderTaxSaved.test.ts`  
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/client/resolveHeaderTaxSaved.ts lib/client/resolveHeaderTaxSaved.test.ts
git commit -m "feat: add resolveHeaderTaxSaved for header/settings parity"
```

---

### Task 2: `ProcessingReceiptWatcher` — summary refresh callback

**Files:**
- Modify: `lib/client/processingReceiptWatcher.ts`
- Modify: `lib/client/processingReceiptWatcher.test.ts`

- [ ] **Step 1: Update failing watcher test**

In `lib/client/processingReceiptWatcher.test.ts`, replace `onTaxSaved` expectations with `onSummaryRefresh`:

```typescript
let summaryRefreshCount = 0;
const watcher = new ProcessingReceiptWatcher({
  onReceiptUpdate: (r) => { /* existing */ },
  onReceiptStuck: () => {},
  onSummaryRefresh: () => { summaryRefreshCount += 1; },
  getWriteBudget: () => 1,
  onWriteFailure: () => {},
  // deps with mock fetch returning done receipt — no fetchList needed for tax
});
// after tick settles processing → expect summaryRefreshCount === 1
```

Remove assertions that `fetchList` was called **only** for tax estimate (settle path should not require list fetch).

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- lib/client/processingReceiptWatcher.test.ts`  
Expected: FAIL — type/signature mismatch

- [ ] **Step 3: Implement watcher change**

In `lib/client/processingReceiptWatcher.ts`:

```typescript
export type ProcessingWatcherCallbacks = {
  onReceiptUpdate: (receipt: ApiReceipt) => void;
  onReceiptStuck: (id: string) => void;
  /** Fired after processing settles; consumer re-reads local season summary. */
  onSummaryRefresh?: () => void;
  getWriteBudget: (id: string) => number;
  onWriteFailure: (id: string) => void;
};
```

In `tick()`, when `receipt.status !== "processing"`:

```typescript
this.callbacks.onReceiptUpdate(receipt);
this.unwatch(id);
this.callbacks.onSummaryRefresh?.();
return;
```

Delete the `fetchList()` call on settle path (was only for `taxSavedEstimate`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- lib/client/processingReceiptWatcher.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/client/processingReceiptWatcher.ts lib/client/processingReceiptWatcher.test.ts
git commit -m "refactor: watcher triggers summary refresh instead of API tax estimate"
```

---

### Task 3: `HomeScreen` — single summary source + unified display

**Files:**
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1: Import helper**

```typescript
import { resolveHeaderTaxSaved } from "@/lib/client/resolveHeaderTaxSaved";
```

- [ ] **Step 2: Simplify `refreshTaxAndSummary`**

Replace:

```typescript
const refreshTaxAndSummary = useCallback(async (apiEstimate?: number) => {
  const summary = await readCurrentSeasonSummary();
  setSeasonSummary(summary);
  if (apiEstimate != null && navigator.onLine) {
    setTaxSaved(apiEstimate);
  } else {
    setTaxSaved(summary.unfiledTaxSaved);
  }
}, []);
```

With:

```typescript
const refreshTaxAndSummary = useCallback(async () => {
  const summary = await readCurrentSeasonSummary();
  setSeasonSummary(summary);
  setTaxSaved(summary.unfiledTaxSaved);
}, []);
```

- [ ] **Step 3: Simplify refresh chain — remove estimate params**

| Symbol | Change |
|--------|--------|
| `refreshTaxSaved` | `(_next: Receipt[]) => { void refreshTaxAndSummary(); }` |
| `pendingMergeRef` | `{ receipts: Receipt[] }` only — drop `taxSavedEstimate` |
| `applyMergeNow(merged)` | `refreshTaxSaved(merged)` — no second arg |
| `applyReceiptUpdate(updated)` | `refreshTaxSaved(...)` — no `apiEstimate` |
| `applyFromApi(api)` | `await applyReceiptUpdate(updated)` — no estimate |

Update `syncFromServer` / `mergeServerReceiptsIntoLocal` destructuring — ignore `taxSavedEstimate`:

```typescript
const { visible } = await mergeServerReceiptsIntoLocal(local);
```

- [ ] **Step 4: Watcher callback**

Replace:

```typescript
onTaxSaved: (estimate) => {
  setReceipts((prev) => {
    refreshTaxSaved(prev, estimate);
    return prev;
  });
},
```

With:

```typescript
onSummaryRefresh: () => {
  void refreshTaxAndSummary();
},
```

- [ ] **Step 5: Derived `headerTaxSaved` + unified `settingsTaxStats`**

After `displayReceipts` useMemo, add:

```typescript
const headerTaxSaved = useMemo(
  () =>
    resolveHeaderTaxSaved({
      displayTaxSaved,
      seasonUnfiledTaxSaved: seasonSummary?.unfiledTaxSaved,
      taxSavedFallback: taxSaved,
    }),
  [displayTaxSaved, seasonSummary, taxSaved],
);
```

Update `settingsTaxStats`:

```typescript
const settingsTaxStats = useMemo((): SettingsTaxStats => {
  if (!seasonSummary) {
    const year = currentTaxYear();
    return {
      taxSaved: headerTaxSaved,
      receiptCount: displayReceipts.length,
      totalDeductions: taxYearDeductions(displayReceipts, year, clientTimeZone()),
      incomeFormCount: incomeFormsInTaxYear(displayReceipts, year, clientTimeZone()),
      totalIncomeGross: totalIncomeGrossInTaxYear(displayReceipts, year, clientTimeZone()),
    };
  }
  return {
    taxSaved: headerTaxSaved,
    receiptCount: seasonSummary.totalReceiptCount,
    totalDeductions: seasonSummary.totalDeductions,
    incomeFormCount: seasonSummary.incomeFormCount,
    totalIncomeGross: seasonSummary.totalIncomeGross,
  };
}, [seasonSummary, displayReceipts, headerTaxSaved]);
```

Update `widgetsData` to use `headerTaxSaved` instead of `displayTaxSaved ?? taxSaved`.

Update `TaxHeader` props:

```typescript
<TaxHeader
  taxSaved={headerTaxSaved}
  displayTaxSaved={undefined}
  ...
/>
```

Or keep `taxSaved={taxSaved}` + `displayTaxSaved={displayTaxSaved}` if TaxHeader already applies `displayTaxSaved ?? taxSaved` — then pass `taxSaved={seasonSummary?.unfiledTaxSaved ?? taxSaved}` and keep displayTaxSaved. **Preferred:** pass `taxSaved={headerTaxSaved}` only and drop `displayTaxSaved` prop to avoid double-apply.

- [ ] **Step 6: Typecheck + lint touched file**

Run: `npm run test:unit`  
Expected: all pass

Run: `npm run lint -- --max-warnings=0 components/home/HomeScreen.tsx`  
Expected: no new errors in changed lines (pre-existing repo lint may still fail globally)

- [ ] **Step 7: Commit**

```bash
git add components/home/HomeScreen.tsx
git commit -m "fix: align header tax saved with settings via season summary"
```

---

### Task 4: `OfflineHomeShell` parity check

**Files:**
- Modify: `components/home/OfflineHomeShell.tsx` (only if gaps found)

- [ ] **Step 1: Verify offline shell**

Confirm `refreshTaxAndSummary` already:

```typescript
setTaxSaved(summary.unfiledTaxSaved);
```

No `apiEstimate` branch exists. If `TaxHeader` still passes `displayTaxSaved ?? taxSaved`, optionally import `resolveHeaderTaxSaved` + `seasonSummary` state for consistency with HomeScreen (offline shell has no Settings page — lower priority).

- [ ] **Step 2: Align TaxHeader props (minimal)**

If offline shell lacks `seasonSummary` state, add it alongside `refreshTaxAndSummary` and use `headerTaxSaved` for `TaxHeader.taxSaved` — same pattern as Task 3 Step 5.

- [ ] **Step 3: Commit (if changed)**

```bash
git add components/home/OfflineHomeShell.tsx
git commit -m "chore: mirror headerTaxSaved helper in offline home shell"
```

Skip commit if no file changes.

---

### Task 5: Acceptance verification

**Files:** none (manual + full test suite)

- [ ] **Step 1: Full unit suite**

Run: `npm run test:unit`  
Expected: all tests pass

- [ ] **Step 2: Manual — online cross-year**

1. `npm run dev`
2. DevTools → IndexedDB：确保有 **上一税季** unfiled done 小票 + **当前税季** unfiled done 小票
3. 在线 sync（`POST /api/ghost/register` 正常）
4. 首屏 Est. Tax Saved === Settings Est. Tax Saved
5. 两者应等于 **当前税季** unfiled sum，**小于** 若用全量 API aggregate 的值

- [ ] **Step 3: Manual — onboarding stage_aha**

Reset onboarding → stage_aha → 首屏与 Settings 均显示 demo 省税额

- [ ] **Step 4: Manual — export filed**

Export 后顶栏与 Settings 同步下降

- [ ] **Step 5: Update spec status**

In `docs/superpowers/specs/2026-06-30-tax-saved-header-settings-alignment-design.md`:

```markdown
**Status:** Implemented
```

```bash
git add docs/superpowers/specs/2026-06-30-tax-saved-header-settings-alignment-design.md
git commit -m "docs: mark tax saved alignment spec implemented"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| G1 首屏 === Settings 同口径 | Task 1, 3 |
| G2 summary 为 UI 唯一真源 | Task 2, 3 |
| G3 onboarding 同步 | Task 1, 3 (`headerTaxSaved`) |
| 移除 apiEstimate UI 路径 | Task 2, 3 |
| API 字段保留不改 | — (no task) |
| Unit tests | Task 1, 2 |
| Manual acceptance | Task 5 |

## Out of scope (follow-up spec)

- 首屏 Receipts 副行 vs Settings Receipts / Deductions 对齐
- Server `taxSavedEstimate` 税季过滤
