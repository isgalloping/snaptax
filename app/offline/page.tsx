export default function OfflinePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-black px-8 text-center text-white">
      <p className="text-6xl font-black text-yellow-400">OFFLINE</p>
      <p className="mt-4 text-lg font-bold text-zinc-300">
        当前无网络连接
      </p>
      <p className="mt-2 text-sm text-zinc-500">
        你仍可以打开 Snap1099 并拍照，网络恢复后将自动上传
      </p>
      <a
        href="/"
        className="mt-10 flex min-h-16 items-center rounded-xl bg-yellow-500 px-8 text-lg font-black text-black active:scale-95"
      >
        返回主界面
      </a>
    </div>
  );
}
