function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function contentSha256FromBytes(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bufferToHex(digest);
}

export async function contentSha256FromBlob(blob: Blob): Promise<string> {
  return contentSha256FromBytes(await blob.arrayBuffer());
}
