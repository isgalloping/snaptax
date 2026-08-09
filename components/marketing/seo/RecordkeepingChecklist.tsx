import type { IndustrySeoPage } from "@/lib/marketing/seo/types";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

export function RecordkeepingChecklist({
  checklist,
}: {
  checklist: NonNullable<IndustrySeoPage["checklist"]>;
}) {
  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-black text-white sm:text-3xl">
          {checklist.title}
        </h2>
        <ul className="mt-8 grid list-none gap-3 sm:grid-cols-2">
          {checklist.items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200"
            >
              <span
                className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-black"
                style={{ backgroundColor: MARKETING_TOKENS.accentGreen }}
                aria-hidden
              >
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
