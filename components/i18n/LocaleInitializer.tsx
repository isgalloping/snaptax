"use client";

import { useEffect } from "react";
import { ensureLocaleCookie } from "@/lib/client/locale";

export function LocaleInitializer() {
  useEffect(() => {
    ensureLocaleCookie();
  }, []);
  return null;
}
