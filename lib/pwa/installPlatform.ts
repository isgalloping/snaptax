export type InstallPlatform =
  | "chromium-android"
  | "chromium-desktop"
  | "ios-safari"
  | "macos-safari"
  | "none";

export type ManualInstallCopyKey =
  | "chromiumAndroid"
  | "chromiumDesktop"
  | "iosSafari"
  | "macosSafari";

export function detectInstallPlatform(userAgent: string): InstallPlatform {
  const ua = userAgent;

  if (/Android/i.test(ua)) {
    if (/EdgA/i.test(ua) || /Chrome/i.test(ua)) {
      return "chromium-android";
    }
    return "none";
  }

  if (/iPhone|iPad|iPod/i.test(ua)) {
    if (/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)) return "none";
    if (/Safari/i.test(ua)) return "ios-safari";
    return "none";
  }

  if (/Macintosh|Mac OS X/i.test(ua)) {
    if (/Chrome/i.test(ua) || /Edg\//i.test(ua)) {
      return "chromium-desktop";
    }
    if (/Safari/i.test(ua)) return "macos-safari";
    return "none";
  }

  if (/Windows/i.test(ua) && (/Edg\//i.test(ua) || /Chrome/i.test(ua))) {
    return "chromium-desktop";
  }

  return "none";
}

export function isIosSafariDevice(userAgent: string): boolean {
  return /iPhone|iPad|iPod/i.test(userAgent);
}

export function supportsNativeInstallPrompt(platform: InstallPlatform): boolean {
  return (
    platform === "chromium-android" || platform === "chromium-desktop"
  );
}

export function isInstallPlatformEligible(platform: InstallPlatform): boolean {
  return platform !== "none";
}

export function manualCopyKeyForPlatform(
  platform: InstallPlatform,
): ManualInstallCopyKey | null {
  switch (platform) {
    case "chromium-android":
      return "chromiumAndroid";
    case "chromium-desktop":
      return "chromiumDesktop";
    case "ios-safari":
      return "iosSafari";
    case "macos-safari":
      return "macosSafari";
    default:
      return null;
  }
}

export function getInstallPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "none";
  return detectInstallPlatform(navigator.userAgent);
}
