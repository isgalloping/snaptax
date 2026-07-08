import { LegalMarkdownPage } from "@/components/legal/LegalMarkdownPage";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";
import { loadLegalMarkdown, parseLegalMarkdown } from "@/lib/legal/markdownDoc";

export const metadata = buildMarketingMetadata({
  title: "Cookie Policy — SnapTax",
  description: "How SnapTax uses cookies and similar technologies.",
  path: "/cookies",
});

export default function CookiesPage() {
  const doc = parseLegalMarkdown(loadLegalMarkdown("cookies.md"));
  return <LegalMarkdownPage doc={doc} embedded />;
}
