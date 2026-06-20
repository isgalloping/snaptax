import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  IDB_LEGACY_CRYPTO_META,
  IDB_LEGACY_PHOTOS,
  IDB_LEGACY_RECEIPTS,
  IDB_LEGACY_SYSTEM_META,
  IDB_STORE_CRYPTO_META,
  IDB_STORE_RECEIPT_PHOTOS,
  IDB_STORE_RECEIPTS,
  IDB_STORE_SYSTEM_META,
} from "@/lib/storage/idbStores";
import { planLegacyDbStoreCopies } from "@/lib/storage/idbDbRenameMigration";

describe("planLegacyDbStoreCopies", () => {
  it("maps v4 legacy store names onto snaptax v5 stores", () => {
    const legacy = [
      IDB_LEGACY_RECEIPTS,
      IDB_LEGACY_PHOTOS,
      IDB_LEGACY_SYSTEM_META,
      IDB_LEGACY_CRYPTO_META,
    ];
    const target = [
      IDB_STORE_RECEIPTS,
      IDB_LEGACY_PHOTOS,
      IDB_STORE_RECEIPT_PHOTOS,
      IDB_STORE_SYSTEM_META,
      IDB_STORE_CRYPTO_META,
    ];

    const copies = planLegacyDbStoreCopies(legacy, target);
    assert.deepEqual(
      copies.map((c) => `${c.from}→${c.to}`),
      [
        `${IDB_LEGACY_RECEIPTS}→${IDB_STORE_RECEIPTS}`,
        `${IDB_LEGACY_SYSTEM_META}→${IDB_STORE_SYSTEM_META}`,
        `${IDB_LEGACY_CRYPTO_META}→${IDB_STORE_CRYPTO_META}`,
        `${IDB_LEGACY_PHOTOS}→${IDB_LEGACY_PHOTOS}`,
      ],
    );
  });

  it("copies snaptax-prefixed stores when legacy db was partially upgraded", () => {
    const legacy = [IDB_STORE_RECEIPTS, IDB_STORE_CRYPTO_META];
    const target = [IDB_STORE_RECEIPTS, IDB_STORE_CRYPTO_META];
    const copies = planLegacyDbStoreCopies(legacy, target);
    assert.deepEqual(copies, [
      { from: IDB_STORE_RECEIPTS, to: IDB_STORE_RECEIPTS },
      { from: IDB_STORE_CRYPTO_META, to: IDB_STORE_CRYPTO_META },
    ]);
  });
});
