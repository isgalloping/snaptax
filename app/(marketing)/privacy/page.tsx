import { LegalPageContent } from "@/components/legal/LegalPageContent";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

export const metadata = buildMarketingMetadata({
  title: "Privacy Policy — SnapTax",
  description: "How SnapTax collects, uses, and protects your data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <LegalPageContent doc="privacy" embedded />;
}
