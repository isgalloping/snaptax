# Receipt Duplicate Detection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 同一张小票扫第二次时，拍照瞬间本地 exact SHA256 拦截并提醒（不新增列表行），上传阶段保留服务端 409 兜底并加强 UX（文案 + 高亮 + 滚动）。

**Architecture:** 压缩管线与上传共用 `compressReceiptImage` 输出字节 → 浏览器 `crypto.subtle` 算 SHA256（与 Node `contentSha256` 一致）→ IDB 存 `contentSha256` 并索引查重 → capture/batch 共用 `prepareReceiptCapture` → 409 reconcile 复用同一 `showDuplicateReceiptNotice` helper。

**Tech Stack:** Next.js 16 · React 19 · IndexedDB · Web Crypto · node:test · tsx

**Spec:** [`docs/superpowers/specs/2026-06-17-receipt-duplicate-detection-design.md`](../specs/2026-06-17-receipt-duplicate-detection-design.md)

---

## File map

| File | Responsibility |
|------|----------------|
| `lib/receipts/clientContentSha256.ts` | Browser SHA-256 hex (matches server) |
| `lib/receipts/clientContentSha256.test.ts` | Cross-env hash parity |
| `lib/receipts/localDuplicate.ts` | Pure fn: find unfiled non-demo duplicate by sha |
| `lib/receipts/localDuplicate.test.ts` | Lookup edge cases |
| `lib/camera/compressReceiptImage.ts` | Add `compressReceiptImageWithFingerprint` |
| `lib/storage/crypto/photoStore.ts` | Accept pre-compressed blob (skip double compress) |
| `lib/storage/receiptDb.ts` | `contentSha256` field, IDB index v6, `savePhotoCompressed` |
| `lib/types.ts` | Optional `contentSha256` on `Receipt` |
| `lib/client/duplicateReceiptNotice.ts` | Notice copy + scroll + highlight timing |
| `lib/client/prepareReceiptCapture.ts` | Shared capture: compress → dedup → save |
| `components/home/HomeScreen.tsx` | Wire capture/batch/upload duplicate UX |
| `components/home/OfflineHomeShell.tsx` | Same capture dedup |
| `components/home/SnapButton.tsx` | Handle batch duplicate (no thumb) |
| `components/home/ReceiptList.tsx` | Pass `highlightReceiptId` |
| `components/home/ReceiptListCard.tsx` | Yellow ring pulse when highlighted |
| `lib/i18n/locales/en-US.ts` | `duplicateReceiptSimilar` copy |

---

### Task 1: Browser content SHA256

**Files:**
- Create: `lib/receipts/clientContentSha256.ts`
- Create: `lib/receipts/clientContentSha256.test.ts`
- Modify: `lib/receipts/imageFingerprint.test.ts` (import cross-check)

- [ ] **Step 1: Write the failing test**

```ts
// lib/receipts/clientContentSha256.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contentSha256 } from "./imageFingerprint.ts";
import { contentSha256FromBytes } from "./clientContentSha256.ts";

describe("clientContentSha256", () => {
  it("matches Node contentSha256 for the same bytes", async () => {
    const fixtures = [
      Buffer.from("same-receipt-bytes"),
      Buffer.from(""),
      Buffer.alloc(256, 0xab),
    ];
    for (const bytes of fixtures) {
      const nodeHex = contentSha256(bytes);
      const browserHex = await contentSha256FromBytes(
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      );
      assert.equal(browserHex, nodeHex);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- lib/receipts/clientContentSha256.test.ts`  
Expected: FAIL — `contentSha256FromBytes` not defined

- [ ] **Step 3: Implement**

```ts
// lib/receipts/clientContentSha256.ts
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function contentSha256FromBytes(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bufferToHex(digest);
}

export async function contentSha256FromBlob(blob: Blob): Promise<string> {
  return contentSha256FromBytes(await blob.arrayBuffer());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- lib/receipts/clientContentSha256.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/receipts/clientContentSha256.ts lib/receipts/clientContentSha256.test.ts
git commit -m "feat: add browser content SHA256 matching server fingerprint"
```

---

### Task 2: Local duplicate lookup

**Files:**
- Create: `lib/receipts/localDuplicate.ts`
- Create: `lib/receipts/localDuplicate.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/receipts/localDuplicate.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findLocalDuplicateBySha } from "./localDuplicate.ts";
import type { Receipt } from "@/lib/types";

const base = (id: string, sha?: string): Receipt & { contentSha256?: string } => ({
  id,
  status: "done",
  timestamp: new Date("2026-01-01T12:00:00.000Z"),
  contentSha256: sha,
});

describe("findLocalDuplicateBySha", () => {
  it("returns matching unfiled receipt", () => {
    const hit = findLocalDuplicateBySha(
      [base("a", "abc"), base("b", "def")],
      "abc",
    );
    assert.equal(hit?.id, "a");
  });

  it("excludes replaceId (resnap self)", () => {
    const hit = findLocalDuplicateBySha([base("a", "abc")], "abc", "a");
    assert.equal(hit, null);
  });

  it("ignores onboarding demo rows", () => {
    const demo = { ...base("demo", "abc"), isOnboardingDemo: true };
    assert.equal(findLocalDuplicateBySha([demo], "abc"), null);
    assert.equal(
      findLocalDuplicateBySha([demo, base("real", "abc")], "abc")?.id,
      "real",
    );
  });

  it("ignores filed receipts", () => {
    const filed = {
      ...base("f", "abc"),
      taxSeason: "2025",
      taxSeasonDate: new Date("2026-04-01T00:00:00.000Z"),
    };
    assert.equal(findLocalDuplicateBySha([filed], "abc"), null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- lib/receipts/localDuplicate.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// lib/receipts/localDuplicate.ts
import { isReceiptFiled } from "@/lib/receipts/filedStatus";
import type { Receipt } from "@/lib/types";

export type ReceiptWithSha = Receipt & { contentSha256?: string };

export function findLocalDuplicateBySha(
  receipts: ReceiptWithSha[],
  sha: string,
  excludeId?: string | null,
): ReceiptWithSha | null {
  for (const receipt of receipts) {
    if (excludeId && receipt.id === excludeId) continue;
    if (receipt.isOnboardingDemo) continue;
    if (isReceiptFiled(receipt)) continue;
    if (receipt.contentSha256 === sha) return receipt;
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- lib/receipts/localDuplicate.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/receipts/localDuplicate.ts lib/receipts/localDuplicate.test.ts
git commit -m "feat: local exact duplicate lookup by content SHA256"
```

---

### Task 3: Compress once with fingerprint

**Files:**
- Modify: `lib/camera/compressReceiptImage.ts`
- Modify: `lib/storage/crypto/photoStore.ts`

- [ ] **Step 1: Add compress + fingerprint export**

In `lib/camera/compressReceiptImage.ts`, after existing `compressReceiptImage`:

```ts
import { contentSha256FromBlob } from "@/lib/receipts/clientContentSha256";

export type CompressedReceiptImage = {
  blob: Blob;
  width: number;
  height: number;
  contentSha256: string;
};

export async function compressReceiptImageWithFingerprint(
  file: File | Blob,
): Promise<CompressedReceiptImage> {
  const { blob, width, height } = await compressReceiptImage(file);
  const contentSha256 = await contentSha256FromBlob(blob);
  return { blob, width, height, contentSha256 };
}
```

- [ ] **Step 2: Refactor photoStore to accept pre-compressed blob**

Change `saveEncryptedPhoto` signature:

```ts
export async function saveEncryptedPhoto(
  db: IDBDatabase,
  id: string,
  file: File | Blob,
  precompressed?: { blob: Blob; width: number; height: number },
): Promise<void> {
  const { blob: compressed, width, height } = precompressed
    ? precompressed
    : await compressReceiptImage(file);
  // ... rest unchanged, use `compressed`, `width`, `height`
}
```

- [ ] **Step 3: Verify no regressions**

Run: `npm run test:unit`  
Expected: all existing tests PASS

- [ ] **Step 4: Commit**

```bash
git add lib/camera/compressReceiptImage.ts lib/storage/crypto/photoStore.ts
git commit -m "feat: compress receipt image once with content SHA256"
```

---

### Task 4: IDB schema — contentSha256 index

**Files:**
- Modify: `lib/storage/idbStores.ts`
- Modify: `lib/types.ts`
- Modify: `lib/storage/receiptDb.ts`

- [ ] **Step 1: Bump IDB version**

```ts
// lib/storage/idbStores.ts
export const IDB_DB_VERSION = 6 as const;
```

- [ ] **Step 2: Add optional field to Receipt**

```ts
// lib/types.ts — inside Receipt interface
/** SHA-256 hex of compressed upload bytes; local dedup key. */
contentSha256?: string;
```

Ensure `StoredReceipt` inherits via `extends Receipt`.

- [ ] **Step 3: Add index in createReceiptIndexes**

```ts
ensureIndex("byContentSha256", "contentSha256");
```

Call `createReceiptIndexes(receiptStore)` on upgrade path when `oldVersion < 6` for both legacy and snaptax receipt stores (mirror existing v5 migration pattern in `migrateToSnaptaxStores`).

- [ ] **Step 4: Add savePhotoCompressed helper**

```ts
// lib/storage/receiptDb.ts
export async function savePhotoCompressed(
  id: string,
  compressed: { blob: Blob; width: number; height: number },
): Promise<void> {
  const db = await openDb();
  await ensurePhotoCipherReady(db);
  await saveEncryptedPhoto(db, id, compressed.blob, compressed);
}
```

Keep `savePhoto(id, file)` as thin wrapper: compress internally (legacy callers).

- [ ] **Step 5: Add IDB lookup by sha (optional fast path)**

```ts
export async function findReceiptIdByContentSha256(
  sha: string,
): Promise<string | null> {
  const db = await openDb();
  const store = receiptsStoreName(db);
  if (!store || !db.transaction(store, "readonly").objectStore(store).indexNames.contains("byContentSha256")) {
    return null;
  }
  const rows = await readIndexAll<SerializedReceipt>(
    db.transaction(store, "readonly").objectStore(store),
    "byContentSha256",
    IDBKeyRange.only(sha),
  );
  for (const row of rows) {
    const receipt = deserializeReceipt(row);
    if (receipt.isOnboardingDemo) continue;
    if (isReceiptFiled(receipt)) continue;
    return receipt.id;
  }
  return null;
}
```

Import `isReceiptFiled` from `@/lib/receipts/filedStatus`.

- [ ] **Step 6: Verify**

Run: `npm run test:unit`  
Expected: PASS (no IDB tests yet — manual smoke in Task 8)

- [ ] **Step 7: Commit**

```bash
git add lib/storage/idbStores.ts lib/types.ts lib/storage/receiptDb.ts
git commit -m "feat: persist contentSha256 on receipts with IDB index"
```

---

### Task 5: Duplicate notice helper

**Files:**
- Create: `lib/client/duplicateReceiptNotice.ts`
- Modify: `lib/i18n/locales/en-US.ts`

- [ ] **Step 1: Add i18n copy**

```ts
// lib/i18n/locales/en-US.ts — home.receiptList
duplicateReceipt: "This receipt is already in your list.",
duplicateReceiptSimilar: "This looks like a receipt you already snapped.",
```

Update locale type if `UserCopy` is strictly typed (grep `duplicateReceipt` in i18n types file and add sibling key).

- [ ] **Step 2: Implement notice helper**

```ts
// lib/client/duplicateReceiptNotice.ts
export type DuplicateMatchType = "exact" | "similar";

export function duplicateNoticeCopy(
  copy: { duplicateReceipt: string; duplicateReceiptSimilar: string },
  matchType: DuplicateMatchType,
): string {
  return matchType === "similar"
    ? copy.duplicateReceiptSimilar
    : copy.duplicateReceipt;
}

export function scrollReceiptIntoView(receiptId: string): void {
  const el = document.querySelector(`[data-receipt-id="${receiptId}"]`);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export const DUPLICATE_HIGHLIGHT_MS = 2000;
```

- [ ] **Step 3: Commit**

```bash
git add lib/client/duplicateReceiptNotice.ts lib/i18n/locales/en-US.ts
git commit -m "feat: duplicate receipt notice copy and scroll helper"
```

---

### Task 6: Shared capture preparation

**Files:**
- Create: `lib/client/prepareReceiptCapture.ts`

- [ ] **Step 1: Implement capture result union**

```ts
// lib/client/prepareReceiptCapture.ts
import { compressReceiptImageWithFingerprint } from "@/lib/camera/compressReceiptImage";
import { findLocalDuplicateBySha } from "@/lib/receipts/localDuplicate";
import {
  findReceiptIdByContentSha256,
  loadAllReceipts,
  savePhotoCompressed,
  saveReceipt,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";
import { withFreshBudget } from "@/lib/receipts/receiptWriteBudget";
import { utcNow } from "@/lib/time/utc";

export type CapturePrepareResult =
  | { kind: "duplicate"; existingReceiptId: string }
  | { kind: "created"; receipt: StoredReceipt };

export async function prepareReceiptCapture(
  file: File,
  options?: { replaceId?: string | null; skipSave?: boolean },
): Promise<CapturePrepareResult> {
  const { blob, width, height, contentSha256 } =
    await compressReceiptImageWithFingerprint(file);

  const excludeId = options?.replaceId ?? null;
  const inMemory = await loadAllReceipts();
  const memHit = findLocalDuplicateBySha(inMemory, contentSha256, excludeId);
  if (memHit) {
    return { kind: "duplicate", existingReceiptId: memHit.id };
  }

  const idbHit = await findReceiptIdByContentSha256(contentSha256);
  if (idbHit && idbHit !== excludeId) {
    return { kind: "duplicate", existingReceiptId: idbHit };
  }

  const id = excludeId ?? crypto.randomUUID();
  const snapAt = utcNow();
  const receipt: StoredReceipt = withFreshBudget({
    id,
    status: "processing",
    merchant: "Scanning",
    timestamp: snapAt,
    updatedAt: snapAt,
    pendingUpload: true,
    contentSha256,
  });

  if (!options?.skipSave) {
    await savePhotoCompressed(id, { blob, width, height });
    await saveReceipt(receipt);
  }

  return { kind: "created", receipt };
}
```

Adjust imports to match actual `withFreshBudget` path in codebase.

- [ ] **Step 2: Commit**

```bash
git add lib/client/prepareReceiptCapture.ts
git commit -m "feat: shared receipt capture with local duplicate detection"
```

---

### Task 7: List row highlight

**Files:**
- Modify: `components/home/ReceiptListCard.tsx`
- Modify: `components/home/ReceiptList.tsx`

- [ ] **Step 1: Add highlight prop to card**

```tsx
// ReceiptListCardProps
highlighted?: boolean;

// CardShell className when highlighted:
className={cn(
  existingClasses,
  highlighted && "ring-2 ring-yellow-500 animate-pulse",
)}
// Add data-receipt-id={receipt.id} on outermost element
```

- [ ] **Step 2: Thread highlightReceiptId through ReceiptList**

```tsx
// ReceiptListProps
highlightReceiptId?: string | null;

// In map:
<ReceiptListCard
  highlighted={highlightReceiptId === receipt.id}
  ...
/>
```

- [ ] **Step 3: Commit**

```bash
git add components/home/ReceiptListCard.tsx components/home/ReceiptList.tsx
git commit -m "feat: highlight duplicate receipt row in list"
```

---

### Task 8: HomeScreen capture + upload UX

**Files:**
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1: Add highlight state + showDuplicate helper**

```tsx
const [highlightReceiptId, setHighlightReceiptId] = useState<string | null>(null);

const showDuplicateReceiptNotice = useCallback(
  (existingReceiptId: string, matchType: "exact" | "similar") => {
    setReceiptNotice(
      duplicateNoticeCopy(copy.home.receiptList, matchType),
    );
    setHighlightReceiptId(existingReceiptId);
    window.setTimeout(() => setHighlightReceiptId(null), DUPLICATE_HIGHLIGHT_MS);
    requestAnimationFrame(() => scrollReceiptIntoView(existingReceiptId));
  },
  [copy.home.receiptList],
);
```

- [ ] **Step 2: Refactor handleCapture**

Replace body with:

```tsx
const handleCapture = useCallback(
  async (file: File) => {
    const replaceId = resnapId;
    setResnapId(null);

    const result = await prepareReceiptCapture(file, { replaceId });
    if (result.kind === "duplicate") {
      showDuplicateReceiptNotice(result.existingReceiptId, "exact");
      return;
    }

    const { receipt: processingReceipt } = result;
    setReceipts((prev) => {
      const without = replaceId ? prev.filter((r) => r.id !== replaceId) : prev;
      return top100ByUpdatedAt([processingReceipt, ...without]);
    });
    scheduleOcrJob(processingReceipt.id);

    if (replaceId) {
      watcherRef.current?.unwatch(replaceId);
      queueRef.current?.onSettled(replaceId);
      setSyncStuckIds((prev) => {
        if (!prev.has(replaceId)) return prev;
        const next = new Set(prev);
        next.delete(replaceId);
        return next;
      });
    }
  },
  [resnapId, showDuplicateReceiptNotice],
);
```

Remove direct `savePhoto` / `saveReceipt` from old handleCapture (now inside `prepareReceiptCapture`).

- [ ] **Step 3: Refactor handleBatchShot**

```tsx
const handleBatchShot = useCallback(
  async (file: File): Promise<string | null> => {
    const result = await prepareReceiptCapture(file);
    if (result.kind === "duplicate") {
      showDuplicateReceiptNotice(result.existingReceiptId, "exact");
      return null;
    }
    const { receipt } = result;
    deferBatchOcrUpload([receipt.id]);
    scheduleOcrJob(receipt.id);
    return receipt.id;
  },
  [showDuplicateReceiptNotice],
);
```

- [ ] **Step 4: Update handleDuplicateUpload**

```tsx
const handleDuplicateUpload = useCallback(
  async (
    localId: string,
    existingReceiptId: string,
    prior?: StoredReceipt,
    matchType: "exact" | "similar" = "exact",
  ) => {
    // ... existing reconcile logic ...
    showDuplicateReceiptNotice(existingReceiptId, matchType);
    // remove standalone setReceiptNotice(copy.home.receiptList.duplicateReceipt)
  },
  [showDuplicateReceiptNotice, refreshTaxSaved],
);
```

Pass `err.matchType` from `isDuplicateReceiptError` catch:

```tsx
await handleDuplicateUpload(latest.id, err.existingReceiptId, latest, err.matchType);
```

Same for legacy `DUPLICATE_RECEIPT` fallback path — use `"exact"`.

- [ ] **Step 5: Pass highlightReceiptId to ReceiptList**

```tsx
<ReceiptList
  highlightReceiptId={highlightReceiptId}
  ...
/>
```

- [ ] **Step 6: Manual smoke**

1. `npm run dev`
2. Snap same gallery image twice → one list row, yellow notice, row pulse
3. (Online) confirm upload 409 still merges if hash somehow diverges

- [ ] **Step 7: Commit**

```bash
git add components/home/HomeScreen.tsx
git commit -m "feat: local duplicate detection on capture with highlight UX"
```

---

### Task 9: SnapButton batch duplicate handling

**Files:**
- Modify: `components/home/SnapButton.tsx`
- Modify: `components/home/HomeScreen.tsx` (prop type if needed)

- [ ] **Step 1: Update onBatchShot type**

```tsx
// SnapButton props
onBatchShot: (file: File) => Promise<string | null>;
```

- [ ] **Step 2: Handle null id in handleBatchShot**

```tsx
const handleBatchShot = async (file: File) => {
  const id = await onBatchShot(file);
  if (!id) return; // duplicate — parent already showed notice

  const slot = resnapSlotIndexRef.current;
  // ... existing thumb/session logic unchanged
};
```

- [ ] **Step 3: Commit**

```bash
git add components/home/SnapButton.tsx
git commit -m "fix: skip batch thumb when capture is duplicate"
```

---

### Task 10: OfflineHomeShell parity

**Files:**
- Modify: `components/home/OfflineHomeShell.tsx`

- [ ] **Step 1: Replace handleCapture with prepareReceiptCapture + notice**

Mirror HomeScreen: `prepareReceiptCapture`, `showDuplicateReceiptNotice`, `highlightReceiptId`, pass to `ReceiptList`.

Offline shell has no upload queue — Layer 1 only is sufficient here.

- [ ] **Step 2: Commit**

```bash
git add components/home/OfflineHomeShell.tsx
git commit -m "feat: offline home duplicate capture detection"
```

---

### Task 11: Final verification

- [ ] **Step 1: Run unit tests**

Run: `npm run test:unit`  
Expected: PASS (including new clientContentSha256 + localDuplicate tests)

- [ ] **Step 2: Run lint**

Run: `npm run lint`  
Expected: no new errors in touched files (pre-existing repo lint may still fail globally)

- [ ] **Step 3: Spec success criteria checklist**

| Criterion | Verify |
|-----------|--------|
| Same JPEG snapped twice → one list row | Manual gallery test |
| Second snap → yellow notice + highlight | Visual |
| Upload 409 exact/similar → merge + correct copy | Mock or staging with similar image |
| Zero Modal on dedup | No Sheet/Dialog opens |
| SHA256 browser/Node parity | Unit test Task 1 |

- [ ] **Step 4: Commit spec + plan (if not yet committed)**

```bash
git add docs/superpowers/specs/2026-06-17-receipt-duplicate-detection-design.md \
        docs/superpowers/plans/2026-06-17-receipt-duplicate-detection.md
git commit -m "docs: receipt duplicate detection spec and plan"
```

---

## Plan self-review

**Spec coverage:**

| Spec section | Task |
|--------------|------|
| Layer 1 local exact | Tasks 1–4, 6, 8, 10 |
| Layer 2 server 409 UX | Task 8 (`matchType` copy) |
| Zero Modal | All tasks (notice only) |
| Highlight + scroll | Tasks 5, 7, 8 |
| Batch / resnap / demo / filed edges | Tasks 2, 6, 9 |
| Legacy backfill | Out of scope (spec) |
| Local similar dHash | Out of scope (spec) |

**Placeholder scan:** None — all steps include concrete code or commands.

**Type consistency:** `CapturePrepareResult`, `DuplicateMatchType`, `onBatchShot: Promise<string | null>`, `contentSha256` on `Receipt` used consistently throughout.

---

## Execution handoff

Plan saved to `docs/superpowers/plans/2026-06-17-receipt-duplicate-detection.md`.

**两种执行方式：**

1. **Subagent-Driven（推荐）** — 每个 Task 派独立 subagent，任务间 review，迭代快  
2. **Inline Execution** — 本会话按 Task 顺序直接实现，checkpoint 处暂停给你看

你想用哪种方式开始实现？
