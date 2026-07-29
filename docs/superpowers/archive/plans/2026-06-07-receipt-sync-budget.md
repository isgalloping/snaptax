# Receipt Sync Budget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 单张 receipt 的上传与 AI 分析共用 5 次失败写操作预算，用尽后转 Tap to Retry；list 同步独立，顶栏提供手动刷新按钮。

**Architecture:** `StoredReceipt.writeBudgetRemaining` 持久化到 IndexedDB；纯函数模块 `receiptSyncBudget.ts` 统一读写；`HomeScreen` 在上传路径扣预算，`ProcessingReceiptWatcher` 在 `/process` 前扣预算；`syncStuckIds` 覆盖 upload + analysis stuck；`TaxHeader` 刷新按钮触发 `syncFromServer()` 不计预算。

**Tech Stack:** Next.js 16 · React 19 · IndexedDB · node:test (`npm run test:unit`)

**Spec:** [`2026-06-07-receipt-sync-budget-design.md`](../specs/2026-06-07-receipt-sync-budget-design.md)

---

## 文件结构

| 路径 | 职责 |
|------|------|
| `lib/client/receiptSyncBudget.ts` | **新建** — `getBudget` / `recordWriteFailure` / `resetBudget` / `isSyncStuck` |
| `lib/client/receiptSyncBudget.test.ts` | **新建** — 预算单元测试 |
| `lib/storage/receiptDb.ts` | `StoredReceipt` 增加 `writeBudgetRemaining?` |
| `lib/client/receiptApi.ts` | `triggerReceiptProcess` 返回 `{ ok, status }`，不 throw |
| `lib/client/processingReceiptWatcher.ts` | 去掉 poll-count stuck；budget 门控 `/process` |
| `components/home/HomeScreen.tsx` | upload 门控；`syncStuckIds`；Retry upload；header sync |
| `components/home/TaxHeader.tsx` | 刷新按钮 |
| `components/icons/RefreshIcon.tsx` | **新建** — SVG 图标 |
| `components/home/ReceiptList.tsx` | prop 重命名 `syncStuckIds` |
| `components/home/ReceiptListCard.tsx` | upload-stuck UI |
| `lib/receipts/receiptListIcon.ts` | upload-stuck 图标 |
| `components/receipts/ReceiptDetailSheet.tsx` | upload-stuck 文案 |
| `docs/tech/06-receipt-ai-pipeline.md` | §6.5 补充 write budget |

---

### Task 1: `receiptSyncBudget` 模块 + 单元测试

**Files:**
- Create: `lib/client/receiptSyncBudget.ts`
- Create: `lib/client/receiptSyncBudget.test.ts`
- Modify: `lib/storage/receiptDb.ts`

- [ ] **Step 1: 写失败测试**

Create `lib/client/receiptSyncBudget.test.ts`:

```typescript
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_WRITE_BUDGET,
  getBudget,
  recordWriteFailure,
  resetBudget,
  isSyncStuck,
  withFreshBudget,
} from "@/lib/client/receiptSyncBudget";
import type { StoredReceipt } from "@/lib/storage/receiptDb";

function receipt(overrides: Partial<StoredReceipt> = {}): StoredReceipt {
  return {
    id: "r1",
    status: "processing",
    merchant: "Test",
    timestamp: new Date("2026-06-07T12:00:00.000Z"),
    ...overrides,
  };
}

test("getBudget defaults to MAX when field omitted", () => {
  assert.equal(getBudget(receipt()), MAX_WRITE_BUDGET);
});

test("recordWriteFailure decrements until zero", () => {
  let r = withFreshBudget(receipt());
  for (let i = MAX_WRITE_BUDGET - 1; i >= 0; i--) {
    r = recordWriteFailure(r);
    assert.equal(getBudget(r), i);
  }
  assert.equal(getBudget(r), 0);
  assert.equal(isSyncStuck(r), true);
});

test("resetBudget restores MAX", () => {
  let r = receipt({ writeBudgetRemaining: 0 });
  r = resetBudget(r);
  assert.equal(getBudget(r), MAX_WRITE_BUDGET);
  assert.equal(isSyncStuck(r), false);
});
```

- [ ] **Step 2: 运行测试确认 FAIL**

Run: `npm run test:unit -- lib/client/receiptSyncBudget.test.ts`  
Expected: FAIL — module not found

- [ ] **Step 3: 实现模块 + StoredReceipt 字段**

`lib/storage/receiptDb.ts` — extend interface:

```typescript
export interface StoredReceipt extends Receipt {
  timestamp: Date;
  pendingUpload?: boolean;
  writeBudgetRemaining?: number;
}
```

Create `lib/client/receiptSyncBudget.ts`:

```typescript
import type { StoredReceipt } from "@/lib/storage/receiptDb";

export const MAX_WRITE_BUDGET = 5;

export function getBudget(receipt: Pick<StoredReceipt, "writeBudgetRemaining">): number {
  return receipt.writeBudgetRemaining ?? MAX_WRITE_BUDGET;
}

export function isSyncStuck(receipt: Pick<StoredReceipt, "writeBudgetRemaining">): boolean {
  return getBudget(receipt) <= 0;
}

export function withFreshBudget<T extends StoredReceipt>(receipt: T): T {
  return { ...receipt, writeBudgetRemaining: MAX_WRITE_BUDGET };
}

export function recordWriteFailure<T extends StoredReceipt>(receipt: T): T {
  const next = Math.max(0, getBudget(receipt) - 1);
  return { ...receipt, writeBudgetRemaining: next };
}

export function resetBudget<T extends StoredReceipt>(receipt: T): T {
  return { ...receipt, writeBudgetRemaining: MAX_WRITE_BUDGET };
}
```

- [ ] **Step 4: 运行测试确认 PASS**

Run: `npm run test:unit -- lib/client/receiptSyncBudget.test.ts`  
Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/client/receiptSyncBudget.ts lib/client/receiptSyncBudget.test.ts lib/storage/receiptDb.ts
git commit -m "feat: add per-receipt write sync budget helpers"
```

---

### Task 2: `triggerReceiptProcess` 不 throw

**Files:**
- Modify: `lib/client/receiptApi.ts`

- [ ] **Step 1: 改返回类型**

Replace `triggerReceiptProcess` with:

```typescript
export type ProcessTriggerResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "failed"; status: number };

export async function triggerReceiptProcess(
  id: string,
): Promise<ProcessTriggerResult> {
  const res = await apiFetch(`/api/receipts/${id}/process`, { method: "POST" });
  if (res.ok) return { ok: true };
  if (res.status === 404) return { ok: false, reason: "not_found", status: 404 };
  return { ok: false, reason: "failed", status: res.status };
}
```

- [ ] **Step 2: 全局搜索调用方并适配**

Grep: `triggerReceiptProcess`  
Update callers to check `result.ok` instead of `.catch(() => {})` for failure handling (Tasks 3–4 会完整接入 budget)。

- [ ] **Step 3: Commit**

```bash
git add lib/client/receiptApi.ts
git commit -m "fix: triggerReceiptProcess returns result instead of throwing"
```

---

### Task 3: `ProcessingReceiptWatcher` 预算门控

**Files:**
- Modify: `lib/client/processingReceiptWatcher.ts`

- [ ] **Step 1: 扩展 callbacks**

```typescript
export type ProcessingWatcherCallbacks = {
  onReceiptUpdate: (receipt: ApiReceipt) => void;
  onReceiptStuck: (id: string) => void;
  onTaxSaved?: (estimate: number) => void;
  getWriteBudget: (id: string) => number;
  onWriteFailure: (id: string) => void;
};
```

- [ ] **Step 2: 构造函数去掉 `stuckAfterAttempts`；保留 `processAfterAttempts`（默认 6）**

Remove `stuckAfterAttempts` parameter entirely.

- [ ] **Step 3: 重写 `tick()` 内 process 逻辑**

核心逻辑（替换现有 `pollAttempts` stuck 块）：

```typescript
this.pollAttempts += 1;

const shouldTryProcess =
  this.pollAttempts >= this.processAfterAttempts &&
  this.pollAttempts % this.processAfterAttempts === 0;

if (shouldTryProcess && this.callbacks.getWriteBudget(id) > 0) {
  const result = await triggerReceiptProcess(id);
  if (result.ok === false) {
    if (result.reason === "not_found") {
      this.unwatch(id);
      return;
    }
    this.callbacks.onWriteFailure(id);
    if (this.callbacks.getWriteBudget(id) <= 0) {
      this.callbacks.onReceiptStuck(id);
      this.unwatch(id);
    }
  }
}
```

**注意：** `onWriteFailure` 在 HomeScreen 内持久化并更新 state；`getWriteBudget` 读最新 state/ref。Watcher 在 `onWriteFailure` 后再次调用 `getWriteBudget` 判断是否 stuck。

- [ ] **Step 4: 删除 `processTriggered` Set**（改为按 poll 周期重试 `/process`）

- [ ] **Step 5: Commit**

```bash
git add lib/client/processingReceiptWatcher.ts
git commit -m "feat: watcher stuck on write budget exhaustion not poll count"
```

---

### Task 4: `HomeScreen` — budget 状态 + upload 路径

**Files:**
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1: 重命名 `analysisStuckIds` → `syncStuckIds`**

全局 replace；bootstrap / clear / retry 全部改用 `syncStuckIds`。

- [ ] **Step 2: 启动时从 IndexedDB 恢复 stuck**

在 Phase 1 `loadReceipts()` 后：

```typescript
const stuckFromDisk = new Set(
  stored.filter((r) => isSyncStuck(r)).map((r) => r.id),
);
setSyncStuckIds(stuckFromDisk);
```

Import `isSyncStuck` from `receiptSyncBudget`.

- [ ] **Step 3: 新 capture 写入 fresh budget**

`handleCapture` 创建 receipt 时：

```typescript
const processingReceipt: StoredReceipt = withFreshBudget({
  id,
  status: "processing",
  merchant: "Scanning",
  timestamp: snapAt,
  pendingUpload: !navigator.onLine,
});
```

上传 catch 块调用 `recordWriteFailure` + persist + 若 `isSyncStuck` 则 `setSyncStuckIds`.

- [ ] **Step 4: 重写 `uploadPendingInner`**

```typescript
const uploadPendingInner = async (receipt: StoredReceipt) => {
  if (isSyncStuck(receipt) || syncStuckIds.has(receipt.id)) return;
  if (getBudget(receipt) <= 0) return;

  const photo = await loadPhoto(receipt.id);
  if (!photo) return;

  try {
    const uploaded = await uploadReceipt(photo, receipt.timestamp);
    // ... existing success path (preserve writeBudgetRemaining on updated row)
    const updated: StoredReceipt = withFreshBudget({
      ...apiReceiptToLocal(uploaded),
      pendingUpload: false,
      writeBudgetRemaining: receipt.writeBudgetRemaining,
    });
    // keep budget across upload success — only failures decrement
    // ...
  } catch {
    const failed = recordWriteFailure(receipt);
    await saveReceipt(failed);
    setReceipts((prev) => prev.map((r) => (r.id === failed.id ? failed : r)));
    if (isSyncStuck(failed)) {
      setSyncStuckIds((prev) => new Set(prev).add(failed.id));
    }
    throw failed; // flush loop catches
  }
};
```

**上传成功不重置 budget**（spec：成功写操作不扣次，budget 原样保留供后续 `/process` 使用）。

- [ ] **Step 5: `flushPendingUploads` 跳过 syncStuck**

```typescript
const pending = stored.filter(
  (r) => r.pendingUpload && !isSyncStuck(r),
);
```

- [ ] **Step 6: Watcher callbacks 接线**

```typescript
const watcher = new ProcessingReceiptWatcher({
  // ...existing onReceiptUpdate, onReceiptStuck, onTaxSaved
  getWriteBudget: (id) => {
    const r = receiptsRef.current.find((x) => x.id === id);
    return r ? getBudget(r) : 0;
  },
  onWriteFailure: (id) => {
    void (async () => {
      const stored = await loadReceipts();
      const row = stored.find((r) => r.id === id);
      if (!row) return;
      const failed = recordWriteFailure(row);
      await saveReceipt(failed);
      setReceipts((prev) => prev.map((r) => (r.id === id ? failed : r)));
      if (isSyncStuck(failed)) {
        setSyncStuckIds((prev) => new Set(prev).add(id));
      }
    })();
  },
});
```

Add `const receiptsRef = useRef<Receipt[]>([]);` + `useEffect(() => { receiptsRef.current = receipts; }, [receipts]);`

- [ ] **Step 7: 统一 Retry handler**

Replace `handleRetryAnalysis` with `handleRetrySync`:

```typescript
const handleRetrySync = useCallback(
  (id: string) => {
    void (async () => {
      const stored = await loadReceipts();
      const row = stored.find((r) => r.id === id);
      if (!row) return;

      const refreshed = resetBudget(row);
      await saveReceipt(refreshed);
      setSyncStuckIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setReceipts((prev) => prev.map((r) => (r.id === id ? refreshed : r)));

      if (refreshed.pendingUpload) {
        try {
          await uploadPendingInner(refreshed);
        } catch {
          // budget updated in uploadPendingInner
        }
        return;
      }

      const result = await triggerReceiptProcess(id);
      if (result.ok === false && result.reason === "failed") {
        const failed = recordWriteFailure(refreshed);
        await saveReceipt(failed);
        setReceipts((prev) => prev.map((r) => (r.id === id ? failed : r)));
        if (isSyncStuck(failed)) {
          setSyncStuckIds((prev) => new Set(prev).add(id));
        }
        return;
      }
      enqueueReceipt(id);
      watcherRef.current?.tickOnce();
    })();
  },
  [enqueueReceipt],
);
```

- [ ] **Step 8: `processingQueue.bootstrapFromList` 排除 syncStuck**

Pass stuck ids into bootstrap or filter in HomeScreen before enqueue:

```typescript
const mergedAfter = await syncFromServer(storedAfter);
const stuck = new Set(mergedAfter.filter(isSyncStuck).map((r) => r.id));
setSyncStuckIds((prev) => new Set([...prev, ...stuck]));
queueRef.current?.bootstrapFromList(
  mergedAfter.filter((r) => !stuck.has(r.id)),
);
```

- [ ] **Step 9: Commit**

```bash
git add components/home/HomeScreen.tsx
git commit -m "feat: wire write budget into upload path and sync stuck state"
```

---

### Task 5: 顶栏手动 list 同步（C 独立）

**Files:**
- Create: `components/icons/RefreshIcon.tsx`
- Modify: `components/home/TaxHeader.tsx`
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1: 创建 RefreshIcon**

`components/icons/RefreshIcon.tsx`:

```tsx
export function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}
```

- [ ] **Step 2: TaxHeader 增加刷新按钮**

Props 扩展：

```typescript
interface TaxHeaderProps {
  // ...existing
  onSyncClick?: () => void;
  syncing?: boolean;
  syncDisabled?: boolean;
}
```

Settings 按钮左侧加：

```tsx
<div className="flex shrink-0 items-center gap-2">
  {onSyncClick && (
    <button
      type="button"
      onClick={onSyncClick}
      disabled={syncDisabled || syncing}
      className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-zinc-600 bg-zinc-800 transition-transform active:scale-95 disabled:opacity-40"
      aria-label="Sync receipts"
    >
      <RefreshIcon
        className={`h-5 w-5 text-white ${syncing ? "animate-spin" : ""}`}
      />
    </button>
  )}
  <button /* settings */ />
</div>
```

- [ ] **Step 3: HomeScreen 接线**

```typescript
const [listSyncing, setListSyncing] = useState(false);

const handleManualListSync = useCallback(async () => {
  if (!navigator.onLine || listSyncing) return;
  setListSyncing(true);
  try {
    const stored = await loadReceipts();
    await syncFromServer(stored);
  } finally {
    setListSyncing(false);
  }
}, [listSyncing, syncFromServer]);
```

Pass to TaxHeader: `onSyncClick={handleManualListSync}` `syncing={listSyncing}` `syncDisabled={!navigator.onLine}`

**不调用** `recordWriteFailure`；**不** auto-retry syncStuck receipts。

- [ ] **Step 4: Commit**

```bash
git add components/icons/RefreshIcon.tsx components/home/TaxHeader.tsx components/home/HomeScreen.tsx
git commit -m "feat: header refresh button for manual list sync"
```

---

### Task 6: UI — upload stuck + prop 重命名

**Files:**
- Modify: `lib/receipts/receiptListIcon.ts`
- Modify: `components/home/ReceiptListCard.tsx`
- Modify: `components/home/ReceiptList.tsx`
- Modify: `components/receipts/ReceiptDetailSheet.tsx`

- [ ] **Step 1: `receiptListIcon.ts`**

Rename opt `analysisStuck` → `syncStuck`; add upload-stuck branch:

```typescript
if (receipt.pendingUpload && opts?.syncStuck) {
  return { emoji: "⚠️", ariaLabel: "Upload paused" };
}
if (opts?.syncStuck) {
  return { emoji: "⚠️", ariaLabel: "Analysis paused" };
}
```

- [ ] **Step 2: `ReceiptListCard.tsx`**

Prop `analysisStuck` → `syncStuck`. Processing block:

```typescript
const pending = receipt.pendingUpload === true;
const stuck = syncStuck && !pending; // analysis stuck
const uploadStuck = syncStuck && pending;

const title = uploadStuck
  ? "Upload paused"
  : stuck
    ? "Analysis paused"
    : pending
      ? "Uploading..."
      : "Uploading...";

const contextLabel =
  syncStuck ? "Tap to retry" : "Processing";

onClick={() => {
  if (syncStuck) onRetrySync(receipt.id);
  else onSelect(receipt);
}}
```

Rename prop `onRetryAnalysis` → `onRetrySync`.

- [ ] **Step 3: `ReceiptList.tsx`**

Props: `syncStuckIds`, `onRetrySync`.

- [ ] **Step 4: `ReceiptDetailSheet.tsx`**

Prop `syncStuck` replaces `analysisStuck`. Hero processing 区块：

```typescript
const pending = receipt.pendingUpload === true;
// title:
pending && syncStuck
  ? "Upload paused"
  : syncStuck
    ? "Analysis paused"
    : "Calculating your deductions...";

// button label:
pending && syncStuck ? "Retry upload" : "Retry analysis"
```

Show Retry button when `syncStuck || onRetrySync`（processing 态）。

- [ ] **Step 5: Commit**

```bash
git add lib/receipts/receiptListIcon.ts components/home/ReceiptListCard.tsx components/home/ReceiptList.tsx components/receipts/ReceiptDetailSheet.tsx
git commit -m "feat: sync stuck UI for upload and analysis"
```

---

### Task 7: 文档更新

**Files:**
- Modify: `docs/tech/06-receipt-ai-pipeline.md`

- [ ] **Step 1: §6.5 追加 write budget 段落**

在 §6.5 末尾添加：

```markdown
### Write budget (2026-06-07)

- 单票 `writeBudgetRemaining` 默认 5，IndexedDB 持久化
- 仅失败写操作扣次：`POST /receipts`、`POST /process`；`GET /api/receipts` 不计
- 用尽 → `syncStuck` → Tap to Retry 重置为 5
- 顶栏刷新按钮：手动 list 同步，不扣单票 budget
```

- [ ] **Step 2: Commit**

```bash
git add docs/tech/06-receipt-ai-pipeline.md
git commit -m "docs: document receipt write sync budget"
```

---

### Task 8: 验证

- [ ] **Step 1: 单元测试**

Run: `npm run test:unit`  
Expected: all PASS

- [ ] **Step 2: 生产构建**

Run: `npm run build`  
Expected: PASS

- [ ] **Step 3: 手动冒烟**

| # | 步骤 | 预期 |
|---|------|------|
| 1 | 模拟 5 次 upload 失败（断网/mock 500） | 第 6 次无 POST；卡片 Upload paused |
| 2 | Tap to Retry | budget 回 5；立即重试 upload |
| 3 | processing 票 5 次 `/process` 失败 | Analysis paused；poll 停止 |
| 4 | 顶栏刷新 | list/税额更新；budget 不变 |
| 5 | 无 processing/pending | Network 面板无 3s interval GET |

- [ ] **Step 4: Commit（若有验证期 fix）**

```bash
git commit -m "fix: address sync budget verification findings"
```

---

## Spec 覆盖自检

| Spec § | Task |
|--------|------|
| §1 Write budget model | 1 |
| §2 Upload path | 4 |
| §3 Analysis path | 2, 3, 4 |
| §4 List sync + header button | 5 |
| §5 UI states | 6 |
| §6 Error handling (no throw) | 2, 3 |
| §8 Files | 1–7 |
| §9 Testing | 8 |
