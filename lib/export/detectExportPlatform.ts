export type ExportPlatform =
  | "android-chrome"
  | "ios-safari"
  | "desktop-chrome"
  | "other";

function isIosDevice(ua: string): boolean {
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  if (typeof navigator === "undefined") return false;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function detectExportPlatform(
  ua: string = typeof navigator !== "undefined" ? navigator.userAgent : "",
): ExportPlatform {
  const isAndroid = /Android/i.test(ua);
  const isIOS = isIosDevice(ua);
  const isChromium =
    /Chrome|CriOS|Edg|OPR/i.test(ua) && !/Firefox/i.test(ua);

  if (isAndroid && isChromium) return "android-chrome";
  if (isIOS) return "ios-safari";
  if (isChromium && !isAndroid && !isIOS) return "desktop-chrome";
  return "other";
}
