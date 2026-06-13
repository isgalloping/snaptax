"use client";

import { useServerInsertedHTML } from "next/navigation";
import { INLINE_INSTALL_CAPTURE_SCRIPT } from "@/lib/pwa/installCaptureScript";

/** Injects PWA install capture via SSR stream — avoids React 19 script-in-tree warnings. */
export function InstallCaptureScript() {
  useServerInsertedHTML(() => (
    <script
      id="snap1099-install-capture"
      dangerouslySetInnerHTML={{ __html: INLINE_INSTALL_CAPTURE_SCRIPT }}
    />
  ));

  return null;
}
