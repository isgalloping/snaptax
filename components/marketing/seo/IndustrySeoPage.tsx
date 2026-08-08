import Link from "next/link";
import { BuiltForBand } from "@/components/marketing/seo/BuiltForBand";
import { DeductionCards } from "@/components/marketing/seo/DeductionCards";
import { ExpenseExamples } from "@/components/marketing/seo/ExpenseExamples";
import { HowItWorks } from "@/components/marketing/seo/HowItWorks";
import { IndustryFaq } from "@/components/marketing/seo/IndustryFaq";
import { IndustryFinalCta } from "@/components/marketing/seo/IndustryFinalCta";
import { IndustryHero } from "@/components/marketing/seo/IndustryHero";
import { ProblemSolution } from "@/components/marketing/seo/ProblemSolution";
import { SeoDisclaimer } from "@/components/marketing/seo/SeoDisclaimer";
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";

export function IndustrySeoPageView({ page }: { page: IndustrySeoPage }) {
  return (
    <>
      <IndustryHero page={page} />
      <DeductionCards page={page} />
      <ProblemSolution page={page} />
      <HowItWorks page={page} />
      <ExpenseExamples page={page} />
      <BuiltForBand page={page} />
      <IndustryFaq items={page.faq} />
      <IndustryFinalCta page={page} />
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
