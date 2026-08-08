import { Fragment } from "react";
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

function StepArrow() {
  return (
    <div className="hidden shrink-0 items-center px-1 lg:flex" aria-hidden>
      <svg
        viewBox="0 0 56 12"
        className="h-3 w-14 text-zinc-500"
        fill="none"
      >
        <line
          x1="0"
          y1="6"
          x2="46"
          y2="6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 4"
        />
        <path d="M50 6 44 2.5v7L50 6Z" fill="currentColor" />
      </svg>
    </div>
  );
}

export function HowItWorks({ page }: { page: IndustrySeoPage }) {
  const { howItWorks } = page;

  return (
    <section
      id={howItWorks.id}
      className="scroll-mt-24 border-t border-white/10"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-black text-white sm:text-3xl">
          {howItWorks.title}
        </h2>

        <ol className="mt-12 flex list-none flex-col gap-10 lg:flex-row lg:items-start lg:gap-2">
          {howItWorks.steps.map((step, index) => (
            <Fragment key={step.title}>
              <li className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-black"
                  style={{ backgroundColor: MARKETING_TOKENS.accentGreen }}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-white sm:text-lg">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-snug text-zinc-400">
                    {step.body}
                  </p>
                </div>
              </li>
              {index < howItWorks.steps.length - 1 ? <StepArrow /> : null}
            </Fragment>
          ))}
        </ol>
      </div>
    </section>
  );
}
