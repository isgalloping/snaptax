"use client";

export type ShareTaxPackResult = "shared" | "cancelled" | "unsupported" | "failed";

/** Runtime Web Share API probe (DOM typings always include navigator.share). */
export function isWebShareAvailable(): boolean {
  if (typeof navigator === "undefined") return false;
  return "share" in navigator && typeof navigator.share === "function";
}

export function downloadTaxPackFile(file: File): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function canShareTaxPackFile(file: File): boolean {
  if (!isWebShareAvailable()) return false;
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
  if (!isWebShareAvailable()) {
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
