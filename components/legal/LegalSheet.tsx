"use client";

import type { LegalDoc } from "@/lib/legal/content";
import { getLegalSections, getLegalTitle } from "@/lib/legal/content";

interface LegalSheetProps {
  doc: LegalDoc | null;
  onClose: () => void;
}

export function LegalSheet({ doc, onClose }: LegalSheetProps) {
  if (!doc) return null;

  const sections = getLegalSections(doc);
  const title = getLegalTitle(doc);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70">
      <div
        className="flex max-h-[85vh] w-full flex-col rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900"
        role="dialog"
        aria-labelledby="legal-sheet-title"
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
          >
            Close
          </button>
        </div>
        <div className="overflow-y-auto p-6 pb-10">
          <p className="mb-6 text-xs text-zinc-400">
            Last Updated: June 2026 · GDPR & CPRA
          </p>
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
            Open full {title} page
          </a>
        </div>
      </div>
    </div>
  );
}
