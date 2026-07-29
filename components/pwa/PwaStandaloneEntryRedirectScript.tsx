"use client";

import { useServerInsertedHTML } from "next/navigation";
import { INLINE_STANDALONE_ENTRY_REDIRECT_SCRIPT } from "@/lib/pwa/standaloneEntryRedirectScript";

/** Early standalone redirect before paint — pairs with PwaStandaloneEntryRedirect. */
export function PwaStandaloneEntryRedirectScript() {
  useServerInsertedHTML(() => (
    <script
      id="snaptax-standalone-entry-redirect"
      dangerouslySetInnerHTML={{ __html: INLINE_STANDALONE_ENTRY_REDIRECT_SCRIPT }}
    />
  ));

  return null;
}
