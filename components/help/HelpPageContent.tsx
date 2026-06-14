"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HelpText } from "@/components/help/HelpText";
import { useI18n } from "@/components/i18n/I18nProvider";

const SECTION_IDS = [
  "quick-start",
  "snap-receipt",
  "home-screen",
  "google-backup",
  "tax-export",
  "faq",
  "privacy",
] as const;

type SectionId = (typeof SECTION_IDS)[number];

function isSectionId(value: string | null): value is SectionId {
  return SECTION_IDS.includes(value as SectionId);
}

function HelpSectionBody({
  sectionId,
  sections,
}: {
  sectionId: SectionId;
  sections: ReturnType<typeof useI18n>["copy"]["help"]["sections"];
}) {
  switch (sectionId) {
    case "quick-start":
      return (
        <>
          <ol className="mb-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-zinc-300">
            {sections.quickStart.steps.map((step) => (
              <li key={step}>
                <HelpText text={step} />
              </li>
            ))}
          </ol>
          <p className="text-sm leading-relaxed text-zinc-300">
            <HelpText text={sections.quickStart.closing} />
          </p>
        </>
      );
    case "snap-receipt":
      return (
        <>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            {sections.snapReceipt.stepsTitle}
          </h3>
          <ol className="mb-6 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-zinc-300">
            {sections.snapReceipt.steps.map((step) => (
              <li key={step}>
                <HelpText text={step} />
              </li>
            ))}
          </ol>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            {sections.snapReceipt.tipsTitle}
          </h3>
          <ul className="mb-6 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-300">
            {sections.snapReceipt.tips.map((tip) => (
              <li key={tip}>
                <HelpText text={tip} />
              </li>
            ))}
          </ul>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            {sections.snapReceipt.blurryTitle}
          </h3>
          <p className="mb-6 text-sm leading-relaxed text-zinc-300">
            <HelpText text={sections.snapReceipt.blurry} />
          </p>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            {sections.snapReceipt.offlineTitle}
          </h3>
          <p className="text-sm leading-relaxed text-zinc-300">
            <HelpText text={sections.snapReceipt.offline} />
          </p>
        </>
      );
    case "home-screen":
      return (
        <>
          <div className="space-y-3">
            {sections.homeScreen.rows.map((row) => (
              <div
                key={row.label}
                className="rounded-xl border-2 border-zinc-700 bg-zinc-900 p-4"
              >
                <p className="text-sm font-bold text-white">
                  <HelpText text={row.label} />
                </p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                  <HelpText text={row.meaning} />
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300">
            <HelpText text={sections.homeScreen.filtersNote} />
          </p>
        </>
      );
    case "google-backup":
      return (
        <>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            {sections.googleBackup.whyTitle}
          </h3>
          <ul className="mb-6 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-300">
            {sections.googleBackup.why.map((line) => (
              <li key={line}>
                <HelpText text={line} />
              </li>
            ))}
          </ul>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            {sections.googleBackup.howTitle}
          </h3>
          <ol className="mb-6 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-zinc-300">
            {sections.googleBackup.how.map((step) => (
              <li key={step}>
                <HelpText text={step} />
              </li>
            ))}
          </ol>
          <p className="mb-6 text-sm leading-relaxed text-zinc-300">
            <HelpText text={sections.googleBackup.staySame} />
          </p>
          <div className="mb-6 rounded-xl border-l-4 border-yellow-500 bg-yellow-950/40 p-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-yellow-400">
              {sections.googleBackup.warningTitle}
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-300">
              {sections.googleBackup.warnings.map((line) => (
                <li key={line}>
                  <HelpText text={line} />
                </li>
              ))}
            </ul>
          </div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            {sections.googleBackup.multiDeviceTitle}
          </h3>
          <p className="text-sm leading-relaxed text-zinc-300">
            <HelpText text={sections.googleBackup.multiDevice} />
          </p>
        </>
      );
    case "tax-export":
      return (
        <>
          <p className="mb-6 text-sm leading-relaxed text-zinc-300">
            <HelpText text={sections.taxExport.when} />
          </p>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            {sections.taxExport.whatTitle}
          </h3>
          <ul className="mb-6 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-300">
            {sections.taxExport.what.map((line) => (
              <li key={line}>
                <HelpText text={line} />
              </li>
            ))}
          </ul>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            {sections.taxExport.stepsTitle}
          </h3>
          <ol className="mb-6 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-zinc-300">
            {sections.taxExport.steps.map((step) => (
              <li key={step}>
                <HelpText text={step} />
              </li>
            ))}
          </ol>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            {sections.taxExport.afterPayTitle}
          </h3>
          <ul className="mb-6 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-300">
            {sections.taxExport.afterPay.map((line) => (
              <li key={line}>
                <HelpText text={line} />
              </li>
            ))}
          </ul>
          <p className="rounded-xl border-l-4 border-yellow-500 bg-yellow-950/40 p-4 text-sm leading-relaxed text-zinc-300">
            <HelpText text={sections.taxExport.beforePay} />
          </p>
        </>
      );
    case "faq":
      return (
        <div className="space-y-4">
          {sections.faq.items.map((item) => (
            <div
              key={item.q}
              className="rounded-xl border-2 border-zinc-700 bg-zinc-900 p-4"
            >
              <p className="text-sm font-bold text-white">{item.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                <HelpText text={item.a} />
              </p>
            </div>
          ))}
        </div>
      );
    case "privacy":
      return (
        <>
          {sections.privacy.paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className="mb-3 text-sm leading-relaxed text-zinc-300"
            >
              <HelpText text={paragraph} />
            </p>
          ))}
          <p className="mt-4 text-sm text-zinc-400">
            <a href="/privacy" className="font-bold text-yellow-400">
              {sections.privacy.privacyLink}
            </a>
            {" · "}
            <a href="/terms" className="font-bold text-yellow-400">
              {sections.privacy.termsLink}
            </a>
          </p>
        </>
      );
    default:
      return null;
  }
}

export function HelpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { copy } = useI18n();
  const help = copy.help;
  const sections = help.sections;

  const sectionParam = searchParams.get("section");
  const activeSection = isSectionId(sectionParam) ? sectionParam : null;

  const tocItems = useMemo(
    () => [
      { id: SECTION_IDS[0], label: help.toc.quickStart, title: sections.quickStart.title },
      { id: SECTION_IDS[1], label: help.toc.snapReceipt, title: sections.snapReceipt.title },
      { id: SECTION_IDS[2], label: help.toc.homeScreen, title: sections.homeScreen.title },
      { id: SECTION_IDS[3], label: help.toc.googleBackup, title: sections.googleBackup.title },
      { id: SECTION_IDS[4], label: help.toc.taxExport, title: sections.taxExport.title },
      { id: SECTION_IDS[5], label: help.toc.faq, title: sections.faq.title },
      { id: SECTION_IDS[6], label: help.toc.privacy, title: sections.privacy.title },
    ],
    [help.toc, sections],
  );

  const activeTitle =
    tocItems.find((item) => item.id === activeSection)?.title ?? help.pageTitle;

  const openSection = useCallback(
    (id: SectionId) => {
      router.replace(`/help?section=${id}`, { scroll: true });
    },
    [router],
  );

  const closeSection = useCallback(() => {
    router.replace("/help", { scroll: true });
  }, [router]);

  const goHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleHeaderBack = () => {
    if (activeSection) {
      closeSection();
      return;
    }
    goHome();
  };

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="sticky top-0 z-50 flex shrink-0 items-center border-b-4 border-yellow-500 bg-zinc-900 p-4">
        <button
          type="button"
          onClick={handleHeaderBack}
          className="flex min-h-16 min-w-16 items-center justify-center rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 text-sm font-black uppercase tracking-wider transition-transform active:scale-95"
        >
          {activeSection ? help.backToTopics : help.backToApp}
        </button>
        <h1 className="ml-4 line-clamp-2 text-base font-black uppercase tracking-wider">
          {activeSection ? activeTitle : help.pageTitle}
        </h1>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 p-6 pb-16">
        {!activeSection ? (
          <>
            <p className="mb-6 text-sm leading-relaxed text-zinc-400">
              {help.tocTitle}
            </p>
            <ul className="space-y-3">
              {tocItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openSection(item.id)}
                    className="flex min-h-16 w-full items-center justify-between rounded-xl border-2 border-zinc-700 bg-zinc-900 px-4 text-left text-sm font-bold text-white transition-transform active:scale-95"
                  >
                    <span>{item.label}</span>
                    <span className="text-yellow-400" aria-hidden>
                      ›
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-10 text-center text-sm text-zinc-500">{help.contact}</p>
          </>
        ) : (
          <>
            <HelpSectionBody sectionId={activeSection} sections={sections} />
            <button
              type="button"
              onClick={closeSection}
              className="mt-10 flex min-h-16 w-full items-center justify-center rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 text-sm font-black uppercase tracking-wider text-white transition-transform active:scale-95"
            >
              {help.allTopics}
            </button>
          </>
        )}
      </main>
    </div>
  );
}
