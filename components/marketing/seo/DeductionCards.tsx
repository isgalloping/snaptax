import type { IndustrySeoPage } from "@/lib/marketing/seo/types";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

export function DeductionCards({ page }: { page: IndustrySeoPage }) {
  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-black text-white sm:text-3xl">
          {page.deductionsTitle}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          {page.deductionsIntro}
        </p>

        <ul className="mt-10 grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {page.deductionCards.map((card) => (
            <li
              key={card.title}
              className="rounded-xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-lg font-black text-white">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {card.body}
              </p>
              <ul className="mt-4 space-y-1.5">
                {card.examples.map((example) => (
                  <li
                    key={example}
                    className="flex items-start gap-2 text-sm text-zinc-200"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: MARKETING_TOKENS.accentGreen }}
                      aria-hidden
                    />
                    {example}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
