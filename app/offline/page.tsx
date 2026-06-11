"use client";

import Link from "next/link";
import { useUserCopy } from "@/components/i18n/I18nProvider";

export default function OfflinePage() {
  const copy = useUserCopy();

  return (
    <div className="flex h-full flex-col items-center justify-center bg-black px-8 text-center text-white">
      <p className="text-6xl font-black text-yellow-400">
        {copy.offline.label}
      </p>
      <p className="mt-4 text-lg font-bold text-zinc-300">
        {copy.offline.title}
      </p>
      <p className="mt-2 text-sm text-zinc-500">{copy.offline.body}</p>
      <Link
        href="/"
        className="mt-10 flex min-h-16 items-center rounded-xl bg-yellow-500 px-8 text-lg font-black text-black active:scale-95"
      >
        {copy.offline.backHome}
      </Link>
    </div>
  );
}
