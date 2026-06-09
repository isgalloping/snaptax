"use client";

interface ReceiptDeleteConfirmSheetProps {
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ReceiptDeleteConfirmSheet({
  open,
  busy = false,
  onCancel,
  onConfirm,
}: ReceiptDeleteConfirmSheetProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end bg-black/70"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 px-6 pb-10 pt-6"
        role="dialog"
        aria-labelledby="delete-receipt-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="delete-receipt-title"
          className="text-lg font-black text-white"
        >
          Delete this receipt?
        </h2>
        <p className="mt-2 text-sm font-bold text-zinc-400">
          This removes it from your deductions.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-14 flex-1 rounded-xl border-2 border-zinc-600 bg-zinc-800 text-sm font-black uppercase tracking-wider text-white active:scale-95 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="min-h-14 flex-1 rounded-xl border-2 border-red-700 bg-red-950 text-sm font-black uppercase tracking-wider text-red-400 active:scale-95 disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
