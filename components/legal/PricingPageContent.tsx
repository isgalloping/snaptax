import { PricingPageBody } from "@/components/legal/PricingPageBody";
import type { ParsedLegalMarkdown } from "@/lib/legal/markdownDoc";
import type { PricingPageLiveData } from "@/lib/legal/pricingPageData";

export function PricingPageContent({
  doc,
  live,
  hideHubSections = false,
  embedded = false,
  hideLiveBlock = false,
  embeddedTitleAs = "h1",
}: {
  doc: ParsedLegalMarkdown;
  live: PricingPageLiveData | null;
  hideHubSections?: boolean;
  embedded?: boolean;
  hideLiveBlock?: boolean;
  embeddedTitleAs?: "h1" | "h2" | "none";
}) {
  return (
    <PricingPageBody
      doc={doc}
      live={live}
      hideHubSections={hideHubSections}
      embedded={embedded}
      hideLiveBlock={hideLiveBlock}
      embeddedTitleAs={embeddedTitleAs}
    />
  );
}
