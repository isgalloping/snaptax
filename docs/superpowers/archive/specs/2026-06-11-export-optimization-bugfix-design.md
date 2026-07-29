# 小票导出逻辑优化与 Bug 修复设计

> **状态：** Draft  
> **日期：** 2026-06-11  
> **范围：** `app/api/export/tax-pack/route.ts`、`components/settings/SettingsScreen.tsx`、`components/settings/PaywallSheet.tsx`、`lib/client/authApi.ts`、`lib/tax/season.ts`、`lib/client/useAuthSession.ts`  
> **前置文档：** `docs/tech/08-export.md`、`docs/prd/0.0.1.md` §2.4.3、`2026-06-10-indexeddb-receipt-query-design.md`

---

## 1. 背景

导出功能是 Snap1099 唯一的付费变现入口（$49/税季），也是用户获得最终价值的核心路径。经过全面代码审计，发现以下三类问题：

1. **产品语义 Bug**：代码行为与 PRD / 技术文档矛盾
2. **竞态条件 / 状态管理 Bug**：支付→导出链路存在时序问题
3. **UX / 健壮性不足**：错误区分不够、缺少加载态、缺日志

---

## 2. Bug 清单

### 2.1 P0 — 产品语义与竞态

#### B1: "Export Again" 仅导出未归档小票（与 PRD 矛盾）

**现状：** `route.ts` 使用 `unfiledReceiptWhere()` 过滤，首次导出后标记 `taxSeason`/`taxSeasonDate`，再次导出只含新小票。

**PRD §2.4.3：** "本季内，该 Google 账号下**全部小票**（含付款后新拍摄的）可**无限次重复导出**"。

**`08-export.md` §8.5：** "每次导出包含**当前全部** done 状态小票（含 Export 后新拍的）"。

**决策：** 遵循 PRD — "Export Again" 应包含本季**所有** `status=done` 小票。`taxSeason`/`taxSeasonDate` 标记保留用于 IndexedDB `isFiled` 索引和 Est. Tax Saved 计算，但**不影响导出查询范围**。

**修复：** 导出查询移除 `unfiledReceiptWhere()`，改为查询 `{ userId, status: "done" }`。导出后仍然标记 `taxSeason`/`taxSeasonDate`（用于 Est. Tax Saved 计算）。

#### B2: Paddle checkout.completed → 立即导出竞态

**现状：** `PaywallSheet` 的 `checkout.completed` 回调立即调用 `onPaid()` → `shareExportFile()`。Paddle Webhook 可能尚未写入 `snaptax_season_entitlements` → 服务端返回 402。

**修复：** 在 `onPaid()` 后导出前，轮询 `GET /api/entitlements/current` 直到确认 `paid=true`，超时后展示友好提示让用户点 "Export Again" 手动重试。

实现：
```typescript
async function pollEntitlementReady(season: string, maxMs = 15000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const paid = await fetchSeasonPaid(season);
    if (paid) return true;
    await new Promise(r => setTimeout(r, 2000));
  }
  return false;
}
```

#### B3: `currentTaxSeason()` 两个分支返回相同值

**现状：**
```typescript
if (month <= 4) return String(year);
return String(year);  // 与 if 分支完全相同
```

**`07-paddle-billing.md`：** 1–4 月报税季为当年，5–12 月为下一年。

**修复：** MVP 暂保持当年返回（所有月份返回当前年）。添加 TODO 注释标注后续季节逻辑。理由：当前为 6 月，如果改为返回 next year 会影响现有用户的 2026 税季导出权益。此项需要产品决策，暂不改动代码逻辑，仅修复死代码分支。

```typescript
export function currentTaxSeason(date = new Date()): string {
  return String(date.getUTCFullYear());
  // TODO: 07-paddle-billing.md 5-12月应返回 next year 税季，需产品决策
}
```

### 2.2 P1 — 状态管理与错误处理

#### B4: Sandbox fallback 伪支付导致 402

**现状：** Paddle.js 不可用时（本地开发/sandbox），`PaywallSheet` 直接调用 `onPaid()` → 本地标记已付费 → 导出 API 返回 402。

**修复：** Sandbox fallback 同时调用一个专用的开发模式 API 来创建测试 entitlement 行，或直接在 fallback 代码中添加明确的 dev-only 警告。生产环境中 Paddle.js 不会不可用。

实现：保留 sandbox fallback 但添加 `console.warn` 说明此为开发模式，导出仍可能 402。不新增 API。

#### B5: `localStorage` 付费缓存可能过期

**现状：** `useAuthSession` 使用 `prev || isSeasonPaid(CURRENT_SEASON)` 逻辑，`localStorage` 的 `true` 可覆盖服务端的 `false`。

**影响：** 按钮显示 "Export Again" 但导出会返回 402。

**修复：** 当 API 明确返回 `paid=false` 时，清除 `localStorage` 缓存。`setSeasonPaidState` 仅在 API 返回 `true` 或 localStorage 且 API 不可达时为 `true`。

```typescript
if (me.user) {
  const paid = await fetchSeasonPaid(CURRENT_SEASON);
  if (!cancelled) {
    setSeasonPaidState(paid);
    if (!paid) setSeasonPaid(CURRENT_SEASON, false); // 清除过期缓存
  }
}
```

#### B6: `refreshSeasonPaid` 传入但未使用

**现状：** `HomeScreen` 把 `refreshSeasonPaid` 传给 `SettingsScreen`，但后者从未调用。

**修复：** 在 `SettingsScreen` 导出成功后调用 `refreshSeasonPaid?.()`，确保状态同步。

#### B7: 422 NO_RECEIPTS 与通用错误不区分

**现状：** `exportTaxPack()` 对非 402 的 `!res.ok` 统一抛 `EXPORT_FAILED`。

**修复：** 增加 422 状态码解析，抛出 `NO_RECEIPTS` 错误。客户端展示专用提示文案。

```typescript
if (res.status === 402) throw new Error("PAYMENT_REQUIRED");
if (res.status === 422) throw new Error("NO_RECEIPTS");
if (!res.ok) throw new Error("EXPORT_FAILED");
```

客户端：
```typescript
if (err.message === "NO_RECEIPTS") {
  setErrorMessage("No completed receipts to export. Snap some receipts first!");
}
```

#### B8: `navigator.share` 取消被静默吞掉

**现状：** `.catch(() => {})` 不区分用户取消与真实错误。

**修复：** 区分 `AbortError`（用户取消）和其他错误。取消不视为错误；其他错误回退到 `<a download>`。

```typescript
try {
  await navigator.share({ files: [file], title, text });
} catch (e) {
  if (e instanceof DOMException && e.name === "AbortError") return;
  // 回退 download
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url; a.download = file.name; a.click();
  URL.revokeObjectURL(url);
}
```

### 2.3 P2 — 质量与可观测性

#### B9: 缺少 `biz.export` 日志事件

**现状：** Route 使用 `withRequestLog("api.entitlement", ...)`，无导出成功的业务日志。

**修复：** 导出成功后额外 emit `biz.export` 日志，包含 `receiptCount`、`taxSeason`、`totalExpenses`、`totalTaxSaved` 元数据。

#### B10: Notes 列始终为空

**现状：** `08-export.md` 规定 "空或 AI notes"，代码硬编码 `notes: ""`。

**修复（MVP scope）：** 暂保持空字符串。AI notes 提取需要从 `ai_raw` JSON 中解析，属于后续增强。添加 TODO 注释。

#### B11: IRS Schedule 标签未在 Excel 中使用

**现状：** `lib/tax/irsScheduleLabel.ts` 已实现但导出不使用。

**修复：** 在 Expenses sheet 中增加 "IRS Schedule" 列，使用 `irsScheduleLabel(category)` 填充。

#### B12: PaywallSheet useEffect 依赖 `onPaid` 闭包

**现状：** `useEffect([onPaid])` 中 `onPaid` 是内联 async 函数，每次渲染重新创建 → Paddle 可能重复初始化。

**修复：** 将 `onPaid` 回调从 `useEffect` 依赖中移除，使用 `useRef` 存储最新回调。Paddle 初始化只执行一次。

```typescript
const onPaidRef = useRef(onPaid);
onPaidRef.current = onPaid;

useEffect(() => {
  // init Paddle once, use onPaidRef.current in callback
}, []); // no onPaid dep
```

---

## 3. 优化项

### O1: 导出按钮加载态

**现状：** 导出期间按钮无状态变化，可重复点击。

**修复：** 添加 `exporting` state：按钮显示 "Exporting…"，`disabled={true}`，防止重复请求。

### O2: 离线检查前置

**现状：** 离线时导出直接网络失败，展示通用错误。

**修复：** 在调用 `exportTaxPack()` 前检查 `navigator.onLine`，展示 "You're offline. Connect to export."。

### O3: 导出后本地状态刷新

**现状：** 导出标记 `taxSeason` 后，IndexedDB / Est. Tax Saved 不会立即更新。

**修复：** 导出成功后触发 receipt list sync → 更新 IndexedDB → 刷新 Est. Tax Saved 显示。

### O4: `handleExportAgain` 中 402 处理一致化

**现状：** `handleExportAgain` 捕获 `PAYMENT_REQUIRED` 并打开 Paywall，但 `runAfterGoogleSignIn` 的 export 路径不做同样处理。

**修复：** 统一提取 `safeExport()` 函数，两个路径共享错误处理逻辑。

---

## 4. 不改动项（需产品决策或超出 MVP 范围）

| 项 | 理由 |
|---|---|
| `currentTaxSeason()` 跨季逻辑 | 需产品决策 5-12 月返回哪个税季 |
| AI Notes 填充 | 需定义 `ai_raw` 中 notes 提取规则 |
| Blob signed URL 交付（方案 A） | 当前方案 B 直接 stream 已满足 MVP |
| 导出审计表 | 08-export.md 标注为可选后续 |
| Sandbox fallback 创建真实 entitlement | 仅开发环境问题，不影响生产 |

---

## 5. 实现优先级

| 优先级 | 编号 | 描述 | 文件 |
|--------|------|------|------|
| **P0** | B1 | Export Again 查询全部 done 小票 | `route.ts` |
| **P0** | B2 | 支付→导出竞态轮询 | `SettingsScreen.tsx` |
| **P1** | B7 | 区分 NO_RECEIPTS 错误 | `authApi.ts`, `SettingsScreen.tsx` |
| **P1** | B8 | Share API 取消 vs 错误区分 | `SettingsScreen.tsx` |
| **P1** | B5 | localStorage 付费缓存修正 | `useAuthSession.ts`, `authStorage.ts` |
| **P1** | B6 | 使用 refreshSeasonPaid | `SettingsScreen.tsx` |
| **P1** | O1 | 导出按钮加载态 | `SettingsScreen.tsx` |
| **P1** | O2 | 离线检查前置 | `SettingsScreen.tsx` |
| **P1** | O4 | 统一 export 错误处理 | `SettingsScreen.tsx` |
| **P2** | B3 | currentTaxSeason 死代码清理 | `season.ts` |
| **P2** | B9 | biz.export 日志 | `route.ts` |
| **P2** | B11 | IRS Schedule 列 | `route.ts` |
| **P2** | B12 | PaywallSheet useEffect 修复 | `PaywallSheet.tsx` |
| **P2** | O3 | 导出后本地状态刷新 | `SettingsScreen.tsx` |
| **Defer** | B4 | Sandbox fallback 警告 | `PaywallSheet.tsx` |
| **Defer** | B10 | Notes 列填充 | `route.ts` |

---

## 6. 技术方案详解

### 6.1 B1: 导出查询修复

**Before:**
```typescript
prisma.snaptaxReceipt.findMany({
  where: {
    userId: actor.userId,
    status: "done",
    ...unfiledReceiptWhere(), // ← 仅未归档
  },
  orderBy: { capturedAt: "asc" },
}),
```

**After:**
```typescript
prisma.snaptaxReceipt.findMany({
  where: {
    userId: actor.userId,
    status: "done",
  },
  orderBy: { capturedAt: "asc" },
}),
```

**副作用：** `updateMany` 的 `taxSeason`/`taxSeasonDate` 标记变为**幂等**（已标记的不影响），符合 "Export Again 无限次" 语义。422 NO_RECEIPTS 条件变为 "用户没有任何 done 小票"（而非 "没有未归档的"）。

### 6.2 B2: 支付→导出轮询

在 `SettingsScreen.tsx` 的 `onPaid` 回调中：

```typescript
onPaid={async () => {
  onSeasonPaid();           // 本地标记
  setShowPaywall(false);
  setExporting(true);
  try {
    const ready = await pollEntitlementReady(currentSeason);
    if (!ready) {
      setErrorMessage("Payment confirmed. Tap Export Again to download.");
      return;
    }
    await shareExportFile();
  } catch {
    setErrorMessage("Export failed after payment. Try Export Again.");
  } finally {
    setExporting(false);
  }
}}
```

### 6.3 O1 + O2 + O4: 统一导出函数

抽取 `safeExport()` 统一处理：

```typescript
const safeExport = async () => {
  clearError();
  if (!navigator.onLine) {
    setErrorMessage("You're offline. Connect to export.");
    return;
  }
  setExporting(true);
  try {
    await shareExportFile();
    refreshSeasonPaid?.();
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "PAYMENT_REQUIRED") { setShowPaywall(true); return; }
      if (err.message === "NO_RECEIPTS") {
        setErrorMessage("No completed receipts to export. Snap some receipts first!");
        return;
      }
    }
    setErrorMessage("Export failed. Please try again.");
  } finally {
    setExporting(false);
  }
};
```

### 6.4 B9: 日志补充

在 `route.ts` 导出成功后增加 `logEvent`：

```typescript
import { logEvent } from "@/lib/server/log/logEvent";

logEvent({
  module: "biz.export",
  level: "info",
  success: true,
  userId: actor.userId,
  meta: {
    taxSeason: season,
    receiptCount: receipts.length,
  },
});
```

### 6.5 B11: IRS Schedule 列

```typescript
import { irsScheduleLabel } from "@/lib/tax/irsScheduleLabel";

expenses.columns = [
  // ... existing columns
  { header: "IRS Schedule", key: "irsSchedule", width: 40 },
];

expenses.addRow({
  // ... existing fields
  irsSchedule: irsScheduleLabel(r.category ?? undefined),
});
```

### 6.6 B12: PaywallSheet useRef 修复

```typescript
const onPaidRef = useRef(onPaid);
useEffect(() => { onPaidRef.current = onPaid; });

useEffect(() => {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!token) return;
  void initializePaddle({
    environment: token.startsWith("test_") ? "sandbox" : "production",
    token,
    eventCallback: (event) => {
      if (event.name === "checkout.completed") {
        void onPaidRef.current();
      }
    },
  }).then((instance) => { paddleRef.current = instance ?? null; });
}, []); // ← 初始化只跑一次
```

---

## 7. 测试策略

### 7.1 自动化测试

- `filedStatus.test.ts` 现有测试不受影响
- 新增 `exportTaxPack` 函数层面的单元测试（mock `apiFetch`）：
  - 402 → throws PAYMENT_REQUIRED
  - 422 → throws NO_RECEIPTS
  - 200 → returns File
- `currentTaxSeason` 简化后的验证

### 7.2 手动测试

- 启动 dev server，Ghost 注册后导航到 Settings
- 验证导出按钮加载态（disabled + "Exporting…"）
- 离线模式下点击导出 → 显示离线提示
- 验证错误提示文案差异化

### 7.3 构建验证

- `npm run lint`
- `npm run build`（确保无类型错误）

---

## 8. 文件变更清单

| 文件 | 变更类型 | 涉及修复项 |
|------|---------|-----------|
| `app/api/export/tax-pack/route.ts` | 修改 | B1, B9, B11 |
| `components/settings/SettingsScreen.tsx` | 修改 | B2, B6, B7, B8, O1, O2, O4 |
| `components/settings/PaywallSheet.tsx` | 修改 | B12 |
| `lib/client/authApi.ts` | 修改 | B7 |
| `lib/client/useAuthSession.ts` | 修改 | B5 |
| `lib/client/authStorage.ts` | 不变 | B5 (`setSeasonPaid(s, false)` 已存在) |
| `lib/tax/season.ts` | 修改 | B3 |
| `docs/tech/08-export.md` | 修改 | 文档对齐 |
