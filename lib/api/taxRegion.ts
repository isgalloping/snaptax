import type { TaxRegion } from "@/lib/tax/types";

const EU_LANGS = new Set([
  "de", "fr", "it", "es", "nl", "pl", "pt", "sv", "da", "fi", "el", "cs",
  "ro", "hu", "sk", "bg", "hr", "sl", "et", "lv", "lt", "mt", "ga",
]);

export type InitialDataRegionResolution = {
  region: TaxRegion;
  adjusted: boolean;
  reason?: string;
};

export function parseTaxRegionHeader(request: Request): TaxRegion {
  const v = request.headers.get("x-tax-region")?.toLowerCase();
  return v === "eu" ? "eu" : "us";
}

function parseAcceptLanguageTags(acceptLanguage: string | null): string[] {
  if (!acceptLanguage) return [];
  return acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean);
}

export function acceptLanguageSuggestsEu(
  acceptLanguage: string | null,
): boolean {
  for (const tag of parseAcceptLanguageTags(acceptLanguage)) {
    const base = tag.split("-")[0];
    if (base && EU_LANGS.has(base)) return true;
  }
  return false;
}

export function resolveInitialDataRegion(params: {
  headerRegion: TaxRegion;
  acceptLanguage: string | null;
}): InitialDataRegionResolution {
  if (params.headerRegion === "eu" && !acceptLanguageSuggestsEu(params.acceptLanguage)) {
    return {
      region: "us",
      adjusted: true,
      reason: "header_language_mismatch",
    };
  }

  return {
    region: params.headerRegion,
    adjusted: false,
  };
}
