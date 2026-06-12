"use client";

export function downloadTaxPackFile(file: File): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}

export async function shareTaxPackFile(
  file: File,
  title: string,
  text: string,
): Promise<void> {
  if (navigator.share) {
    try {
      await navigator.share({ files: [file], title, text });
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
  }
  downloadTaxPackFile(file);
}
