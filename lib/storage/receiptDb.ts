import type { OcrDraftPayload } from "@/lib/ocr/types";
import type { Receipt, ReceiptStatus } from "@/lib/types";
import { filedFlag, isReceiptFiled } from "@/lib/receipts/filedStatus";
import { parseUtcISOString, toUtcISOString } from "@/lib/time/utc";
import {
  migrateLegacyPhotosToOpfs,
  migrateLegacyPlainPhotos,
  PHOTO_OPFS_MIGRATION_KEY,
} from "@/lib/storage/crypto/photoMigration";
import {
  deleteEncryptedPhoto,
  loadEncryptedPhoto,
  loadEncryptedThumbnail,
  markPhotoRemoteSynced,
  PHOTOS_STORE,
  saveEncryptedPhoto,
} from "@/lib/storage/crypto/photoStore";
import {
  deleteLegacyIdbIfPresent,
  migrateLegacyIdbDbNameIfNeeded,
} from "@/lib/storage/idbDbRenameMigration";
import {
  IDB_DB_NAME,
  IDB_DB_VERSION,
  IDB_LEGACY_CRYPTO_META,
  IDB_LEGACY_RECEIPTS,
  IDB_LEGACY_SYSTEM_META,
  IDB_STORE_CRYPTO_META,
  IDB_STORE_RECEIPT_PHOTOS,
  IDB_STORE_RECEIPTS,
  IDB_STORE_SYSTEM_META,
} from "@/lib/storage/idbStores";
import { wipeSnaptaxOpfsTree } from "@/lib/storage/opfs/photoFiles";

const DB_NAME = IDB_DB_NAME;
const DB_VERSION = IDB_DB_VERSION;

function receiptsStoreName(db: IDBDatabase): string {
  return db.objectStoreNames.contains(IDB_STORE_RECEIPTS)
    ? IDB_STORE_RECEIPTS
    : IDB_LEGACY_RECEIPTS;
}

function systemMetaStoreName(db: IDBDatabase): string {
  return db.objectStoreNames.contains(IDB_STORE_SYSTEM_META)
    ? IDB_STORE_SYSTEM_META
    : IDB_LEGACY_SYSTEM_META;
}

function cryptoMetaStoreName(db: IDBDatabase): string {
  return db.objectStoreNames.contains(IDB_STORE_CRYPTO_META)
    ? IDB_STORE_CRYPTO_META
    : IDB_LEGACY_CRYPTO_META;
}

type SystemMetaRow<T> = { key: string; value: T };

export interface StoredReceipt extends Receipt {
  timestamp: Date;
  pendingUpload?: boolean;
  writeBudgetRemaining?: number;
  ocrDraft?: OcrDraftPayload;
}

type SerializedReceipt = Omit<
  StoredReceipt,
  "timestamp" | "updatedAt" | "taxSeasonDate"
> & {
  timestamp: string;
  updatedAt?: string;
  taxSeasonDate?: string;
  updatedAtMs: number;
  createdAtMs: number;
  isFiled: 0 | 1;
  hasRemoteImage: boolean;
};

function receiptUpdatedAt(receipt: Pick<Receipt, "updatedAt" | "timestamp">): Date {
  return receipt.updatedAt ?? receipt.timestamp;
}

function toMs(date: Date): number {
  return date.getTime();
}

function enrichRow(receipt: StoredReceipt): SerializedReceipt {
  const updatedAt = receiptUpdatedAt(receipt);
  const { taxSeasonDate, updatedAt: _u, ...rest } = receipt;
  return {
    ...rest,
    hasRemoteImage: Boolean(receipt.hasRemoteImage),
    timestamp: toUtcISOString(receipt.timestamp),
    updatedAt: toUtcISOString(updatedAt),
    taxSeasonDate: taxSeasonDate ? toUtcISOString(taxSeasonDate) : undefined,
    updatedAtMs: toMs(updatedAt),
    createdAtMs: toMs(receipt.timestamp),
    isFiled: filedFlag(receipt),
  };
}

function deserializeReceipt(raw: SerializedReceipt): StoredReceipt {
  const {
    updatedAtMs: _updatedAtMs,
    createdAtMs: _createdAtMs,
    isFiled: _isFiled,
    ...rest
  } = raw;
  const timestamp = parseUtcISOString(rest.timestamp);
  return {
    ...rest,
    hasRemoteImage: Boolean(rest.hasRemoteImage),
    timestamp,
    updatedAt: rest.updatedAt ? parseUtcISOString(rest.updatedAt) : timestamp,
    taxSeasonDate: rest.taxSeasonDate
      ? parseUtcISOString(rest.taxSeasonDate)
      : undefined,
  };
}

function legacyDeserialize(raw: Record<string, unknown>): StoredReceipt {
  const timestamp = parseUtcISOString(String(raw.timestamp));
  const updatedAtRaw = raw.updatedAt ? parseUtcISOString(String(raw.updatedAt)) : timestamp;
  return {
    id: String(raw.id),
    status: raw.status as ReceiptStatus,
    amount: raw.amount as number | undefined,
    merchant: raw.merchant as string | undefined,
    category: raw.category as string | undefined,
    taxAmount: raw.taxAmount as number | undefined,
    dataRegion: raw.dataRegion as StoredReceipt["dataRegion"],
    currency: raw.currency as string | undefined,
    deductible: raw.deductible as boolean | undefined,
    imageUrl: raw.imageUrl as string | null | undefined,
    hasRemoteImage: Boolean(raw.hasRemoteImage),
    subtitle: raw.subtitle as string | undefined,
    timestamp,
    updatedAt: updatedAtRaw,
    taxSeason: raw.taxSeason as string | undefined,
    taxSeasonDate: raw.taxSeasonDate
      ? parseUtcISOString(String(raw.taxSeasonDate))
      : undefined,
    pendingUpload: raw.pendingUpload as boolean | undefined,
    writeBudgetRemaining: raw.writeBudgetRemaining as number | undefined,
    isOnboardingDemo: raw.isOnboardingDemo as boolean | undefined,
    ocrDraft: raw.ocrDraft as OcrDraftPayload | undefined,
  };
}

function createReceiptIndexes(store: IDBObjectStore): void {
  const ensureIndex = (
    name: string,
    keyPath: string | string[],
    options?: IDBIndexParameters,
  ) => {
    if (!store.indexNames.contains(name)) {
      store.createIndex(name, keyPath, options ?? { unique: false });
    }
  };
  ensureIndex("byUpdatedAt", "updatedAtMs");
  ensureIndex("byCreatedAt", "createdAtMs");
  ensureIndex("byStatus", "status");
  ensureIndex("byStatusUpdatedAt", ["status", "updatedAtMs"]);
  ensureIndex("byFiledUpdatedAt", ["isFiled", "updatedAtMs"]);
  ensureIndex("byFiledStatus", ["isFiled", "status"]);
  ensureIndex("byContentSha256", "contentSha256");
}

function readIndexLimited<T>(
  store: IDBObjectStore,
  indexName: string,
  range: IDBKeyRange | null,
  direction: IDBCursorDirection,
  limit: number,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const index = store.index(indexName);
    const rows: T[] = [];
    const request = index.openCursor(range, direction);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor || rows.length >= limit) {
        resolve(rows);
        return;
      }
      rows.push(cursor.value as T);
      cursor.continue();
    };
  });
}

function readIndexAll<T>(
  store: IDBObjectStore,
  indexName: string,
  range: IDBKeyRange | null,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const index = store.index(indexName);
    const rows: T[] = [];
    const request = index.openCursor(range);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(rows);
        return;
      }
      rows.push(cursor.value as T);
      cursor.continue();
    };
  });
}

function migrateReceiptRowV3(raw: Record<string, unknown>): SerializedReceipt {
  const legacy = legacyDeserialize(raw);
  if (legacy.hasRemoteImage == null) {
    legacy.hasRemoteImage = false;
  }
  return enrichRow(legacy);
}

function copyObjectStore(
  tx: IDBTransaction,
  fromName: string,
  toName: string,
  onComplete: () => void,
  onError: (err: DOMException | null) => void,
): void {
  const from = tx.objectStore(fromName);
  const to = tx.objectStore(toName);
  const cursorReq = from.openCursor();
  cursorReq.onerror = () => onError(cursorReq.error);
  cursorReq.onsuccess = () => {
    const cursor = cursorReq.result;
    if (!cursor) {
      onComplete();
      return;
    }
    const putReq = to.put(cursor.value);
    putReq.onerror = () => onError(putReq.error);
    putReq.onsuccess = () => cursor.continue();
  };
}

function upgradeReceiptIndexesForV6(
  db: IDBDatabase,
  tx: IDBTransaction,
  oldVersion: number,
): void {
  if (oldVersion >= 6) return;
  if (db.objectStoreNames.contains(IDB_LEGACY_RECEIPTS)) {
    createReceiptIndexes(tx.objectStore(IDB_LEGACY_RECEIPTS));
  }
  if (db.objectStoreNames.contains(IDB_STORE_RECEIPTS)) {
    createReceiptIndexes(tx.objectStore(IDB_STORE_RECEIPTS));
  }
}

function migrateToSnaptaxStores(
  db: IDBDatabase,
  tx: IDBTransaction,
  oldVersion: number,
  onError: (err: DOMException | null) => void,
): void {
  if (oldVersion >= IDB_DB_VERSION) return;

  if (!db.objectStoreNames.contains(IDB_STORE_CRYPTO_META)) {
    db.createObjectStore(IDB_STORE_CRYPTO_META, { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains(IDB_STORE_RECEIPTS)) {
    const receiptStore = db.createObjectStore(IDB_STORE_RECEIPTS, {
      keyPath: "id",
    });
    createReceiptIndexes(receiptStore);
  }
  if (!db.objectStoreNames.contains(IDB_STORE_RECEIPT_PHOTOS)) {
    db.createObjectStore(IDB_STORE_RECEIPT_PHOTOS, { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains(IDB_STORE_SYSTEM_META)) {
    db.createObjectStore(IDB_STORE_SYSTEM_META, { keyPath: "key" });
  }

  const finishPhotoMigrationFlag = (): void => {
    if (
      db.objectStoreNames.contains(PHOTOS_STORE) &&
      oldVersion < IDB_DB_VERSION
    ) {
      const metaStore = systemMetaStoreName(db);
      tx.objectStore(metaStore).put({
        key: PHOTO_OPFS_MIGRATION_KEY,
        value: "pending",
      });
    }
  };

  const migrateCryptoMeta = (): void => {
    if (!db.objectStoreNames.contains(IDB_LEGACY_CRYPTO_META)) {
      finishPhotoMigrationFlag();
      return;
    }
    copyObjectStore(
      tx,
      IDB_LEGACY_CRYPTO_META,
      IDB_STORE_CRYPTO_META,
      () => {
        db.deleteObjectStore(IDB_LEGACY_CRYPTO_META);
        finishPhotoMigrationFlag();
      },
      onError,
    );
  };

  const migrateSystemMeta = (): void => {
    if (!db.objectStoreNames.contains(IDB_LEGACY_SYSTEM_META)) {
      migrateCryptoMeta();
      return;
    }
    copyObjectStore(
      tx,
      IDB_LEGACY_SYSTEM_META,
      IDB_STORE_SYSTEM_META,
      () => {
        db.deleteObjectStore(IDB_LEGACY_SYSTEM_META);
        migrateCryptoMeta();
      },
      onError,
    );
  };

  const migrateReceipts = (): void => {
    if (!db.objectStoreNames.contains(IDB_LEGACY_RECEIPTS)) {
      migrateSystemMeta();
      return;
    }
    copyObjectStore(
      tx,
      IDB_LEGACY_RECEIPTS,
      IDB_STORE_RECEIPTS,
      () => {
        db.deleteObjectStore(IDB_LEGACY_RECEIPTS);
        migrateSystemMeta();
      },
      onError,
    );
  };

  migrateReceipts();
}

function runLegacyReceiptRowMigrations(
  receiptStore: IDBObjectStore,
  oldVersion: number,
  onComplete: () => void,
  onError: (err: DOMException | null) => void,
): void {
  const runV3 = (): void => {
    if (oldVersion >= 3) {
      onComplete();
      return;
    }
    const migrateV3 = receiptStore.openCursor();
    migrateV3.onerror = () => onError(migrateV3.error);
    migrateV3.onsuccess = () => {
      const cursor = migrateV3.result;
      if (!cursor) {
        onComplete();
        return;
      }
      const row = migrateReceiptRowV3(cursor.value as Record<string, unknown>);
      const updateReq = cursor.update(row);
      updateReq.onerror = () => onError(updateReq.error);
      updateReq.onsuccess = () => cursor.continue();
    };
  };

  if (oldVersion >= 2) {
    runV3();
    return;
  }

  createReceiptIndexes(receiptStore);
  const migrateV2 = receiptStore.openCursor();
  migrateV2.onerror = () => onError(migrateV2.error);
  migrateV2.onsuccess = () => {
    const cursor = migrateV2.result;
    if (!cursor) {
      runV3();
      return;
    }
    const legacy = legacyDeserialize(cursor.value as Record<string, unknown>);
    const updateReq = cursor.update(enrichRow(legacy));
    updateReq.onerror = () => onError(updateReq.error);
    updateReq.onsuccess = () => cursor.continue();
  };
}

let dbOpenPromise: Promise<IDBDatabase> | null = null;

function openDbInner(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbOpenPromise = null;
      reject(request.error);
    };
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const tx = request.transaction!;
      const oldVersion = event.oldVersion;
      let receiptStore: IDBObjectStore;
      const legacyReceipts = IDB_LEGACY_RECEIPTS;

      if (!db.objectStoreNames.contains(IDB_LEGACY_CRYPTO_META)) {
        db.createObjectStore(IDB_LEGACY_CRYPTO_META, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(legacyReceipts)) {
        receiptStore = db.createObjectStore(legacyReceipts, { keyPath: "id" });
        createReceiptIndexes(receiptStore);
      } else {
        receiptStore = tx.objectStore(legacyReceipts);
      }

      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        db.createObjectStore(PHOTOS_STORE, { keyPath: "id" });
      }

      if (oldVersion < 4) {
        if (!db.objectStoreNames.contains(IDB_LEGACY_SYSTEM_META)) {
          db.createObjectStore(IDB_LEGACY_SYSTEM_META, { keyPath: "key" });
        }
      }

      const startSnaptaxStoreMigration = (): void => {
        if (oldVersion < IDB_DB_VERSION) {
          migrateToSnaptaxStores(db, tx, oldVersion, reject);
        }
        upgradeReceiptIndexesForV6(db, tx, oldVersion);
      };

      if (db.objectStoreNames.contains(legacyReceipts) && oldVersion < 4) {
        runLegacyReceiptRowMigrations(
          receiptStore,
          oldVersion,
          startSnaptaxStoreMigration,
          reject,
        );
      } else {
        startSnaptaxStoreMigration();
      }
    };
  });
}

function openDb(): Promise<IDBDatabase> {
  if (dbOpenPromise) return dbOpenPromise;
  dbOpenPromise = migrateLegacyIdbDbNameIfNeeded(openDbInner)
    .then(() => openDbInner())
    .catch((err) => {
      dbOpenPromise = null;
      throw err;
    });
  return dbOpenPromise;
}

let migrationPromise: Promise<void> | null = null;

async function ensurePhotoCipherReady(db: IDBDatabase): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = migrateLegacyPlainPhotos(db)
      .then(() => migrateLegacyPhotosToOpfs(db))
      .catch((err) => {
        migrationPromise = null;
        throw err;
      });
  }
  await migrationPromise;
}

export async function warmReceiptDb(): Promise<IDBDatabase> {
  const db = await openDb();
  await ensurePhotoCipherReady(db);
  return db;
}

export async function loadRecentUnfiledReceipts(
  limit = 30,
): Promise<StoredReceipt[]> {
  const db = await openDb();
  const receiptsStore = receiptsStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(receiptsStore, "readonly");
    const store = tx.objectStore(receiptsStore);
    const range = IDBKeyRange.bound([0, 0], [0, Number.MAX_SAFE_INTEGER]);
    readIndexLimited<SerializedReceipt>(
      store,
      "byFiledUpdatedAt",
      range,
      "prev",
      limit,
    )
      .then((rows) => resolve(rows.map(deserializeReceipt)))
      .catch(reject);
  });
}

export async function loadTopByUpdatedAt(
  limit = 100,
): Promise<StoredReceipt[]> {
  const db = await openDb();
  const receiptsStore = receiptsStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(receiptsStore, "readonly");
    const store = tx.objectStore(receiptsStore);
    readIndexLimited<SerializedReceipt>(
      store,
      "byUpdatedAt",
      null,
      "prev",
      limit,
    )
      .then((rows) => resolve(rows.map(deserializeReceipt)))
      .catch(reject);
  });
}

export async function sumUnfiledLocalTaxSavedIndexed(): Promise<number> {
  const db = await openDb();
  const receiptsStore = receiptsStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(receiptsStore, "readonly");
    const store = tx.objectStore(receiptsStore);
    const range = IDBKeyRange.only([0, "done"]);
    readIndexAll<SerializedReceipt>(store, "byFiledStatus", range)
      .then((rows) => {
        const sum = rows.reduce(
          (total, row) => total + (row.taxAmount ?? 0),
          0,
        );
        resolve(sum);
      })
      .catch(reject);
  });
}

export async function queryByStatus(
  status: ReceiptStatus,
  limit?: number,
): Promise<StoredReceipt[]> {
  const db = await openDb();
  const receiptsStore = receiptsStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(receiptsStore, "readonly");
    const store = tx.objectStore(receiptsStore);
    const range = IDBKeyRange.only(status);
    const read = limit
      ? readIndexLimited<SerializedReceipt>(
          store,
          "byStatus",
          range,
          "prev",
          limit,
        )
      : readIndexAll<SerializedReceipt>(store, "byStatus", range);
    read
      .then((rows) => resolve(rows.map(deserializeReceipt)))
      .catch(reject);
  });
}

/** Full corpus scan — sync merge / export only; not for startup hot path. */
export async function loadAllReceipts(): Promise<StoredReceipt[]> {
  const db = await openDb();
  const receiptsStore = receiptsStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(receiptsStore, "readonly");
    const request = tx.objectStore(receiptsStore).getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const rows = (request.result as SerializedReceipt[]) ?? [];
      resolve(
        rows
          .map(deserializeReceipt)
          .sort(
            (a, b) =>
              receiptUpdatedAt(b).getTime() - receiptUpdatedAt(a).getTime(),
          ),
      );
    };
  });
}

/** @deprecated Use loadTopByUpdatedAt or loadAllReceipts. */
export async function loadReceipts(): Promise<StoredReceipt[]> {
  return loadAllReceipts();
}

export async function loadReceipt(id: string): Promise<StoredReceipt | null> {
  const db = await openDb();
  const receiptsStore = receiptsStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(receiptsStore, "readonly");
    const request = tx.objectStore(receiptsStore).get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const raw = request.result as SerializedReceipt | undefined;
      resolve(raw ? deserializeReceipt(raw) : null);
    };
  });
}

export async function saveReceipt(receipt: StoredReceipt): Promise<void> {
  const db = await openDb();
  const receiptsStore = receiptsStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(receiptsStore, "readwrite");
    const request = tx.objectStore(receiptsStore).put(enrichRow(receipt));
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function deleteReceipt(id: string): Promise<void> {
  const db = await openDb();
  await deleteEncryptedPhoto(db, id);
  const receiptsStore = receiptsStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(receiptsStore, "readwrite");
    tx.objectStore(receiptsStore).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openDb();
  await deleteEncryptedPhoto(db, id);
}

/** Mark remote sync time on local photos; retain full image up to 90 days. */
export async function reconcileServerPrimaryPhotos(
  receipts: Pick<Receipt, "id" | "hasRemoteImage">[],
): Promise<void> {
  const db = await openDb();
  await Promise.all(
    receipts
      .filter((r) => r.hasRemoteImage)
      .map((r) => markPhotoRemoteSynced(db, r.id)),
  );
}

export async function markRemoteSyncedPhotos(
  receiptIds: string[],
): Promise<void> {
  const db = await openDb();
  await Promise.all(
    receiptIds.map((id) => markPhotoRemoteSynced(db, id)),
  );
}

export async function savePhoto(id: string, file: File | Blob): Promise<void> {
  const db = await openDb();
  await ensurePhotoCipherReady(db);
  await saveEncryptedPhoto(db, id, file);
}

export async function savePhotoCompressed(
  id: string,
  compressed: { blob: Blob; width: number; height: number },
): Promise<void> {
  const db = await openDb();
  await ensurePhotoCipherReady(db);
  await saveEncryptedPhoto(db, id, compressed.blob, compressed);
}

export async function findReceiptIdByContentSha256(
  sha: string,
): Promise<string | null> {
  const db = await openDb();
  const storeName = receiptsStoreName(db);
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  if (!store.indexNames.contains("byContentSha256")) {
    return null;
  }
  const rows = await readIndexAll<SerializedReceipt>(
    store,
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

export async function loadPhoto(id: string): Promise<Blob | null> {
  const db = await openDb();
  await ensurePhotoCipherReady(db);
  return loadEncryptedPhoto(db, id);
}

export async function loadPhotoThumb(id: string): Promise<Blob | null> {
  const db = await openDb();
  await ensurePhotoCipherReady(db);
  return loadEncryptedThumbnail(db, id);
}

export async function hasStoredData(): Promise<boolean> {
  const db = await openDb();
  const receiptsStore = receiptsStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(receiptsStore, "readonly");
    const request = tx.objectStore(receiptsStore).count();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve((request.result ?? 0) > 0);
  });
}

export async function readSystemMeta<T>(key: string): Promise<T | null> {
  const db = await openDb();
  const store = systemMetaStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const row = request.result as SystemMetaRow<T> | undefined;
      resolve(row?.value ?? null);
    };
  });
}

export async function writeSystemMeta<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  const store = systemMetaStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const request = tx
      .objectStore(store)
      .put({ key, value } satisfies SystemMetaRow<T>);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function clearAllLocalData(): Promise<void> {
  const db = await openDb();
  await wipeSnaptaxOpfsTree();
  const receiptsStore = receiptsStoreName(db);
  const systemStore = systemMetaStoreName(db);
  const cryptoStore = cryptoMetaStoreName(db);
  await new Promise<void>((resolve, reject) => {
    const stores = [receiptsStore, PHOTOS_STORE];
    if (db.objectStoreNames.contains(IDB_STORE_RECEIPT_PHOTOS)) {
      stores.push(IDB_STORE_RECEIPT_PHOTOS);
    }
    if (db.objectStoreNames.contains(cryptoStore)) {
      stores.push(cryptoStore);
    }
    if (db.objectStoreNames.contains(systemStore)) {
      stores.push(systemStore);
    }
    const tx = db.transaction(stores, "readwrite");
    tx.objectStore(receiptsStore).clear();
    tx.objectStore(PHOTOS_STORE).clear();
    if (db.objectStoreNames.contains(IDB_STORE_RECEIPT_PHOTOS)) {
      tx.objectStore(IDB_STORE_RECEIPT_PHOTOS).clear();
    }
    if (db.objectStoreNames.contains(cryptoStore)) {
      tx.objectStore(cryptoStore).clear();
    }
    if (db.objectStoreNames.contains(systemStore)) {
      tx.objectStore(systemStore).clear();
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  dbOpenPromise = null;
  db.close();
  await deleteLegacyIdbIfPresent();
}
