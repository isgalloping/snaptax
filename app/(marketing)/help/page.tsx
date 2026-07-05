import { Suspense } from "react";
import { HelpPageContent } from "@/components/help/HelpPageContent";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

export const metadata = buildMarketingMetadata({
  title: "Help — SnapTax",
  description: "SnapTax help center — quick start, receipts, export, and FAQ.",
  path: "/help",
});

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="min-h-40" />}>
      <HelpPageContent appHomeHref="/app" embedded />
    </Suspense>
  );
}
