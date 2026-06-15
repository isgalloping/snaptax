import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DeleteAccountOfflineError,
  deleteAccountAndLocalData,
  isDeleteAccountOfflineError,
  resolveDeleteUsesUserApi,
} from "./deleteAccountFlow.ts";

describe("resolveDeleteUsesUserApi", () => {
  it("returns true when session has user", async () => {
    const result = await resolveDeleteUsesUserApi(async () => ({
      user: { id: "u1", email: "a@b.com" },
      ghostId: "g1",
    }));
    assert.equal(result, true);
  });

  it("returns false when session has no user", async () => {
    const result = await resolveDeleteUsesUserApi(async () => ({
      user: null,
      ghostId: "g1",
    }));
    assert.equal(result, false);
  });
});

describe("deleteAccountAndLocalData", () => {
  it("throws DeleteAccountOfflineError when offline", async () => {
    await assert.rejects(
      () =>
        deleteAccountAndLocalData({
          isOnline: () => false,
        }),
      (err: unknown) => {
        assert.ok(isDeleteAccountOfflineError(err));
        assert.equal(err.code, "OFFLINE");
        return true;
      },
    );
  });

  it("calls ghost API path when session has no user", async () => {
    const order: string[] = [];
    let apiPath: boolean | null = null;

    await deleteAccountAndLocalData({
      isOnline: () => true,
      fetchAuthMe: async () => ({ user: null, ghostId: "g1" }),
      ensureGhostSession: async () => {
        order.push("ghost");
      },
      deleteAccountApi: async (useUserApi) => {
        apiPath = useUserApi;
        order.push("api");
      },
      clearLocalAppData: async () => {
        order.push("local");
      },
    });

    assert.equal(apiPath, false);
    assert.deepEqual(order, ["ghost", "api", "local"]);
  });

  it("calls user API path when session has user and skips ghost ensure", async () => {
    const order: string[] = [];
    let apiPath: boolean | null = null;

    await deleteAccountAndLocalData({
      isOnline: () => true,
      fetchAuthMe: async () => ({
        user: { id: "u1", email: "a@b.com" },
        ghostId: "g1",
      }),
      ensureGhostSession: async () => {
        order.push("ghost");
      },
      deleteAccountApi: async (useUserApi) => {
        apiPath = useUserApi;
        order.push("api");
      },
      clearLocalAppData: async () => {
        order.push("local");
      },
    });

    assert.equal(apiPath, true);
    assert.deepEqual(order, ["api", "local"]);
  });

  it("does not clear local when API fails", async () => {
    let localCleared = false;

    await assert.rejects(
      () =>
        deleteAccountAndLocalData({
          isOnline: () => true,
          fetchAuthMe: async () => ({
            user: { id: "u1", email: "a@b.com" },
            ghostId: null,
          }),
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
