import { LegalMarkdownView } from "@/components/legal/LegalMarkdownView";
import { loadLegalMarkdown, parseLegalMarkdown } from "@/lib/legal/markdownDoc";

export const metadata = {
  title: "Refund Policy · Snap1099",
};

export default function RefundPage() {
  const doc = parseLegalMarkdown(loadLegalMarkdown("refund.md"));
  return <LegalMarkdownView doc={doc} />;
}
