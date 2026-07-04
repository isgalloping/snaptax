"use client";

import { useRouter } from "next/navigation";
import type { ParsedLegalMarkdown } from "@/lib/legal/markdownDoc";
import { LegalMarkdownSections } from "@/components/legal/LegalMarkdownSections";

export function LegalMarkdownPage({
  doc,
}: {
  doc: ParsedLegalMarkdown;
}) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b-4 border-yellow-500 bg-zinc-900 p-6">
        <button
          type="button"
          onClick={handleBack}
          className="mb-4 inline-flex min-h-12 items-center text-sm font-black uppercase tracking-wider text-yellow-400"
        >
          &lt; Back to Snap1099
        </button>
        <h1 className="text-2xl font-black uppercase tracking-wider">{doc.title}</h1>
        {doc.subtitle && (
          <p className="mt-2 text-xs text-zinc-400">{doc.subtitle}</p>
        )}
      </header>
      <main className="mx-auto max-w-2xl p-6 pb-16">
        <LegalMarkdownSections sections={doc.sections} headingLevel="h2" />
      </main>
    </div>
  );
}
