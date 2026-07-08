import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Locales with optional localized markdown siblings (`*.fr.md`, `*.de.md`). */
export type LegalMarkdownLocale = "en-US" | "fr-FR" | "de-DE";

export type LegalMarkdownFile =
  | "data-retention.md"
  | "security-incident.md"
  | "pricing.md"
  | "refund.md"
  | "cookies.md"
  | "disclaimer.md";

export type LegalMarkdownSection = {
  title: string;
  body: string[];
};

export type ParsedLegalMarkdown = {
  title: string;
  subtitle: string | null;
  sections: LegalMarkdownSection[];
};

function localizedLegalMarkdownFilename(
  file: LegalMarkdownFile,
  locale: LegalMarkdownLocale,
): string {
  if (locale === "en-US") return file;
  const suffix = locale === "fr-FR" ? ".fr" : ".de";
  return file.replace(/\.md$/, `${suffix}.md`);
}

/** Load markdown; falls back to English base file when locale variant is missing. */
export function loadLegalMarkdown(
  file: LegalMarkdownFile,
  locale: LegalMarkdownLocale = "en-US",
): string {
  const dir = join(process.cwd(), "docs/legal");
  if (locale !== "en-US") {
    const localized = localizedLegalMarkdownFilename(file, locale);
    const localizedPath = join(dir, localized);
    if (existsSync(localizedPath)) {
      return readFileSync(localizedPath, "utf8");
    }
  }
  return readFileSync(join(dir, file), "utf8");
}

export function hasLocalizedLegalMarkdown(
  file: LegalMarkdownFile,
  locale: LegalMarkdownLocale,
): boolean {
  if (locale === "en-US") return true;
  const localized = localizedLegalMarkdownFilename(file, locale);
  return existsSync(join(process.cwd(), "docs/legal", localized));
}

/** Minimal markdown: # title, ## sections, paragraphs and `-` bullets. */
export function parseLegalMarkdown(markdown: string): ParsedLegalMarkdown {
  const lines = markdown.split("\n");
  let title = "Legal";
  let subtitle: string | null = null;
  const sections: LegalMarkdownSection[] = [];
  let current: LegalMarkdownSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      title = trimmed.slice(2).trim();
      continue;
    }
    if (trimmed.startsWith("**Last Updated:")) {
      subtitle = trimmed.replace(/\*\*/g, "");
      continue;
    }
    if (trimmed.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: trimmed.slice(3).trim(), body: [] };
      continue;
    }
    if (!trimmed || trimmed.startsWith("---")) continue;
    if (!current) {
      if (!subtitle && !trimmed.startsWith("#")) {
        subtitle = trimmed;
      }
      continue;
    }
    if (trimmed.startsWith("|") || trimmed.startsWith("Related:")) continue;
    const text = trimmed.startsWith("- ")
      ? trimmed.slice(2)
      : trimmed.replace(/\*\*/g, "");
    current.body.push(text);
  }
  if (current) sections.push(current);

  return { title, subtitle, sections };
}
