import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decryptBuffer, encryptBuffer } from "./aesGcm";

async function generateTestKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

describe("aesGcm", () => {
  it("round-trips plaintext", async () => {
    const key = await generateTestKey();
    const input = new TextEncoder().encode("receipt-photo").buffer;
    const { iv, ct } = await encryptBuffer(key, input);
    const out = await decryptBuffer(key, iv, ct);
    assert.equal(new TextDecoder().decode(out), "receipt-photo");
  });

  it("rejects tampered ciphertext", async () => {
    const key = await generateTestKey();
    const { iv, ct } = await encryptBuffer(key, new Uint8Array([1, 2, 3]).buffer);
    const tampered = new Uint8Array(ct);
    tampered[0] ^= 0xff;
    await assert.rejects(() => decryptBuffer(key, iv, tampered.buffer));
  });
});
