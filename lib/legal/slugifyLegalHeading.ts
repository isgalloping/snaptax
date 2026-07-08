/** Stable kebab-case id for legal page section headings (deep links). */
export function slugifyLegalHeading(title: string): string {
  const withoutNumber = title.replace(/^\d+\.\s*/, "");
  return withoutNumber
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
