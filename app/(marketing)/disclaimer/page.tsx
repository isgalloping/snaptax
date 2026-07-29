import { LegalMarkdownPage } from "@/components/legal/LegalMarkdownPage";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";
import { loadLegalMarkdown, parseLegalMarkdown } from "@/lib/legal/markdownDoc";

export const metadata = buildMarketingMetadata({
  title: "Disclaimer — SnapTax",
  description: "SnapTax is not a tax advisor or CPA substitute.",
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  const doc = parseLegalMarkdown(loadLegalMarkdown("disclaimer.md"));
  return <LegalMarkdownPage doc={doc} embedded />;
}
