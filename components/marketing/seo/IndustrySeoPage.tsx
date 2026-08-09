import Link from "next/link";
import { BuiltForBand } from "@/components/marketing/seo/BuiltForBand";
import { DeductionCards } from "@/components/marketing/seo/DeductionCards";
import { ExpenseExamples } from "@/components/marketing/seo/ExpenseExamples";
import { HowItWorks } from "@/components/marketing/seo/HowItWorks";
import { IndustryFaq } from "@/components/marketing/seo/IndustryFaq";
import { IndustryFinalCta } from "@/components/marketing/seo/IndustryFinalCta";
import { IndustryHero } from "@/components/marketing/seo/IndustryHero";
import { ProblemSolution } from "@/components/marketing/seo/ProblemSolution";
import { RecordkeepingChecklist } from "@/components/marketing/seo/RecordkeepingChecklist";
import { RelatedTrades } from "@/components/marketing/seo/RelatedTrades";
import { SeoDisclaimer } from "@/components/marketing/seo/SeoDisclaimer";
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";

export function IndustrySeoPageView({ page }: { page: IndustrySeoPage }) {
  return (
    <>
      <IndustryHero page={page} />
      <DeductionCards page={page} />
      <HowItWorks page={page} />
      <ProblemSolution page={page} />
      {page.checklist ? (
        <RecordkeepingChecklist checklist={page.checklist} />
      ) : null}
      <BuiltForBand page={page} />
      {page.examples.length > 0 ? <ExpenseExamples page={page} /> : null}
      <IndustryFaq items={page.faq} />
      <IndustryFinalCta page={page} />
      {page.relatedTrades ? (
        <RelatedTrades relatedTrades={page.relatedTrades} />
      ) : null}
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-4 text-sm">
          {page.outboundLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-zinc-400 underline hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <SeoDisclaimer text={page.disclaimer} />
      </div>
    </>
  );
}
