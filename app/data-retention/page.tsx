import { LegalMarkdownView } from "@/components/legal/LegalMarkdownView";
import { loadLegalMarkdown, parseLegalMarkdown } from "@/lib/legal/markdownDoc";

export const metadata = {
  title: "Data Retention · Snap1099",
};

export default function DataRetentionPage() {
  const doc = parseLegalMarkdown(loadLegalMarkdown("data-retention.md"));
  return <LegalMarkdownView doc={doc} />;
}
