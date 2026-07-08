import { NextRequest, NextResponse } from "next/server";
import {
  hasLocalizedLegalMarkdown,
  loadLegalMarkdown,
  parseLegalMarkdown,
  type LegalMarkdownFile,
  type LegalMarkdownLocale,
} from "@/lib/legal/markdownDoc";

const SHEET_FILES: Record<string, LegalMarkdownFile> = {
  "data-retention": "data-retention.md",
  security: "security-incident.md",
  refund: "refund.md",
};

function parseLocale(value: string | null): LegalMarkdownLocale {
  if (value === "fr-FR" || value === "de-DE") return value;
  return "en-US";
}

export async function GET(request: NextRequest) {
  const fileKey = request.nextUrl.searchParams.get("file");
  if (!fileKey || !(fileKey in SHEET_FILES)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));
  const file = SHEET_FILES[fileKey]!;
  const doc = parseLegalMarkdown(loadLegalMarkdown(file, locale));
  const localized =
    locale === "en-US" || hasLocalizedLegalMarkdown(file, locale);

  return NextResponse.json({ ...doc, localized });
}
