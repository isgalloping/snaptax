export type AppSharePayload = {
  url: string;
  message: string;
  title: string;
  combinedText: string;
};

export function getAppShareUrl(origin?: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (origin) return origin.replace(/\/$/, "");
  return "https://app.snap1099.com";
}

export function buildAppSharePayload(input: {
  message: string;
  title: string;
  url?: string;
}): AppSharePayload {
  const url = input.url ?? getAppShareUrl();
  return {
    url,
    message: input.message,
    title: input.title,
    combinedText: `${input.message} ${url}`,
  };
}

export function buildWhatsAppShareUrl(combinedText: string): string {
  return `https://wa.me/?text=${encodeURIComponent(combinedText)}`;
}

export function buildFacebookShareUrl(url: string, message: string): string {
  const params = new URLSearchParams({ u: url, quote: message });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

export function isShareAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export async function copyShareLink(url: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

export type NativeShareResult = "shared" | "copied" | "failed";

export async function shareAppViaNative(
  payload: AppSharePayload,
): Promise<NativeShareResult> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.message,
        url: payload.url,
      });
      return "shared";
    } catch (err) {
      if (isShareAbortError(err)) return "shared";
    }
  }
  return (await copyShareLink(payload.url)) ? "copied" : "failed";
}

export function openExternalShare(url: string): void {
  if (typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
}
