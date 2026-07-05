"use client";

import { useEffect, useState } from "react";
import type { LegalDoc } from "@/lib/legal/content";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal/content";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import {
  LegalInAppFullPageOverlay,
  type InAppLegalFullPage,
} from "@/components/legal/LegalInAppFullPageOverlay";
import { LegalSheet } from "@/components/legal/LegalSheet";
import {
  deleteAccountAndLocalData,
  isDeleteAccountOfflineError,
  isDeleteAccountSessionExpiredError,
} from "@/lib/client/deleteAccountFlow";
import { useDialogEscape } from "@/lib/ui/useDialogEscape";

interface PrivacyDataSectionProps {
  isSignedIn?: boolean;
  onAccountDeleted?: () => void;
  /** @deprecated use onAccountDeleted */
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
  isSignedIn = false,
  onAccountDeleted,
  onLocalDataCleared,
}: PrivacyDataSectionProps) {
  const copy = useUserCopy().settings.privacyData;
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);
  const [fullPageLegal, setFullPageLegal] = useState<InAppLegalFullPage | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator !== "undefined" && navigator.onLine,
  );

  useEffect(() => {
    const syncOnline = () =>
      setIsOnline(typeof navigator !== "undefined" && navigator.onLine);
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
    };
  }, []);

  useDialogEscape(showDeleteConfirm, () => {
    if (!deleting) {
      setShowDeleteConfirm(false);
      setError(null);
    }
  });

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteAccountAndLocalData();
      setShowDeleteConfirm(false);
      (onAccountDeleted ?? onLocalDataCleared)?.();
    } catch (err) {
      if (isDeleteAccountOfflineError(err)) {
        setError(copy.deleteRequiresOnline);
      } else if (isDeleteAccountSessionExpiredError(err)) {
        setError(copy.deleteSessionExpired);
      } else {
        setError(copy.deleteFailed);
      }
    } finally {
      setDeleting(false);
    }
  };

  const offline = !isOnline;

  return (
    <>
      <section className="mb-8">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
          {copy.title}
        </h2>
        <div className="space-y-3">
          <SettingsRow
            label={copy.privacy}
            onClick={() => setLegalDoc("privacy")}
          />
          <SettingsRow
            label={copy.terms}
            onClick={() => setLegalDoc("terms")}
          />
          <SettingsRow
            label={copy.pricing}
            onClick={() => setFullPageLegal("pricing")}
          />
          <SettingsRow
            label={copy.refundPolicy}
            onClick={() => setFullPageLegal("refund")}
          />
          <SettingsRow
            label={copy.dataRetention}
            onClick={() => setLegalDoc("data-retention")}
          />
          <SettingsRow
            label={copy.security}
            onClick={() => setLegalDoc("security")}
          />
          <button
            type="button"
            onClick={() => setLegalDoc("privacy")}
            aria-label={copy.dataStorageOpenPrivacy}
            className="w-full rounded-xl border-2 border-zinc-600 bg-zinc-800 p-4 text-left transition-transform active:scale-95"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {copy.dataStorage}
            </p>
            <p className="mt-2 text-sm font-bold text-yellow-400">
              {copy.dataStorageValue}
            </p>
          </button>
          <SettingsRow
            label={`${copy.contactPrefix}: ${LEGAL_CONTACT_EMAIL}`}
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
          />
          <p className="px-1 text-xs leading-relaxed text-zinc-500">
            {copy.contactDsrNote}
          </p>
          <SettingsRow
            label={copy.deleteAccount}
            destructive
            onClick={() => {
              setError(null);
              setShowDeleteConfirm(true);
            }}
          />
        </div>
        {error && !showDeleteConfirm && (
          <p className="mt-3 text-center text-sm font-bold text-red-500" role="alert">
            {error}
          </p>
        )}
      </section>

      <LegalSheet doc={legalDoc} onClose={() => setLegalDoc(null)} />

      {fullPageLegal && (
        <LegalInAppFullPageOverlay
          page={fullPageLegal}
          onClose={() => setFullPageLegal(null)}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70">
          <div
            className="w-full rounded-t-3xl border-t-4 border-red-600 bg-zinc-900 p-6 pb-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <p
              id="delete-account-title"
              className="text-lg font-black uppercase tracking-wider text-white"
            >
              {copy.deleteTitle}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-300">
              {isSignedIn
                ? copy.deleteSignedInWarning
                : copy.deleteGhostWarning}
            </p>
            {offline && (
              <p className="mt-4 text-sm font-bold text-yellow-400" role="alert">
                {copy.deleteRequiresOnline}
              </p>
            )}
            {error && (
              <p className="mt-4 text-sm font-bold text-red-500" role="alert">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={deleting || offline}
              onClick={() => void handleDelete()}
              className="mt-6 w-full min-h-16 rounded-xl border-2 border-red-600 bg-red-950 py-4 text-lg font-black uppercase tracking-wider text-red-400 transition-transform active:scale-95 disabled:opacity-60"
            >
              {deleting ? copy.deleting : copy.deletePermanently}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(false);
                setError(null);
              }}
              className="mt-3 w-full min-h-16 py-3 text-sm font-bold text-zinc-400 transition-transform active:scale-95"
            >
              {copy.cancel}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
