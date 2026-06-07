# 服务端 5xx 错误日志增强设计

**日期：** 2026-06-07  
**状态：** 已批准  
**依据：** `docs/superpowers/specs/2026-06-06-logging-design.md`  
**触发：** `POST /api/receipts` 500 时 logfmt 仅有 `httpStatus=500`，无 `errorCode`/`errorMessage` 与 stack

---

## 问题

Route Handler 普遍使用 `catch → return mapErrorToResponse(err)`，**不 throw**。`withRequestLog` 仅在 throw 时写 `errorMessage`，对返回 500 Response 的路径只记 `success=false`，丢失根因。

---

## 决策

| 项 | 选择 |
|----|------|
| 环境 | **B** — dev + Vercel Preview 输出 stack；Production 仅 logfmt 短句 |
| 架构 | **AsyncLocalStorage** 请求上下文 + `mapErrorToResponse` 登记 `pendingError` |
| logfmt | 仍 **单行 key=value**；stack **不进** logfmt |
| stack 输出 | dev/preview：`console.error('[requestId=…]', err)` |

---

## 行为矩阵

| 环境 | logfmt（stdout） | stack |
|------|------------------|-------|
| development | `errorCode` + `errorMessage`（≤120） | `console.error` |
| preview | 同上 | 同上 → Runtime Logs |
| production | 同上 | **无** |

---

## 实现要点

1. **`requestLogContext.ts`** — ALS 存 `{ module, request, actor, pendingError }`
2. **`mapErrorToResponse(err)`** — 写入 `pendingError`；映射 HTTP 响应（客户端 message 不变）
3. **`withRequestLog`** — 响应 `status>=500` 时从 `pendingError` 填 `meta.errorCode/errorMessage`；dev/preview 打 stack；**统一一条** logfmt（含 `durationMs`）
4. **`withRequestLog` catch** — 改为 `return mapErrorToResponse(err)` + 同一套 log 路径（不再 throw）
5. **`resolveApiError(err)`** — 从 `errors.ts` 导出，供 meta 与 Response 共用

---

## Spec 增量（logging-design §2.4）

- Production：**禁止** logfmt 内 stack（不变）
- dev/preview：允许 **第二条** stderr 输出（Node `console.error` 打印 Error stack），须带 `[requestId=…]` 前缀关联

---

## 验收

1. `POST /api/receipts` 500 → logfmt 含 `errorCode` + `errorMessage`
2. 本地 dev 终端可见 stack
3. Production 仅单行 logfmt
4. 单元测试覆盖 `resolveApiError` 与 pendingError 路径
