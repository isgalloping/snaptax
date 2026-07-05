import Link from "next/link";
import type { LegalMarkdownSection } from "@/lib/legal/markdownDoc";
import { parseLegalInlineMarkdown } from "@/lib/legal/inlineMarkdownLinks";
import { slugifyLegalHeading } from "@/lib/legal/slugifyLegalHeading";

export function LegalMarkdownInline({ text }: { text: string }) {
  return (
    <>
      {parseLegalInlineMarkdown(text).map((part, index) =>
        part.kind === "link" ? (
          <Link
            key={`${part.href}-${index}`}
            href={part.href}
            className="font-bold text-yellow-400 underline"
          >
            {part.label}
          </Link>
        ) : (
          <span key={index}>{part.value}</span>
        ),
      )}
    </>
  );
}

export function LegalMarkdownSections({
  sections,
  headingLevel = "h2",
}: {
  sections: LegalMarkdownSection[];
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;

  return (
    <>
      {sections.map((section) => (
        <section key={section.title} className={headingLevel === "h2" ? "mb-8" : "mb-6"}>
          <Heading
            id={headingLevel === "h2" ? slugifyLegalHeading(section.title) : undefined}
            className={
              headingLevel === "h2"
                ? "mb-3 text-sm font-bold uppercase tracking-wider text-yellow-400"
                : "mb-2 text-sm font-bold uppercase tracking-wider text-yellow-400"
            }
          >
            {section.title}
          </Heading>
          {section.body.map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className="mb-3 text-sm leading-relaxed text-zinc-300"
            >
              <LegalMarkdownInline text={paragraph} />
            </p>
          ))}
        </section>
      ))}
    </>
  );
}
