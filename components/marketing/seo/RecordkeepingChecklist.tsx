import type { IndustrySeoPage } from "@/lib/marketing/seo/types";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

function ChecklistItem({ item }: { item: string }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
      <span
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-black"
        style={{ backgroundColor: MARKETING_TOKENS.accentGreen }}
        aria-hidden
      >
        ✓
      </span>
      {item}
    </li>
  );
}

function ClipboardIcon() {
  return (
    <svg
      viewBox="0 0 80 80"
      className="h-20 w-20 shrink-0"
      fill="none"
      aria-hidden
    >
      <rect
        x="18"
        y="14"
        width="44"
        height="56"
        rx="4"
        stroke={MARKETING_TOKENS.accentGreen}
        strokeWidth="2.5"
      />
      <path
        d="M30 14v-4a4 4 0 0 1 8 0v4"
        stroke={MARKETING_TOKENS.accentGreen}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect
        x="28"
        y="10"
        width="24"
        height="8"
        rx="2"
        stroke={MARKETING_TOKENS.accentGreen}
        strokeWidth="2.5"
      />
      <path
        d="M28 32h24M28 42h24M28 52h16"
        stroke={MARKETING_TOKENS.accentGreen}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RecordkeepingChecklist({ page }: { page: IndustrySeoPage }) {
  const checklist = page.checklist;
  if (!checklist) return null;
  const isMockup = page.presentation === "mockup";

  const items = (
    <ul className="grid list-none gap-3 sm:grid-cols-2">
      {checklist.items.map((item) => (
        <ChecklistItem key={item} item={item} />
      ))}
    </ul>
  );

  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-black text-white sm:text-3xl">
          {checklist.title}
        </h2>

        {isMockup ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex shrink-0 justify-center sm:justify-start">
                <ClipboardIcon />
              </div>
              <div className="min-w-0 flex-1">{items}</div>
            </div>
          </div>
        ) : (
          <div className="mt-8">{items}</div>
        )}
      </div>
    </section>
  );
}
