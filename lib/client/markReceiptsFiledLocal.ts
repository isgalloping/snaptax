import type { StoredReceipt } from "@/lib/storage/receiptDb";
import { loadAllReceipts, saveReceipt } from "@/lib/storage/receiptDb";

export async function markReceiptsFiledLocal(params: {
  receiptIds: string[];
  taxSeason: string;
  taxSeasonDate: Date;
}): Promise<void> {
  if (params.receiptIds.length === 0) return;
  const idSet = new Set(params.receiptIds);
  const all = await loadAllReceipts();
  for (const row of all) {
    if (!idSet.has(row.id)) continue;
    const updated: StoredReceipt = {
      ...row,
      taxSeason: params.taxSeason,
      taxSeasonDate: params.taxSeasonDate,
      updatedAt: params.taxSeasonDate,
    };
    await saveReceipt(updated);
  }
}
