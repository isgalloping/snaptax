import { getTranslations } from "next-intl/server";

export default async function OfflinePage() {
  const t = await getTranslations("Offline");

  return (
    <div className="flex h-full flex-col items-center justify-center bg-black px-8 text-center text-white">
      <p className="text-6xl font-black text-yellow-400">{t("label")}</p>
      <p className="mt-4 text-lg font-bold text-zinc-300">
        {t("title")}
      </p>
      <p className="mt-2 text-sm text-zinc-500">{t("body")}</p>
      <a
        href="/"
        className="mt-10 flex min-h-16 items-center rounded-xl bg-yellow-500 px-8 text-lg font-black text-black active:scale-95"
      >
        {t("backHome")}
      </a>
    </div>
  );
}
