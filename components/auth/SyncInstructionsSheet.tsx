"use client";

interface SyncInstructionsSheetProps {
  email: string;
  onClose: () => void;
}

export function SyncInstructionsSheet({
  email,
  onClose,
}: SyncInstructionsSheetProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70">
      <div className="w-full rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-6 pb-10">
        <p className="text-lg font-black uppercase tracking-wider text-white">
          View on all devices
        </p>
        <p className="mt-2 text-sm font-bold text-yellow-400">{email}</p>
        <ol className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-300">
          <li>1. Open Snap1099 on your other phone, tablet, or computer.</li>
          <li>2. Tap Settings and choose Continue with Google.</li>
          <li>3. Sign in with the same Google account — receipts sync automatically.</li>
        </ol>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full min-h-16 rounded-xl border-2 border-zinc-600 bg-zinc-800 py-4 text-sm font-black uppercase tracking-wider text-white transition-transform active:scale-95"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
