import { Fragment } from "react";
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";

function FeatureConnector() {
  return (
    <div className="hidden shrink-0 items-center self-center px-1 xl:flex" aria-hidden>
      <svg viewBox="0 0 56 12" className="h-3 w-14 text-zinc-500" fill="none">
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

export function BuiltForBand({ page }: { page: IndustrySeoPage }) {
  const { builtFor } = page;
  const isMockup = page.presentation === "mockup";

  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2
          className={
            isMockup
              ? "text-center text-2xl font-black text-white sm:text-3xl"
              : "text-2xl font-black text-white sm:text-3xl"
          }
        >
          {builtFor.title}
        </h2>
        <p
          className={
            isMockup
              ? "mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-zinc-400 sm:text-base"
              : "mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base"
          }
        >
          {builtFor.body}
        </p>

        {isMockup ? (
          <ul className="mt-10 flex list-none flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            {builtFor.features.map((feature, index) => (
              <Fragment key={feature.title}>
                <li className="min-w-0 flex-1">
                  <h3 className="text-base font-black text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-snug text-zinc-400">
                    {feature.body}
                  </p>
                </li>
                {index < builtFor.features.length - 1 ? (
                  <FeatureConnector />
                ) : null}
              </Fragment>
            ))}
          </ul>
        ) : (
          <ul className="mt-10 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
        )}
      </div>
    </section>
  );
}
