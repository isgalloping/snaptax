import Link from "next/link";
import { SeoDisclaimer } from "@/components/marketing/seo/SeoDisclaimer";
import { listPublishedIndustries } from "@/lib/marketing/seo/industries";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

const INDEX_DISCLAIMER =
  "For educational purposes only. Not tax advice. Confirm deductions with a qualified professional.";

export function TaxDeductionsIndex() {
  const industries = listPublishedIndustries();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black text-white sm:text-4xl">
        Tax Deductions by Trade
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
        Contractors can review common business expenses by trade and keep
        receipt-ready records before tax season.
      </p>

      {industries.length === 0 ? (
        <p className="mt-10 text-sm text-zinc-400">More trades coming soon.</p>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {industries.map((industry) => (
            <li key={industry.slug}>
              <Link
                href={industry.path}
                className="block min-h-24 rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-white/20"
              >
                <h2 className="text-lg font-black text-white">
                  {industry.label}
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  {industry.indexBlurb}
                </p>
                <span
                  className="mt-4 inline-block text-sm font-bold"
                  style={{ color: MARKETING_TOKENS.accentGreen }}
                >
                  View checklist →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-12">
        <SeoDisclaimer text={INDEX_DISCLAIMER} />
      </div>
    </div>
  );
}
