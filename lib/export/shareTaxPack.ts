"use client";

export type ShareTaxPackResult = "shared" | "cancelled" | "unsupported" | "failed";

export function downloadTaxPackFile(file: File): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}

export function canShareTaxPackFile(file: File): boolean {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  if (typeof navigator.canShare !== "function") {
    return file.type.startsWith("text/") || file.type === "application/pdf";
  }
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export async function shareTaxPackFile(
  file: File,
  title: string,
  text: string,
): Promise<ShareTaxPackResult> {
  if (!canShareTaxPackFile(file)) {
    return "unsupported";
  }
  try {
    await navigator.share({ files: [file], title, text });
    return "shared";
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return "cancelled";
    }
    return "failed";
  }
}
