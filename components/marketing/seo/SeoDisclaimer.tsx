import Link from "next/link";

export function SeoDisclaimer({ text }: { text: string }) {
  return (
    <p className="text-xs leading-relaxed text-zinc-500">
      {text}{" "}
      <Link href="/disclaimer" className="underline hover:text-zinc-300">
        Disclaimer
      </Link>
      .
    </p>
  );
}
