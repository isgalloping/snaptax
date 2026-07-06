import { MARKETING_COPY } from "@/lib/marketing/copy";
import { MarketingPaymentMethods } from "@/components/marketing/MarketingPaymentMethods";

export function MarketingPricingFooter({
  className = "mt-8",
}: {
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-center text-sm text-zinc-500 sm:text-left">
        {MARKETING_COPY.pricing.footer}
      </p>
      <MarketingPaymentMethods className="mt-4" />
    </div>
  );
}
