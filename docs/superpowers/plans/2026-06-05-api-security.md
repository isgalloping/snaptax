# API 安全（MVP P0）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按已批准 spec 实现 Ghost HMAC 认证、小票上传校验、IDOR 防护、服务端 OpenAI 边界、速率限制与 Blob 私有访问。

**Architecture:** Next.js Route Handlers + `lib/auth/*`（Ghost token / Session）+ `lib/api/middleware.ts` 统一鉴权；`lib/receipts/*` 处理上传与归属；`lib/openai/*` 独占 Vision 调用；Vercel KV 限流。客户端首次联网调 `POST /api/ghost/register`，Cookie 自动携带。

**Tech Stack:** Next.js 16 App Router, Prisma, `@vercel/blob`, OpenAI SDK, `@upstash/ratelimit` + `@upstash/redis`（或 Vercel KV 等价封装）, `zod`, Node `crypto` HMAC

**Spec:** `docs/superpowers/specs/2026-06-05-api-security-design.md`

---

## 文件结构（新建/修改）

| 路径 | 职责 |
|------|------|
| `lib/auth/ghostToken.ts` | 签发/验证 Ghost HMAC token |
| `lib/auth/session.ts` | Session JWT 读写（或 Auth.js 适配层） |
| `lib/auth/getActor.ts` | 解析请求 → `{ type: 'ghost'|'user', ghostId?, userId? }` |
| `lib/api/errors.ts` | 统一 `{ error: { code, message } }` |
| `lib/api/rateLimit.ts` | IP / Ghost / User 计数 |
| `lib/receipts/ownership.ts` | receipt 归属断言 |
| `lib/receipts/uploadValidation.ts` | 魔数、大小、MIME |
| `lib/receipts/processReceipt.ts` | Blob put → OpenAI → DB 更新 |
| `lib/openai/receiptVision.ts` | Vision JSON schema 调用 |
| `middleware.ts` | 可选：全局 `/api/*` 安全头 |
| `app/api/ghost/register/route.ts` | Ghost 登记 |
| `app/api/receipts/route.ts` | GET 列表 + POST 上传 |
| `app/api/receipts/[id]/route.ts` | GET / DELETE |
| `app/api/receipts/[id]/process/route.ts` | 触发/重试 AI |
| `lib/storage/ghostClient.ts` | 客户端：register + fetch 带 credentials |

---

### Task 1: 依赖与环境变量

**Files:**
- Modify: `package.json`
- Create: `.env.example`（若不存在则新建）

- [ ] **Step 1: 安装运行时依赖**

```bash
npm install @prisma/client @vercel/blob openai zod @upstash/ratelimit @upstash/redis jose
npm install -D prisma
```

- [ ] **Step 2: 追加 `.env.example`**

```bash
DATABASE_URL=
GHOST_HMAC_SECRET=          # openssl rand -base64 32
AUTH_SECRET=                # Session JWT
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
BLOB_READ_WRITE_TOKEN=
KV_REST_API_URL=            # Upstash / Vercel KV
KV_REST_API_TOKEN=
RECEIPT_MAX_BYTES=5242880
RECEIPT_GHOST_HOURLY=10
RECEIPT_USER_HOURLY=30
RECEIPT_GHOST_MAX_UNBOUND=50
RECEIPT_CONFIDENCE_THRESHOLD=0.7
```

- [ ] **Step 3: 运行 `npx prisma generate`**

Expected: 生成 `@prisma/client` 无报错

---

### Task 2: Ghost HMAC token

**Files:**
- Create: `lib/auth/ghostToken.ts`
- Test: `lib/auth/ghostToken.test.ts`（Node `node:test`）

- [ ] **Step 1: 写失败测试**

```typescript
// lib/auth/ghostToken.test.ts
import { test, strict as assert } from "node:test";
import { signGhostToken, verifyGhostToken } from "./ghostToken";

test("sign and verify ghost token", () => {
  process.env.GHOST_HMAC_SECRET = "test-secret-min-32-chars-long!!";
  const { token, ghostId } = signGhostToken();
  const payload = verifyGhostToken(token);
  assert.equal(payload.ghostId, ghostId);
});

test("reject tampered token", () => {
  process.env.GHOST_HMAC_SECRET = "test-secret-min-32-chars-long!!";
  const { token } = signGhostToken();
  assert.throws(() => verifyGhostToken(token.slice(0, -1) + "x"));
});
```

- [ ] **Step 2: 运行测试确认 FAIL**

Run: `node --import tsx --test lib/auth/ghostToken.test.ts`  
（若无 tsx：`npm i -D tsx`）  
Expected: FAIL — module not found

- [ ] **Step 3: 实现 `lib/auth/ghostToken.ts`**

```typescript
import { createHmac, randomUUID, timingSafeEqual } from "crypto";

const COOKIE_NAME = "snap1099_ghost";
const TTL_MS = 90 * 24 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.GHOST_HMAC_SECRET;
  if (!s) throw new Error("GHOST_HMAC_SECRET missing");
  return s;
}

export function signGhostToken(existingGhostId?: string) {
  const ghostId = existingGhostId ?? randomUUID();
  const exp = Date.now() + TTL_MS;
  const body = `${ghostId}.${exp}`;
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  const token = `${body}.${sig}`;
  return { token, ghostId, cookieName: COOKIE_NAME };
}

export function verifyGhostToken(token: string): { ghostId: string; exp: number } {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("INVALID_GHOST_TOKEN");
  const [ghostId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!ghostId || !Number.isFinite(exp) || Date.now() > exp) throw new Error("INVALID_GHOST_TOKEN");
  const body = `${ghostId}.${expStr}`;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("INVALID_GHOST_TOKEN");
  return { ghostId, exp };
}

export { COOKIE_NAME as GHOST_COOKIE_NAME };
```

- [ ] **Step 4: 运行测试 PASS**

---

### Task 3: `getActor` 请求解析

**Files:**
- Create: `lib/auth/getActor.ts`
- Create: `lib/api/errors.ts`

- [ ] **Step 1: 实现 `lib/api/errors.ts`**

```typescript
import { NextResponse } from "next/server";

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}
```

- [ ] **Step 2: 实现 `getActor(request)`**

规则：
1. 解析 `snap1099_session` → userId（Task 4 或 stub）
2. 否则解析 Cookie / `Authorization: Ghost <token>` → verifyGhostToken
3. 若 Header `X-Ghost-Id` 存在且与 token ghostId 不一致 → 401
4. 若 Ghost 已绑定 user（查 `snaptax_ghost_account`）且请求为写操作 → 401 `GOOGLE_LOGIN_REQUIRED`

返回类型：

```typescript
export type Actor =
  | { kind: "user"; userId: string; ghostId?: string }
  | { kind: "ghost"; ghostId: string; readOnly: boolean };
```

---

### Task 4: `POST /api/ghost/register`

**Files:**
- Create: `app/api/ghost/register/route.ts`

- [ ] **Step 1: 实现 route**

```typescript
import { NextResponse } from "next/server";
import { signGhostToken, GHOST_COOKIE_NAME } from "@/lib/auth/ghostToken";

export async function POST() {
  const { token, ghostId } = signGhostToken();
  const res = NextResponse.json({ ghostId }, { status: 201 });
  res.cookies.set(GHOST_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 90 * 24 * 60 * 60,
  });
  return res;
}
```

- [ ] **Step 2: 手动验证**

Run dev server → `curl -i -X POST http://localhost:3000/api/ghost/register`  
Expected: 201 + `Set-Cookie: snap1099_ghost=...`

---

### Task 5: 速率限制

**Files:**
- Create: `lib/api/rateLimit.ts`

- [ ] **Step 1: 实现 IP / Ghost / User limiter**

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const ipReceiptLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "rl:ip:receipt",
});

export const ghostReceiptLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    Number(process.env.RECEIPT_GHOST_HOURLY ?? 10),
    "1 h"
  ),
  prefix: "rl:ghost:receipt",
});
```

- [ ] **Step 2: 超限返回 429 + `Retry-After`**

---

### Task 6: 上传校验

**Files:**
- Create: `lib/receipts/uploadValidation.ts`

- [ ] **Step 1: 魔数检测 JPEG/PNG**

```typescript
const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47];

export function assertValidReceiptImage(bytes: Buffer): "jpeg" | "png" {
  const max = Number(process.env.RECEIPT_MAX_BYTES ?? 5_242_880);
  if (bytes.length > max) throw new Error("FILE_TOO_LARGE");
  if (JPEG.every((b, i) => bytes[i] === b)) return "jpeg";
  if (PNG.every((b, i) => bytes[i] === b)) return "png";
  throw new Error("INVALID_FILE_TYPE");
}
```

---

### Task 7: 归属（IDOR）

**Files:**
- Create: `lib/receipts/ownership.ts`

- [ ] **Step 1: `assertReceiptAccess(receipt, actor)`**

```typescript
import type { SnaptaxReceipt } from "@prisma/client";
import type { Actor } from "@/lib/auth/getActor";

export function assertReceiptAccess(receipt: SnaptaxReceipt, actor: Actor): void {
  if (actor.kind === "user") {
    if (receipt.userId !== actor.userId) throw new Error("NOT_FOUND");
    return;
  }
  if (receipt.userId != null) throw new Error("NOT_FOUND");
  if (receipt.ghostId !== actor.ghostId) throw new Error("NOT_FOUND");
}
```

- [ ] **Step 2: Route 层 catch → **404**（非 403）**

---

### Task 8: `POST /api/receipts` 上传流水线

**Files:**
- Create: `lib/receipts/processReceipt.ts`
- Create: `lib/openai/receiptVision.ts`
- Create: `app/api/receipts/route.ts`

- [ ] **Step 1: Blob private upload**

```typescript
import { put } from "@vercel/blob";

const blob = await put(`receipts/${receiptId}.jpg`, file, {
  access: "private",
  contentType: mime,
});
```

- [ ] **Step 2: OpenAI 仅服务端 — 禁止客户端 URL**

`receiptVision.ts` 接受 `Buffer` 或 **服务端** `blob.downloadUrl` + 自签短期 URL；不接受 request body 中的 `imageUrl`。

- [ ] **Step 3: Zod schema 校验 AI 输出**

```typescript
import { z } from "zod";

export const ReceiptAiSchema = z.object({
  amount: z.number().min(0),
  merchant: z.string(),
  category: z.string(),
  deductible: z.boolean(),
  confidence: z.number().min(0).max(1),
});
```

- [ ] **Step 4: Ghost 未绑定累计 ≤ 50 张校验**

Prisma: `count({ where: { ghostId, userId: null } })`

- [ ] **Step 5: Route 串联 getActor → rateLimit → validate → put → process → 201**

---

### Task 9: Receipt CRUD 路由

**Files:**
- Create: `app/api/receipts/[id]/route.ts`
- Create: `app/api/receipts/[id]/process/route.ts`

- [ ] **Step 1:** GET / DELETE 均 `findUnique` + `assertReceiptAccess`
- [ ] **Step 2:** POST process 仅 `status=processing` + idempotency（同 id 重复调用不二次扣 OpenAI）

---

### Task 10: 客户端 Ghost 登记

**Files:**
- Create: `lib/storage/ghostClient.ts`
- Modify: `components/home/HomeScreen.tsx`（或拍照/upload 入口）

- [ ] **Step 1: `ensureGhostSession()`**

```typescript
export async function ensureGhostSession(): Promise<string> {
  const res = await fetch("/api/ghost/register", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("ghost register failed");
  const { ghostId } = await res.json();
  localStorage.setItem("snap1099_ghost_id", ghostId); // 仅 UI/调试
  return ghostId;
}
```

- [ ] **Step 2: 联网上传前调用；fetch 一律 `credentials: "include"`**

---

### Task 11: 验证与文档

- [ ] **Step 1:** `npm run build` 通过
- [ ] **Step 2:** 手动场景：无 Cookie 上传 → 401；register 后上传 → 201；遍历他人 id → 404
- [ ] **Step 3:** 更新 `docs/superpowers/specs/2026-06-05-api-security-design.md` 状态为「P0 已实现」
- [ ] **Step 4:** 更新 PRODUCT-SPEC §12 里程碑表

---

## Spec 覆盖自检

| Spec § | Task |
|--------|------|
| §3 Ghost HMAC | Task 2–4, 10 |
| §4 上传校验 | Task 6, 8 |
| §5 OpenAI | Task 8 |
| §6 IDOR | Task 7, 9 |
| §7 限流 | Task 5 |
| §9 Secrets/Blob | Task 1, 8 |
| §10 MVP P0 清单 | Task 1–11 |

---

## 执行选项

Plan 已保存。可选：

1. **Subagent-Driven（推荐）** — 每 Task 派生子 agent，任务间 review  
2. **Inline Execution** — 本会话按 Task 顺序实现，检查点暂停

请告知选择；**未收到指示前不写 API 代码**。
