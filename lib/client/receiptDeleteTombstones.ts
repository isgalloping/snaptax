import { readSystemMeta, writeSystemMeta } from "@/lib/storage/receiptDb";

export const DELETED_RECEIPT_IDS_KEY = "deleted_receipt_ids";

export async function readDeletedReceiptIds(): Promise<Set<string>> {
  const raw = await readSystemMeta<string[]>(DELETED_RECEIPT_IDS_KEY);
  return new Set(raw ?? []);
}

export async function addDeletedReceiptId(id: string): Promise<void> {
  const ids = await readDeletedReceiptIds();
  if (ids.has(id)) return;
  ids.add(id);
  await writeSystemMeta(DELETED_RECEIPT_IDS_KEY, [...ids]);
}

export async function removeDeletedReceiptId(id: string): Promise<void> {
  const ids = await readDeletedReceiptIds();
  if (!ids.has(id)) return;
  ids.delete(id);
  if (ids.size === 0) {
    await writeSystemMeta(DELETED_RECEIPT_IDS_KEY, []);
    return;
  }
  await writeSystemMeta(DELETED_RECEIPT_IDS_KEY, [...ids]);
}

export function filterIdsByTombstones(
  ids: Iterable<string>,
  tombstones: ReadonlySet<string>,
): string[] {
  return [...ids].filter((id) => !tombstones.has(id));
}
