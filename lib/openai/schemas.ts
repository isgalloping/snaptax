import { z } from "zod";

export const UsReceiptAiSchema = z.object({
  amount: z.number().min(0),
  merchant: z.string(),
  category: z.string(),
  deductible: z.boolean(),
  deduction_ratio: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
});

export const EuReceiptAiSchema = z.object({
  amount: z.number().min(0),
  currency: z.string(),
  merchant: z.string(),
  category: z.string(),
  deductible: z.boolean(),
  vat_rate: z.number().min(0).max(1).nullable(),
  vat_amount: z.number().min(0).nullable(),
  confidence: z.number().min(0).max(1),
});
