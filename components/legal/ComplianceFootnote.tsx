"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";

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
  const copy = useUserCopy().legal.compliance;

  return (
    <p
      className={`max-w-sm px-2 text-center text-xs leading-relaxed text-zinc-400 ${className || "mt-4"}`}
    >
      {copy.prefix}
      <button
        type="button"
        onClick={onOpenTerms}
        className="min-h-11 underline decoration-yellow-400 decoration-2 underline-offset-2 text-yellow-400"
      >
        {copy.terms}
      </button>
      {copy.middle}
      <button
        type="button"
        onClick={onOpenPrivacy}
        className="min-h-11 underline decoration-yellow-400 decoration-2 underline-offset-2 text-yellow-400"
      >
        {copy.privacy}
      </button>
      {copy.suffix}
    </p>
  );
}
