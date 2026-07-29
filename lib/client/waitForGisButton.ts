/** GIS renderButton inserts a div[role="button"] wrapper (iframe inside). */
export function findGisButtonInHost(
  container: HTMLElement | null,
): HTMLElement | null {
  if (!container) return null;
  return container.querySelector<HTMLElement>('div[role="button"]');
}

export async function waitForGisButtonInHost(
  container: HTMLElement,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<HTMLElement | null> {
  const { timeoutMs = 8_000, intervalMs = 50 } = options;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const button = findGisButtonInHost(container);
    if (button) return button;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return null;
}
