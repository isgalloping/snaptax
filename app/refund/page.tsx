import { LegalMarkdownPage } from "@/components/legal/LegalMarkdownPage";
import { loadLegalMarkdown, parseLegalMarkdown } from "@/lib/legal/markdownDoc";

export const metadata = {
  title: "Refund Policy · Snap1099",
};

export default function RefundPage() {
  const doc = parseLegalMarkdown(loadLegalMarkdown("refund.md"));
  return <LegalMarkdownPage doc={doc} />;
}
