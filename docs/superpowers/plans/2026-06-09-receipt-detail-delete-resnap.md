# Receipt Detail DELETE / RESNAP Implementation Plan

> **Status:** Implemented

**Goal:** 小票详情 ORIGINAL RECEIPT CAPTURE 区叠加 DELETE/RESNAP；done 仅 DELETE + 确认 Sheet。

**Architecture:** 新建 `ReceiptCaptureActions` + `ReceiptDeleteConfirmSheet`；扩展 `ReceiptCaptureSection` overlay；`HomeScreen.handleDeleteReceipt` 统一本地+远端删除。

**Tech Stack:** Next.js React, IndexedDB, `deleteReceiptRemote` API.

**Spec:** [`2026-06-09-receipt-detail-delete-resnap-design.md`](../specs/2026-06-09-receipt-detail-delete-resnap-design.md)

---

### Task 1: ReceiptCaptureActions

**Files:**
- Create: `components/receipts/ReceiptCaptureActions.tsx`

- [ ] **Step 1: Create overlay actions**

```tsx
"use client";

import type { ReactNode } from "react";
import { homeVisual } from "@/lib/ui/homeVisual";

interface ReceiptCaptureActionsProps {
  showResnap?: boolean;
  busy?: boolean;
  onDelete: () => void;
  onResnap?: () => void;
}

export function ReceiptCaptureActions({
  showResnap = true,
  busy = false,
  onDelete,
  onResnap,
}: ReceiptCaptureActionsProps) {
  const { size, delete: deleteCls, resnap } = homeVisual.reviewControl;

  const btn = (
    label: string,
    ariaLabel: string,
    className: string,
    icon: ReactNode,
    onClick: () => void,
  ) => (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        disabled={busy}
        aria-label={ariaLabel}
        className={`flex ${size} items-center justify-center transition-transform active:scale-95 disabled:opacity-40 ${className}`}
      >
        {icon}
      </button>
      <span className="text-[10px] font-bold uppercase tracking-wide text-white drop-shadow-md">
        {label}
      </span>
    </div>
  );

  return (
    <div
      className={`pointer-events-auto absolute inset-0 z-10 flex items-center justify-center gap-8 bg-black/25 ${
        showResnap ? "" : ""
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {btn("Delete", "Delete receipt", deleteCls, <span className="text-xl">🗑</span>, onDelete)}
      {showResnap &&
        onResnap &&
        btn("Resnap", "Resnap receipt", resnap, <span className="text-2xl font-black">✕</span>, onResnap)}
    </div>
  );
}
```

---

### Task 2: ReceiptCaptureSection overlay

**Files:**
- Modify: `components/receipts/ReceiptCaptureSection.tsx`

- [ ] **Step 1: Add optional actions slot**

```tsx
interface ReceiptCaptureSectionProps {
  // ...existing
  actions?: React.ReactNode;
}

// In render, wrap img button:
<button ... className="relative ...">
  <img ... />
  {actions}
  <span className="... z-20">TAP TO ZOOM</span>
</button>
```

- [ ] **Step 2: Ensure zoom button area stays above overlay corner hint

---

### Task 3: ReceiptDeleteConfirmSheet

**Files:**
- Create: `components/receipts/ReceiptDeleteConfirmSheet.tsx`

- [ ] **Step 1: Bottom sheet**

```tsx
interface Props {
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

// z-[55] above detail sheet z-50
// Copy: "Delete this receipt?" / "This removes it from your deductions."
// Cancel: zinc border; Delete: red destructive min-h-14
```

---

### Task 4: HomeScreen handleDeleteReceipt

**Files:**
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1: Implement handler**

```typescript
const handleDeleteReceipt = useCallback(async (id: string) => {
  setReceipts((prev) => prev.filter((r) => r.id !== id));
  setSelectedReceipt((prev) => (prev?.id === id ? null : prev));
  watcherRef.current?.unwatch(id);
  queueRef.current?.onSettled(id);
  setSyncStuckIds((prev) => {
    if (!prev.has(id)) return prev;
    const next = new Set(prev);
    next.delete(id);
    return next;
  });
  await deleteStoredReceipt(id);
  if (navigator.onLine) {
    try {
      await ensureGhostSession();
      await deleteReceiptRemote(id);
    } catch {
      // local already removed; list refresh on next sync
    }
  }
  const stored = await loadReceipts();
  const visible = top100ByUpdatedAt(stored);
  setReceipts(visible);
  refreshTaxSaved(visible);
}, [refreshTaxSaved]);
```

- [ ] **Step 2: Pass `onDeleteReceipt={handleDeleteReceipt}` to `ReceiptDetailSheet`

---

### Task 5: ReceiptDetailSheet wiring

**Files:**
- Modify: `components/receipts/ReceiptDetailSheet.tsx`

- [ ] **Step 1: Props `onDeleteReceipt: (id: string) => Promise<void>`

- [ ] **Step 2: State `deleteBusy`, `showDeleteConfirm`

- [ ] **Step 3: Remove blurry hero yellow RESNAP button block (lines ~230-236)

- [ ] **Step 4: Pass actions to ReceiptCaptureSection**

```tsx
const showResnap = hero.kind === "processing" || hero.kind === "blurry";

<ReceiptCaptureSection
  ...
  actions={
    imageSrc ? (
      <ReceiptCaptureActions
        showResnap={showResnap}
        busy={deleteBusy}
        onDelete={() => void handleDeleteClick()}
        onResnap={showResnap ? handleResnap : undefined}
      />
    ) : undefined
  }
/>

const handleDeleteClick = async () => {
  if (hero.kind === "done") {
    setShowDeleteConfirm(true);
    return;
  }
  setDeleteBusy(true);
  try {
    await onDeleteReceipt(receipt.id);
    onClose();
  } finally {
    setDeleteBusy(false);
  }
};
```

- [ ] **Step 5: Render `ReceiptDeleteConfirmSheet` when done confirm open

---

### Task 6: Docs + build

**Files:**
- Modify: `docs/product/PRODUCT-SPEC.md` — 详情 DELETE/RESNAP 一行

- [ ] **Step 1: Manual acceptance spec §1–7**

- [ ] **Step 2: Run build**

```bash
npx next build
```

Expected: exit 0

---

## Plan self-review

| Spec requirement | Task |
|------------------|------|
| Overlay DELETE/RESNAP processing/blurry | 1, 2, 5 |
| done DELETE only | 1, 5 |
| done Sheet confirm | 3, 5 |
| Remove blurry top RESNAP | 5 |
| handleDeleteReceipt | 4 |
| zoom preserved | 2 |

No placeholders.

## Estimated effort

~2–3h implement + 30m QA
