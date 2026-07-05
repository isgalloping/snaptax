"use client";

import { useEffect, useState } from "react";
import type { ParsedLegalMarkdown } from "@/lib/legal/markdownDoc";
import type { PricingPageLiveData } from "@/lib/legal/pricingPageData";
import { PricingPageBody } from "@/components/legal/PricingPageBody";
import { LegalMarkdownPage } from "@/components/legal/LegalMarkdownPage";
import { useI18n, useUserCopy } from "@/components/i18n/I18nProvider";
import { getLegalBundle } from "@/lib/legal/content";

export type InAppLegalFullPage = "pricing" | "refund";

export function LegalInAppFullPageOverlay({
  page,
  onClose,
}: {
  page: InAppLegalFullPage;
  onClose: () => void;
}) {
  const privacyCopy = useUserCopy().settings.privacyData;
  const { locale } = useI18n();
  const closeLabel = getLegalBundle(locale).close;
  const [pricingDoc, setPricingDoc] = useState<ParsedLegalMarkdown | null>(null);
  const [pricingLive, setPricingLive] = useState<PricingPageLiveData | null>(null);
  const [refundDoc, setRefundDoc] = useState<ParsedLegalMarkdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setPricingDoc(null);
    setPricingLive(null);
    setRefundDoc(null);

    const url =
      page === "pricing" ? "/api/legal/pricing-page" : "/api/legal/document?file=refund";

    void fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error("load failed");
        return res.json();
      })
      .then((payload) => {
        if (cancelled) return;
        if (page === "pricing") {
          setPricingDoc(payload.doc as ParsedLegalMarkdown);
          setPricingLive((payload.live as PricingPageLiveData | null) ?? null);
          return;
        }
        setRefundDoc(payload as ParsedLegalMarkdown);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {loading ? (
        <div className="flex h-dvh items-center justify-center p-6">
          <p className="text-sm text-zinc-400">{privacyCopy.loadingLegal}</p>
        </div>
      ) : error ? (
        <div className="flex h-dvh flex-col items-center justify-center gap-4 p-6">
          <p className="text-sm text-zinc-300">{privacyCopy.legalLoadFailed}</p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 text-sm font-black uppercase tracking-wider text-white active:scale-95"
          >
            {closeLabel}
          </button>
        </div>
      ) : page === "pricing" && pricingDoc ? (
        <PricingPageBody
          doc={pricingDoc}
          live={pricingLive}
          hideHubSections
          onClose={onClose}
        />
      ) : page === "refund" && refundDoc ? (
        <LegalMarkdownPage doc={refundDoc} hideHubSections onClose={onClose} />
      ) : null}
    </div>
  );
}
