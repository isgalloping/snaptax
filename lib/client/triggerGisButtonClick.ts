/** Programmatically activate a GIS renderButton host (custom branded overlay). */
export function triggerGisButtonClick(container: HTMLElement | null): boolean {
  if (!container) return false;

  const roleButton = container.querySelector<HTMLElement>('div[role="button"]');
  if (roleButton) {
    roleButton.click();
    return true;
  }

  const iframe = container.querySelector<HTMLIFrameElement>("iframe");
  if (iframe) {
    iframe.click();
    return true;
  }

  return false;
}
