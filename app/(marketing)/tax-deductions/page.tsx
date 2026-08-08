import { TaxDeductionsIndex } from "@/components/marketing/seo/TaxDeductionsIndex";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

export const metadata = buildMarketingMetadata({
  title: "Tax Deductions by Trade | SnapTax",
  description:
    "Browse trade-specific tax deduction checklists for independent contractors. Start with electricians — tools, vehicles, supplies, and receipt tracking.",
  path: "/tax-deductions",
});

export default function TaxDeductionsIndexPage() {
  return <TaxDeductionsIndex />;
}
