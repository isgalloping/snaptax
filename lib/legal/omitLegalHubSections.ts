import type { LegalMarkdownSection } from "@/lib/legal/markdownDoc";

export function isLegalHubSection(title: string): boolean {
  const normalized = title.trim().toLowerCase();
  return normalized === "related policies" || normalized === "related";
}

/** Strip cross-link footer sections for in-app Privacy Center views. */
export function omitLegalHubSections(
  sections: LegalMarkdownSection[],
): LegalMarkdownSection[] {
  return sections.filter((section) => !isLegalHubSection(section.title));
}
