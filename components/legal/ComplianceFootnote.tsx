"use client";

import { useTranslations } from "next-intl";

interface ComplianceFootnoteProps {
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  className?: string;
}

export function ComplianceFootnote({
  onOpenTerms,
  onOpenPrivacy,
  className = "",
}: ComplianceFootnoteProps) {
  const t = useTranslations("Legal");

  return (
    <p
      className={`max-w-sm px-2 text-center text-xs leading-relaxed text-zinc-400 ${className || "mt-4"}`}
    >
      {"By snapping, you agree to our "}
      <button
        type="button"
        onClick={onOpenTerms}
        className="min-h-11 underline decoration-yellow-400 decoration-2 underline-offset-2 text-yellow-400"
      >
        {t("terms")}
      </button>
      {" & "}
      <button
        type="button"
        onClick={onOpenPrivacy}
        className="min-h-11 underline decoration-yellow-400 decoration-2 underline-offset-2 text-yellow-400"
      >
        {t("privacyPolicyLink")}
      </button>
      {". Online processing stores data in the United States."}
    </p>
  );
}
