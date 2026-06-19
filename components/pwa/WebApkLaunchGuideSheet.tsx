"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";

export type WebApkGuideVariant = "pre-install" | "post-install";

interface WebApkLaunchGuideSheetProps {
  open: boolean;
  variant: WebApkGuideVariant;
  onContinue: () => void;
  onDismiss: () => void;
}

export function WebApkLaunchGuideSheet({
  open,
  variant,
  onContinue,
  onDismiss,
}: WebApkLaunchGuideSheetProps) {
  const guide = useUserCopy().pwa.webApkGuide;

  if (!open) return null;

  const isPre = variant === "pre-install";
  const title = isPre ? guide.preInstallTitle : guide.postInstallTitle;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="webapk-guide-title"
    >
      <button
        type="button"
        aria-label={guide.gotIt}
        className="absolute inset-0 bg-black/70"
        onClick={onDismiss}
      />
      <div
        className="relative z-10 w-full rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-4 pb-8"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <h2
          id="webapk-guide-title"
          className="text-lg font-black uppercase tracking-wider text-white"
        >
          {title}
        </h2>
        {isPre ? (
          <p className="mt-3 text-sm font-bold leading-snug text-zinc-300">
            {guide.preInstallBody}
          </p>
        ) : (
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm font-bold text-zinc-200">
            {guide.postInstallSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}
        <button
          type="button"
          onClick={isPre ? onContinue : onDismiss}
          className="mt-6 min-h-16 w-full rounded-xl bg-yellow-500 text-sm font-black uppercase tracking-wide text-black active:scale-95"
        >
          {isPre ? guide.continueInstall : guide.gotIt}
        </button>
      </div>
    </div>
  );
}
