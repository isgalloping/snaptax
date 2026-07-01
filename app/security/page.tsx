import { LegalMarkdownView } from "@/components/legal/LegalMarkdownView";
import { loadLegalMarkdown, parseLegalMarkdown } from "@/lib/legal/markdownDoc";

export const metadata = {
  title: "Security & Incident Response · Snap1099",
};

export default function SecurityPage() {
  const doc = parseLegalMarkdown(loadLegalMarkdown("security-incident.md"));
  return <LegalMarkdownView doc={doc} />;
}
