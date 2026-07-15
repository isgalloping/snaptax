import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deleteAccountBodySchema,
  parseDeleteAccountOrphanGhostIds,
} from "./deleteAccountBody.ts";

describe("deleteAccountBodySchema", () => {
  it("defaults orphanGhostIds to empty", () => {
    assert.deepEqual(deleteAccountBodySchema.parse({}).orphanGhostIds, []);
  });

  it("accepts up to 20 orphan ids", () => {
    const ids = Array.from({ length: 20 }, (_, i) => `g-${i}`);
    assert.deepEqual(
      deleteAccountBodySchema.parse({ orphanGhostIds: ids }).orphanGhostIds,
      ids,
    );
  });

  it("rejects more than 20 orphan ids", () => {
    const ids = Array.from({ length: 21 }, (_, i) => `g-${i}`);
    assert.throws(() =>
      deleteAccountBodySchema.parse({ orphanGhostIds: ids }),
    );
  });
});

describe("parseDeleteAccountOrphanGhostIds", () => {
  it("treats an empty DELETE body as no compatibility orphan ids", async () => {
    const request = new Request("https://snaptax.test/api/users/me", {
      method: "DELETE",
      body: "  ",
    });

    assert.deepEqual(await parseDeleteAccountOrphanGhostIds(request), []);
  });

  it("parses a valid JSON body with orphan ids", async () => {
    const request = new Request("https://snaptax.test/api/users/me", {
      method: "DELETE",
      body: JSON.stringify({ orphanGhostIds: ["ghost-1", "ghost-2"] }),
    });

    assert.deepEqual(await parseDeleteAccountOrphanGhostIds(request), [
      "ghost-1",
      "ghost-2",
    ]);
  });

  it("rejects malformed JSON and invalid orphan id payloads", async () => {
    await assert.rejects(() =>
      parseDeleteAccountOrphanGhostIds(
        new Request("https://snaptax.test/api/users/me", {
          method: "DELETE",
          body: "{",
        }),
      ),
    );

    await assert.rejects(() =>
      parseDeleteAccountOrphanGhostIds(
        new Request("https://snaptax.test/api/users/me", {
          method: "DELETE",
          body: JSON.stringify({ orphanGhostIds: [""] }),
        }),
      ),
    );
  });
});
