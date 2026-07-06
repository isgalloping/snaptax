import { LegalMarkdownPage } from "@/components/legal/LegalMarkdownPage";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";
import { loadLegalMarkdown, parseLegalMarkdown } from "@/lib/legal/markdownDoc";

export const metadata = buildMarketingMetadata({
  title: "Security — SnapTax",
  description: "SnapTax security practices and incident response.",
  path: "/security",
});

export default function SecurityPage() {
  const doc = parseLegalMarkdown(loadLegalMarkdown("security-incident.md"));
  return <LegalMarkdownPage doc={doc} embedded />;
}
