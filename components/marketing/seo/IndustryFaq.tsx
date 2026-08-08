"use client";

import { useState } from "react";

export function IndustryFaq({
  items,
  title = "Frequently Asked Questions",
}: {
  items: readonly { question: string; answer: string }[];
  title?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="text-2xl font-black text-white sm:text-3xl">{title}</h2>
      <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
        {items.map((item, index) => {
          const open = openIndex === index;
          return (
            <div key={item.question}>
              <button
                type="button"
                className="flex min-h-12 w-full items-center justify-between gap-4 py-5 text-left"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span className="font-bold text-white">{item.question}</span>
                <span className="shrink-0 text-zinc-400" aria-hidden>
                  {open ? "−" : "+"}
                </span>
              </button>
              <p
                className={
                  open
                    ? "pb-5 text-sm leading-relaxed text-zinc-400"
                    : "hidden pb-5 text-sm leading-relaxed text-zinc-400"
                }
              >
                {item.answer}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
