import Link from "next/link";
import type { LegalDoc } from "@/lib/legal/content";
import { getLegalSections, getLegalTitle } from "@/lib/legal/content";

export function LegalPageContent({ doc }: { doc: LegalDoc }) {
  const sections = getLegalSections(doc);
  const title = getLegalTitle(doc);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b-4 border-yellow-500 bg-zinc-900 p-6">
        <Link
          href="/"
          className="mb-4 inline-flex min-h-12 items-center text-sm font-black uppercase tracking-wider text-yellow-400"
        >
          &lt; Back to Snap1099
        </Link>
        <h1 className="text-2xl font-black uppercase tracking-wider">{title}</h1>
        <p className="mt-2 text-xs text-zinc-400">
          Last Updated: June 2026 · GDPR & CPRA
        </p>
      </header>
      <main className="mx-auto max-w-2xl p-6 pb-16">
        {sections.map((section) => (
          <section key={section.title} className="mb-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-yellow-400">
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
        <p className="text-sm text-zinc-400">
          Full text:{" "}
          <code className="text-yellow-400">
            docs/legal/{doc === "privacy" ? "privacy" : "terms"}.md
          </code>
        </p>
      </main>
    </div>
  );
}
