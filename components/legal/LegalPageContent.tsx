"use client";

import type { LocalizedLegalDoc } from "@/lib/legal/content";
import { getLegalBundle, getLegalSections, getLegalTitle } from "@/lib/legal/content";
import { LegalFullPageShell } from "@/components/legal/LegalFullPageShell";
import { slugifyLegalHeading } from "@/lib/legal/slugifyLegalHeading";
import { useI18n } from "@/components/i18n/I18nProvider";

export function LegalPageContent({ doc }: { doc: LocalizedLegalDoc }) {
  const { locale } = useI18n();
  const bundle = getLegalBundle(locale);
  const sections = getLegalSections(doc, locale);
  const title = getLegalTitle(doc, locale);

  return (
    <LegalFullPageShell title={title} subtitle={bundle.lastUpdatedLabel}>
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
              key={paragraph.slice(0, 40)}
              className="mb-3 text-sm leading-relaxed text-zinc-300"
            >
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </LegalFullPageShell>
  );
}
