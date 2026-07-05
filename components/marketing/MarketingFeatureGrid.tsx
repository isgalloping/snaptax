import { Fragment, type ReactNode } from "react";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

type FeatureIconName = (typeof MARKETING_COPY.features.items)[number]["icon"];

function FeatureArrow() {
  return (
    <div className="hidden shrink-0 items-center self-center px-0.5 xl:flex" aria-hidden>
      <svg viewBox="0 0 40 12" className="h-3 w-10 text-zinc-500" fill="none">
        <path
          d="M2 6h30M30 6l-4-3v6l4-3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function FeatureIcon({ icon }: { icon: FeatureIconName }) {
  const stroke = MARKETING_TOKENS.accentGreen;
  const className = "h-8 w-8";

  const wrap = (svg: ReactNode) => (
    <div className="mb-3 inline-flex rounded-lg bg-white/5 p-2.5">{svg}</div>
  );

  if (icon === "receipt") {
    return wrap(
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <path
          d="M7 4h10v16l-2-1-2 1-2-1-2 1-2-1V4Z"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M9 8h6M9 11h4M14 14l3 3m0-3-3 3"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>,
    );
  }

  if (icon === "categories") {
    return wrap(
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <rect
          x="5"
          y="5"
          width="14"
          height="14"
          rx="2"
          stroke={stroke}
          strokeWidth="1.5"
        />
        <path
          d="m9 12 2 2 4-4"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>,
    );
  }

  if (icon === "reports") {
    return wrap(
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <path
          d="M8 4h8a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2Z"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M9 9h6M9 12h6M9 15h4"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>,
    );
  }

  if (icon === "offline") {
    return wrap(
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <path
          d="M5 12.5a7 7 0 0 1 10.5-6M12.5 5A7 7 0 0 1 19 12.5M8.5 16.5A3.5 3.5 0 0 1 12 13"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="12" cy="18.5" r="1" fill={stroke} />
      </svg>,
    );
  }

  return wrap(
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect
        x="10"
        y="10"
        width="4"
        height="5"
        rx="1"
        stroke={stroke}
        strokeWidth="1.5"
      />
    </svg>,
  );
}

export function MarketingFeatureGrid() {
  const { features } = MARKETING_COPY;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="text-center text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">
        {features.sectionTitle}
      </h2>
      <ul className="mt-12 flex list-none flex-col gap-8 sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:flex xl:flex-row xl:items-start xl:gap-1">
        {features.items.map((feature, index) => (
          <Fragment key={feature.title}>
            <li className="min-w-0 xl:flex-1">
              <FeatureIcon icon={feature.icon} />
              <h3 className="text-sm font-black leading-snug text-white sm:text-base">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-xs leading-snug text-zinc-400 sm:text-sm">
                {feature.body}
              </p>
            </li>
            {index < features.items.length - 1 ? <FeatureArrow /> : null}
          </Fragment>
        ))}
      </ul>
    </section>
  );
}
