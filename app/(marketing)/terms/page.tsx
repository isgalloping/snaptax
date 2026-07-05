import { LegalPageContent } from "@/components/legal/LegalPageContent";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

export const metadata = buildMarketingMetadata({
  title: "Terms of Service — SnapTax",
  description: "SnapTax terms of service for customers in the US and EU.",
  path: "/terms",
});

export default function TermsPage() {
  return <LegalPageContent doc="terms" embedded />;
}
