import Link from "next/link";
import type { IndustrySeoPage } from "@/lib/marketing/seo/types";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

export function RelatedTrades({
  relatedTrades,
}: {
  relatedTrades: NonNullable<IndustrySeoPage["relatedTrades"]>;
}) {
  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-black text-white sm:text-2xl">
          {relatedTrades.title}
        </h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {relatedTrades.links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex min-h-11 items-center rounded-lg border border-white/15 px-4 text-sm font-bold text-zinc-200 hover:border-white/30 hover:text-white"
              >
                <span style={{ color: MARKETING_TOKENS.accentGreen }}>
                  {link.label} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
