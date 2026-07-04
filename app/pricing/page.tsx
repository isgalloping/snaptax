import { PricingPageContent } from "@/components/legal/PricingPageContent";
import { loadPricingPageLiveData } from "@/lib/legal/pricingPageData";
import { loadLegalMarkdown, parseLegalMarkdown } from "@/lib/legal/markdownDoc";

export const metadata = {
  title: "Pricing · Snap1099",
};

export default async function PricingPage() {
  const doc = parseLegalMarkdown(loadLegalMarkdown("pricing.md"));
  let live = null;
  try {
    live = await loadPricingPageLiveData();
  } catch {
    live = null;
  }

  return <PricingPageContent doc={doc} live={live} />;
}
