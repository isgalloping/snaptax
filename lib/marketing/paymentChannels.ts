export const MARKETING_PAYMENT_CHANNELS = [
  { id: "visa", label: "Visa" },
  { id: "mastercard", label: "Mastercard" },
  { id: "amex", label: "American Express" },
  { id: "apple-pay", label: "Apple Pay" },
  { id: "google-pay", label: "Google Pay" },
] as const;

export type MarketingPaymentChannelId =
  (typeof MARKETING_PAYMENT_CHANNELS)[number]["id"];
