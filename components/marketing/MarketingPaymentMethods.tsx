import { MARKETING_PAYMENT_CHANNELS } from "@/lib/marketing/paymentChannels";

function VisaLogo() {
  return (
    <svg viewBox="0 0 48 16" aria-hidden className="h-4 w-auto">
      <path
        fill="#1434CB"
        d="M19.5 15.5h-3.2L17.8.5h3.2L19.5 15.5zm10.2-10.1c-.6-.2-1.6-.5-2.8-.5-3.1 0-5.2 1.6-5.2 3.9 0 1.7 1.5 2.6 2.7 3.2 1.2.6 1.6 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.3 0-2-.3-3.1-.9l-.4-.2-.5 2.8c.8.4 2.3.7 3.8.7 3.3 0 5.4-1.6 5.5-4.1 0-1.4-.8-2.4-2.6-3.3-1.1-.5-1.7-.9-1.7-1.5 0-.5.6-1 1.8-1 1 0 1.8.2 2.4.5l.3.1.5-2.7zm8.3-.4h-2.5c-.8 0-1.3.2-1.7 1l-4.6 11h3.4l.6-1.7h4.2l.4 1.7H42l-2.4-6.1c-.2-.4-.2-.7-.2-.9 0-.3.2-.5.5-.7l2.2-4.3zm-3.2 7.7 1.7-4.6.9 4.6h-2.6zM14.1.5l-3.1 10.6-.3-1.6C9.9 3.7 8.2 1.5 6.1.8L9 15.5h3.4L18.3.5h-4.2z"
      />
    </svg>
  );
}

function MastercardLogo() {
  return (
    <svg viewBox="0 0 32 20" aria-hidden className="h-5 w-auto">
      <circle cx="12" cy="10" r="8" fill="#EB001B" />
      <circle cx="20" cy="10" r="8" fill="#F79E1B" fillOpacity="0.95" />
    </svg>
  );
}

function AmexLogo() {
  return (
    <svg viewBox="0 0 48 16" aria-hidden className="h-4 w-auto">
      <rect width="48" height="16" rx="2" fill="#006FCF" />
      <text
        x="24"
        y="11"
        fill="#fff"
        fontSize="7"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        textAnchor="middle"
      >
        AMEX
      </text>
    </svg>
  );
}

function ApplePayLogo() {
  return (
    <svg viewBox="0 0 44 18" aria-hidden className="h-5 w-auto">
      <path
        fill="#000"
        d="M8.2 3.2c-.4.5-1.1.9-1.8.9-.1-.7.3-1.4.6-1.8.4-.5 1.1-.9 1.7-.9.1.7-.2 1.4-.5 1.8zm.5.9c-1-.1-1.8.5-2.3.5-.5 0-1.2-.5-2-.5-1 0-2 .6-2.5 1.5-1.1 1.9-.3 4.7.7 6.2.5.7 1.1 1.5 1.9 1.5.8 0 1.1-.5 2.1-.5 1 0 1.3.5 2.1.5.8 0 1.4-.7 1.9-1.4.6-.8.9-1.7.9-1.8 0 0-1.8-.7-1.8-2.8 0-1.8 1.4-2.6 1.5-2.7-.8-.5-1.9-.9-2.4-.9z"
      />
      <text
        x="15"
        y="13"
        fill="#000"
        fontSize="10"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
      >
        Pay
      </text>
    </svg>
  );
}

function GooglePayLogo() {
  return (
    <svg viewBox="0 0 52 18" aria-hidden className="h-5 w-auto">
      <path
        fill="#4285F4"
        d="M10.2 9.1V7.4h5.1c0 .3 0 .6-.1.9-.1.8-.5 1.6-1 2.3-.8.8-1.9 1.3-3.2 1.3-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5c1.4 0 2.4.5 3.2 1.3l-1.3 1.3c-.5-.5-1.3-.9-1.9-.9-1.6 0-2.8 1.3-2.8 2.8s1.3 2.8 2.8 2.8c1 0 1.6-.4 2-.7.3-.3.5-.7.5-1.3H10.2z"
      />
      <path fill="#34A853" d="M22.8 8.8c0-.3 0-.5-.1-.8h-4.3v1.6h2.5c-.1.8-.4 1.4-.9 1.8l1.3 1c.7-.7 1.6-1.8 1.6-3.6z" />
      <path fill="#FBBC04" d="M27.6 6.2c-.5-.3-1.1-.4-1.8-.4-1.6 0-2.8 1.3-2.8 2.8s1.3 2.8 2.8 2.8c.8 0 1.5-.2 2-.6l1.3 1c-.8.8-1.8 1.1-3.2 1.1-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5c1.7 0 2.9.7 3.6 1.6l-1.3 1.1z" />
      <path fill="#EA4335" d="M31.2 4.8c1.2 0 2.2.4 3 1.1l-1.1 1.1c-.5-.5-1.2-.8-1.9-.8-1.6 0-2.8 1.3-2.8 2.8 0 1.6 1.3 2.8 2.8 2.8.7 0 1.4-.3 1.9-.8l1.1 1.1c-.8.7-1.8 1.1-3 1.1-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5z" />
      <text
        x="36"
        y="12.5"
        fill="#5F6368"
        fontSize="9"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
      >
        Pay
      </text>
    </svg>
  );
}

const LOGO_BY_ID = {
  visa: VisaLogo,
  mastercard: MastercardLogo,
  amex: AmexLogo,
  "apple-pay": ApplePayLogo,
  "google-pay": GooglePayLogo,
} as const;

export function MarketingPaymentMethods({
  className = "",
}: {
  className?: string;
}) {
  return (
    <ul
      className={`flex flex-wrap items-center justify-center gap-2 sm:justify-start ${className}`}
      aria-label="Accepted payment methods"
    >
      {MARKETING_PAYMENT_CHANNELS.map(({ id, label }) => {
        const Logo = LOGO_BY_ID[id];
        return (
          <li key={id}>
            <span className="flex h-9 min-w-[3.25rem] items-center justify-center rounded-md bg-white px-2.5">
              <Logo />
              <span className="sr-only">{label}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
