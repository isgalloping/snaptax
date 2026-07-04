import { OPFS_PHOTOS_PREFIX } from "@/lib/storage/idbStores";

export function opfsFullRelPath(receiptId: string): string {
  return `${OPFS_PHOTOS_PREFIX}/${receiptId}/full.v1.enc`;
}

export function opfsThumbRelPath(receiptId: string): string {
  return `${OPFS_PHOTOS_PREFIX}/${receiptId}/thumb.v1.enc`;
}

export function isOpfsAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "storage" in navigator &&
    "getDirectory" in navigator.storage
  );
}

async function getOrCreateDir(
  parent: FileSystemDirectoryHandle,
  name: string,
): Promise<FileSystemDirectoryHandle> {
  return parent.getDirectoryHandle(name, { create: true });
}

/** Resolve `snaptax/photos/{id}/file.enc` under storage root. */
export async function resolveOpfsFileHandle(
  relPath: string,
  create: boolean,
): Promise<FileSystemFileHandle> {
  const parts = relPath.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error(`Invalid OPFS path: ${relPath}`);
  }
  const fileName = parts[parts.length - 1]!;
  const dirParts = parts.slice(0, -1);
  let dir = await navigator.storage.getDirectory();
  for (const segment of dirParts) {
    dir = await (create
      ? getOrCreateDir(dir, segment)
      : dir.getDirectoryHandle(segment));
  }
  return dir.getFileHandle(fileName, { create });
}

export async function writeOpfsBytes(
  relPath: string,
  data: ArrayBuffer,
): Promise<void> {
  const handle = await resolveOpfsFileHandle(relPath, true);
  const writable = await handle.createWritable();
  await writable.write(data);
  await writable.close();
}

export async function readOpfsBytes(relPath: string): Promise<ArrayBuffer | null> {
  try {
    const handle = await resolveOpfsFileHandle(relPath, false);
    const file = await handle.getFile();
    return file.arrayBuffer();
  } catch {
    return null;
  }
}

export async function deleteOpfsPath(relPath: string): Promise<void> {
  try {
    const parts = relPath.split("/").filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) return;
    let dir = await navigator.storage.getDirectory();
    for (const segment of parts) {
      dir = await dir.getDirectoryHandle(segment);
    }
    await dir.removeEntry(fileName);
  } catch {
    // already gone
  }
}

export async function deleteOpfsReceiptPhotos(receiptId: string): Promise<void> {
  if (!isOpfsAvailable()) return;
  try {
    const root = await navigator.storage.getDirectory();
    const snaptax = await root.getDirectoryHandle("snaptax");
    const photos = await snaptax.getDirectoryHandle("photos");
    await photos.removeEntry(receiptId, { recursive: true });
  } catch {
    // missing tree
  }
}

export async function wipeSnaptaxOpfsTree(): Promise<void> {
  if (!isOpfsAvailable()) return;
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry("snaptax", { recursive: true });
  } catch {
    // missing
  }
}
