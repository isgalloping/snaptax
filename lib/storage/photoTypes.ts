export const PHOTO_META_VERSION = 2 as const;

export type ReceiptPhotoMeta = {
  id: string;
  v: typeof PHOTO_META_VERSION;
  mime: "image/jpeg";
  width: number;
  height: number;
  byteLength: number;
  thumbWidth: number;
  thumbHeight: number;
  thumbByteLength: number;
  opfsFullPath: string;
  opfsThumbPath: string;
  fullIvB64: string;
  thumbIvB64: string;
  cipher: { alg: "AES-GCM"; v: 1 };
  remoteSyncedAtMs?: number;
  fullPurged?: boolean;
  fullPurgedAtMs?: number;
};
