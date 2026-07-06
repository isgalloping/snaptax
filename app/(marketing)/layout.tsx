import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingPwaRedirect } from "@/components/marketing/MarketingPwaRedirect";
import { MarketingPwaRedirectScript } from "@/components/marketing/MarketingPwaRedirectScript";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

export const metadata: Metadata = {
  title: {
    default: "SnapTax",
    template: "%s",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-dvh text-white"
      style={{ backgroundColor: MARKETING_TOKENS.bg }}
    >
      <MarketingPwaRedirectScript />
      <MarketingPwaRedirect />
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
