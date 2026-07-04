"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LegalDoc } from "@/lib/legal/content";
import { getLegalBundle, getLegalSections, getLegalTitle } from "@/lib/legal/content";
import type { ParsedLegalMarkdown } from "@/lib/legal/markdownDoc";
import { useI18n, useUserCopy } from "@/components/i18n/I18nProvider";
import { LegalMarkdownSections } from "@/components/legal/LegalMarkdownSections";
import { useDialogEscape } from "@/lib/ui/useDialogEscape";

const MARKDOWN_DOCS = new Set<LegalDoc>(["data-retention", "security"]);

const FULL_PAGE_HREF: Record<LegalDoc, string> = {
  privacy: "/privacy",
  terms: "/terms",
  "data-retention": "/data-retention",
  security: "/security",
};

interface LegalSheetProps {
  doc: LegalDoc | null;
  onClose: () => void;
}

export function LegalSheet({ doc, onClose }: LegalSheetProps) {
  const { locale } = useI18n();
  const privacyCopy = useUserCopy().settings.privacyData;
  useDialogEscape(doc != null, onClose);

  const [markdownDoc, setMarkdownDoc] = useState<ParsedLegalMarkdown | null>(null);
  const [markdownError, setMarkdownError] = useState(false);
  const [loadingMarkdown, setLoadingMarkdown] = useState(false);

  useEffect(() => {
    if (!doc || !MARKDOWN_DOCS.has(doc)) {
      setMarkdownDoc(null);
      setMarkdownError(false);
      setLoadingMarkdown(false);
      return;
    }

    let cancelled = false;
    setLoadingMarkdown(true);
    setMarkdownError(false);

    void fetch(`/api/legal/document?file=${doc}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("load failed");
        return (await res.json()) as ParsedLegalMarkdown;
      })
      .then((parsed) => {
        if (!cancelled) setMarkdownDoc(parsed);
      })
      .catch(() => {
        if (!cancelled) {
          setMarkdownDoc(null);
          setMarkdownError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMarkdown(false);
      });

    return () => {
      cancelled = true;
    };
  }, [doc]);

  if (!doc) return null;

  const bundle = getLegalBundle(locale);
  const isMarkdown = MARKDOWN_DOCS.has(doc);
  const sections = isMarkdown ? [] : getLegalSections(doc, locale);
  const title = isMarkdown
    ? (markdownDoc?.title ??
      (doc === "data-retention"
        ? privacyCopy.dataRetention
        : privacyCopy.security))
    : getLegalTitle(doc, locale);
  const showEnglishOnly = isMarkdown && locale !== "en-US";

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
          {showEnglishOnly && (
            <p className="mb-4 rounded-xl border border-zinc-600 bg-zinc-800/80 p-3 text-xs font-bold text-zinc-300">
              {privacyCopy.englishOnlyNotice}
            </p>
          )}
          {isMarkdown ? (
            loadingMarkdown ? (
              <p className="text-sm text-zinc-400">{privacyCopy.loadingLegal}</p>
            ) : markdownError || !markdownDoc ? (
              <p className="text-sm text-zinc-300">{privacyCopy.legalLoadFailed}</p>
            ) : (
              <LegalMarkdownSections sections={markdownDoc.sections} headingLevel="h3" />
            )
          ) : (
            sections.map((section) => (
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
            ))
          )}
          <Link
            href={FULL_PAGE_HREF[doc]}
            className="mt-4 inline-block min-h-12 text-sm font-bold text-yellow-400 underline"
          >
            {bundle.openFullPage(title)}
          </Link>
        </div>
      </div>
    </div>
  );
}
