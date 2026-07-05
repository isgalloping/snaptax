import type { ParsedLegalMarkdown } from "@/lib/legal/markdownDoc";
import { omitLegalHubSections } from "@/lib/legal/omitLegalHubSections";
import { LegalMarkdownInline } from "@/components/legal/LegalMarkdownSections";
import { LegalFullPageShell } from "@/components/legal/LegalFullPageShell";
import { slugifyLegalHeading } from "@/lib/legal/slugifyLegalHeading";
import type { PricingPageLiveData } from "@/lib/legal/pricingPageData";

export function PricingPageBody({
  doc,
  live,
  hideHubSections = false,
  onClose,
}: {
  doc: ParsedLegalMarkdown;
  live: PricingPageLiveData | null;
  hideHubSections?: boolean;
  onClose?: () => void;
}) {
  const sections = hideHubSections
    ? omitLegalHubSections(doc.sections)
    : doc.sections;

  return (
    <LegalFullPageShell title={doc.title} subtitle={doc.subtitle} onClose={onClose}>
      {live ? (
        <section className="mb-8 rounded-xl border-2 border-yellow-500 bg-zinc-900 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Current offer
          </p>
          <p className="mt-2 text-lg font-black text-white">
            Export Tax Pack · {live.taxSeason} Tax Season
          </p>
          <p className="mt-1 text-3xl font-black text-yellow-400">
            {live.priceLabel}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            One-time per tax season. Unlimited re-export for that season after
            purchase.
          </p>
          {live.showFounderTable && live.founderRows.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
                Founder Program tiers (seats remaining: open)
              </p>
              <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-700 text-zinc-400">
                    <th className="py-2 pr-3 font-bold">Tier</th>
                    <th className="py-2 pr-3 font-bold">Seats</th>
                    <th className="py-2 pr-3 font-bold">Price</th>
                    <th className="py-2 font-bold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {live.founderRows.map((row) => (
                    <tr
                      key={row.tier}
                      className="border-b border-zinc-800 text-zinc-300"
                    >
                      <td className="py-3 pr-3 font-bold text-white">
                        {row.label}
                      </td>
                      <td className="py-3 pr-3">{row.seatRange}</td>
                      <td className="py-3 pr-3 text-yellow-400">
                        {row.priceLabel}
                      </td>
                      <td className="py-3">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <p className="mb-8 rounded-xl border-2 border-zinc-600 bg-zinc-900 p-5 text-sm leading-relaxed text-zinc-300">
          Open Snap1099 in your browser for current season pricing at checkout.
        </p>
      )}

      {sections.map((section) => (
        <section key={section.title} className="mb-8">
          <h2
            id={slugifyLegalHeading(section.title)}
            className="mb-3 text-sm font-bold uppercase tracking-wider text-yellow-400"
          >
            {section.title}
          </h2>
          {section.body.map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className="mb-3 text-sm leading-relaxed text-zinc-300"
            >
              <LegalMarkdownInline text={paragraph} />
            </p>
          ))}
        </section>
      ))}
    </LegalFullPageShell>
  );
}
