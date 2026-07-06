import { ContactForm } from "@/components/marketing/ContactForm";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";

export const metadata = buildMarketingMetadata({
  title: "Contact — SnapTax",
  description:
    "Contact SnapTax support by email. We respond within one business day.",
  path: "/contact",
});

export default function ContactPage() {
  const { contact } = MARKETING_COPY;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black text-white sm:text-4xl">
        {contact.title}
      </h1>
      <dl className="mt-8 space-y-4 text-sm text-zinc-300">
        <div>
          <dt className="font-bold text-white">Email</dt>
          <dd className="mt-1">
            <a
              href={`mailto:${contact.email}`}
              className="text-zinc-200 underline-offset-4 hover:underline"
            >
              {contact.email}
            </a>
          </dd>
        </div>
        <div>
          <dt className="font-bold text-white">Hours</dt>
          <dd className="mt-1">{contact.hours}</dd>
        </div>
        <div>
          <dt className="font-bold text-white">Response time</dt>
          <dd className="mt-1">{contact.response}</dd>
        </div>
      </dl>
      <ContactForm />
    </div>
  );
}
