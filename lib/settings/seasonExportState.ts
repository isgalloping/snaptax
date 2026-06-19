function getLocalStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  const globalStorage = (globalThis as { localStorage?: Storage }).localStorage;
  return globalStorage ?? null;
}

export function seasonExportStorageKey(season: string): string {
  return `snap1099_tax_pack_exported_${season}`;
}

export function hasSeasonExportDone(season: string): boolean {
  const storage = getLocalStorage();
  if (!storage) return false;
  return storage.getItem(seasonExportStorageKey(season)) === "1";
}

export function markSeasonExportDone(season: string): void {
  const storage = getLocalStorage();
  if (!storage) return;
  storage.setItem(seasonExportStorageKey(season), "1");
}

export function clearSeasonExportDone(season: string): void {
  const storage = getLocalStorage();
  if (!storage) return;
  storage.removeItem(seasonExportStorageKey(season));
}
