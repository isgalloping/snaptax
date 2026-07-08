# Home Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 高保真还原参考图主界面视觉 — hero 渐变顶栏、Snap 三列布局、圆形状态徽章卡片、双刷新入口、stuck 筛选。

**Architecture:** 新建 `homeVisual.ts` tokens + `CircularStatusIcon` / `StatusPill` 共享组件；就地 reskin `TaxHeader`、`SnapButton`、`ReceiptFilterBar`、`ReceiptList`、`ReceiptListCard`；`HomeScreen` 仅透传 sync props。不改 sync budget / 轮询逻辑。

**Tech Stack:** Next.js 16 · React 19 · Tailwind CSS 4

**Spec:** [`2026-06-07-home-visual-redesign-design.md`](../specs/2026-06-07-home-visual-redesign-design.md)

---

## 文件结构

| 路径 | 职责 |
|------|------|
| `lib/ui/homeVisual.ts` | 渐变、状态色、Snap 尺寸常量 |
| `components/icons/ReceiptIcon.tsx` | 顶栏副标题小票 SVG |
| `components/icons/SlidersIcon.tsx` | 设置 sliders 图标 |
| `components/icons/ChevronRightIcon.tsx` | Snap/卡片 chevron |
| `components/home/CircularStatusIcon.tsx` | 圆形状态徽章 |
| `components/home/StatusPill.tsx` | 右侧 ANALYZING/PAUSED 等标签 |
| `components/home/TaxHeader.tsx` | Hero 渐变 + 双按钮 |
| `components/home/SnapButton.tsx` | 三列快门 |
| `components/home/ReceiptFilterBar.tsx` | 四 tab + stuck ⚠️ |
| `components/home/ReceiptList.tsx` | PULL TO REFRESH + stuck filter |
| `components/home/ReceiptListCard.tsx` | 新卡片布局 |
| `components/home/HomeScreen.tsx` | 透传 `onSyncClick` / `syncStuckIds` |
| `docs/product/PRODUCT-SPEC.md` | §3 视觉更新 |

---

### Task 1: Design tokens + 图标

**Files:**
- Create: `lib/ui/homeVisual.ts`
- Create: `components/icons/ReceiptIcon.tsx`
- Create: `components/icons/SlidersIcon.tsx`
- Create: `components/icons/ChevronRightIcon.tsx`

- [ ] **Step 1: 创建 `lib/ui/homeVisual.ts`**

```typescript
export const homeVisual = {
  heroGradient:
    "linear-gradient(180deg, rgba(234,179,8,0.18) 0%, rgba(0,0,0,0.75) 45%, #000 100%)",
  status: {
    analyzing: "text-blue-400",
    uploading: "text-yellow-400",
    paused: "text-yellow-500",
    done: "text-green-400",
  },
  snap: {
    height: "h-[140px]",
    maxHeight: "max-h-[18vh]",
  },
} as const;

export type ReceiptVisualState =
  | "uploading"
  | "analyzing"
  | "paused"
  | "done"
  | "blurry";
```

- [ ] **Step 2: 创建 `ReceiptIcon.tsx`**

```tsx
export function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h8" />
    </svg>
  );
}
```

- [ ] **Step 3: 创建 `SlidersIcon.tsx`**

```tsx
export function SlidersIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <circle cx="4" cy="14" r="2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="6" r="2" fill="currentColor" stroke="none" />
      <circle cx="20" cy="16" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
```

- [ ] **Step 4: 创建 `ChevronRightIcon.tsx`**

```tsx
export function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/ui/homeVisual.ts components/icons/ReceiptIcon.tsx components/icons/SlidersIcon.tsx components/icons/ChevronRightIcon.tsx
git commit -m "feat: add home visual design tokens and icons"
```

---

### Task 2: CircularStatusIcon + StatusPill

**Files:**
- Create: `components/home/CircularStatusIcon.tsx`
- Create: `components/home/StatusPill.tsx`

- [ ] **Step 1: 创建 `CircularStatusIcon.tsx`**

```tsx
"use client";

import type { ReceiptVisualState } from "@/lib/ui/homeVisual";

const CONFIG: Record<
  ReceiptVisualState,
  { bg: string; content: string; spin?: boolean }
> = {
  uploading: { bg: "bg-yellow-500/20", content: "☁️" },
  analyzing: { bg: "bg-blue-500/20", content: "⚙️", spin: true },
  paused: { bg: "bg-yellow-500/30", content: "⚠️" },
  done: { bg: "bg-green-500/20", content: "🧾" },
  blurry: { bg: "bg-red-500/20", content: "❌" },
};

export function CircularStatusIcon({
  state,
  emoji,
}: {
  state: ReceiptVisualState;
  emoji?: string;
}) {
  const cfg = CONFIG[state];
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}
      aria-hidden
    >
      <span className={cfg.spin ? "inline-block animate-spin text-base" : "text-base"}>
        {state === "done" && emoji ? emoji : cfg.content}
      </span>
    </span>
  );
}
```

- [ ] **Step 2: 创建 `StatusPill.tsx`**

```tsx
"use client";

import { homeVisual } from "@/lib/ui/homeVisual";

type PillVariant = "analyzing" | "uploading" | "paused" | "done" | "none";

const LABEL: Record<Exclude<PillVariant, "none" | "done">, string> = {
  analyzing: "ANALYZING",
  uploading: "UPLOADING",
  paused: "PAUSED",
};

const COLOR: Record<Exclude<PillVariant, "none">, string> = {
  analyzing: homeVisual.status.analyzing,
  uploading: homeVisual.status.uploading,
  paused: homeVisual.status.paused,
  done: homeVisual.status.done,
};

export function StatusPill({
  variant,
  doneLabel,
}: {
  variant: PillVariant;
  doneLabel?: string;
}) {
  if (variant === "none") return null;
  if (variant === "done" && doneLabel) {
    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider ${COLOR.done}`}>
        {doneLabel}
      </span>
    );
  }
  const key = variant as keyof typeof LABEL;
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider ${COLOR[key]}`}>
      {LABEL[key]}
    </span>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/home/CircularStatusIcon.tsx components/home/StatusPill.tsx
git commit -m "feat: add circular status icon and status pill components"
```

---

### Task 3: TaxHeader hero 渐变

**Files:**
- Modify: `components/home/TaxHeader.tsx`

- [ ] **Step 1: 替换整个组件**

```tsx
"use client";

import { formatCurrency } from "@/lib/format";
import { homeVisual } from "@/lib/ui/homeVisual";
import { ReceiptIcon } from "@/components/icons/ReceiptIcon";
import { SlidersIcon } from "@/components/icons/SlidersIcon";
import { RefreshIcon } from "@/components/icons/RefreshIcon";

interface TaxHeaderProps {
  taxSaved: number | null;
  totalExpenses: number;
  receiptCount: number;
  animating: boolean;
  onSettingsClick: () => void;
  onSyncClick?: () => void;
  syncing?: boolean;
  syncDisabled?: boolean;
}

const actionBtn =
  "flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-black/40 transition-transform active:scale-95 disabled:opacity-40";

export function TaxHeader({
  taxSaved,
  totalExpenses,
  receiptCount,
  animating,
  onSettingsClick,
  onSyncClick,
  syncing = false,
  syncDisabled = false,
}: TaxHeaderProps) {
  const receiptLabel =
    receiptCount === 1 ? "1 receipt" : `${receiptCount} receipts`;

  return (
    <header className="relative min-h-[120px] max-h-[22vh] shrink-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: homeVisual.heroGradient }}
        aria-hidden
      />
      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <div className="min-w-0 flex-1 pr-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
            Estimated Tax Saved
          </p>
          <p
            className={`text-4xl font-black tracking-tight text-yellow-400 ${
              animating ? "animate-tax-bounce text-green-400" : ""
            }`}
          >
            {taxSaved === null ? "$- - -" : formatCurrency(taxSaved)}
          </p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-bold text-zinc-400">
            <ReceiptIcon className="h-3 w-3 shrink-0" />
            <span>
              {receiptLabel} • {formatCurrency(totalExpenses)} tracked
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onSyncClick && (
            <button
              type="button"
              onClick={onSyncClick}
              disabled={syncDisabled || syncing}
              className={actionBtn}
              aria-label="Sync receipts"
            >
              <RefreshIcon
                className={`h-5 w-5 text-white ${syncing ? "animate-spin" : ""}`}
              />
            </button>
          )}
          <button
            type="button"
            onClick={onSettingsClick}
            className={actionBtn}
            aria-label="Settings"
          >
            <SlidersIcon className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/home/TaxHeader.tsx
git commit -m "feat: hero gradient tax header with sliders settings icon"
```

---

### Task 4: SnapButton 三列布局

**Files:**
- Modify: `components/home/SnapButton.tsx`

- [ ] **Step 1: 更新 button className 与内部结构**

Replace button block:

```tsx
import { ChevronRightIcon } from "@/components/icons/ChevronRightIcon";
import { homeVisual } from "@/lib/ui/homeVisual";

// inside return:
<button
  type="button"
  onClick={openCamera}
  className={`flex ${homeVisual.snap.height} ${homeVisual.snap.maxHeight} w-full cursor-pointer flex-row items-center justify-between rounded-2xl border-4 border-white bg-yellow-500 px-5 text-black shadow-xl transition-all active:scale-[0.99] active:bg-yellow-400`}
>
  <CameraIcon className="h-10 w-10 shrink-0 stroke-[2.5]" />
  <div className="min-w-0 flex-1 px-3 text-left">
    <span className="block text-lg font-black uppercase tracking-wider">
      Snap Receipt
    </span>
    <span className="mt-0.5 block text-xs font-bold opacity-80">
      {resnapId ? "Resnap this receipt" : "Take a photo of your receipt"}
    </span>
  </div>
  <ChevronRightIcon className="h-6 w-6 shrink-0" />
</button>
```

Remove old centered `justify-center gap-3` layout.

- [ ] **Step 2: Commit**

```bash
git add components/home/SnapButton.tsx
git commit -m "feat: snap button three-column layout with subtext and chevron"
```

---

### Task 5: ReceiptFilterBar + stuck filter

**Files:**
- Modify: `components/home/ReceiptFilterBar.tsx`
- Modify: `components/home/ReceiptList.tsx`

- [ ] **Step 1: 扩展 `ReceiptFilter` 类型与 props**

```typescript
export type ReceiptFilter = "all" | "done" | "processing" | "blurry" | "stuck";

interface ReceiptFilterBarProps {
  counts: ReceiptStatusCounts;
  active: ReceiptFilter;
  stuckCount: number;
  onChange: (filter: ReceiptFilter) => void;
}
```

- [ ] **Step 2: 更新 FILTERS 数组**

```typescript
const FILTERS = [
  { id: "all" as const, label: "ALL", icon: "🧾", countKey: "all" as const },
  { id: "done" as const, label: "READY", icon: "✓", countKey: "done" as const },
  { id: "processing" as const, label: "PROCESSING", icon: "⚙️", countKey: "processing" as const },
  { id: "blurry" as const, label: "BLURRY", icon: "❌", countKey: "blurry" as const },
];
```

- [ ] **Step 3: 渲染末尾 stuck pill**

After FILTERS.map, append:

```tsx
<button
  type="button"
  onClick={() => onChange("stuck")}
  className={`relative shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
    active === "stuck"
      ? "bg-yellow-500/20 text-yellow-400 ring-2 ring-yellow-500"
      : "border border-zinc-700 bg-zinc-800/80 text-zinc-300"
  }`}
  aria-label={`Stuck receipts${stuckCount > 0 ? ` (${stuckCount})` : ""}`}
>
  ⚠️
  {stuckCount > 0 && (
    <span className="ml-1 tabular-nums">({stuckCount})</span>
  )}
</button>
```

- [ ] **Step 4: ReceiptList filter 逻辑**

```typescript
function filterReceipts(
  receipts: Receipt[],
  filter: ReceiptFilter,
  syncStuckIds: Set<string>,
): Receipt[] {
  if (filter === "stuck") {
    return receipts.filter((r) => syncStuckIds.has(r.id));
  }
  if (filter === "all") return receipts;
  return receipts.filter((r) => r.status === filter);
}
```

Pass `stuckCount={syncStuckIds.size}` to `ReceiptFilterBar`.

- [ ] **Step 5: Commit**

```bash
git add components/home/ReceiptFilterBar.tsx components/home/ReceiptList.tsx
git commit -m "feat: filter bar stuck shortcut pill"
```

---

### Task 6: ReceiptList PULL TO REFRESH

**Files:**
- Modify: `components/home/ReceiptList.tsx`
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1: ReceiptList 新 props**

```typescript
interface ReceiptListProps {
  receipts: Receipt[];
  syncStuckIds: Set<string>;
  onSelect: (receipt: Receipt) => void;
  onResnap: (id: string) => void;
  onRetrySync: (id: string) => void;
  onSyncClick?: () => void;
  syncing?: boolean;
  syncDisabled?: boolean;
}
```

- [ ] **Step 2: 替换 section 标题为双列行**

Replace single `<h2>` with:

```tsx
<div className="mb-2 flex items-center justify-between gap-2">
  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
    All Local Receipts
  </h2>
  {onSyncClick && (
    <button
      type="button"
      onClick={onSyncClick}
      disabled={syncDisabled || syncing}
      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 disabled:opacity-40"
    >
      Pull to refresh
      <RefreshIcon
        className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`}
      />
    </button>
  )}
</div>
```

Import `RefreshIcon` from `@/components/icons/RefreshIcon`.

- [ ] **Step 3: HomeScreen 透传**

```tsx
<ReceiptList
  receipts={receipts}
  syncStuckIds={syncStuckIds}
  onSelect={...}
  onResnap={handleResnap}
  onRetrySync={handleRetrySync}
  onSyncClick={handleManualListSync}
  syncing={listSyncing}
  syncDisabled={!navigator.onLine}
/>
```

- [ ] **Step 4: Commit**

```bash
git add components/home/ReceiptList.tsx components/home/HomeScreen.tsx
git commit -m "feat: pull to refresh entry in receipt list header"
```

---

### Task 7: ReceiptListCard 新布局

**Files:**
- Modify: `components/home/ReceiptListCard.tsx`

- [ ] **Step 1: 添加 visual state 辅助函数**

```typescript
import { CircularStatusIcon } from "./CircularStatusIcon";
import { StatusPill } from "./StatusPill";
import { ChevronRightIcon } from "@/components/icons/ChevronRightIcon";
import type { ReceiptVisualState } from "@/lib/ui/homeVisual";
import { getReceiptListIcon } from "@/lib/receipts/receiptListIcon";

function resolveVisualState(
  receipt: Receipt,
  syncStuck: boolean,
): { state: ReceiptVisualState; pill: "analyzing" | "uploading" | "paused" | "none" } {
  if (receipt.status === "processing") {
    if (syncStuck) {
      return {
        state: "paused",
        pill: "paused",
      };
    }
    if (receipt.pendingUpload) {
      return { state: "uploading", pill: "uploading" };
    }
    return { state: "analyzing", pill: "analyzing" };
  }
  if (receipt.status === "blurry") {
    return { state: "blurry", pill: "none" };
  }
  return { state: "done", pill: "none" };
}
```

- [ ] **Step 2: processing 卡片布局**

```tsx
if (receipt.status === "processing") {
  const pending = receipt.pendingUpload === true;
  const { state, pill } = resolveVisualState(receipt, syncStuck);
  const title = syncStuck
    ? pending
      ? "UPLOAD PAUSED"
      : "ANALYSIS PAUSED"
    : pending
      ? "UPLOADING..."
      : "UPLOADING...";
  const contextLabel = syncStuck ? "Tap to retry" : "Processing";

  return (
    <CardShell
      className="p-3"
      onClick={() => {
        if (syncStuck) onRetrySync(receipt.id);
        else onSelect(receipt);
      }}
    >
      <CircularStatusIcon state={state} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold uppercase text-yellow-500">{title}</p>
        <p className="mt-0.5 truncate text-xs text-zinc-400">
          {listSubtitle(receipt, contextLabel)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <StatusPill variant={pill} />
        <ChevronRightIcon className="h-5 w-5 text-zinc-500" />
      </div>
    </CardShell>
  );
}
```

- [ ] **Step 3: done 卡片 — 圆形 icon + StatusPill 显示税额**

```tsx
const categoryEmoji = getReceiptListIcon(receipt).emoji;

return (
  <CardShell className="p-3" onClick={() => onSelect(receipt)}>
    <CircularStatusIcon state="done" emoji={categoryEmoji} />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-extrabold uppercase text-white">
        {receipt.merchant ?? "Unknown merchant"}
      </p>
      <p className="mt-0.5 truncate text-xs text-zinc-400">
        {listDate} · {categoryLabel}
      </p>
    </div>
    <div className="flex shrink-0 items-center gap-0.5">
      <StatusPill variant="done" doneLabel={taxLabel} />
      <ChevronRightIcon className="h-5 w-5 text-zinc-500" />
    </div>
  </CardShell>
);
```

- [ ] **Step 4: 删除旧 `ReceiptIcon` 内部组件**（改用 CircularStatusIcon）

- [ ] **Step 5: CardShell 默认 class 更新**

```typescript
className={`flex w-full items-center gap-3 rounded-xl border border-zinc-700/80 bg-zinc-800/90 text-left transition-transform active:scale-[0.98] ${className}`}
```

- [ ] **Step 6: Commit**

```bash
git add components/home/ReceiptListCard.tsx
git commit -m "feat: receipt list card circular badges and status pills"
```

---

### Task 8: 文档 + 验证

**Files:**
- Modify: `docs/product/PRODUCT-SPEC.md`

- [ ] **Step 1: 更新 PRODUCT-SPEC §3**

Replace home layout bullets:

```markdown
├── 顶栏（hero 渐变 ~120px–22vh）：Tax Saved + 副标题（小票 icon）+ 刷新/设置
├── 快门区：140px 三列（相机 · SNAP RECEIPT + 副标题 · chevron）+ 合规脚注
└── 底栏：四态筛选 + stuck ⚠️ + PULL TO REFRESH + 圆形徽章卡片（Analyzing 蓝 / Paused 黄）
```

- [ ] **Step 2: 构建验证**

Run: `npm run build`  
Expected: PASS

- [ ] **Step 3: 视觉冒烟（375×667）**

| # | 检查项 |
|---|--------|
| 1 | 顶栏黄色渐变 hero，无照片请求 |
| 2 | Snap 有副标题 + 右 chevron |
| 3 | 列表头 PULL TO REFRESH 可点且与顶栏刷新等效 |
| 4 | ⚠️ filter 仅显示 stuck 票 |
| 5 | Analyzing 卡 blue pill，Paused 卡 yellow pill |

- [ ] **Step 4: Commit**

```bash
git add docs/product/PRODUCT-SPEC.md
git commit -m "docs: update product spec for home visual redesign"
```

---

## Spec 覆盖自检

| Spec § | Task |
|--------|------|
| §1 Hero header | 3 |
| §2 Snap shutter | 4 |
| §3 Filter + stuck | 5 |
| §4 PULL TO REFRESH | 6 |
| §5 List cards | 2, 7 |
| §6 Tokens | 1 |
| §8 PRODUCT-SPEC | 8 |
| §9 Testing | 8 |
