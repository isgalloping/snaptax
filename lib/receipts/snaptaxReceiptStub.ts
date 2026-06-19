import { isIncomeFormType } from "@/lib/export/incomeDocuments";
import type { Receipt } from "@/lib/types";
import type { SnaptaxReceipt } from "@prisma/client";

const DEFAULT_STUB: SnaptaxReceipt = {
  id: "00000000-0000-0000-0000-000000000001",
  userId: null,
  ghostId: null,
  imageUrl: "",
  status: "done",
  amount: 0 as unknown as SnaptaxReceipt["amount"],
  currency: "USD",
  merchantName: "",
  category: null,
  deductible: true,
  taxAmount: 0 as unknown as SnaptaxReceipt["taxAmount"],
  dataRegion: "us",
  aiRaw: { deduction_ratio: 1 },
  aiConfidence: null,
  capturedAt: new Date(0),
  snapAt: null,
  processedAt: null,
  taxSeason: null,
  taxSeasonDate: null,
  contentSha256: "",
  imageFingerprint: "",
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

/** Minimal full SnaptaxReceipt for tests and client-side export adapters. */
export function stubSnaptaxReceipt(
  overrides: Partial<SnaptaxReceipt> = {},
): SnaptaxReceipt {
  return { ...DEFAULT_STUB, ...overrides };
}

/** Map local Receipt → SnaptaxReceipt shape for export preview helpers. */
export function receiptToSnaptaxStub(receipt: Receipt): SnaptaxReceipt {
  const category = receipt.category ?? null;
  const aiRaw = isIncomeFormType(category)
    ? {
        document_kind: category,
        tax_year: receipt.incomeTaxYear ?? null,
      }
    : { deduction_ratio: 1 };

  return stubSnaptaxReceipt({
    id: receipt.id,
    imageUrl: receipt.imageUrl?.trim() || "",
    status: receipt.status,
    amount: (receipt.amount ?? 0) as unknown as SnaptaxReceipt["amount"],
    currency: receipt.currency ?? "USD",
    merchantName: receipt.merchant ?? "",
    category,
    deductible: receipt.deductible ?? false,
    taxAmount: (receipt.taxAmount ?? 0) as unknown as SnaptaxReceipt["taxAmount"],
    dataRegion: receipt.dataRegion ?? "us",
    aiRaw,
    aiConfidence: receipt.aiConfidence ?? null,
    capturedAt: receipt.timestamp,
    snapAt: receipt.timestamp,
    taxSeason: receipt.taxSeason ?? null,
    taxSeasonDate: receipt.taxSeasonDate ?? null,
    createdAt: receipt.timestamp,
    updatedAt: receipt.updatedAt ?? receipt.timestamp,
  });
}
