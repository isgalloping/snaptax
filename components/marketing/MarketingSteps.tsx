import { Fragment } from "react";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

type StepIconName = (typeof MARKETING_COPY.steps.items)[number]["icon"];

function StepIcon({ icon }: { icon: StepIconName }) {
  const className = "h-10 w-10 shrink-0";
  const stroke = MARKETING_TOKENS.accentGreen;

  if (icon === "camera") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden
      >
        <path
          d="M4 8.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.5M4 8.5 5.2 6.8A2 2 0 0 1 7 6h2.2l1-1.3A1 1 0 0 1 11 4h2a1 1 0 0 1 .8.7L15 6H17a2 2 0 0 1 1.8 1.2L20 8.5M12 15.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "tag") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden
      >
        <path
          d="M7 7h4l8.5 8.5a2.12 2.12 0 0 1 0 3L16 20a2.12 2.12 0 0 1-3 0L4.5 11.5V7a2 2 0 0 1 2-2Z"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="9" r="1.25" fill={stroke} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M8 4h8a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 9h6M9 12h6M9 15h4"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StepArrow() {
  return (
    <div
      className="hidden shrink-0 items-center px-1 lg:flex"
      aria-hidden
    >
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

export function MarketingSteps() {
  const { steps } = MARKETING_COPY;

  return (
    <section className="border-t border-white/10 bg-black/20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">
          {steps.sectionTitle}
        </h2>
        <ol className="mt-12 flex list-none flex-col gap-10 lg:flex-row lg:items-center lg:gap-2">
          {steps.items.map((step, index) => (
            <Fragment key={step.title}>
              <li className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-black"
                  style={{ backgroundColor: MARKETING_TOKENS.accentGreen }}
                >
                  {index + 1}
                </span>
                <StepIcon icon={step.icon} />
                <div className="min-w-0">
                  <h3 className="text-base font-black text-white sm:text-lg">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-snug text-zinc-400">
                    {step.body}
                  </p>
                </div>
              </li>
              {index < steps.items.length - 1 ? <StepArrow /> : null}
            </Fragment>
          ))}
        </ol>
      </div>
    </section>
  );
}
