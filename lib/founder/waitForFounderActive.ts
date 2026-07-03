import { fetchFounderProgramClient } from "./fetchFounderProgramClient";

const DEFAULT_ATTEMPTS = 10;
const DEFAULT_INTERVAL_MS = 1000;

/** Poll until webhook marks founder active, or timeout. */
export async function waitForFounderActive(
  maxAttempts = DEFAULT_ATTEMPTS,
  intervalMs = DEFAULT_INTERVAL_MS,
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const program = await fetchFounderProgramClient();
    if (program?.user?.founderStatus === "active") {
      return true;
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  return false;
}
