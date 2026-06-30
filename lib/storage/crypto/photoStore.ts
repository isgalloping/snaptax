import {
  compressReceiptImage,
  generateReceiptThumbnail,
} from "@/lib/camera/compressReceiptImage";
import { decryptBuffer, encryptBuffer } from "@/lib/storage/crypto/aesGcm";
import { getOrCreateDek } from "@/lib/storage/crypto/keyManager";
import {
  IDB_LEGACY_PHOTOS,
} from "@/lib/storage/idbStores";
import {
  deleteOpfsPath,
  deleteOpfsReceiptPhotos,
  isOpfsAvailable,
  opfsFullRelPath,
  opfsThumbRelPath,
  readOpfsBytes,
  writeOpfsBytes,
} from "@/lib/storage/opfs/photoFiles";
import {
  deletePhotoMeta,
  getPhotoMeta,
  putPhotoMeta,
} from "@/lib/storage/photoMetadata";
import { PHOTO_META_VERSION } from "@/lib/storage/photoTypes";

export const PHOTOS_STORE = IDB_LEGACY_PHOTOS;
export const PHOTO_CIPHER_VERSION = 1 as const;

export type EncryptedPhotoRow = {
  id: string;
  v: typeof PHOTO_CIPHER_VERSION;
  alg: "AES-GCM";
  iv: ArrayBuffer;
  ct: ArrayBuffer;
  mime: string;
  byteLength: number;
};

type LegacyPhotoRow = {
  id: string;
  blob?: Blob;
};

function ivToB64(iv: ArrayBuffer): string {
  const bytes = new Uint8Array(iv);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function ivFromB64(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function legacyBlobStoreName(db: IDBDatabase): string | null {
  if (!db.objectStoreNames.contains(IDB_LEGACY_PHOTOS)) return null;
  return IDB_LEGACY_PHOTOS;
}

function isEncryptedPhotoRow(
  row: EncryptedPhotoRow | LegacyPhotoRow | Record<string, unknown>,
): row is EncryptedPhotoRow {
  return (
    typeof row === "object" &&
    row != null &&
    "v" in row &&
    row.v === PHOTO_CIPHER_VERSION &&
    "ct" in row
  );
}

function readLegacyPhotoRow(
  db: IDBDatabase,
  id: string,
): Promise<EncryptedPhotoRow | LegacyPhotoRow | null> {
  const store = legacyBlobStoreName(db);
  if (!store) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const row = request.result as EncryptedPhotoRow | LegacyPhotoRow | undefined;
      if (!row) {
        resolve(null);
        return;
      }
      if (
        "v" in row &&
        (row as { v?: number }).v === PHOTO_META_VERSION
      ) {
        resolve(null);
        return;
      }
      resolve(row);
    };
  });
}

async function decryptOpfsFile(
  dek: CryptoKey,
  ivB64: string,
  relPath: string,
  mime: string,
): Promise<Blob | null> {
  const ct = await readOpfsBytes(relPath);
  if (!ct) return null;
  const plain = await decryptBuffer(dek, ivFromB64(ivB64), ct);
  return new Blob([plain], { type: mime });
}

async function saveLegacyEncryptedPhotoInIdb(
  db: IDBDatabase,
  id: string,
  file: File | Blob,
): Promise<void> {
  const dek = await getOrCreateDek(db);
  const plaintext = await file.arrayBuffer();
  const { iv, ct } = await encryptBuffer(dek, plaintext);
  const row: EncryptedPhotoRow = {
    id,
    v: PHOTO_CIPHER_VERSION,
    alg: "AES-GCM",
    iv,
    ct,
    mime: file.type || "image/jpeg",
    byteLength: plaintext.byteLength,
  };
  const store = legacyBlobStoreName(db);
  if (!store) {
    throw new Error("LEGACY_PHOTOS_STORE_MISSING");
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const request = tx.objectStore(store).put(row);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function saveEncryptedPhoto(
  db: IDBDatabase,
  id: string,
  file: File | Blob,
  precompressed?: { blob: Blob; width: number; height: number },
): Promise<void> {
  const { blob: compressed, width, height } = precompressed
    ? precompressed
    : await compressReceiptImage(file);

  if (!isOpfsAvailable()) {
    await saveLegacyEncryptedPhotoInIdb(db, id, compressed);
    return;
  }

  const thumb = await generateReceiptThumbnail(compressed);
  const dek = await getOrCreateDek(db);
  const fullPlain = await compressed.arrayBuffer();
  const thumbPlain = await thumb.blob.arrayBuffer();
  const fullEnc = await encryptBuffer(dek, fullPlain);
  const thumbEnc = await encryptBuffer(dek, thumbPlain);

  const opfsFullPath = opfsFullRelPath(id);
  const opfsThumbPath = opfsThumbRelPath(id);
  await writeOpfsBytes(opfsFullPath, fullEnc.ct);
  await writeOpfsBytes(opfsThumbPath, thumbEnc.ct);

  await putPhotoMeta(db, {
    id,
    v: PHOTO_META_VERSION,
    mime: "image/jpeg",
    width,
    height,
    byteLength: fullPlain.byteLength,
    thumbWidth: thumb.width,
    thumbHeight: thumb.height,
    thumbByteLength: thumbPlain.byteLength,
    opfsFullPath,
    opfsThumbPath,
    fullIvB64: ivToB64(fullEnc.iv),
    thumbIvB64: ivToB64(thumbEnc.iv),
    cipher: { alg: "AES-GCM", v: 1 },
  });

  const legacy = await readLegacyPhotoRow(db, id);
  if (legacy) {
    const store = legacyBlobStoreName(db);
    if (store) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  }
}

export async function loadEncryptedPhoto(
  db: IDBDatabase,
  id: string,
): Promise<Blob | null> {
  const meta = await getPhotoMeta(db, id);
  if (meta && !meta.fullPurged) {
    const dek = await getOrCreateDek(db);
    const fromOpfs = await decryptOpfsFile(
      dek,
      meta.fullIvB64,
      meta.opfsFullPath,
      meta.mime,
    );
    if (fromOpfs) return fromOpfs;
  }

  const legacy = await readLegacyPhotoRow(db, id);
  if (!legacy) return null;
  if ("blob" in legacy && legacy.blob) return legacy.blob;
  if (!isEncryptedPhotoRow(legacy)) return null;
  const dek = await getOrCreateDek(db);
  const plaintext = await decryptBuffer(dek, legacy.iv, legacy.ct);
  return new Blob([plaintext], { type: legacy.mime });
}

export async function loadEncryptedThumbnail(
  db: IDBDatabase,
  id: string,
): Promise<Blob | null> {
  const meta = await getPhotoMeta(db, id);
  if (meta) {
    const dek = await getOrCreateDek(db);
    return decryptOpfsFile(dek, meta.thumbIvB64, meta.opfsThumbPath, meta.mime);
  }
  return loadEncryptedPhoto(db, id);
}

export async function markPhotoRemoteSynced(
  db: IDBDatabase,
  id: string,
  atMs = Date.now(),
): Promise<void> {
  const meta = await getPhotoMeta(db, id);
  if (meta) {
    await putPhotoMeta(db, { ...meta, remoteSyncedAtMs: atMs });
    return;
  }
}

export async function purgePhotoFull(
  db: IDBDatabase,
  id: string,
  atMs = Date.now(),
): Promise<void> {
  const meta = await getPhotoMeta(db, id);
  if (!meta || meta.fullPurged) return;
  await deleteOpfsPath(meta.opfsFullPath);
  await putPhotoMeta(db, {
    ...meta,
    fullPurged: true,
    fullPurgedAtMs: atMs,
  });
}

export async function deleteEncryptedPhoto(
  db: IDBDatabase,
  id: string,
): Promise<void> {
  await deleteOpfsReceiptPhotos(id);
  await deletePhotoMeta(db, id);
  const legacyStore = legacyBlobStoreName(db);
  if (!legacyStore) return;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(legacyStore, "readwrite");
    tx.objectStore(legacyStore).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
