import { z } from "zod";
import { INCOME_FORM_TYPES } from "@/lib/export/incomeDocuments";

export const Us1099AiSchema = z.object({
  form_type: z.enum(INCOME_FORM_TYPES),
  payer: z.string(),
  amount: z.number().min(0),
  tax_year: z.number().int().min(2000).max(2100).nullable().optional(),
  confidence: z.number().min(0).max(1),
});
