const IV_BYTES = 12;

export type AesGcmCiphertext = {
  iv: ArrayBuffer;
  ct: ArrayBuffer;
};

export async function encryptBuffer(
  key: CryptoKey,
  plaintext: ArrayBuffer,
): Promise<AesGcmCiphertext> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext,
  );
  return { iv: iv.buffer, ct };
}

export async function decryptBuffer(
  key: CryptoKey,
  iv: ArrayBuffer,
  ct: ArrayBuffer,
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, key, ct);
}
