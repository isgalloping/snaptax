import type { VisionProcessResult } from "@/lib/openai/receiptVision";
import { resolveDeductionRatio } from "@/lib/tax/usCategories";
import { US_EXPORT_CATEGORIES } from "@/lib/tax/usExportCategories";
import type { TaxRegion } from "@/lib/tax/types";

const MOCK_MERCHANTS = [
  "Shell",
  "Home Depot",
  "McDonald's",
  "Walmart",
  "Costco",
] as const;

const MOCK_CATEGORIES = US_EXPORT_CATEGORIES.filter((c) => c !== "PERSONAL");

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomAmount(): number {
  const cents = 500 + Math.floor(Math.random() * (20000 - 500 + 1));
  return cents / 100;
}

export function mockReceiptVision(dataRegion: TaxRegion): VisionProcessResult {
  const amount = randomAmount();
  const taxAmount = Math.round(amount * 0.25 * 100) / 100;
  const category = pickRandom(MOCK_CATEGORIES);
  const merchant = pickRandom(MOCK_MERCHANTS);
  const deductionRatio = resolveDeductionRatio(category, 1);
  const deductible = category !== "PERSONAL";

  const fields =
    dataRegion === "eu"
      ? {
          amount,
          currency: "EUR",
          merchant,
          category,
          deductible,
          vat_rate: 0.25,
          vat_amount: taxAmount,
          confidence: 0.95,
        }
      : {
          amount,
          merchant,
          category,
          deductible,
          deduction_ratio: deductionRatio,
          confidence: 0.95,
        };

  return {
    fields,
    taxAmount,
    status: "done",
    merchantName: merchant,
    category,
    amount,
    currency: dataRegion === "eu" ? "EUR" : "USD",
    deductible,
    aiRaw: { mock: true, model: "verify-mock", region: dataRegion },
  };
}
