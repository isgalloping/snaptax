import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DeleteAccountLocalClearError,
  DeleteAccountOfflineError,
  DeleteAccountSessionExpiredError,
  deleteAccountAndLocalData,
  finishLocalWipeAfterAccountDelete,
  isDeleteAccountLocalClearError,
  isDeleteAccountOfflineError,
  isDeleteAccountSessionExpiredError,
  resolveDeleteRoute,
  resolveDeleteUsesUserApi,
} from "./deleteAccountFlow.ts";

describe("resolveDeleteRoute", () => {
  it("returns user when session has user", async () => {
    const result = await resolveDeleteRoute(
      async () => ({
        user: { id: "u1", email: "a@b.com" },
        ghostId: "g1",
      }),
      () => ({ email: "a@b.com", name: "A" }),
    );
    assert.equal(result, "user");
  });

  it("returns ghost when session has no user and no google cache", async () => {
    const result = await resolveDeleteRoute(
      async () => ({ user: null, ghostId: "g1" }),
      () => null,
    );
    assert.equal(result, "ghost");
  });

  it("throws when google cache exists but session has no user", async () => {
    await assert.rejects(
      () =>
        resolveDeleteRoute(
          async () => ({ user: null, ghostId: "g1" }),
          () => ({ email: "a@b.com", name: "A" }),
        ),
      (err: unknown) => {
        assert.ok(isDeleteAccountSessionExpiredError(err));
        assert.equal(err.code, "SESSION_EXPIRED");
        return true;
      },
    );
  });
});

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

  it("throws DeleteAccountSessionExpiredError when google cache without session", async () => {
    let apiCalled = false;
    let localCleared = false;

    await assert.rejects(
      () =>
        deleteAccountAndLocalData({
          isOnline: () => true,
          fetchAuthMe: async () => ({ user: null, ghostId: "g1" }),
          loadGoogleUser: () => ({ email: "a@b.com", name: "A" }),
          deleteAccountApi: async () => {
            apiCalled = true;
          },
          clearLocalAppData: async () => {
            localCleared = true;
          },
        }),
      (err: unknown) => {
        assert.ok(isDeleteAccountSessionExpiredError(err));
        return true;
      },
    );

    assert.equal(apiCalled, false);
    assert.equal(localCleared, false);
  });

  it("calls ghost API path when session has no user and no google cache", async () => {
    const order: string[] = [];
    let apiPath: boolean | null = null;
    let sentOrphans: { ghostId: string; token: string }[] | null = null;

    await deleteAccountAndLocalData({
      isOnline: () => true,
      fetchAuthMe: async () => ({ user: null, ghostId: "g1" }),
      loadGoogleUser: () => null,
      ensureGhostSession: async () => {
        order.push("ghost");
        return "g-current";
      },
      getClientOrphanGhostPossession: (current) => {
        assert.equal(current, "g-current");
        return [
          { ghostId: "g-old-a", token: "g-old-a.exp.sig" },
          { ghostId: "g-old-b", token: "g-old-b.exp.sig" },
        ];
      },
      deleteAccountApi: async (useUserApi, orphanGhosts) => {
        apiPath = useUserApi;
        sentOrphans = orphanGhosts;
        order.push("api");
      },
      clearLocalAppData: async () => {
        order.push("local");
      },
    });

    assert.equal(apiPath, false);
    assert.deepEqual(sentOrphans, [
      { ghostId: "g-old-a", token: "g-old-a.exp.sig" },
      { ghostId: "g-old-b", token: "g-old-b.exp.sig" },
    ]);
    assert.deepEqual(order, ["ghost", "api", "local"]);
  });

  it("calls user API path with client orphans and skips ghost ensure", async () => {
    const order: string[] = [];
    let apiPath: boolean | null = null;
    let sentOrphans: { ghostId: string; token: string }[] | null = null;

    await deleteAccountAndLocalData({
      isOnline: () => true,
      fetchAuthMe: async () => ({
        user: { id: "u1", email: "a@b.com" },
        ghostId: "g1",
      }),
      loadGoogleUser: () => ({ email: "a@b.com", name: "A" }),
      ensureGhostSession: async () => {
        order.push("ghost");
        return "unused";
      },
      getClientOrphanGhostPossession: (current) => {
        assert.equal(current, "g1");
        return [{ ghostId: "g-orphan", token: "g-orphan.exp.sig" }];
      },
      deleteAccountApi: async (useUserApi, orphanGhosts) => {
        apiPath = useUserApi;
        sentOrphans = orphanGhosts;
        order.push("api");
      },
      clearLocalAppData: async () => {
        order.push("local");
      },
    });

    assert.equal(apiPath, true);
    assert.deepEqual(sentOrphans, [
      { ghostId: "g-orphan", token: "g-orphan.exp.sig" },
    ]);
    assert.deepEqual(order, ["api", "local"]);
  });

  it("maps GOOGLE_LOGIN_REQUIRED to session-expired error", async () => {
    let localCleared = false;

    await assert.rejects(
      () =>
        deleteAccountAndLocalData({
          isOnline: () => true,
          fetchAuthMe: async () => ({ user: null, ghostId: "g1" }),
          loadGoogleUser: () => null,
          ensureGhostSession: async () => "g1",
          getClientOrphanGhostPossession: () => [],
          deleteAccountApi: async () => {
            throw new Error("GOOGLE_LOGIN_REQUIRED");
          },
          clearLocalAppData: async () => {
            localCleared = true;
          },
        }),
      (err: unknown) => {
        assert.ok(isDeleteAccountSessionExpiredError(err));
        return true;
      },
    );

    assert.equal(localCleared, false);
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
          loadGoogleUser: () => null,
          getClientOrphanGhostPossession: () => [],
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

  it("throws LocalClearError and marks pending when wipe fails after API", async () => {
    let marked = false;
    let apiCalled = false;

    await assert.rejects(
      () =>
        deleteAccountAndLocalData({
          isOnline: () => true,
          fetchAuthMe: async () => ({
            user: { id: "u1", email: "a@b.com" },
            ghostId: "g1",
          }),
          loadGoogleUser: () => null,
          getClientOrphanGhostPossession: () => [],
          hasPendingLocalWipe: () => false,
          markPendingLocalWipe: () => {
            marked = true;
          },
          deleteAccountApi: async () => {
            apiCalled = true;
          },
          clearLocalAppData: async () => {
            throw new Error("IDB_FAIL");
          },
          localClearAttempts: 2,
        }),
      (err: unknown) => {
        assert.ok(isDeleteAccountLocalClearError(err));
        return true;
      },
    );

    assert.equal(apiCalled, true);
    assert.equal(marked, true);
  });

  it("finishes pending local wipe without calling delete API", async () => {
    const order: string[] = [];

    await deleteAccountAndLocalData({
      hasPendingLocalWipe: () => true,
      isOnline: () => false,
      deleteAccountApi: async () => {
        order.push("api");
      },
      clearLocalAppData: async () => {
        order.push("local");
      },
      localClearAttempts: 1,
    });

    assert.deepEqual(order, ["local"]);
  });
});

describe("finishLocalWipeAfterAccountDelete", () => {
  it("retries and then surfaces LocalClearError", async () => {
    let tries = 0;
    await assert.rejects(
      () =>
        finishLocalWipeAfterAccountDelete({
          clearLocalAppData: async () => {
            tries += 1;
            throw new Error("still failing");
          },
          localClearAttempts: 3,
        }),
      (err: unknown) => isDeleteAccountLocalClearError(err),
    );
    assert.equal(tries, 3);
  });
});

describe("DeleteAccountLocalClearError", () => {
  it("is recognized by isDeleteAccountLocalClearError", () => {
    assert.ok(isDeleteAccountLocalClearError(new DeleteAccountLocalClearError()));
    assert.equal(
      isDeleteAccountLocalClearError(new Error("LOCAL_CLEAR_FAILED")),
      false,
    );
  });
});

describe("DeleteAccountOfflineError", () => {
  it("is recognized by isDeleteAccountOfflineError", () => {
    assert.ok(isDeleteAccountOfflineError(new DeleteAccountOfflineError()));
    assert.equal(isDeleteAccountOfflineError(new Error("OFFLINE")), false);
  });
});

describe("DeleteAccountSessionExpiredError", () => {
  it("is recognized by isDeleteAccountSessionExpiredError", () => {
    assert.ok(
      isDeleteAccountSessionExpiredError(new DeleteAccountSessionExpiredError()),
    );
    assert.equal(
      isDeleteAccountSessionExpiredError(new Error("SESSION_EXPIRED")),
      false,
    );
  });
});
