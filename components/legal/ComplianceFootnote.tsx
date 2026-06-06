"use client";

interface ComplianceFootnoteProps {
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export function ComplianceFootnote({
  onOpenTerms,
  onOpenPrivacy,
}: ComplianceFootnoteProps) {
  const prefix = "By snapping, you agree to our ";
  const middle = " & ";
  const suffix =
    ". Online processing stores data in the United States.";

  return (
    <p className="mt-4 max-w-sm px-2 text-center text-xs leading-relaxed text-zinc-400">
      {prefix}
      <button
        type="button"
        onClick={onOpenTerms}
        className="min-h-11 underline decoration-yellow-400 decoration-2 underline-offset-2 text-yellow-400"
      >
        Terms
      </button>
      {middle}
      <button
        type="button"
        onClick={onOpenPrivacy}
        className="min-h-11 underline decoration-yellow-400 decoration-2 underline-offset-2 text-yellow-400"
      >
        Privacy Policy
      </button>
      {suffix}
    </p>
  );
}
