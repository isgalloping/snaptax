import { ONBOARDING_DEMO_RECEIPT_ID } from "./demoReceipt";
import { setOnboardingStatus } from "./onboardingState";
import { deleteReceipt } from "@/lib/storage/receiptDb";

export async function skipOnboarding(): Promise<void> {
  try {
    await deleteReceipt(ONBOARDING_DEMO_RECEIPT_ID);
  } catch {
    // Demo receipt or photo may already be absent.
  }
  await setOnboardingStatus("completed");
}
