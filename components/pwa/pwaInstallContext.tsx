import { createContext, useContext } from "react";
import type { InstallUiMode } from "@/lib/pwa/deferredInstall";

export type PwaInstallContextValue = {
  mode: InstallUiMode;
  canPrompt: boolean;
  manualSheetOpen: boolean;
  install: () => Promise<void>;
  dismissBar: () => void;
  closeManualSheet: () => void;
};

export const PwaInstallContext = createContext<PwaInstallContextValue | null>(
  null,
);

export function usePwaInstall(): PwaInstallContextValue {
  const value = useContext(PwaInstallContext);
  if (!value) {
    throw new Error("usePwaInstall must be used within PwaInstallProvider");
  }
  return value;
}

export function usePwaInstallOptional(): PwaInstallContextValue | null {
  return useContext(PwaInstallContext);
}
