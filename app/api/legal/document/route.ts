import { NextRequest, NextResponse } from "next/server";
import {
  loadLegalMarkdown,
  parseLegalMarkdown,
  type LegalMarkdownFile,
} from "@/lib/legal/markdownDoc";

const SHEET_FILES: Record<string, LegalMarkdownFile> = {
  "data-retention": "data-retention.md",
  security: "security-incident.md",
};

export async function GET(request: NextRequest) {
  const fileKey = request.nextUrl.searchParams.get("file");
  if (!fileKey || !(fileKey in SHEET_FILES)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const doc = parseLegalMarkdown(
    loadLegalMarkdown(SHEET_FILES[fileKey]!),
  );
  return NextResponse.json(doc);
}
