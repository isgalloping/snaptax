export type PaymentSuccessVariant = "export" | "founder";

export type PaymentSuccessPhase = "confirming" | "ready" | "error";

export type PaymentSuccessState = {
  open: boolean;
  variant: PaymentSuccessVariant;
  phase: PaymentSuccessPhase;
  seasonLabel: string;
  founderNumber?: number | null;
};
