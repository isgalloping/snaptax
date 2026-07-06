import Link from "next/link";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

export const metadata = buildMarketingMetadata({
  title: "Disclaimer — SnapTax",
  description: "SnapTax is not a tax advisor or CPA substitute.",
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black text-white">Disclaimer</h1>
      <p className="mt-6 text-sm leading-relaxed text-zinc-400">
        SnapTax helps organize receipts and export reports for independent
        contractors and small businesses. It does not provide tax, legal, or
        accounting advice.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-zinc-400">
        Calculations, categorizations, and &quot;Est. Tax Saved&quot; figures are
        estimates based on the information you provide and general tax rules.
        Always consult a qualified tax professional before filing.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-zinc-400">
        SnapTax is not affiliated with the IRS or any government agency. Pricing
        and entitlements are described in our{" "}
        <Link
          href="/terms"
          className="text-white underline-offset-4 hover:underline"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/pricing"
          className="text-white underline-offset-4 hover:underline"
        >
          Pricing
        </Link>{" "}
        pages.
      </p>
    </div>
  );
}
