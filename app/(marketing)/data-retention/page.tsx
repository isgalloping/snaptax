import { LegalMarkdownPage } from "@/components/legal/LegalMarkdownPage";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";
import { loadLegalMarkdown, parseLegalMarkdown } from "@/lib/legal/markdownDoc";

export const metadata = buildMarketingMetadata({
  title: "Data Retention — SnapTax",
  description: "How long SnapTax retains your receipts and account data.",
  path: "/data-retention",
});

export default function DataRetentionPage() {
  const doc = parseLegalMarkdown(loadLegalMarkdown("data-retention.md"));
  return <LegalMarkdownPage doc={doc} embedded />;
}
