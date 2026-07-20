"use client";

import { useState } from "react";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import { MARKETING_TOKENS } from "@/lib/marketing/tokens";

export function ContactForm() {
  const { contact } = MARKETING_COPY;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const mailtoHref = `mailto:${contact.email}?subject=${encodeURIComponent(
    `SnapTax support — ${name || "Customer"}`,
  )}&body=${encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\n\n${message}`,
  )}`;

  return (
    <form
      className="mt-10 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        window.location.href = mailtoHref;
      }}
    >
      <label className="block">
        <span className="text-sm font-bold text-zinc-300">Name</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/30"
        />
      </label>
      <label className="block">
        <span className="text-sm font-bold text-zinc-300">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/30"
        />
      </label>
      <label className="block">
        <span className="text-sm font-bold text-zinc-300">Message</span>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/30"
        />
      </label>
      <button
        type="submit"
        className="flex min-h-14 w-full items-center justify-center rounded-xl text-lg font-black text-black transition-transform active:scale-95 sm:w-auto sm:px-10"
        style={{ backgroundColor: MARKETING_TOKENS.ctaYellow }}
      >
        Send email
      </button>
    </form>
  );
}
