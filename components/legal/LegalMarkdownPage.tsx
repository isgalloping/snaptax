"use client";

import type { ParsedLegalMarkdown } from "@/lib/legal/markdownDoc";
import { omitLegalHubSections } from "@/lib/legal/omitLegalHubSections";
import { LegalMarkdownSections } from "@/components/legal/LegalMarkdownSections";
import { LegalFullPageShell } from "@/components/legal/LegalFullPageShell";

export function LegalMarkdownPage({
  doc,
  hideHubSections = false,
  onClose,
}: {
  doc: ParsedLegalMarkdown;
  hideHubSections?: boolean;
  onClose?: () => void;
}) {
  const sections = hideHubSections
    ? omitLegalHubSections(doc.sections)
    : doc.sections;

  return (
    <LegalFullPageShell
      title={doc.title}
      subtitle={doc.subtitle}
      onClose={onClose}
    >
      <LegalMarkdownSections sections={sections} headingLevel="h2" />
    </LegalFullPageShell>
  );
}
