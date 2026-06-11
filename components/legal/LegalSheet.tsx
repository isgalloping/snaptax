"use client";

import { useTranslations } from "next-intl";
import type { LegalDoc } from "@/lib/legal/content";

interface LegalSheetProps {
  doc: LegalDoc | null;
  onClose: () => void;
}

interface SectionDef {
  titleKey: string;
  bodyKeys: string[];
}

const PRIVACY_SECTION_DEFS: SectionDef[] = [
  { titleKey: "privacyByDesignTitle", bodyKeys: ["privacyByDesignBody1", "privacyByDesignBody2", "privacyByDesignBody3"] },
  { titleKey: "dataStorageTitle", bodyKeys: ["dataStorageBody1", "dataStorageBody2", "dataStorageBody3"] },
  { titleKey: "googleSignInTitle", bodyKeys: ["googleSignInBody"] },
  { titleKey: "subProcessorsTitle", bodyKeys: ["subProcessorsBody"] },
  { titleKey: "noSaleTitle", bodyKeys: ["noSaleBody"] },
  { titleKey: "yourRightsTitle", bodyKeys: ["yourRightsBody1", "yourRightsBody2"] },
];

const TERMS_SECTION_DEFS: SectionDef[] = [
  { titleKey: "termsServiceTitle", bodyKeys: ["termsServiceBody"] },
  { titleKey: "termsAccountsTitle", bodyKeys: ["termsAccountsBody1", "termsAccountsBody2"] },
  { titleKey: "termsPaymentsTitle", bodyKeys: ["termsPaymentsBody"] },
  { titleKey: "termsPrivacyTitle", bodyKeys: ["termsPrivacyBody"] },
  { titleKey: "termsDisclaimerTitle", bodyKeys: ["termsDisclaimerBody1", "termsDisclaimerBody2"] },
];

export function LegalSheet({ doc, onClose }: LegalSheetProps) {
  const t = useTranslations("Legal");

  if (!doc) return null;

  const sectionDefs = doc === "privacy" ? PRIVACY_SECTION_DEFS : TERMS_SECTION_DEFS;
  const title = doc === "privacy" ? t("privacyPolicy") : t("termsOfService");

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
            {t("close")}
          </button>
        </div>
        <div className="overflow-y-auto p-6 pb-10">
          <p className="mb-6 text-xs text-zinc-400">
            {t("lastUpdated")}
          </p>
          {sectionDefs.map((section) => (
            <section key={section.titleKey} className="mb-6">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-yellow-400">
                {t(section.titleKey)}
              </h3>
              {section.bodyKeys.map((bodyKey) => (
                <p
                  key={bodyKey}
                  className="mb-3 text-sm leading-relaxed text-zinc-300"
                >
                  {t(bodyKey)}
                </p>
              ))}
            </section>
          ))}
          <a
            href={doc === "privacy" ? "/privacy" : "/terms"}
            className="inline-block min-h-12 text-sm font-bold text-yellow-400 underline"
          >
            {t("openFullPage", { title })}
          </a>
        </div>
      </div>
    </div>
  );
}
