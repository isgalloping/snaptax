"use client";

import type { LegalDoc } from "@/lib/legal/content";
import { getLegalBundle, getLegalSections, getLegalTitle } from "@/lib/legal/content";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useDialogEscape } from "@/lib/ui/useDialogEscape";

interface LegalSheetProps {
  doc: LegalDoc | null;
  onClose: () => void;
}

export function LegalSheet({ doc, onClose }: LegalSheetProps) {
  const { locale } = useI18n();
  useDialogEscape(doc != null, onClose);
  if (!doc) return null;

  const bundle = getLegalBundle(locale);
  const sections = getLegalSections(doc, locale);
  const title = getLegalTitle(doc, locale);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/70"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[85vh] w-full flex-col rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-700 p-4">
          <h2
            id="legal-sheet-title"
            className="text-lg font-black uppercase tracking-wider text-white"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 min-w-12 rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 text-sm font-black uppercase tracking-wider transition-transform active:scale-95"
            aria-label={bundle.close}
          >
            {bundle.close}
          </button>
        </div>
        <div className="overflow-y-auto p-6 pb-10">
          <p className="mb-6 text-xs text-zinc-400">{bundle.lastUpdatedLabel}</p>
          {sections.map((section) => (
            <section key={section.title} className="mb-6">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-yellow-400">
                {section.title}
              </h3>
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
          <a
            href={doc === "privacy" ? "/privacy" : "/terms"}
            className="inline-block min-h-12 text-sm font-bold text-yellow-400 underline"
          >
            {bundle.openFullPage(title)}
          </a>
        </div>
      </div>
    </div>
  );
}
