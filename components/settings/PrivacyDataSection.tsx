"use client";

import { useState } from "react";
import type { LegalDoc } from "@/lib/legal/content";
import { LEGAL_CONTACT_EMAIL, formatDataStorageLabel } from "@/lib/legal/content";
import { LegalSheet } from "@/components/legal/LegalSheet";
import { clearLocalAppData } from "@/lib/storage/clearLocalData";

interface PrivacyDataSectionProps {
  onLocalDataCleared?: () => void;
}

function SettingsRow({
  label,
  onClick,
  href,
  destructive,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  destructive?: boolean;
}) {
  const className = `w-full min-h-16 rounded-xl border-2 p-4 text-left text-sm font-bold transition-transform active:scale-95 ${
    destructive
      ? "border-red-700 bg-red-950 text-red-400"
      : "border-zinc-600 bg-zinc-800 text-white"
  }`;

  if (href) {
    return (
      <a href={href} className={`block ${className}`}>
        {label}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}

export function PrivacyDataSection({
  onLocalDataCleared,
}: PrivacyDataSectionProps) {
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const storageLabel = formatDataStorageLabel();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // TODO: DELETE /api/users/me when signed in
      await clearLocalAppData();
      setShowDeleteConfirm(false);
      onLocalDataCleared?.();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <section className="mb-8">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
          Privacy & Data
        </h2>
        <div className="space-y-3">
          <SettingsRow
            label="Privacy Policy"
            onClick={() => setLegalDoc("privacy")}
          />
          <SettingsRow
            label="Terms of Service"
            onClick={() => setLegalDoc("terms")}
          />
          <div className="rounded-xl border-2 border-zinc-600 bg-zinc-800 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Data storage
            </p>
            <p className="mt-2 text-sm font-bold text-yellow-400">
              {storageLabel}
            </p>
          </div>
          <SettingsRow
            label={`Contact: ${LEGAL_CONTACT_EMAIL}`}
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
          />
          <SettingsRow
            label="Delete Account"
            destructive
            onClick={() => setShowDeleteConfirm(true)}
          />
        </div>
      </section>

      <LegalSheet doc={legalDoc} onClose={() => setLegalDoc(null)} />

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70">
          <div className="w-full rounded-t-3xl border-t-4 border-red-600 bg-zinc-900 p-6 pb-10">
            <p className="text-lg font-black uppercase tracking-wider text-white">
              Delete Account
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-300">
              Clears receipts on this device and requests deletion of Ghost-linked
              cloud data where applicable. Cannot be undone.
            </p>
            <button
              type="button"
              disabled={deleting}
              onClick={() => void handleDelete()}
              className="mt-6 w-full min-h-16 rounded-xl border-2 border-red-600 bg-red-950 py-4 text-lg font-black uppercase tracking-wider text-red-400 transition-transform active:scale-95 disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete permanently"}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="mt-3 w-full min-h-16 py-3 text-sm font-bold text-zinc-400 transition-transform active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
