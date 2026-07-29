# Local Image Storage (OPFS + Compress + 90d Retention) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move receipt image bytes from IndexedDB blobs to OPFS (encrypted), store only metadata in `snaptax_receipt_photos`, compress captures to ~1280×960 JPEG 75% (~200–300KB), and purge synced full images after 90 days while keeping thumbnails.

**Architecture:** Capture → `compressReceiptImage` → encrypt (existing DEK) → OPFS files + IDB meta row. IDB v5 renames stores to `snaptax_*`. Upload success sets `remoteSyncedAtMs` (no immediate delete). Idle job purges OPFS full files when synced ≥90d. `resolveReceiptImage` prefers local full → remote signed URL → local thumb.

**Tech Stack:** Web Crypto AES-GCM (existing), OPFS (`navigator.storage.getDirectory`), Canvas/`createImageBitmap`, IndexedDB v5, Node test runner (`npm run test:unit`).

**Specs:** [`docs/tech/12-local-image-storage-design.md`](../../tech/12-local-image-storage-design.md) · [`DB-DESIGN-SPEC.md`](../../tech/DB-DESIGN-SPEC.md) §2.2–2.3 · [`receipt-sync-lifecycle-design.md`](../topics/receipt-sync-lifecycle-design.md) §3.6

**Out of scope (this plan):** OCR Worker pipeline (`11-ocr-pipeline-design.md` Phase 1) · 18-month receipt row prune · Event Store

---

## Rollout phases

| Phase | Delivers | User-visible |
|-------|----------|--------------|
| **P0** | Compress at capture (still legacy IDB store) | Smaller uploads, faster persist |
| **P1** | IDB v5 + `snaptax_*` stores + OPFS for **new** photos | New captures use OPFS |
| **P2** | Legacy v4 photo → OPFS migration job | Existing users upgraded in background |
| **P3** | Upload `remoteSyncedAtMs` + remove immediate reconcile delete | Local full kept post-sync |
| **P4** | 90d idle purge + thumb-aware image resolve | Disk savings after 90d |

**Ship gate:** P0+P1+P3 before release; P2 can run as background migration on first launch; P4 can ship same release if idle job is low-risk.

---

## File map

| File | Action |
|------|--------|
| `lib/storage/idbStores.ts` | **Create** — canonical store names + DB version |
| `lib/camera/imageDimensions.ts` | **Create** — pure fit-inside math |
| `lib/camera/imageDimensions.test.ts` | **Create** |
| `lib/camera/compressReceiptImage.ts` | **Create** — canvas compress + target size loop |
| `lib/camera/compressReceiptImage.test.ts` | **Create** — dimension helpers only (no canvas in node) |
| `lib/camera/generateReceiptThumbnail.ts` | **Create** — 480px edge from full blob |
| `lib/storage/photoTypes.ts` | **Create** — `ReceiptPhotoMeta` |
| `lib/storage/opfs/opfsRoot.ts` | **Create** — `getSnaptaxRoot()`, `isOpfsAvailable()` |
| `lib/storage/opfs/photoFiles.ts` | **Create** — encrypted read/write/delete |
| `lib/storage/opfs/photoFiles.test.ts` | **Create** — path helpers (no OPFS in node) |
| `lib/storage/photoMetadata.ts` | **Create** — IDB meta CRUD |
| `lib/storage/crypto/photoStore.ts` | **Rewrite** — delegate to OPFS+meta; legacy IDB read fallback |
| `lib/storage/crypto/photoMigration.ts` | **Extend** — v4 blob → OPFS job |
| `lib/storage/receiptDb.ts` | **Modify** — v5 schema, store renames, wire new APIs |
| `lib/client/photoRetention.ts` | **Create** — 90d full purge |
| `lib/client/photoRetention.test.ts` | **Create** |
| `lib/client/receiptSync.ts` | **Modify** — replace `reconcileServerPrimaryPhotos` |
| `lib/receipts/receiptDetail.ts` | **Modify** — fullPurged + thumb fallback |
| `lib/camera/capturePhoto.ts` | **Modify** — call compress after frame capture |
| `components/home/HomeScreen.tsx` | **Modify** — compress gallery pick; schedule retention |
| `components/home/OfflineHomeShell.tsx` | **Modify** — compress on capture |
| `lib/storage/clearLocalData.ts` | **Modify** — wipe OPFS `snaptax/` tree |
| `docs/tech/12-local-image-storage-design.md` | **Modify** — mark Implemented sections |

---

## Task 1: IDB store constants

**Files:**
- Create: `lib/storage/idbStores.ts`

- [ ] **Step 1: Add canonical constants**

```typescript
export const IDB_DB_NAME = "snap1099" as const;
export const IDB_DB_VERSION = 5 as const;

export const IDB_STORE_RECEIPTS = "snaptax_receipts" as const;
export const IDB_STORE_RECEIPT_PHOTOS = "snaptax_receipt_photos" as const;
export const IDB_STORE_SYSTEM_META = "snaptax_system_meta" as const;
export const IDB_STORE_CRYPTO_META = "snaptax_crypto_meta" as const;

/** v4 legacy — migration only */
export const IDB_LEGACY_RECEIPTS = "receipts" as const;
export const IDB_LEGACY_PHOTOS = "photos" as const;
export const IDB_LEGACY_SYSTEM_META = "system_meta" as const;
export const IDB_LEGACY_CRYPTO_META = "meta" as const;

export const OPFS_PHOTOS_PREFIX = "snaptax/photos" as const;
```

- [ ] **Step 2: Run tests**

Run: `npm run test:unit`  
Expected: PASS (no new tests yet)

---

## Task 2: Image dimension helpers (TDD)

**Files:**
- Create: `lib/camera/imageDimensions.ts`
- Create: `lib/camera/imageDimensions.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fitInsideDimensions } from "@/lib/camera/imageDimensions";

describe("fitInsideDimensions", () => {
  it("scales 4032x3024 to max edge 1280", () => {
    const r = fitInsideDimensions(4032, 3024, 1280);
    assert.equal(r.width, 1280);
    assert.equal(r.height, 960);
  });

  it("does not upscale small images", () => {
    const r = fitInsideDimensions(800, 600, 1280);
    assert.equal(r.width, 800);
    assert.equal(r.height, 600);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm run test:unit -- lib/camera/imageDimensions.test.ts`

- [ ] **Step 3: Implement**

```typescript
export function fitInsideDimensions(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    throw new Error("Invalid dimensions");
  }
  if (width <= maxEdge && height <= maxEdge) {
    return { width, height };
  }
  const scale = maxEdge / Math.max(width, height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
```

- [ ] **Step 4: Run test — expect PASS**

---

## Task 3: Client JPEG compress (browser)

**Files:**
- Create: `lib/camera/compressReceiptImage.ts`
- Modify: `lib/camera/capturePhoto.ts`

Constants (lock to spec):

```typescript
export const RECEIPT_FULL_MAX_EDGE = 1280;
export const RECEIPT_FULL_JPEG_QUALITY = 0.75;
export const RECEIPT_FULL_JPEG_MIN_QUALITY = 0.65;
export const RECEIPT_FULL_TARGET_MAX_BYTES = 300_000;
export const RECEIPT_FULL_TARGET_MIN_BYTES = 200_000;
```

- [ ] **Step 1: Implement `compressReceiptImage(file: Blob): Promise<{ blob: Blob; width: number; height: number }>`**

Algorithm:
1. `createImageBitmap(file)` → get natural width/height
2. `fitInsideDimensions(w, h, 1280)` → canvas size
3. `canvas.toBlob(..., "image/jpeg", quality)` starting at **0.75**
4. If `blob.size > 300_000`, lower quality by **0.05** until **0.65** or under 300KB
5. Return `{ blob, width, height }`

Guard: `typeof document === "undefined"` → throw (browser-only).

- [ ] **Step 2: Wire `captureVideoFrame`**

In `capturePhoto.ts`, after `drawImage`, replace direct `toBlob` with:

```typescript
const raw = await new Promise<Blob>((resolve, reject) => {
  canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Capture failed"))), "image/jpeg", 0.92);
});
const { blob, width, height } = await compressReceiptImage(raw);
return new File([blob], `receipt-${Date.now()}.jpg`, { type: "image/jpeg" });
```

(Keep 0.92 only as intermediate canvas step; user-facing file is compressed.)

- [ ] **Step 3: Manual smoke**

Run: `npm run dev` → gallery pick or capture → verify Network upload payload **< ~350KB** (DevTools).

---

## Task 4: Thumbnail generator

**Files:**
- Create: `lib/camera/generateReceiptThumbnail.ts`

- [ ] **Step 1: Implement `generateReceiptThumbnail(full: Blob): Promise<{ blob: Blob; width: number; height: number }>`**

- Max edge **480**, JPEG **0.70**
- Input: compressed full blob (not camera raw)
- Same canvas pattern as Task 3

---

## Task 5: Photo meta types + OPFS path helpers

**Files:**
- Create: `lib/storage/photoTypes.ts`
- Create: `lib/storage/opfs/opfsRoot.ts`
- Create: `lib/storage/opfs/photoFiles.ts`
- Create: `lib/storage/opfs/photoFiles.test.ts`

- [ ] **Step 1: Define `ReceiptPhotoMeta`** (match spec §4)

Include `fullIvB64` / `thumbIvB64` (store IV in IDB; OPFS file = ciphertext only).

- [ ] **Step 2: Path helpers + tests**

```typescript
export function opfsFullRelPath(receiptId: string): string {
  return `${OPFS_PHOTOS_PREFIX}/${receiptId}/full.v1.enc`;
}
export function opfsThumbRelPath(receiptId: string): string {
  return `${OPFS_PHOTOS_PREFIX}/${receiptId}/thumb.v1.enc`;
}
```

- [ ] **Step 3: `isOpfsAvailable()`**

```typescript
export function isOpfsAvailable(): boolean {
  return typeof navigator !== "undefined" && "storage" in navigator && "getDirectory" in navigator.storage;
}
```

- [ ] **Step 4: `getSnaptaxRoot(): Promise<FileSystemDirectoryHandle>`**

`navigator.storage.getDirectory()` → ensure `snaptax/photos/` via `getDirectoryHandle(..., { create: true })`.

- [ ] **Step 5: `writeEncryptedFile(relPath, iv, ct)` / `readEncryptedFile` / `deleteOpfsPath`**

Use existing `encryptBuffer` / `decryptBuffer` from `lib/storage/crypto/aesGcm.ts` + DEK from `keyManager`.

---

## Task 6: Photo metadata IDB CRUD

**Files:**
- Create: `lib/storage/photoMetadata.ts`

- [ ] **Step 1: Implement**

```typescript
export async function putPhotoMeta(db: IDBDatabase, meta: ReceiptPhotoMeta): Promise<void>
export async function getPhotoMeta(db: IDBDatabase, id: string): Promise<ReceiptPhotoMeta | null>
export async function deletePhotoMeta(db: IDBDatabase, id: string): Promise<void>
export async function listPhotoMetaForRetention(db: IDBDatabase): Promise<ReceiptPhotoMeta[]>
```

Store name: `IDB_STORE_RECEIPT_PHOTOS` from `idbStores.ts`.

`listPhotoMetaForRetention`: `getAll()` filter `remoteSyncedAtMs && !fullPurged`.

---

## Task 7: Rewrite photoStore (OPFS primary)

**Files:**
- Modify: `lib/storage/crypto/photoStore.ts`

Public API **unchanged** for callers: `saveEncryptedPhoto`, `loadEncryptedPhoto`, `deleteEncryptedPhoto`.

- [ ] **Step 1: New save path**

```typescript
export async function saveEncryptedPhoto(db, id, file) {
  if (!isOpfsAvailable()) {
    return saveLegacyEncryptedPhotoInIdb(db, id, file); // existing v4 logic, temporary fallback
  }
  const full = await compressReceiptImage(file);
  const thumb = await generateReceiptThumbnail(full.blob);
  const dek = await getOrCreateDek(db);
  const fullEnc = await encryptBuffer(dek, await full.blob.arrayBuffer());
  const thumbEnc = await encryptBuffer(dek, await thumb.blob.arrayBuffer());
  await writeEncryptedFile(opfsFullRelPath(id), fullEnc.iv, fullEnc.ct);
  await writeEncryptedFile(opfsThumbRelPath(id), thumbEnc.iv, thumbEnc.ct);
  await putPhotoMeta(db, { id, v: 2, mime: "image/jpeg", ...paths, ivs, byteLengths });
}
```

- [ ] **Step 2: Load full**

```typescript
export async function loadEncryptedPhoto(db, id) {
  const meta = await getPhotoMeta(db, id);
  if (meta && !meta.fullPurged) {
    const ct = await readEncryptedFile(meta.opfsFullPath);
    const plain = await decryptBuffer(dek, base64ToIv(meta.fullIvB64), ct);
    return new Blob([plain], { type: meta.mime });
  }
  // fallback: legacy IDB row with ct/blob (v4)
  return loadLegacyEncryptedPhoto(db, id);
}
```

- [ ] **Step 3: Add `loadEncryptedThumbnail(db, id)`**

Same as full but `opfsThumbPath` / `thumbIvB64`.

- [ ] **Step 4: Delete**

Remove OPFS files + meta row + legacy IDB row if present.

- [ ] **Step 5: Add `markPhotoRemoteSynced(db, id, atMs = Date.now())`**

Set `remoteSyncedAtMs` on meta row (create minimal meta if missing — should not happen).

- [ ] **Step 6: Add `purgePhotoFull(db, id)`**

Delete OPFS full file; set `fullPurged: true`, `fullPurgedAtMs`.

Export new functions from `receiptDb.ts` as needed.

---

## Task 8: IndexedDB v5 migration (`snaptax_*` stores)

**Files:**
- Modify: `lib/storage/receiptDb.ts`
- Modify: `lib/storage/crypto/keyManager.ts` — import store name from `idbStores`

- [ ] **Step 1: Bump to `IDB_DB_VERSION = 5`**

Replace local `RECEIPTS_STORE` etc. with imports from `idbStores.ts`.

- [ ] **Step 2: `onupgradeneeded` v4 → v5**

```
1. Create snaptax_receipts, snaptax_receipt_photos, snaptax_system_meta, snaptax_crypto_meta if missing
2. If legacy receipts exists: cursor copy all → snaptax_receipts; drop legacy store
3. Same for system_meta → snaptax_system_meta, meta → snaptax_crypto_meta
4. Do NOT drop legacy photos in upgrade (async migration in Task 9)
5. Set system_meta key photo_opfs_migration_v1 = "pending" if legacy photos has rows
```

Indexes on `snaptax_receipts`: recreate `updatedAtMs`, `isFiled`, `status` (copy from v4 upgrade logic).

- [ ] **Step 3: Update all transaction store names in receiptDb**

- [ ] **Step 4: Regression**

Run: `npm run test:unit`  
Manual: existing dev DB — reload app, verify receipts list intact.

---

## Task 9: Legacy photo migration (v4 IDB blob → OPFS)

**Files:**
- Modify: `lib/storage/crypto/photoMigration.ts`
- Modify: `lib/storage/receiptDb.ts` — call after `openDb`

- [ ] **Step 1: `migrateLegacyPhotosToOpfs(db)`**

```
if !isOpfsAvailable() return;
if readSystemMeta("photo_opfs_migration_v1") === "done" return;
cursor legacy photos store OR snaptax_receipt_photos rows with ct/blob:
  decrypt → compress if huge (>500KB plaintext) → write OPFS + meta
  delete legacy blob fields / delete legacy store row
set photo_opfs_migration_v1 = "done"
```

Run from `deferAfterPaint` in HomeScreen (same as startup sync), **not** in `onupgradeneeded`.

- [ ] **Step 2: Drop legacy `photos` store on v6** (optional follow-up — keep read fallback in v5)

---

## Task 10: Upload lifecycle — keep local full + `remoteSyncedAtMs`

**Files:**
- Modify: `lib/client/receiptSync.ts`
- Modify: `components/home/HomeScreen.tsx` — `persistUploadedReceipt`
- Modify: `lib/client/reconcileDuplicateReceipt.ts` if it deletes photos

- [ ] **Step 1: Remove immediate delete**

Delete call to `reconcileServerPrimaryPhotos(merged)` in `receiptSync.ts` **or** replace implementation:

```typescript
export async function reconcileServerPrimaryPhotos(receipts) {
  const db = await openDb();
  for (const r of receipts.filter(r => r.hasRemoteImage)) {
    await markPhotoRemoteSynced(db, r.id);
  }
}
```

Rename to `markRemoteSyncedPhotos` (update import sites).

- [ ] **Step 2: On upload success in `persistUploadedReceipt`**

After `saveReceipt(updated)`:

```typescript
await markPhotoRemoteSynced(await openDb(), updated.id);
```

- [ ] **Step 3: Verify no `deletePhoto` on upload success** in HomeScreen / reconcileDuplicateReceipt

- [ ] **Step 4: Unit test**

`lib/client/receiptSync.test.ts` — assert merged sync does **not** delete photo meta when `hasRemoteImage`.

---

## Task 11: 90-day full image retention job

**Files:**
- Create: `lib/client/photoRetention.ts`
- Create: `lib/client/photoRetention.test.ts`

- [ ] **Step 1: Pure selector test**

```typescript
export const PHOTO_FULL_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export function shouldPurgePhotoFull(meta: ReceiptPhotoMeta, nowMs: number): boolean {
  if (meta.fullPurged) return false;
  if (!meta.remoteSyncedAtMs) return false;
  return nowMs - meta.remoteSyncedAtMs >= PHOTO_FULL_RETENTION_MS;
}
```

- [ ] **Step 2: `purgeExpiredPhotoFulls(db, receiptRows, nowMs)`**

Skip if receipt has `pendingUpload` or `status === "processing"` (load receipt by id from passed map).

For each eligible meta: `purgePhotoFull(db, id)`.

- [ ] **Step 3: Wire idle scheduler**

In `HomeScreen.runDeferredStartup` after sync:

```typescript
deferAfterPaint(() => {
  void purgeExpiredPhotoFullsIdle(); // wraps requestIdleCallback + 30s setTimeout fallback
});
```

**Must not** run before first paint or block shutter.

---

## Task 12: Image resolve — full, remote, thumb

**Files:**
- Modify: `lib/receipts/receiptDetail.ts`
- Modify: `lib/storage/receiptDb.ts` — export `loadPhotoThumb`

- [ ] **Step 1: Extend `tryLocal`**

```typescript
const blob = (await loadPhoto(receipt.id)) ?? (await loadPhotoThumb(receipt.id));
```

Only use thumb when full missing (purged) **and** offline; online purged → prefer remote first (existing `preferRemoteFirst`).

- [ ] **Step 2: Batch camera preview**

If batch UI uses `loadPhoto` for thumbnails, switch to `loadPhotoThumb` in camera overlay component (grep `loadPhoto` in `components/camera/`).

---

## Task 13: Clear local data + delete receipt

**Files:**
- Modify: `lib/storage/receiptDb.ts` — `deleteReceipt`, `clearAllLocalData`
- Create or extend: `lib/storage/opfs/wipeSnaptaxTree.ts`

- [ ] **Step 1: `deleteReceipt`** — delete OPFS dir `snaptax/photos/{id}/` + meta

- [ ] **Step 2: `clearAllLocalData`** — wipe entire `snaptax/` OPFS subtree + all IDB stores

- [ ] **Step 3: Delete Account flow** — already calls `clearLocalAppData`; verify OPFS empty

---

## Task 14: Gallery pick compression (HomeScreen)

**Files:**
- Modify: `components/home/HomeScreen.tsx`
- Modify: `components/home/OfflineHomeShell.tsx`

- [ ] **Step 1: Find gallery `input type=file` handler**

Before `savePhoto(id, file)`:

```typescript
const { blob } = await compressReceiptImage(file);
await savePhoto(id, blob);
```

Same for OfflineHomeShell capture path if not using `captureVideoFrame`.

---

## Task 15: Verification + docs

- [ ] **Unit tests green**

Run: `npm run test:unit`  
Expected: all PASS

- [ ] **Lint**

Run: `npm run lint`

- [ ] **Manual acceptance (spec §10)**

1. IDB `snaptax_receipt_photos`: rows have `opfsFullPath`, no `ct`/`blob`
2. OPFS tree visible in DevTools
3. Capture compresses to ~200–300KB
4. Upload → `remoteSyncedAtMs` set; full file still on OPFS
5. Mock `remoteSyncedAtMs` 91d ago → idle purge → full gone, thumb remains
6. Detail with purged full + online → signed URL loads

- [ ] **Update `docs/tech/12-local-image-storage-design.md` header:** `实现：v5（YYYY-MM-DD）`

- [ ] **Update `docs/product/PRODUCT-SPEC.md` §12** implementation status row for local image storage

---

## Dependency graph

```text
Task 1 → Task 8
Task 2 → Task 3 → Task 4 → Task 7
Task 5 → Task 7
Task 6 → Task 7
Task 7 → Task 9, 10, 11, 12, 13
Task 8 → Task 9
Task 10, 11, 12, 13, 14 — parallel after Task 7+8
Task 15 — last
```

---

## Risk notes

| Risk | Mitigation |
|------|------------|
| OPFS missing (old Safari) | Legacy IDB encrypted fallback in Task 7; log once |
| Migration blocks startup | Background job only; flag in system_meta |
| Upload size regression | P0 compress ships before OPFS |
| `reconcileServerPrimaryPhotos` behavior change | Explicit test in Task 10 |
| OCR Phase 1 later | Compressed full is OCR input — no rework |

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| IDB meta only | 6, 7, 8 |
| OPFS encrypted files | 5, 7 |
| 1280/q75, 200–300KB | 2, 3 |
| Thumb 480/q70 | 4 |
| `snaptax_*` store names | 1, 8 |
| 90d purge synced full | 11 |
| Upload keeps full 90d | 10 |
| resolve thumb + signed URL | 12 |
| v4 migration | 9 |
| Delete / clear wipes OPFS | 13 |

---

**Plan complete.** Saved to `docs/superpowers/plans/2026-06-19-local-image-storage-opfs.md`.

**Execution options:**

1. **Subagent-Driven (recommended)** — one fresh subagent per task, review between tasks  
2. **Inline Execution** — implement task-by-task in this session with checkpoints  

Which approach do you want?
