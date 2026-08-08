import type { IndustrySeoPage } from "@/lib/marketing/seo/types";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

export function ExpenseExamples({ page }: { page: IndustrySeoPage }) {
  return (
    <section className="border-t border-white/10 bg-black/20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-black text-white sm:text-3xl">
          {page.examplesTitle}
        </h2>

        <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[20rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 font-black text-white sm:px-6">
                  Expense
                </th>
                <th className="px-4 py-3 font-black text-white sm:px-6">
                  {page.examplesCategoryHeader}
                </th>
              </tr>
            </thead>
            <tbody>
              {page.examples.map((row) => (
                <tr
                  key={`${row.expense}-${row.category}`}
                  className="border-b border-white/10 last:border-b-0"
                >
                  <td className="px-4 py-3 text-zinc-200 sm:px-6">
                    {row.expense}
                  </td>
                  <td
                    className="px-4 py-3 font-semibold sm:px-6"
                    style={{ color: MARKETING_TOKENS.accentGreen }}
                  >
                    {row.category}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-zinc-500 sm:text-sm">
          {page.productCategoryNote}
        </p>
      </div>
    </section>
  );
}
