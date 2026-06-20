export const IDB_DB_NAME = "snaptax" as const;
/** Pre-rename client DB — migrated once to {@link IDB_DB_NAME} on first open. */
export const IDB_LEGACY_DB_NAME = "snap1099" as const;
export const IDB_DB_VERSION = 5 as const;

export const IDB_STORE_RECEIPTS = "snaptax_receipts" as const;
export const IDB_STORE_RECEIPT_PHOTOS = "snaptax_receipt_photos" as const;
export const IDB_STORE_SYSTEM_META = "snaptax_system_meta" as const;
export const IDB_STORE_CRYPTO_META = "snaptax_crypto_meta" as const;

/** v4 legacy — migration only */
export const IDB_LEGACY_RECEIPTS = "receipts" as const;
export const IDB_LEGACY_PHOTOS = "photos" as const;
export const IDB_LEGACY_SYSTEM_META = "system_meta" as const;
export const IDB_LEGACY_CRYPTO_META = "meta" as const;

export const OPFS_PHOTOS_PREFIX = "snaptax/photos" as const;
