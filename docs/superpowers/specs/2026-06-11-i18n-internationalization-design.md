# Snap1099 国际化（i18n）设计

**日期：** 2026-06-11
**状态：** 待审核
**前置：** `2026-06-07-user-facing-english-design.md`（已完成的英文文案统一）
**目标语言：** 英文（en）、法文（fr）、德文（de）；未知语区默认 en

---

## 1. 目标

为 Snap1099 PWA 添加完整的多语言支持，覆盖 UI 文案、法律文档、日期/数字格式化。用户无需手动切换语言——浏览器语言偏好自动匹配，不确定时回退英文。

### 1.1 锁定决策

| 决策点 | 选择 |
|--------|------|
| i18n 库 | **`next-intl` v4.12+**（Next.js 16 兼容，~2KB client，原生 Server Components） |
| 路由策略 | **Cookie-based，无 URL 前缀**（PWA 优先；不改 URL 结构） |
| 语言检测 | `navigator.languages` → cookie `NEXT_LOCALE` → 默认 `en` |
| 支持语言 | `en`（默认）、`fr`、`de` |
| 税务/IRS 内容 | **保持英文**（领域术语，不翻译 Schedule C 等） |
| 法律文档 | 翻译 Privacy Policy 和 Terms of Service |
| API 错误信息 | **服务端保持英文 code**，客户端按 locale 翻译展示 |
| Locale vs Tax Region | **独立概念**：UI locale（en/fr/de）≠ tax region（us/eu） |

---

## 2. 已评估方案

### 方案 A：Cookie-based locale，无 URL 前缀 ✅ 推荐

**做法：** `i18n/request.ts` 从 cookie 读 locale；无 middleware 路由；所有页面 URL 不变。

| 优点 | 缺点 |
|------|------|
| PWA 友好：manifest `start_url`/`scope` 不变 | 无 SEO per-locale 路径 |
| Service Worker 预缓存简单：只缓存一套 URL | CDN 需按 cookie 做 Vary |
| 迁移改动最小：不改 `app/` 目录结构 | 切换语言需刷新（或 `router.refresh()`）|
| 离线体验不受影响 | — |

### 方案 B：URL-prefix 路由 (`/[locale]/...`)

**做法：** 在 `app/` 下添加 `[locale]` 动态段，middleware 处理重定向。

| 优点 | 缺点 |
|------|------|
| SEO 友好：每语言独立 URL | PWA manifest 需 per-locale 或动态生成 |
| CDN 自然按 URL 缓存 | Service Worker 预缓存需排除 locale 前缀路由 |
| 标准 next-intl 模式 | **大量目录重构**：所有 `app/` page 迁移到 `app/[locale]/` |

### 方案 C：混合（公开页 URL-prefix + 应用内 Cookie）

| 优点 | 缺点 |
|------|------|
| Legal 页面 SEO 好 | 两套模式，维护成本高 |
| 主应用 PWA 友好 | 路由配置复杂 |

**选择理由：** Snap1099 是 PWA-first 的工具应用，用户通过安装使用，不依赖搜索引擎流量。方案 A 改动最小、PWA 兼容最好、Service Worker 无冲突。

---

## 3. 架构

### 3.1 总体结构

```
├── messages/
│   ├── en.json          ← 英文（source of truth）
│   ├── fr.json          ← 法文
│   └── de.json          ← 德文
├── i18n/
│   ├── config.ts        ← locales 列表、defaultLocale
│   └── request.ts       ← getRequestConfig：从 cookie 读 locale，加载 messages
├── next.config.ts       ← 添加 createNextIntlPlugin 包装
├── app/
│   └── layout.tsx       ← html lang 动态化；添加 NextIntlClientProvider
├── lib/
│   ├── client/locale.ts ← 浏览器端 locale 检测 + cookie 写入
│   └── format.ts        ← localeForRegion → 接受 uiLocale 参数
└── components/
    └── settings/
        └── LanguagePicker.tsx  ← 可选：手动切换语言（可后期添加）
```

### 3.2 Locale 检测流程

```
┌─────────────────────────────────────────────────────────┐
│                     首次访问                             │
│  navigator.languages → 匹配 [en, fr, de] → 写 cookie   │
│  不匹配 → 默认 en → 写 cookie                          │
└──────────────┬──────────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────┐
│                  后续请求                                │
│  i18n/request.ts → cookies().get('NEXT_LOCALE') → locale│
│  cookie 无效/缺失 → 'en'                                │
└──────────────┬──────────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────┐
│              Server Component / Client Component         │
│  useTranslations('Home') / getTranslations('Home')      │
│  useFormatter() → 日期/数字本地化                        │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Locale 与 Tax Region 的分离

```
┌──────────────┐        ┌──────────────┐
│  UI Locale   │        │  Tax Region  │
│  en / fr / de│        │   us / eu    │
│  影响：      │        │  影响：       │
│  - UI 文案   │        │  - 税率计算   │
│  - 日期格式  │        │  - 货币符号   │
│  - 数字格式  │        │  - IRS/VAT    │
│  来源：      │        │  来源：       │
│  - cookie    │        │  - localStorage│
│  NEXT_LOCALE │        │  snap1099_    │
│              │        │  region_      │
│              │        │  candidate    │
└──────────────┘        └──────────────┘
```

**关键：**
- 法文用户可能在 US 报税（加拿大法语区 1099 承包商）→ locale=fr, region=us
- 德文用户在 EU → locale=de, region=eu
- 日期/货币格式同时受两者影响：UI locale 决定翻译文案，tax region 决定货币符号和税务格式

### 3.4 格式化策略

| 格式化场景 | 当前实现 | i18n 后 |
|-----------|---------|---------|
| 收据时间 "Today / Yesterday" | `formatReceiptTime()` 硬编码英文 | `useFormatter().relativeTime()` 或 messages 翻译 |
| 长日期 "June 7, 2026 at 2:43 PM" | `formatReceiptDetailLongDateTime()` 硬编码 "at" | `useFormatter().dateTime()` + locale-aware 连接词 |
| 货币 "$12.34" | `formatCurrencyForRegion()` 按 region | **保持按 region**（税务金额必须用报税辖区货币） |
| 数字 "1,234.56" | 隐式 US 格式 | `useFormatter().number()` 按 UI locale |

---

## 4. 消息文件结构

### 4.1 命名空间设计

按功能域而非文件拆分，减少 client bundle（只加载当前页面需要的 namespace）：

```json
{
  "Common": {
    "back": "Back",
    "cancel": "Cancel",
    "done": "Done",
    "delete": "Delete",
    "retry": "Retry",
    "loading": "Loading…",
    "offline": "Offline",
    "online": "Online"
  },
  "Home": {
    "estimatedTaxSaved": "Estimated Tax Saved",
    "receiptsTracked": "{count, plural, one {# receipt} other {# receipts}} tracked",
    "snapReceipt": "Snap Receipt",
    "takePhoto": "Take a photo of your receipt",
    "resnapReceipt": "Resnap this receipt",
    "allLocalReceipts": "All Local Receipts",
    "pullToRefresh": "Pull to refresh",
    "scanning": "Scanning"
  },
  "ReceiptCard": {
    "uploadPaused": "Upload Paused",
    "receiptBlurry": "Receipt Blurry",
    "resnap": "Resnap",
    "unknownMerchant": "Unknown merchant",
    "needAction": "Need Action",
    "tapToRetry": "Tap to retry"
  },
  "ReceiptFilter": {
    "all": "All",
    "ready": "Ready",
    "processing": "Processing",
    "blurry": "Blurry"
  },
  "ReceiptStatus": {
    "analyzing": "Analyzing",
    "uploading": "Uploading",
    "paused": "Paused"
  },
  "ReceiptDetail": {
    "calculatingDeductions": "Calculating your deductions...",
    "taxAiCouldntRead": "Tax AI Couldn't Read This",
    "merchant": "Merchant",
    "irsLine": "IRS Line",
    "addedToScheduleC": "Added to Schedule C Deduction",
    "personalNonDeductible": "Personal (Non-Deductible)",
    "unknownUnclear": "Unknown (Unclear)",
    "resetZoom": "Reset zoom (1:1)"
  },
  "Camera": {
    "opening": "Opening camera…",
    "openFailed": "Couldn't open camera. Try again.",
    "captureFailed": "Capture failed. Try again.",
    "retry": "Retry",
    "chooseGallery": "Choose from gallery",
    "takePhoto": "Take Photo",
    "flashDone": "Flash Done",
    "doneReview": "Done & Review",
    "batchCount": "Batch {count}",
    "errorNotAllowed": "Camera access is required to snap receipts. Allow camera in your browser settings.",
    "errorNotFound": "No camera found",
    "errorNotReadable": "Camera is in use by another app",
    "errorDefault": "Couldn't open camera. Try again."
  },
  "Settings": {
    "title": "Settings",
    "back": "< Back",
    "yourIndustry": "Your Industry",
    "viewOnAllDevices": "View on All Devices",
    "exportTaxPack": "Export IRS Tax Pack",
    "exportAgain": "Export Again",
    "exportFailed": "Export failed. Please try again."
  },
  "Privacy": {
    "title": "Privacy & Data",
    "deleteAccount": "Delete Account",
    "deleting": "Deleting...",
    "deleteConfirm": "Delete permanently",
    "cancel": "Cancel",
    "deleteFailed": "Delete failed. Please try again.",
    "dataStorage": "Processed and stored in the United States. See Privacy Policy for international transfers."
  },
  "Auth": {
    "continueWithGoogle": "Continue with Google",
    "saveYourReceipts": "Save your receipts",
    "viewOnAllDevices": "View on all devices",
    "signedIn": "Signed in",
    "cloudBackupOn": "Cloud backup on"
  },
  "Paywall": {
    "price": "$49.00",
    "oneTimeForSeason": "One-Time for {season} Tax Season",
    "payWithPaddle": "Pay $49 with Paddle",
    "openingPaddle": "Opening Paddle…",
    "deviceWarning": "If you switch phones without signing in with Google, your purchase cannot be restored."
  },
  "Pwa": {
    "addToHomeScreen": "Add Snap1099 to Home Screen",
    "subtitle": "Open like a native app — snap receipts one-handed on the job site",
    "install": "Install",
    "notNow": "Not now",
    "manualHint": "Tap ⋮ in Chrome, then Install app",
    "manualSheetTitle": "Install Snap1099",
    "manualGotIt": "Got it",
    "manualStepChromiumAndroid1": "Tap the ⋮ menu (top-right of Chrome).",
    "manualStepChromiumAndroid2": "Tap \"Install app\" or \"Add to Home screen\".",
    "manualStepChromiumAndroid3": "Confirm — Snap1099 opens from your home screen like a native app.",
    "manualStepChromiumDesktop1": "Tap the ⋮ menu (top-right of Chrome or Edge).",
    "manualStepChromiumDesktop2": "Tap \"Apps\" → \"Install Snap1099\" (or \"Install this site\").",
    "manualStepChromiumDesktop3": "Confirm — Snap1099 opens in its own window.",
    "manualStepIosSafari1": "Tap the Share button (square with arrow) at the bottom of Safari.",
    "manualStepIosSafari2": "Scroll and tap \"Add to Home Screen\".",
    "manualStepIosSafari3": "Tap \"Add\" — open Snap1099 from your home screen.",
    "manualStepMacosSafari1": "Tap the Share button in Safari's toolbar.",
    "manualStepMacosSafari2": "Choose \"Add to Dock\".",
    "manualStepMacosSafari3": "Snap1099 appears in your Dock like a native app."
  },
  "Offline": {
    "title": "You're offline",
    "body": "You can still snap receipts. They'll upload when you're back online.",
    "backHome": "Back to home"
  },
  "Landing": {
    "loadingToolkit": "Loading your tax-saving toolkit...",
    "snaptaxSystemLog": "Snaptax System Log",
    "privateSecure": "100% Private & Secure",
    "privateSecureDesc": "Encrypted sync when online. Local cache on device.",
    "worksOffline": "Works Offline",
    "worksOfflineDesc": "Snap and queue without signal.",
    "builtForWorkers": "Built for Workers",
    "builtForWorkersDesc": "Construction. Trucking. Delivery."
  },
  "Legal": {
    "privacyPolicy": "Privacy Policy",
    "termsOfService": "Terms of Service",
    "close": "Close",
    "complianceFootnote": "By snapping, you agree to our Terms & Privacy Policy. Online processing stores data in the United States."
  },
  "Industries": {
    "truck_driver": "Truck Driver",
    "plumber": "Plumber",
    "electrician": "Electrician",
    "construction": "Construction",
    "delivery": "Delivery",
    "general": "General 1099"
  },
  "Errors": {
    "authRequired": "Authentication required",
    "googleLoginRequired": "Sign in with Google to continue",
    "notFound": "Resource not found",
    "fileTooLarge": "File exceeds size limit",
    "invalidFileType": "Only JPEG and PNG are allowed",
    "tooManyReceipts": "Too many receipts for unbound ghost",
    "tooManyRequests": "Too many requests",
    "paymentRequired": "Payment required",
    "noReceipts": "No receipts to export",
    "blobNotConfigured": "Blob storage not configured",
    "receiptAnalysisUnavailable": "Receipt analysis is temporarily unavailable",
    "somethingWentWrong": "Something went wrong"
  },
  "DateTime": {
    "today": "Today",
    "yesterday": "Yesterday",
    "at": "at"
  }
}
```

### 4.2 翻译范围

| 类别 | 翻译？ | 说明 |
|------|--------|------|
| UI 按钮/标签 | ✅ | 所有 namespace |
| 日期相对词（Today/Yesterday） | ✅ | `DateTime` namespace |
| 法律文档（Privacy/Terms） | ✅ | 单独的 legal messages 文件或 namespace |
| IRS Schedule C 行标签 | ❌ | 美国税务术语，保持英文 |
| 行业名称 | ✅ | `Industries` namespace |
| API 错误 code | ❌ | 保持英文 code，客户端展示翻译 |
| 收据 AI 提取字段（merchant/category） | ❌ | AI 原始输出，按原始语言展示 |
| 品牌名 "Snap1099" / "Snaptax" | ❌ | 品牌不翻译 |
| 货币金额 | **部分** | 格式化按 locale（千分位/小数点），但货币符号按 tax region |

### 4.3 法律文档翻译策略

法律文档（`lib/legal/content.ts`）内容较多且涉及法律合规，需要单独处理：

```
messages/
├── en.json         ← 主 UI 消息
├── fr.json
├── de.json
└── legal/
    ├── en.json     ← Privacy / Terms 全文
    ├── fr.json
    └── de.json
```

**加载方式：** 法律页面按需加载对应 legal JSON，不放入主 bundle。

**要求：** 法律翻译需要专业审核，初版可用 AI 翻译 + 人工复审标记。每个翻译版本在文件头标注审核状态：
```json
{
  "_meta": { "reviewed": false, "version": "2026-06-11" },
  "Privacy": { ... },
  "Terms": { ... }
}
```

---

## 5. 实现细节

### 5.1 `next.config.ts` 变更

```ts
import { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  env: { /* 现有 env aliases */ },
};

const withNextIntl = createNextIntlPlugin();
export default withSerwist(withNextIntl(nextConfig));
```

**插件组合顺序：** `withSerwist(withNextIntl(config))` — Serwist 在外层，next-intl 在内层。

### 5.2 `i18n/config.ts`

```ts
export const locales = ["en", "fr", "de"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
```

### 5.3 `i18n/request.ts`

```ts
import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale } from "./config";

export default getRequestConfig(async () => {
  const store = await cookies();
  const raw = store.get("NEXT_LOCALE")?.value;
  const locale = locales.includes(raw as any) ? raw! : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

### 5.4 客户端 Locale 检测 (`lib/client/locale.ts`)

```ts
import { locales, defaultLocale, type Locale } from "@/i18n/config";

const LOCALE_COOKIE = "NEXT_LOCALE";

export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return defaultLocale;
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const tag of langs) {
    const base = tag.split("-")[0]?.toLowerCase();
    if (base && (locales as readonly string[]).includes(base)) {
      return base as Locale;
    }
  }
  return defaultLocale;
}

export function ensureLocaleCookie(): Locale {
  const existing = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${LOCALE_COOKIE}=`))
    ?.split("=")[1];
  if (existing && (locales as readonly string[]).includes(existing)) {
    return existing as Locale;
  }
  const detected = detectBrowserLocale();
  document.cookie = `${LOCALE_COOKIE}=${detected};path=/;max-age=31536000;SameSite=Lax`;
  return detected;
}
```

### 5.4.1 Cookie 触发时机

`ensureLocaleCookie()` 由 `app/layout.tsx` 中的一个轻量 Client Component（如 `<LocaleInitializer />`）在首次 hydrate 时调用。它只在 cookie 缺失时写入，后续请求不再触发检测逻辑。

```tsx
"use client";
import { useEffect } from "react";
import { ensureLocaleCookie } from "@/lib/client/locale";

export function LocaleInitializer() {
  useEffect(() => { ensureLocaleCookie(); }, []);
  return null;
}
```

### 5.5 `app/layout.tsx` 变更

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className="...">
      <body>
        <script dangerouslySetInnerHTML={{ __html: INLINE_INSTALL_CAPTURE_SCRIPT }} />
        <NextIntlClientProvider>
          <PwaProvider>{children}</PwaProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 5.6 组件迁移模式

**Server Component（推荐优先）：**
```tsx
import { getTranslations } from "next-intl/server";

export default async function OfflinePage() {
  const t = await getTranslations("Offline");
  return <h1>{t("title")}</h1>;
}
```

**Client Component：**
```tsx
"use client";
import { useTranslations } from "next-intl";

export function SnapButton() {
  const t = useTranslations("Home");
  return <button>{t("snapReceipt")}</button>;
}
```

**ICU 复数：**
```tsx
const t = useTranslations("Home");
// messages: "receiptsTracked": "{count, plural, one {# receipt} other {# receipts}} tracked"
t("receiptsTracked", { count: 5 }); // "5 receipts tracked"
```

### 5.7 `lib/copy/userFacing.ts` 废弃计划

现有的 `USER_COPY` 对象将被 messages JSON 替代。迁移步骤：

1. 在 messages JSON 中创建对应的 namespace/key
2. 逐组件替换 `USER_COPY.xxx` → `useTranslations('Xxx')` / `getTranslations('Xxx')`
3. 所有引用移除后删除 `userFacing.ts`
4. 同理处理 `lib/legal/content.ts` 和 `components/landing/dataStreamCopy.ts`

### 5.8 `lib/format.ts` 变更

现有函数保留，但增加 `uiLocale` 参数用于非税务格式化：

```ts
export function formatReceiptTime(
  date: Date,
  region: TaxRegion = "us",
  translations?: { today: string; yesterday: string }
): string {
  const now = new Date();
  const locale = localeForRegion(region);
  const time = formatClockTime(date, region);

  if (isSameLocalCalendarDay(date, now))
    return `${translations?.today ?? "Today"}, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameLocalCalendarDay(date, yesterday))
    return `${translations?.yesterday ?? "Yesterday"}, ${time}`;

  // ...
}
```

或更优方案：调用方通过 `useFormatter()` / `useTranslations()` 组合替代整个函数。

### 5.9 `lib/api/errors.ts` — 不变

API 错误响应保持英文 `clientMessage`。客户端展示层通过 error `code` 查找翻译：

```tsx
const t = useTranslations("Errors");
const message = t(apiErrorCodeToKey(error.code));
```

---

## 6. PWA / Service Worker 影响

### 6.1 无 URL 前缀 = 无 SW 冲突

因为采用 cookie-based 方案，所有页面 URL 不变（`/`, `/privacy`, `/terms`, `/offline`）。Service Worker 预缓存列表不受影响。

### 6.2 离线页面

`/offline` 页面需要访问翻译。由于 SW fallback 返回预缓存的 HTML，翻译数据需要内联或通过 IndexedDB 缓存。

**方案：** 离线页面使用 Server Component 渲染的默认英文内容，外加一个 Client Component 在有 cookie 时替换为正确语言。预缓存的 `/offline` HTML 默认英文，运行时 hydrate 替换。

### 6.3 Manifest

`app/manifest.ts` 保持英文品牌名 "Snap1099"（品牌不翻译）。`description` 可按请求 locale 动态化，但 PWA manifest 通常只在安装时读取一次，实际影响很小。MVP 保持英文 description。

---

## 7. 迁移计划（文件清单）

按优先级分批迁移，每批可独立合并：

### 第 1 批：基础设施

| 文件 | 变更 |
|------|------|
| `package.json` | 添加 `next-intl` 依赖 |
| `i18n/config.ts` | 新建：locales, defaultLocale |
| `i18n/request.ts` | 新建：getRequestConfig |
| `next.config.ts` | 添加 createNextIntlPlugin |
| `app/layout.tsx` | NextIntlClientProvider + 动态 `lang` |
| `lib/client/locale.ts` | 新建：浏览器 locale 检测 |
| `messages/en.json` | 新建：英文消息文件 |
| `messages/fr.json` | 新建：法文消息文件 |
| `messages/de.json` | 新建：德文消息文件 |

### 第 2 批：核心 UI 组件

| 文件 | 变更 |
|------|------|
| `components/home/TaxHeader.tsx` | `useTranslations('Home')` |
| `components/home/SnapButton.tsx` | `useTranslations('Home')` |
| `components/home/StatusPill.tsx` | `useTranslations('ReceiptStatus')` |
| `components/home/ReceiptList.tsx` | `useTranslations('Home')` |
| `components/home/ReceiptListCard.tsx` | `useTranslations('ReceiptCard')` |
| `components/home/ReceiptFilterBar.tsx` | `useTranslations('ReceiptFilter')` |
| `components/home/HomeScreen.tsx` | `useTranslations('Home')` |

### 第 3 批：Camera + Review

| 文件 | 变更 |
|------|------|
| `components/camera/CameraOverlay.tsx` | `useTranslations('Camera')` |
| `components/camera/CameraLiveFooter.tsx` | `useTranslations('Camera')` |
| `components/camera/CameraShutterControl.tsx` | `useTranslations('Camera')` |
| `components/camera/ReceiptReviewControls.tsx` | `useTranslations('Common')` |
| `components/camera/FlashDoneButton.tsx` | `useTranslations('Camera')` |
| `components/camera/ReviewDoneButton.tsx` | `useTranslations('Camera')` |
| `components/camera/BatchCountBadge.tsx` | `useTranslations('Camera')` |

### 第 4 批：Settings + Auth + Paywall

| 文件 | 变更 |
|------|------|
| `components/settings/SettingsScreen.tsx` | `useTranslations('Settings')` |
| `components/settings/PrivacyDataSection.tsx` | `useTranslations('Privacy')` |
| `components/settings/PaywallSheet.tsx` | `useTranslations('Paywall')` |
| Auth sheets (Google, Sync) | `useTranslations('Auth')` |

### 第 5 批：Landing + PWA + Offline + Legal

| 文件 | 变更 |
|------|------|
| Landing 组件 | `useTranslations('Landing')` |
| PWA 组件 | `useTranslations('Pwa')` |
| `app/offline/page.tsx` | `getTranslations('Offline')` |
| Legal 组件 | 加载 `messages/legal/{locale}.json` |
| Receipt detail 组件 | `useTranslations('ReceiptDetail')` |

### 第 6 批：清理

| 文件 | 变更 |
|------|------|
| `lib/copy/userFacing.ts` | 删除 |
| `lib/legal/content.ts` | 重构为从 messages 读取 |
| `components/landing/dataStreamCopy.ts` | 删除 |
| `lib/format.ts` | 接受 locale 参数 |
| `lib/types.ts` | INDUSTRIES label 改为 i18n key |

---

## 8. 不翻译的内容（明确排除）

| 内容 | 原因 |
|------|------|
| 品牌名 "Snap1099" / "Snaptax" | 品牌标识 |
| IRS Schedule C 行标签（"Line 9 - Car & Truck"） | 美国税法术语，用户需要准确的英文标签对照 IRS 表格 |
| 收据 AI 提取字段（merchant、category 原始值） | AI 按小票原始语言输出 |
| API 内部错误 code | 机器可读标识符 |
| `lib/tax/irsScheduleLabel.ts` | 税务领域术语 |
| 数据库字段值 | 持久化数据不翻译 |
| 内部文档（`docs/`） | 开发文档 |
| Excel 导出列标题 | 保持英文——用户提交给 CPA/税务师需要标准化的英文列名（Date, Merchant, Tax Saved） |

---

## 9. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 法律翻译准确性 | 合规风险 | AI 初译 + 标记"未审核"；上线前须专业法律翻译审核 |
| 翻译遗漏（硬编码字符串） | 用户看到混合语言 | CI 检查：`rg` 扫描组件目录中的裸英文字符串；逐步严格化 |
| Serwist + next-intl 插件冲突 | 构建失败 | 第 1 批先验证插件组合；有冲突可调整包装顺序 |
| 离线页面翻译 | 离线时显示英文 | 可接受的降级；hydrate 后替换 |
| 消息文件体积 | Client bundle 增大 | 按 namespace 拆分加载；Server Components 优先 |
| 法文/德文文案过长撑破 UI | 布局错位 | 翻译时限制字符长度；Tailwind `truncate` / `line-clamp` |

---

## 10. 验证标准

### 10.1 功能验证

```bash
# 构建成功
npm run build

# 英文默认
curl -s http://localhost:3000 | grep 'lang="en"'

# 法文 cookie
curl -s -b 'NEXT_LOCALE=fr' http://localhost:3000 | grep 'lang="fr"'

# 德文 cookie
curl -s -b 'NEXT_LOCALE=de' http://localhost:3000 | grep 'lang="de"'

# 未知语言回退英文
curl -s -b 'NEXT_LOCALE=ja' http://localhost:3000 | grep 'lang="en"'
```

### 10.2 翻译完整性

```bash
# 检查 fr.json 和 de.json 的 key 与 en.json 一致
node -e "
  const en = require('./messages/en.json');
  const fr = require('./messages/fr.json');
  const de = require('./messages/de.json');
  const enKeys = JSON.stringify(Object.keys(en).sort());
  const frKeys = JSON.stringify(Object.keys(fr).sort());
  const deKeys = JSON.stringify(Object.keys(de).sort());
  console.assert(enKeys === frKeys, 'FR keys mismatch');
  console.assert(enKeys === deKeys, 'DE keys mismatch');
  console.log('All locale keys match');
"
```

### 10.3 无残留中文/硬编码检查

```bash
# 组件中不应有裸的用户可见硬编码字符串（逐步严格化）
rg '[\u4e00-\u9fff]' components app lib/copy lib/camera --glob '*.{tsx,ts}'
```

---

## 11. 未来扩展

| 方向 | 优先级 | 说明 |
|------|--------|------|
| 设置页语言切换器 | 中 | 允许用户手动覆盖浏览器语言 |
| URL-prefix 路由 | 低 | 如需 SEO 可后期迁移 |
| 更多语言（es, pt, it） | 低 | 框架就绪后只需添加 messages 文件 |
| Excel 导出本地化 | 中 | 列标题按 locale 翻译 |
| AI 提取 prompt 按用户语言调整 | 低 | OpenAI Vision prompt 已按 tax region 分；可扩展 |
| ICU message 编译（SWC 插件） | 低 | 性能优化：编译时替代运行时解析 |
