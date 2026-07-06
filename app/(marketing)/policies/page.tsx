import { PoliciesHubContent } from "@/components/legal/PoliciesHubContent";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

export const metadata = buildMarketingMetadata({
  title: "Terms & Policies — SnapTax",
  description: "SnapTax legal policies hub — privacy, terms, pricing, and security.",
  path: "/policies",
});

export default function PoliciesPage() {
  return <PoliciesHubContent embedded />;
}
