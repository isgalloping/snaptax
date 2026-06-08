export type BatchThumb = {
  id: string;
  url: string;
};

export function createBatchThumb(id: string, file: File): BatchThumb {
  return { id, url: URL.createObjectURL(file) };
}

export function revokeBatchThumbs(thumbs: BatchThumb[]): void {
  for (const thumb of thumbs) {
    URL.revokeObjectURL(thumb.url);
  }
}
