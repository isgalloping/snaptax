import { readFileSync } from "node:fs";
import { join } from "node:path";

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

export function loadLegalMarkdown(file: LegalMarkdownFile): string {
  return readFileSync(join(process.cwd(), "docs/legal", file), "utf8");
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
