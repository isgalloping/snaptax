export type TaxRegion = "us" | "eu";

export type UsAiFields = {
  amount: number;
  merchant: string;
  category: string;
  deductible: boolean;
  deduction_ratio: number;
  confidence: number;
};

export type EuAiFields = {
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  deductible: boolean;
  vat_rate: number | null;
  vat_amount: number | null;
  confidence: number;
};

export type ReceiptAiFields = UsAiFields | EuAiFields;
