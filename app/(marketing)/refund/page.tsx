import { LegalMarkdownPage } from "@/components/legal/LegalMarkdownPage";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";
import { loadLegalMarkdown, parseLegalMarkdown } from "@/lib/legal/markdownDoc";

export const metadata = buildMarketingMetadata({
  title: "Refund Policy — SnapTax",
  description: "SnapTax refund policy for Export Tax Pack purchases via Paddle.",
  path: "/refund",
});

export default async function RefundPage({
  searchParams,
}: {
  searchParams: Promise<{ ctx?: string }>;
}) {
  const { ctx } = await searchParams;
  const doc = parseLegalMarkdown(loadLegalMarkdown("refund.md"));
  return (
    <LegalMarkdownPage
      doc={doc}
      hideHubSections={ctx === "privacy-center"}
      embedded
    />
  );
}
