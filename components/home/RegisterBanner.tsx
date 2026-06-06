"use client";

interface RegisterBannerProps {
  onRegister: () => void;
}

export function RegisterBanner({ onRegister }: RegisterBannerProps) {
  return (
    <button
      type="button"
      onClick={onRegister}
      className="mx-6 mb-2 rounded-xl border-2 border-yellow-500 bg-yellow-950 px-4 py-3 text-left text-sm font-bold text-yellow-400 transition-transform active:scale-[0.98]"
    >
      怕数据丢失？输入手机号，一键安全保存 →
    </button>
  );
}
