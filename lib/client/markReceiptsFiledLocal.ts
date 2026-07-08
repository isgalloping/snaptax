import type { StoredReceipt } from "@/lib/storage/receiptDb";
import { loadAllReceipts, saveReceiptsBatch } from "@/lib/storage/receiptDb";

export async function markReceiptsFiledLocal(params: {
  receiptIds: string[];
  taxSeason: string;
  taxSeasonDate: Date;
}): Promise<void> {
  if (params.receiptIds.length === 0) return;
  const idSet = new Set(params.receiptIds);
  const all = await loadAllReceipts();
  const updates: StoredReceipt[] = [];
  for (const row of all) {
    if (!idSet.has(row.id)) continue;
    updates.push({
      ...row,
      taxSeason: params.taxSeason,
      taxSeasonDate: params.taxSeasonDate,
      updatedAt: params.taxSeasonDate,
    });
  }
  await saveReceiptsBatch(updates);
}
