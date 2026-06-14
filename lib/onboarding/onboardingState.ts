import {
  loadAllReceipts,
  loadReceipt,
  readSystemMeta,
  saveReceipt,
  deleteReceipt,
  writeSystemMeta,
} from "@/lib/storage/receiptDb";
import {
  createShadowDemoReceipt,
  ensureOnboardingDemoDone,
  ONBOARDING_DEMO_RECEIPT_ID,
} from "./demoReceipt";
import {
  GOOGLE_SOFT_DISMISSED_KEY,
  ONBOARD_FIRST_RECEIPT_KEY,
  ONBOARD_SNAP_DISMISSED_KEY,
  readOnboardFlag,
  SETTINGS_VISITED_KEY,
  writeOnboardingStatusMirror,
} from "./onboardingStorage";

export type OnboardingStatus =
  | "not_started"
  | "stage_1"
  | "stage_2"
  | "stage_3"
  | "stage_aha"
  | "stage_4"
  | "deferred_login"
  | "completed";

export const ONBOARDING_STATUS_KEY = "onboarding_status";

const LEGACY_ONBOARD_FLAGS = [
  ONBOARD_SNAP_DISMISSED_KEY,
  ONBOARD_FIRST_RECEIPT_KEY,
  GOOGLE_SOFT_DISMISSED_KEY,
  SETTINGS_VISITED_KEY,
] as const;

function isValidOnboardingStatus(value: unknown): value is OnboardingStatus {
  return (
    typeof value === "string" &&
    (value === "not_started" ||
      value === "stage_1" ||
      value === "stage_2" ||
      value === "stage_3" ||
      value === "stage_aha" ||
      value === "stage_4" ||
      value === "deferred_login" ||
      value === "completed")
  );
}

function hasLegacyOnboardProgress(): boolean {
  return LEGACY_ONBOARD_FLAGS.some((key) => readOnboardFlag(key));
}

export function isOnboardingActive(status: OnboardingStatus): boolean {
  return status.startsWith("stage_");
}

export function isSnapGateActive(_status: OnboardingStatus): boolean {
  return false;
}

export async function normalizeOnboardingStatus(
  status: OnboardingStatus,
): Promise<OnboardingStatus> {
  if (status === "deferred_login") {
    await setOnboardingStatus("completed");
    return "completed";
  }
  if (status === "stage_4") {
    await setOnboardingStatus("stage_aha");
    return "stage_aha";
  }
  return status;
}

export function shouldSkipLegacyCoaches(status: OnboardingStatus): boolean {
  return status !== "not_started";
}

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const stored = await readSystemMeta<OnboardingStatus>(ONBOARDING_STATUS_KEY);
  if (stored != null && isValidOnboardingStatus(stored)) {
    const status = await normalizeOnboardingStatus(stored);
    writeOnboardingStatusMirror(status);
    return status;
  }
  return "not_started";
}

export async function setOnboardingStatus(
  status: OnboardingStatus,
): Promise<void> {
  await writeSystemMeta(ONBOARDING_STATUS_KEY, status);
  writeOnboardingStatusMirror(status);
}

async function purgeStage1ShadowDemo(): Promise<void> {
  const demo = await loadReceipt(ONBOARDING_DEMO_RECEIPT_ID);
  if (demo?.isOnboardingDemo && demo.status === "processing") {
    await deleteReceipt(ONBOARDING_DEMO_RECEIPT_ID);
  }
}

async function ensureDemoReceiptPresent(status: OnboardingStatus): Promise<void> {
  if (
    status === "completed" ||
    status === "not_started" ||
    status === "stage_1" ||
    status === "stage_2"
  ) {
    return;
  }
  const demo = await loadReceipt(ONBOARDING_DEMO_RECEIPT_ID);
  if (!demo) {
    await saveReceipt(createShadowDemoReceipt());
  }
}

export async function commitHeroLandingStart(): Promise<void> {
  await purgeStage1ShadowDemo();
  await setOnboardingStatus("stage_1");
}

export async function ensureOnboardingInitialized(): Promise<OnboardingStatus> {
  const stored = await readSystemMeta<OnboardingStatus>(ONBOARDING_STATUS_KEY);

  let status: OnboardingStatus;

  if (stored != null && isValidOnboardingStatus(stored)) {
    status = stored;
  } else if (stored == null) {
    if (hasLegacyOnboardProgress()) {
      const receipts = await loadAllReceipts();
      if (receipts.some((r) => !r.isOnboardingDemo)) {
        await setOnboardingStatus("completed");
        status = "completed";
      } else {
        await setOnboardingStatus("stage_1");
        status = "stage_1";
      }
    } else {
      status = "not_started";
    }
  } else {
    status = "not_started";
  }

  await ensureDemoReceiptPresent(status);
  const normalized = await normalizeOnboardingStatus(status);
  if (normalized === "stage_1") {
    await purgeStage1ShadowDemo();
  }
  if (normalized === "stage_3" || normalized === "stage_aha") {
    await ensureOnboardingDemoDone();
  }
  return normalized;
}
