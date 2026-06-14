import { z } from "zod";
import type { Industry } from "@/lib/types";
import { INDUSTRIES } from "@/lib/types";

export const industrySchema = z.enum([
  "truck_driver",
  "plumber",
  "electrician",
  "construction",
  "delivery",
  "general",
]);

export type ValidIndustry = z.infer<typeof industrySchema>;

const LABEL_BY_ID = Object.fromEntries(
  INDUSTRIES.map((item) => [item.id, item.label]),
) as Record<Industry, string>;

export function parseIndustry(value: unknown): ValidIndustry {
  return industrySchema.parse(value);
}

export function industryLabelForPrompt(industry: ValidIndustry): string {
  return LABEL_BY_ID[industry];
}

export const patchUserBodySchema = z.object({
  industry: industrySchema,
});
