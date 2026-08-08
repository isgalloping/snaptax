import type { IndustrySeoPage } from "@/lib/marketing/seo/types";

export function BuiltForBand({ page }: { page: IndustrySeoPage }) {
  const { builtFor } = page;

  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-black text-white sm:text-3xl">
          {builtFor.title}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          {builtFor.body}
        </p>

        <ul className="mt-10 grid list-none gap-6 sm:grid-cols-3">
          {builtFor.features.map((feature) => (
            <li key={feature.title} className="min-w-0">
              <h3 className="text-base font-black text-white">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm leading-snug text-zinc-400">
                {feature.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
