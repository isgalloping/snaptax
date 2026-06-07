# Receipt Sync — Ghost Stability + Safe Reconcile — Design

**Date:** 2026-06-07  
**Status:** Approved  
**Scope:** Fix client receipt loss after server link / app restart / multi-device login. Root causes: ghost cookie rotation, aggressive local delete, missing post-login sync, remote not persisted to IndexedDB.

## Problem

Users report all three failure modes (often combined):

| Scenario | Symptom |
|----------|---------|
| **A** — Google login from Settings | After linking, home list empty; local IndexedDB wiped |
| **B** — Ghost-only, restart / online event | Receipts visible before refresh, gone after Phase 2 sync |
| **C** — Second device, same Google account | Server has receipts; client never shows them (or shows briefly then empty on reload) |

## Root cause summary

### RC-1: Ghost cookie rotated on every `ensureGhostSession`

- Client `ensureGhostSession()` always `POST /api/ghost/register`.
- Server always `signGhostToken()` → **new** `ghostId`, overwrites `snap1099_ghost` cookie.
- Receipts uploaded under ghost-A are invisible to ghost-B (`receiptWhereForActor`: `{ ghostId, userId: null }`).
- Google login migrates only **current cookie ghost** → orphan receipts on rotated ghosts never attach to user.

**Triggers:** cold-start Phase 2, `online` event, pre-upload capture, Privacy delete flow.

### RC-2: `syncFromServer` treats empty remote as authoritative delete

```typescript
for (const r of local) {
  if (!r.pendingUpload && !remoteIds.has(r.id)) {
    await deleteStoredReceipt(r.id);
  }
}
```

When `fetchReceiptList` succeeds but returns `[]` (wrong ghost, session expired, migrate miss), all synced local rows are **physically deleted** from IndexedDB. `mergeReceipts` then yields empty UI.

### RC-3: No post-login sync hook

`SettingsScreen.handleGoogleSuccess` only calls `signInWithGoogle()`. No `flushPendingUploads`, no `syncFromServer`, no `pollTaxRecalc`. User may hit RC-2 on next manual/background sync with wrong actor state.

### RC-4: Remote receipts not persisted to IndexedDB after merge

`syncFromServer` updates React state but does not `saveReceipt()` for remote rows. On reload, Phase 0 reads empty IndexedDB → flash empty until Phase 2; offline shows nothing.

### RC-5: Session expiry + local Google cache mismatch

`useAuthSession` keeps `googleUser` from localStorage when `fetchAuthMe` fails, but API calls use expired session → actor falls back to (possibly new) ghost → empty remote → RC-2 delete.

---

## Decisions

| Topic | Choice |
|-------|--------|
| Ghost register | **A** — idempotent: reuse valid cookie; mint only when missing/expired |
| Local delete on sync | **B** — never delete local synced rows when remote is empty; delete only on explicit user action or server-confirmed reconcile |
| Post-login | **C** — immediate `flushPendingUploads` + `syncFromServer(immediate)` + `pollTaxRecalc` when `taxRecalcQueued > 0` |
| IndexedDB persist | **D** — after successful merge, upsert all merged rows to IndexedDB |
| Actor for list fetch | **E** — prefer session user; ghost list only when no session |

---

## Architecture

```
ensureGhostSession
  ├─ read snap1099_ghost cookie (via GET /api/auth/me ghostId or dedicated probe)
  └─ POST /api/ghost/register ONLY if no valid ghost

syncFromServer (safe reconcile)
  ├─ fetchReceiptList (actor = user if session, else ghost)
  ├─ mergeReceipts(local, remote)
  ├─ pruneLocal: ONLY if actor.kind === "user" AND remote.length > 0
  │     delete local ids not in remote AND not pendingUpload
  ├─ persistMerged → saveReceipt each merged row
  └─ applyMergeNow / applyMergeOrDefer

postLoginSync (HomeScreen callback)
  ├─ flushPendingUploads
  ├─ syncFromServer(..., "immediate")
  └─ pollTaxRecalc if taxRecalcQueued > 0
```

---

## §1 Idempotent ghost register

### Server: `POST /api/ghost/register`

1. Read `snap1099_ghost` from request cookies.
2. If token verifies and not expired → **200** `{ ghostId, reused: true }` (no Set-Cookie change).
3. Else → **201** `{ ghostId, reused: false }` + Set-Cookie new token.

### Client: `ensureGhostSession()`

1. Call register (server decides reuse vs mint).
2. Update `localStorage.snap1099_ghost_id` for UI/debug only.
3. Never assume POST always creates new id.

### Acceptance (B)

- Cold start ×3, `online` event, capture upload: same `ghostId` in responses.
- Receipts uploaded before restart still appear in `GET /api/receipts` as ghost.

---

## §2 Safe reconcile (`syncFromServer`)

### Merge (unchanged semantics)

```typescript
function mergeReceipts(local, remote): Receipt[] {
  const byId = new Map();
  for (const r of remote) byId.set(r.id, r);
  for (const r of local) {
    if (r.pendingUpload) byId.set(r.id, r); // local pending wins
  }
  return sorted([...byId.values()]);
}
```

### Local delete rules (new)

| Condition | Delete local row? |
|-----------|-------------------|
| `fetchReceiptList` throws | **No** — keep local, show local |
| `remote.length === 0` | **No** — keep all local (avoid RC-2) |
| `actor.kind === "ghost"` | **No** — ghost list may be incomplete during rotation recovery |
| `actor.kind === "user"` AND `remote.length > 0` | **Yes** — delete local synced ids ∉ remoteIds (server is source of truth for bound account) |
| `pendingUpload === true` | **Never** delete via sync |

### Persist merged to IndexedDB

After merge, for each row in `merged`:

```typescript
await saveReceipt(row as StoredReceipt);
```

Photos: unchanged (local blob keyed by receipt id; upload flow already re-keys on server id).

### Acceptance (A, B, C)

- Empty remote response never clears local list.
- After Google login + sync, list matches server; local IndexedDB matches UI.
- Second device login: remote rows appear and survive reload.

---

## §3 Post-login sync hook

### Flow

1. User completes Google sign-in (Settings or future entry points).
2. `HomeScreen` receives `onPostLoginSync({ taxRecalcQueued })`:
   - `await flushPendingUploads()`
   - `await syncFromServer(await loadReceipts(), "immediate")`
   - if `taxRecalcQueued > 0`: `pollTaxRecalc(taxRecalcQueued, onTick)` where `onTick` calls `syncFromServer(..., "immediate")`

### Settings integration

`SettingsScreen.handleGoogleSuccess` returns `taxRecalcQueued` from sign-in; parent passes callback that runs post-login sync before showing SyncInstructionsSheet.

### Acceptance (A)

- Login from Settings → return home → list shows server + local pending, no wipe.

---

## §4 Session / auth edge cases

### `useAuthSession`

When `fetchAuthMe` returns `user: null` but localStorage has Google user:

- Set `googleUser = null` (already done) — UI shows signed-out.
- Do **not** treat as signed-in for sync delete rules (no session → ghost-safe delete policy).

### Manual refresh (`handleManualListSync`)

Uses same safe reconcile; immediate merge (no camera defer).

---

## §5 Files to change

| File | Change |
|------|--------|
| `app/api/ghost/register/route.ts` | Idempotent reuse valid cookie |
| `lib/client/ghostClient.ts` | Handle 200 reused vs 201 new |
| `components/home/HomeScreen.tsx` | Safe reconcile, persist merged, `postLoginSync` callback |
| `components/settings/SettingsScreen.tsx` | Invoke post-login sync after sign-in |
| `lib/client/useAuthSession.ts` | Optional: expose `taxRecalcQueued` from sign-in (or keep in Settings return) |
| `docs/tech/05-auth-ghost-google.md` | Clarify register is idempotent |
| `docs/tech/06-receipt-ai-pipeline.md` | Note safe reconcile + post-login sync |

**Out of scope (follow-up):**

- Orphan ghost receipt recovery on server (admin / merge job).
- Full CRDT / conflict resolution for concurrent edits.

---

## §6 Testing plan

| # | Test | Expected |
|---|------|----------|
| 1 | Ghost: snap 2, reload app | Same ghostId; 2 receipts in list + IndexedDB |
| 2 | Ghost: snap 2, toggle airplane off/on | No local delete; list intact |
| 3 | Ghost: snap 2, login Google | List ≥2; server userId set; IndexedDB populated |
| 4 | Device 2: login same Google | Server receipts visible; reload keeps them |
| 5 | Mock `GET /api/receipts` → `[]` while session valid | Local **not** deleted |
| 6 | User with 10 server receipts, login | Local prune removes only ids genuinely absent from remote |

---

## §7 Acceptance criteria (ship gate)

1. Scenarios A, B, C pass manual QA above.
2. `ensureGhostSession` does not rotate ghost across restart/online/capture.
3. Empty remote never wipes local synced receipts.
4. Successful sync persists merged rows to IndexedDB.
5. Google login triggers immediate sync + optional tax recalc poll.
6. `npx next build` passes.
