import type { SnaptaxReceipt } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertReceiptCategoryPatchAllowed } from "@/lib/receipts/doneReceiptLock";
import { computeUsTaxAmount } from "@/lib/tax/computeUs";
import {
  isUsExportCategory,
  type UsExportCategory,
} from "@/lib/tax/usExportCategories";
import { utcNow } from "@/lib/time/utc";

function extractAiDeductionRatio(aiRaw: SnaptaxReceipt["aiRaw"]): number {
  if (!aiRaw || typeof aiRaw !== "object" || Array.isArray(aiRaw)) return 1;
  const ratio = (aiRaw as Record<string, unknown>).deduction_ratio;
  return typeof ratio === "number" ? ratio : 1;
}

/**
 * Manual category correction before export.
 * Recomputes tax_amount from amount + category (not a Vision re-run).
 */
export async function updateReceiptCategory(
  receipt: SnaptaxReceipt,
  categoryInput: string,
): Promise<SnaptaxReceipt> {
  if (!isUsExportCategory(categoryInput)) {
    throw new Error("INVALID_CATEGORY");
  }
  assertReceiptCategoryPatchAllowed(receipt);
  const category = categoryInput.toUpperCase().trim() as UsExportCategory;
  const amount = Number(receipt.amount ?? 0);
  const deductionRatio = extractAiDeductionRatio(receipt.aiRaw);
  const deductible = category !== "PERSONAL";
  const taxAmount = computeUsTaxAmount({
    amount,
    merchant: receipt.merchantName ?? "",
    category,
    deductible,
    deduction_ratio: deductionRatio,
    confidence: 1,
  });

  const priorAi =
    receipt.aiRaw && typeof receipt.aiRaw === "object" && !Array.isArray(receipt.aiRaw)
      ? (receipt.aiRaw as Record<string, unknown>)
      : {};

  return prisma.snaptaxReceipt.update({
    where: { id: receipt.id },
    data: {
      category,
      deductible,
      taxAmount,
      updatedAt: utcNow(),
      aiRaw: {
        ...priorAi,
        category,
        deductible,
        deduction_ratio: deductionRatio,
        manual_category_override: true,
      },
    },
  });
}
