"use client";

import Link from "next/link";
import { useState } from "react";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";
import type { FaqItem } from "@/lib/marketing/faq";

function FaqPreviewCard({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="font-bold text-white">{item.question}</span>
        <span className="shrink-0 text-lg font-light text-white" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <p className="px-5 pb-4 text-sm leading-relaxed text-zinc-400">
          {item.answer}
        </p>
      ) : null}
    </div>
  );
}

export function MarketingFaqPreview() {
  const { faq } = MARKETING_COPY;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="text-center text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">
        {faq.previewSectionTitle}
      </h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {faq.previewItems.map((item, index) => (
          <FaqPreviewCard
            key={item.question}
            item={item}
            open={openIndex === index}
            onToggle={() =>
              setOpenIndex(openIndex === index ? null : index)
            }
          />
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link
          href="/faq"
          className="text-sm font-bold underline-offset-4 hover:underline"
          style={{ color: MARKETING_TOKENS.accentGreen }}
        >
          {faq.viewAll}
        </Link>
      </div>
    </section>
  );
}
