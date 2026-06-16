"use client";

import { useCallback, useState } from "react";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import {
  buildAppSharePayload,
  buildFacebookShareUrl,
  buildWhatsAppShareUrl,
  getAppShareUrl,
  openExternalShare,
  shareAppViaNative,
} from "@/lib/client/shareApp";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-400" aria-hidden>
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-400" aria-hidden>
      <path
        fill="currentColor"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

function MoreShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-zinc-400"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16 6 12 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const shareTileClass =
  "flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-zinc-600 bg-zinc-800 p-2 text-[11px] font-bold text-zinc-300 transition-transform active:scale-95";

export function ShareAppSection() {
  const copy = useUserCopy().settings.share;
  const [notice, setNotice] = useState<string | null>(null);

  const buildPayload = useCallback(
    () =>
      buildAppSharePayload({
        message: copy.message,
        title: copy.shareTitle,
        url: getAppShareUrl(window.location.origin),
      }),
    [copy.message, copy.shareTitle],
  );

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3000);
  }, []);

  const handleWhatsApp = () => {
    openExternalShare(buildWhatsAppShareUrl(buildPayload().combinedText));
  };

  const handleFacebook = () => {
    const payload = buildPayload();
    openExternalShare(buildFacebookShareUrl(payload.url, payload.message));
  };

  const handleMore = async () => {
    const result = await shareAppViaNative(buildPayload());
    if (result === "copied") {
      showNotice(copy.linkCopied);
    } else if (result === "failed") {
      showNotice(copy.shareFailed);
    }
  };

  return (
    <section className="mb-6">
      <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
        {copy.title}
      </h2>
      <p className="mb-3 text-sm text-zinc-400">{copy.hint}</p>
      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={handleWhatsApp} className={shareTileClass}>
          <WhatsAppIcon />
          {copy.whatsapp}
        </button>
        <button type="button" onClick={handleFacebook} className={shareTileClass}>
          <FacebookIcon />
          {copy.facebook}
        </button>
        <button type="button" onClick={() => void handleMore()} className={shareTileClass}>
          <MoreShareIcon />
          {copy.more}
        </button>
      </div>
      {notice && (
        <p className="mt-3 text-center text-sm font-bold text-yellow-400" role="status">
          {notice}
        </p>
      )}
    </section>
  );
}
