import type { SnaptaxReceipt } from "@prisma/client";

export function serializeReceipt(r: SnaptaxReceipt) {
  return {
    id: r.id,
    status: r.status,
    amount: r.amount != null ? Number(r.amount) : null,
    merchant: r.merchantName,
    category: r.category,
    deductible: r.deductible,
    currency: r.currency,
    taxAmount: Number(r.taxAmount),
    dataRegion: r.dataRegion,
    capturedAt: r.capturedAt.toISOString(),
    snapAt: r.snapAt?.toISOString() ?? null,
    updatedAt: r.updatedAt.toISOString(),
    taxSeason: r.taxSeason,
    taxSeasonDate: r.taxSeasonDate?.toISOString() ?? null,
    hasImage: Boolean(r.imageUrl?.trim()),
  };
}

export function sumTaxSaved(receipts: SnaptaxReceipt[]): number {
  return receipts
    .filter((r) => r.status === "done")
    .reduce((sum, r) => sum + Number(r.taxAmount), 0);
}
