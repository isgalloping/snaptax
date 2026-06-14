import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DeleteAccountOfflineError,
  deleteAccountAndLocalData,
  isDeleteAccountOfflineError,
} from "./deleteAccountFlow.ts";

describe("deleteAccountAndLocalData", () => {
  it("throws DeleteAccountOfflineError when offline", async () => {
    await assert.rejects(
      () =>
        deleteAccountAndLocalData(false, {
          isOnline: () => false,
        }),
      (err: unknown) => {
        assert.ok(isDeleteAccountOfflineError(err));
        assert.equal(err.code, "OFFLINE");
        return true;
      },
    );
  });

  it("calls delete API before clearing local data when online (ghost)", async () => {
    const order: string[] = [];

    await deleteAccountAndLocalData(false, {
      isOnline: () => true,
      ensureGhostSession: async () => {
        order.push("ghost");
      },
      deleteAccountApi: async () => {
        order.push("api");
      },
      clearLocalAppData: async () => {
        order.push("local");
      },
    });

    assert.deepEqual(order, ["ghost", "api", "local"]);
  });

  it("skips ensureGhostSession when signed in", async () => {
    const order: string[] = [];

    await deleteAccountAndLocalData(true, {
      isOnline: () => true,
      ensureGhostSession: async () => {
        order.push("ghost");
      },
      deleteAccountApi: async () => {
        order.push("api");
      },
      clearLocalAppData: async () => {
        order.push("local");
      },
    });

    assert.deepEqual(order, ["api", "local"]);
  });

  it("does not clear local when API fails", async () => {
    let localCleared = false;

    await assert.rejects(
      () =>
        deleteAccountAndLocalData(true, {
          isOnline: () => true,
          deleteAccountApi: async () => {
            throw new Error("DELETE_ACCOUNT_FAILED");
          },
          clearLocalAppData: async () => {
            localCleared = true;
          },
        }),
      /DELETE_ACCOUNT_FAILED/,
    );

    assert.equal(localCleared, false);
  });
});

describe("DeleteAccountOfflineError", () => {
  it("is recognized by isDeleteAccountOfflineError", () => {
    assert.ok(isDeleteAccountOfflineError(new DeleteAccountOfflineError()));
    assert.equal(isDeleteAccountOfflineError(new Error("OFFLINE")), false);
  });
});
