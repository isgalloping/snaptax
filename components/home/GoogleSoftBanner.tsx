"use client";

interface GoogleSoftBannerProps {
  onSignIn: () => void;
}

export function GoogleSoftBanner({ onSignIn }: GoogleSoftBannerProps) {
  return (
    <button
      type="button"
      onClick={onSignIn}
      className="mx-6 mb-2 rounded-xl border-2 border-yellow-500 bg-yellow-950 px-4 py-3 text-left text-sm font-bold text-yellow-400 transition-transform active:scale-[0.98]"
    >
      Afraid of losing data? Save with Google (sign in before switching phones) →
    </button>
  );
}
