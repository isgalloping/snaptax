import type { VisionProcessResult } from "@/lib/openai/receiptVision";
import type { IncomeFormType } from "@/lib/export/incomeDocuments";

const MOCK_PAYERS = ["Client A", "Stripe", "Upwork", "Acme Corp"] as const;

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function mock1099Vision(
  formType: IncomeFormType = "1099-NEC",
): VisionProcessResult {
  const amount = Math.round((5000 + Math.random() * 45000) * 100) / 100;
  const payer = pickRandom(MOCK_PAYERS);

  return {
    fields: {
      amount,
      merchant: payer,
      category: formType,
      deductible: false,
      deduction_ratio: 0,
      confidence: 0.95,
    },
    taxAmount: 0,
    status: "done",
    merchantName: payer,
    category: formType,
    amount,
    currency: "USD",
    deductible: false,
    aiRaw: {
      region: "us",
      document_kind: formType,
      payer,
      tax_year: new Date().getFullYear() - 1,
      model: "mock",
    },
  };
}
