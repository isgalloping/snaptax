import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingInstallShell } from "@/components/marketing/MarketingInstallShell";
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
    <MarketingInstallShell>
      <div
        className="min-h-dvh text-white"
        style={{ backgroundColor: MARKETING_TOKENS.bg }}
      >
        <MarketingHeader />
        <main>{children}</main>
        <MarketingFooter />
      </div>
    </MarketingInstallShell>
  );
}
