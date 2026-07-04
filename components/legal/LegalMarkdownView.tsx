import Link from "next/link";
import type { ParsedLegalMarkdown } from "@/lib/legal/markdownDoc";
import { slugifyLegalHeading } from "@/lib/legal/slugifyLegalHeading";

export function LegalMarkdownView({
  doc,
  backHref = "/",
}: {
  doc: ParsedLegalMarkdown;
  backHref?: string;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b-4 border-yellow-500 bg-zinc-900 p-6">
        <Link
          href={backHref}
          className="mb-4 inline-flex min-h-12 items-center text-sm font-black uppercase tracking-wider text-yellow-400"
        >
          &lt; Back to Snap1099
        </Link>
        <h1 className="text-2xl font-black uppercase tracking-wider">{doc.title}</h1>
        {doc.subtitle && (
          <p className="mt-2 text-xs text-zinc-400">{doc.subtitle}</p>
        )}
      </header>
      <main className="mx-auto max-w-2xl p-6 pb-16">
        {doc.sections.map((section) => (
          <section key={section.title} className="mb-8">
            <h2
              id={slugifyLegalHeading(section.title)}
              className="mb-3 text-sm font-bold uppercase tracking-wider text-yellow-400"
            >
              {section.title}
            </h2>
            {section.body.map((paragraph) => (
              <p
                key={paragraph.slice(0, 48)}
                className="mb-3 text-sm leading-relaxed text-zinc-300"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
