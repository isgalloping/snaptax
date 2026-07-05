import { PricingPageBody } from "@/components/legal/PricingPageBody";
import type { ParsedLegalMarkdown } from "@/lib/legal/markdownDoc";
import type { PricingPageLiveData } from "@/lib/legal/pricingPageData";

export function PricingPageContent({
  doc,
  live,
  hideHubSections = false,
}: {
  doc: ParsedLegalMarkdown;
  live: PricingPageLiveData | null;
  hideHubSections?: boolean;
}) {
  return (
    <PricingPageBody
      doc={doc}
      live={live}
      hideHubSections={hideHubSections}
    />
  );
}
