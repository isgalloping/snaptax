import type { IndustrySeoPage } from "@/lib/marketing/seo/types";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

export function ProblemSolution({ page }: { page: IndustrySeoPage }) {
  return (
    <section className="border-t border-white/10 bg-black/20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-black text-white sm:text-3xl">
          {page.problemsTitle}
        </h2>

        <ul className="mt-10 grid list-none gap-4 sm:grid-cols-3">
          {page.problems.map((problem) => (
            <li
              key={problem.title}
              className="rounded-xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-base font-black text-white sm:text-lg">
                {problem.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {problem.body}
              </p>
              <p
                className="mt-4 text-sm font-bold leading-snug"
                style={{ color: MARKETING_TOKENS.accentGreen }}
              >
                {problem.solution}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
