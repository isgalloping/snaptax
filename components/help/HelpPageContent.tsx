"use client";

import Link from "next/link";
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

export function HelpPageContent() {
  const { copy } = useI18n();
  const help = copy.help;
  const sections = help.sections;

  const tocItems = [
    { id: SECTION_IDS[0], label: help.toc.quickStart },
    { id: SECTION_IDS[1], label: help.toc.snapReceipt },
    { id: SECTION_IDS[2], label: help.toc.homeScreen },
    { id: SECTION_IDS[3], label: help.toc.googleBackup },
    { id: SECTION_IDS[4], label: help.toc.taxExport },
    { id: SECTION_IDS[5], label: help.toc.faq },
    { id: SECTION_IDS[6], label: help.toc.privacy },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b-4 border-yellow-500 bg-zinc-900 p-6">
        <Link
          href="/"
          className="mb-4 inline-flex min-h-12 items-center text-sm font-black uppercase tracking-wider text-yellow-400 transition-transform active:scale-95"
        >
          {help.backToApp}
        </Link>
        <h1 className="text-2xl font-black uppercase tracking-wider">
          {help.pageTitle}
        </h1>
      </header>

      <main className="mx-auto max-w-2xl p-6 pb-16">
        <nav aria-label={help.tocTitle} className="mb-10">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
            {help.tocTitle}
          </h2>
          <ul className="space-y-2">
            {tocItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="flex min-h-14 items-center rounded-xl border-2 border-zinc-700 bg-zinc-900 px-4 text-sm font-bold text-white transition-transform active:scale-95"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <section id={SECTION_IDS[0]} className="mb-10 scroll-mt-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-yellow-400">
            {sections.quickStart.title}
          </h2>
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
        </section>

        <section id={SECTION_IDS[1]} className="mb-10 scroll-mt-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-yellow-400">
            {sections.snapReceipt.title}
          </h2>
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
        </section>

        <section id={SECTION_IDS[2]} className="mb-10 scroll-mt-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-yellow-400">
            {sections.homeScreen.title}
          </h2>
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
        </section>

        <section id={SECTION_IDS[3]} className="mb-10 scroll-mt-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-yellow-400">
            {sections.googleBackup.title}
          </h2>
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
        </section>

        <section id={SECTION_IDS[4]} className="mb-10 scroll-mt-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-yellow-400">
            {sections.taxExport.title}
          </h2>
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
        </section>

        <section id={SECTION_IDS[5]} className="mb-10 scroll-mt-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-yellow-400">
            {sections.faq.title}
          </h2>
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
        </section>

        <section id={SECTION_IDS[6]} className="scroll-mt-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-yellow-400">
            {sections.privacy.title}
          </h2>
          {sections.privacy.paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className="mb-3 text-sm leading-relaxed text-zinc-300"
            >
              <HelpText text={paragraph} />
            </p>
          ))}
          <p className="mt-4 text-sm text-zinc-400">
            <Link href="/privacy" className="font-bold text-yellow-400">
              {sections.privacy.privacyLink}
            </Link>
            {" · "}
            <Link href="/terms" className="font-bold text-yellow-400">
              {sections.privacy.termsLink}
            </Link>
          </p>
        </section>

        <p className="mt-10 text-center text-sm text-zinc-500">{help.contact}</p>
      </main>
    </div>
  );
}
