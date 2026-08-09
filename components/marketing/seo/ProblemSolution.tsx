import type { IndustrySeoPage } from "@/lib/marketing/seo/types";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

const PROBLEM_ICON_ORANGE = "#FB923C";

function ProblemMockupIcon({ title }: { title: string }) {
  const lower = title.toLowerCase();

  let paths: React.ReactNode;
  if (lower.includes("receipt") || lower.includes("disappear")) {
    paths = (
      <>
        <path
          d="M8 4.5h8v15H8V4.5Z"
          stroke="currentColor"
          strokeLinejoin="round"
        />
        <path
          d="M10 8.5h4M10 11.5h4M10 14.5h2.5"
          stroke="currentColor"
          strokeLinecap="round"
        />
      </>
    );
  } else if (lower.includes("mix") || lower.includes("expense")) {
    paths = (
      <>
        <rect x="5" y="6" width="10" height="10" rx="1.5" />
        <path d="M9 6V5a2 2 0 0 1 4 0v1" strokeLinecap="round" />
      </>
    );
  } else {
    paths = (
      <>
        <circle cx="10" cy="10.5" r="6.5" />
        <path d="M10 7.5v4l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    );
  }

  return (
    <span
      className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full"
      style={{
        backgroundColor: `${PROBLEM_ICON_ORANGE}26`,
        color: PROBLEM_ICON_ORANGE,
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 20 20"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        {paths}
      </svg>
    </span>
  );
}

export function ProblemSolution({ page }: { page: IndustrySeoPage }) {
  const isMockup = page.presentation === "mockup";

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
              {isMockup ? <ProblemMockupIcon title={problem.title} /> : null}
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

        {page.problemsClosing ? (
          <p
            className="mt-10 text-center text-sm font-bold sm:text-base"
            style={{ color: MARKETING_TOKENS.accentGreen }}
          >
            {page.problemsClosing}
          </p>
        ) : null}
      </div>
    </section>
  );
}
