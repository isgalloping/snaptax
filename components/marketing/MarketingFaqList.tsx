"use client";

import { useState } from "react";
import type { FaqCategory, FaqItem } from "@/lib/marketing/faq";

function FaqAccordionItem({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="font-bold text-white">{item.question}</span>
        <span className="shrink-0 text-zinc-400" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <p className="pb-5 text-sm leading-relaxed text-zinc-400">
          {item.answer}
        </p>
      ) : null}
    </div>
  );
}

export function MarketingFaqList({
  categories,
  defaultOpenIndex = 0,
}: {
  categories: readonly FaqCategory[];
  defaultOpenIndex?: number;
}) {
  const flat = categories.flatMap((category) => category.items);
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex);

  return (
    <div className="divide-y divide-white/10 border-y border-white/10">
      {flat.map((item, index) => (
        <FaqAccordionItem
          key={item.question}
          item={item}
          open={openIndex === index}
          onToggle={() =>
            setOpenIndex(openIndex === index ? null : index)
          }
        />
      ))}
    </div>
  );
}

export function MarketingFaqByCategory({
  categories,
}: {
  categories: readonly FaqCategory[];
}) {
  const [openKey, setOpenKey] = useState<string | null>(
    categories[0]?.items[0]?.question ?? null,
  );

  return (
    <div className="space-y-12">
      {categories.map((category) => (
        <section key={category.name}>
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400">
            {category.name}
          </h2>
          <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
            {category.items.map((item) => (
              <FaqAccordionItem
                key={item.question}
                item={item}
                open={openKey === item.question}
                onToggle={() =>
                  setOpenKey(openKey === item.question ? null : item.question)
                }
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
