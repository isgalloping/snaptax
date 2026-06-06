# Snap1099 结构化日志规范

**日期：** 2026-06-06  
**状态：** 已批准  
**范围：** 服务端 API 访问日志 + 非 HTTP 业务事件（方案 C）  
**依据：** `docs/tech/10-testing-observability.md` · `docs/superpowers/specs/2026-06-05-api-security-design.md` · `docs/product/PRODUCT-SPEC.md`

---

## 1. 目标与锁定决策

### 1.1 目标

为 Snap1099 **服务端**建立统一结构化日志，支持 HTTP API 审计与非 HTTP 业务事件（OpenAI、Paddle、Blob、Ghost HMAC 等），满足排障、KPI 与安全合规；**不**记录小票原图、密钥或完整 PII。

### 1.2 锁定决策

| 决策点 | 选择 |
|--------|------|
| 范围 | **仅服务端**（Route Handler + `lib/server/*` + integrations） |
| 格式 | **单行 key=value**（logfmt；**不用 JSON**） |
| 输出 | `stdout` → Vercel Runtime Logs / Log Drain |
| Schema | API 与业务事件 **同一 `LogEntry`** |
| 业务板块 | 字段 **`module`**（枚举） |
| 成败 | **`success: boolean`** |
| 耗时 | **`durationMs: number`**（毫秒整数） |
| 身份 | `userId`、`ghostId`、`authChannel`；`email` **脱敏** |
| 扩展 | **`meta`** 白名单键 |
| 客户端 | 不上报同等 schema |

---

## 2. LogEntry Schema

### 2.1 必填

| 字段 | 类型 | 说明 |
|------|------|------|
| `ts` | string | ISO 8601 UTC |
| `level` | `info` \| `warn` \| `error` | 日志级别 |
| `module` | string | 业务板块（§2.3） |
| `success` | boolean | 是否成功 |
| `durationMs` | number | 耗时 ms；无耗时填 `0` |

### 2.2 身份与请求（无则 `null`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `requestId` | string | 请求/trace id |
| `method` | string \| null | HTTP 方法 |
| `route` | string \| null | 如 `/api/receipts` |
| `httpStatus` | number \| null | HTTP 状态码 |
| `userId` | string \| null | `snaptax_users.id` UUID |
| `ghostId` | string \| null | HMAC token 内 ghost id |
| `email` | string \| null | 脱敏（§2.4） |
| `authChannel` | string \| null | 如 `google` |

### 2.3 `module` 枚举

| module | 场景 |
|--------|------|
| `api.auth` | ghost/register, google, logout, me |
| `api.receipt` | receipts CRUD, process |
| `api.user` | users/me, delete |
| `api.entitlement` | entitlements, export |
| `api.webhook` | paddle webhook |
| `biz.openai` | Vision 调用 |
| `biz.blob` | Blob put/delete/signed URL |
| `biz.ghost` | HMAC 签发/校验 |
| `biz.paddle` | Webhook 解析/幂等 |
| `biz.export` | Excel 生成 |

### 2.4 脱敏

| 字段 | 规则 | 示例 |
|------|------|------|
| `email` | 首字符 + `***` + `@` + 域名 | `u***@gmail.com` |
| `ghostId` | MVP 全量 UUID；可选 env 截断 | — |
| `userId` | 内部 UUID 可全量 | — |

**禁止：** 密码、Cookie 值、JWT 全文、API Key、小票 base64、完整 `ai_raw`、stack trace（生产 `meta.errorMessage` 仅短句）。

### 2.5 `meta` 白名单

| 键 | 说明 |
|----|------|
| `receiptId` | 小票 UUID |
| `status` | receipt 状态 |
| `errorCode` | 如 `UNAUTHORIZED` |
| `errorMessage` | 短文本 |
| `taxSeason` | 报税季 |
| `transactionId` | Paddle 交易号 |
| `openaiModel` | 模型名 |
| `tokenUsage` | 代码内 `{ prompt, completion }`；**输出行**拆为 `tokenUsagePrompt` / `tokenUsageCompletion` |
| `ipHash` | IP SHA256 前 8 hex |

新键须更新本 spec + `.cursor/rules/snap1099-logging.mdc`。

### 2.6 单行输出格式

- **一条事件 = 一行文本**，空格分隔 `key=value` 对（logfmt）
- **固定前缀顺序**（有值才输出，无值省略）：  
  `ts` → `level` → `module` → `success` → `durationMs` → `requestId` → `method` → `route` → `httpStatus` → `userId` → `ghostId` → `email` → `authChannel` → meta 白名单键（§2.5）
- **类型：** `success` 为 `true`/`false`；`durationMs` 为整数；其余为字符串
- **含空格或 `=` 的值** 用双引号包裹，内部 `"` 与 `\` 须转义
- **禁止** `JSON.stringify`、多行 pretty print、嵌套 JSON 对象

**示例：**

```
ts=2026-06-06T12:00:01.123Z level=info module=api.receipt success=true durationMs=842 requestId=req_abc method=POST route=/api/receipts httpStatus=201 ghostId=550e8400-e29b-41d4-a716-446655440000 receiptId=rcpt_xyz status=processing
```

---

## 3. 封装 API

### 3.1 目录（实施时）

```
lib/server/log/
├── types.ts          # LogEntry, LogModule, LogMeta
├── mask.ts           # maskEmail, hashIp
├── formatLogLine.ts  # LogEntry → 单行 key=value
├── logEvent.ts       # format + console.log 一行
├── withRequestLog.ts # Route Handler 包装
└── context.ts        # requestId, actor 解析
```

### 3.2 `logEvent(entry: LogEntry)`

- `const line = formatLogLine(entry)` → `console.log(line)`（**单行，非 JSON**）
- 所有级别统一 `console.log`（Vercel 按行采集；MVP 不 duplicate 到 `console.error`）

### 3.2.1 `formatLogLine(entry: LogEntry): string`

- 按 §2.6 顺序拼接 `key=value`；跳过 `null` / `undefined` / 空字符串
- `meta` 白名单键展平到同一行（如 `receiptId=…`），不输出 `meta={...}` JSON
- `tokenUsage` 拆为 `tokenUsagePrompt` / `tokenUsageCompletion` 两个键

### 3.3 `withRequestLog(module, handler)`

```typescript
// 伪代码
export function withRequestLog(module: LogModule, handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    const start = Date.now();
    const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
    const actor = await resolveActor(req); // userId, ghostId, email, authChannel
    try {
      const res = await handler(req, ctx);
      logEvent(buildEntry({ module, success: res.ok, durationMs: Date.now()-start, ...actor, httpStatus: res.status, ... }));
      return res;
    } catch (e) {
      logEvent(buildEntry({ module, success: false, level: "error", meta: { errorCode: "INTERNAL" }, ... }));
      throw e;
    }
  };
}
```

### 3.4 业务事件（非 HTTP）

集成层在关键路径 **手动** 调用 `logEvent`：

```typescript
const start = Date.now();
try {
  const result = await openai.chat.completions.create(...);
  logEvent({ module: "biz.openai", success: true, durationMs: Date.now()-start, requestId, ghostId, meta: { receiptId, tokenUsage, openaiModel } });
} catch (e) {
  logEvent({ module: "biz.openai", success: false, level: "error", durationMs: Date.now()-start, ... });
  throw e;
}
```

**规则：** 同一 HTTP 请求内 OpenAI/Blob 子事件 **继承** 父 `requestId`。

---

## 4. Route 集成点

| Route | module |
|-------|--------|
| `POST /api/ghost/register` | `api.auth` |
| `POST /api/auth/google` | `api.auth` |
| `POST /api/auth/logout` | `api.auth` |
| `GET /api/auth/me` | `api.auth` |
| `GET/POST /api/receipts` | `api.receipt` |
| `GET/DELETE /api/receipts/[id]` | `api.receipt` |
| `POST /api/receipts/[id]/process` | `api.receipt` + 内部 `biz.openai` |
| `DELETE /api/users/me` | `api.user` |
| `GET /api/entitlements/current` | `api.entitlement` |
| `POST /api/export/tax-pack` | `api.entitlement` + `biz.export` |
| `POST /api/webhooks/paddle` | `api.webhook` + `biz.paddle` |

每条 Route **至少 1 条** access log；含 OpenAI 的 Route **额外 1 条** `biz.openai`。

---

## 5. 成败语义

| 场景 | `success` | `httpStatus` | `level` |
|------|-----------|--------------|---------|
| 2xx 正常完成 | `true` | 2xx | `info` |
| 4xx 预期错误（401/404/429） | `false` | 4xx | `warn` |
| 5xx / 未捕获异常 | `false` | 5xx | `error` |
| OpenAI 最终失败 | `false` | `null` | `error` |
| Webhook 签名无效 | `false` | 401 | `warn` |
| Webhook 幂等重复（已处理） | `true` | 200 | `info` |

---

## 6. 示例

### 6.1 API 成功

```
ts=2026-06-06T12:00:01.123Z level=info module=api.receipt success=true durationMs=842 requestId=req_abc method=POST route=/api/receipts httpStatus=201 ghostId=550e8400-e29b-41d4-a716-446655440000 receiptId=rcpt_xyz status=processing
```

### 6.2 已登录 + 脱敏 email

```
ts=2026-06-06T12:01:00.000Z level=info module=api.auth success=true durationMs=320 requestId=req_def method=POST route=/api/auth/google httpStatus=200 userId=a1b2c3d4-e5f6-7890-abcd-ef1234567890 ghostId=550e8400-e29b-41d4-a716-446655440000 email=u***@gmail.com authChannel=google
```

### 6.3 OpenAI 失败

```
ts=2026-06-06T12:00:05.456Z level=error module=biz.openai success=false durationMs=3200 requestId=req_abc ghostId=550e8400-e29b-41d4-a716-446655440000 receiptId=rcpt_xyz errorCode=OPENAI_ERROR openaiModel=gpt-4o
```

---

## 7. 禁止与合规

- 与 API 安全 ADR 一致：不 log 原图、signed URL 全文、Google credential
- Ghost 限流审计可用 `meta.ipHash`，不 log 原始 IP（GDPR 最小化）
- 日志保留遵循 Vercel/子处理方政策；不在日志中存收据财务明细 beyond `receiptId` + `status`

---

## 8. 文档与 Rules 同步

| 文件 | 用途 |
|------|------|
| `.cursor/rules/snap1099-logging.mdc` | Agent 铁律 |
| `docs/tech/10-testing-observability.md` | §10.5 摘要 |
| `.cursor/rules/snap1099-backend.mdc` | 交叉引用 |
| `AGENTS.md` | 仓库入口索引 |

---

## 9. 不在 MVP 范围

- 客户端 fetch 日志上报
- OpenTelemetry / Datadog 自动 instrumentation
- 日志写入 Postgres 表
- 实时日志 UI

---

## 10. 实施

见 [`docs/superpowers/plans/2026-06-06-logging.md`](../plans/2026-06-06-logging.md)。
