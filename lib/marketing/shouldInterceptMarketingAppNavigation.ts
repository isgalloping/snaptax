import type { InstallPlatform } from "@/lib/pwa/installPlatform";
import { isAndroidChromeWebApkBrowser } from "@/lib/pwa/installPlatform";

/**
 * Platforms that cannot auto-launch an installed PWA from a browser tab.
 * Show the "open from home screen / dock" hint instead of navigating.
 *
 * Android Chrome keeps native `<a href>` navigation so WebAPK intent filters
 * can launch the installed app. Desktop Chromium likewise uses link capture.
 */
export function shouldInterceptMarketingAppNavigation(
  platform: InstallPlatform,
  pwaInstalledLocally: boolean,
  userAgent = "",
): boolean {
  if (!pwaInstalledLocally) return false;

  if (platform === "ios-safari" || platform === "macos-safari") {
    return true;
  }

  if (!/Android/i.test(userAgent)) return false;

  if (platform === "none") {
    return true;
  }

  if (platform === "chromium-android") {
    return !isAndroidChromeWebApkBrowser(userAgent);
  }

  return false;
}
