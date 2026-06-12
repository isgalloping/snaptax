# Local Data Encryption + Server-Primary Image — Implementation Plan

**Goal:** Encrypt all local receipt photos at rest; after successful server upload, delete local copies and serve images via signed Blob URLs; align privacy copy and full local wipe.

**Architecture:** `lib/storage/crypto/*` (DEK + AES-GCM) behind `receiptDb.ts` v3; new `GET /api/receipts/:id/image`; client photo lifecycle rewrite in `HomeScreen` / `resolveReceiptImage`.

**Tech Stack:** Web Crypto API, IndexedDB v3, Vercel Blob signed URLs, existing Ghost/Session auth.

**Spec:** [`2026-06-12-local-data-encryption-design.md`](../specs/2026-06-12-local-data-encryption-design.md)

---

## File map

| File | Action |
|------|--------|
| `lib/storage/crypto/keyManager.ts` | Create |
| `lib/storage/crypto/aesGcm.ts` | Create |
| `lib/storage/crypto/photoStore.ts` | Create |
| `lib/storage/crypto/aesGcm.test.ts` | Create |
| `lib/storage/receiptDb.ts` | v3 schema + v2→v3 migration |
| `lib/storage/clearLocalData.ts` | Prefix wipe |
| `lib/types.ts` | `hasRemoteImage` |
| `lib/receipts/serialize.ts` | `hasImage` |
| `app/api/receipts/[id]/image/route.ts` | Create |
| `lib/client/receiptApi.ts` | `fetchReceiptImageUrl`, `hasImage` mapping |
| `lib/receipts/receiptDetail.ts` | Server-primary resolve |
| `components/home/HomeScreen.tsx` | Upload lifecycle |
| `components/home/OfflineHomeShell.tsx` | Align capture path |
| `components/receipts/ReceiptCaptureSection.tsx` | Offline placeholder |
| `components/receipts/ReceiptDetailSheet.tsx` | Copy fix |
| `lib/copy/userFacing.ts` | Strings |
| `docs/legal/privacy.md` | §1 local encryption |

---

### Task 1: Crypto primitives + tests

**Files:** `lib/storage/crypto/aesGcm.ts`, `lib/storage/crypto/aesGcm.test.ts`

- [ ] Implement `encryptBuffer(key, plaintext) → { iv, ct }` and `decryptBuffer(key, iv, ct)` using AES-GCM 256, 12-byte IV.
- [ ] Unit test round-trip + tampered ciphertext rejection.

---

### Task 2: KeyManager + meta store

**Files:** `lib/storage/crypto/keyManager.ts`

- [ ] `getOrCreateDek(db): Promise<CryptoKey>` — non-extractable, stored in `meta` store.
- [ ] `clearDek(db)` called from `clearAllLocalData`.

---

### Task 3: Encrypted photoStore

**Files:** `lib/storage/crypto/photoStore.ts`

- [ ] `saveEncryptedPhoto(db, id, file)` — detect mime, encrypt, put v3 shape.
- [ ] `loadEncryptedPhoto(db, id)` — decrypt to `Blob`.
- [ ] `deleteEncryptedPhoto(db, id)`.

Wire into `receiptDb.ts` `savePhoto` / `loadPhoto` / `deletePhoto` (public API unchanged).

---

### Task 4: IDB v3 migration

**Files:** `lib/storage/receiptDb.ts`

- [ ] `DB_VERSION = 3`; add `meta` store.
- [ ] `onupgradeneeded` from v2: init DEK; migrate plaintext `photos.blob` → encrypted rows.
- [ ] Receipt rows: add `hasRemoteImage` (default `false`); optional `enc` for merchant/category/subtitle.
- [ ] Verify v1→v2→v3 chain still works.

---

### Task 5: Server image endpoint

**Files:** `app/api/receipts/[id]/image/route.ts`

- [ ] Auth + ownership check (reuse receipt access helper).
- [ ] `get(pathname, { access: 'private', expiresIn: 900 })` or project equivalent.
- [ ] Return `{ url, expiresAt }`.
- [ ] Add `hasImage: Boolean(receipt.imageUrl)` to `serializeReceipt`.

---

### Task 6: Client API + types

**Files:** `lib/types.ts`, `lib/client/receiptApi.ts`, `lib/receipts/serialize.ts`

- [ ] `Receipt.hasRemoteImage?: boolean`.
- [ ] `apiReceiptToLocal` sets `hasRemoteImage` from `hasImage`.
- [ ] `fetchReceiptImageUrl(id)` with error handling.

---

### Task 7: resolveReceiptImage + UI placeholder

**Files:** `lib/receipts/receiptDetail.ts`, `ReceiptCaptureSection.tsx`, `ReceiptDetailSheet.tsx`

- [ ] Branch: local encrypted / remote signed / offline placeholder / missing.
- [ ] Revoke object URLs on unmount.
- [ ] Offline placeholder copy (EN): `Photo available when you're back online.`

---

### Task 8: Server-primary upload lifecycle

**Files:** `components/home/HomeScreen.tsx`, `OfflineHomeShell.tsx`

- [ ] **Remove** all `savePhoto(serverId, file)` after successful upload.
- [ ] **Add** `deletePhoto` after upload success (old + new id if changed).
- [ ] Set `hasRemoteImage: true` on saved receipt row.
- [ ] `uploadPendingInner`: same pattern.
- [ ] `syncFromServer`: if remote `hasImage` and local photo exists → `deletePhoto` (reconcile redundant copy).

---

### Task 9: P0 — wipe + copy

**Files:** `clearLocalData.ts`, `privacy.md`, `userFacing.ts`, `ReceiptDetailSheet.tsx`

- [ ] Prefix wipe `snap1099_*` in `clearLocalAppData`.
- [ ] Update legal + UI strings per spec §9.

---

### Task 10: Acceptance pass

- [ ] Manual: encrypted IDB inspection.
- [ ] Manual: upload → local photo gone → detail shows via signed URL.
- [ ] Manual: offline uploaded receipt → placeholder.
- [ ] `npm run test:unit` green for crypto tests.
- [ ] `npm run build` passes.

---

## Dependency order

```
Task 1 → 2 → 3 → 4 → 8 (encrypted local)
Task 5 → 6 → 7 → 8 (server-primary viewing)
Task 9 (parallel anytime)
Task 10 (last)
```

**Ship gate:** Tasks 1–8 + 9 + 10 before release; do not ship encryption without server-primary deletion (avoids double retention).
