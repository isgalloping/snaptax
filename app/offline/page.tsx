import { USER_COPY } from "@/lib/copy/userFacing";

export default function OfflinePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-black px-8 text-center text-white">
      <p className="text-6xl font-black text-yellow-400">OFFLINE</p>
      <p className="mt-4 text-lg font-bold text-zinc-300">
        {USER_COPY.offline.title}
      </p>
      <p className="mt-2 text-sm text-zinc-500">{USER_COPY.offline.body}</p>
      <a
        href="/"
        className="mt-10 flex min-h-16 items-center rounded-xl bg-yellow-500 px-8 text-lg font-black text-black active:scale-95"
      >
        {USER_COPY.offline.backHome}
      </a>
    </div>
  );
}
