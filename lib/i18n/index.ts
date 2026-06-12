import type { Industry } from "@/lib/types";

export const DEFAULT_LOCALE = "en-US";
export const SUPPORTED_LOCALES = ["en-US", "zh-CN"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type UserCopy = {
  app: {
    description: string;
  };
  pwa: {
    title: string;
    subtitle: string;
    install: string;
    howToInstall: string;
    dismiss: string;
    manualHint: string;
    manualSheetTitle: string;
    manualSheetLead: string;
    manualGotIt: string;
    manualSteps: {
      chromiumAndroid: string[];
      chromiumDesktop: string[];
      iosSafari: string[];
      macosSafari: string[];
    };
  };
  camera: {
    opening: string;
    openFailed: string;
    captureFailed: string;
    retry: string;
    chooseGallery: string;
    errors: {
      notAllowed: string;
      notFound: string;
      notReadable: string;
      abort: string;
      default: string;
    };
  };
  offline: {
    label: string;
    title: string;
    body: string;
    backHome: string;
  };
  home: {
    taxHeader: {
      title: string;
      receiptSingular: string;
      receiptPlural: string;
      tracked: string;
      installApp: string;
      syncReceipts: string;
      settings: string;
    };
    snapButton: {
      title: string;
      resnapSubtitle: string;
      subtitle: string;
    };
    receiptList: {
      filters: {
        all: string;
        done: string;
        processing: string;
        blurry: string;
        stuckAria: string;
      };
      title: string;
      refresh: string;
      emptyFirst: string;
      emptyFilter: string;
      uploadPaused: string;
      analysisPaused: string;
      uploading: string;
      tapToRetry: string;
      processing: string;
      receiptBlurry: string;
      needAction: string;
      resnap: string;
      unknownMerchant: string;
      status: {
        analyzing: string;
        uploading: string;
        paused: string;
      };
    };
  };
  legal: {
    compliance: {
      prefix: string;
      terms: string;
      middle: string;
      privacy: string;
      suffix: string;
    };
  };
  settings: {
    back: string;
    title: string;
    account: {
      title: string;
      signedInPrefix: string;
      cloudBackupOn: string;
      taxSeasonPaid: string;
      notSignedIn: string;
      backupHint: string;
      googleCta: string;
    };
    language: {
      title: string;
      english: string;
      chinese: string;
    };
    industry: {
      title: string;
      labels: Record<Industry, string>;
    };
    multiDevice: {
      title: string;
      button: string;
    };
    privacyData: {
      title: string;
      privacy: string;
      terms: string;
      dataStorage: string;
      dataStorageValue: string;
      contactPrefix: string;
      deleteAccount: string;
      deleteFailed: string;
      deleteTitle: string;
      deleteSignedInWarning: string;
      deleteGhostWarning: string;
      deleting: string;
      deletePermanently: string;
      cancel: string;
    };
    export: {
      title: string;
      button: string;
      buttonPaid: string;
      exporting: string;
      shareText: string;
      offline: string;
      noReceipts: string;
      failed: string;
      failedAfterPayment: string;
      paymentConfirmed: string;
    };
  };
};

const USER_COPY_BY_LOCALE: Record<Locale, UserCopy> = {
  "en-US": {
    app: {
      description: "Snap receipts, auto-categorize. Simple 1099 bookkeeping.",
    },
    pwa: {
      title: "Add Snap1099 to Home Screen",
      subtitle:
        "Open like a native app — snap receipts one-handed on the job site",
      install: "Install",
      howToInstall: "How to add",
      dismiss: "Not now",
      manualHint: "Tap ⋮ in Chrome, then Install app",
      manualSheetTitle: "Install Snap1099",
      manualSheetLead:
        "Your browser can't install automatically — follow these steps:",
      manualGotIt: "Got it",
      manualSteps: {
        chromiumAndroid: [
          "Tap the ⋮ menu (top-right of Chrome).",
          'Tap "Install app" or "Add to Home screen".',
          "Confirm — Snap1099 opens from your home screen like a native app.",
        ],
        chromiumDesktop: [
          "Tap the ⋮ menu (top-right of Chrome or Edge).",
          'Tap "Apps" → "Install Snap1099" (or "Install this site").',
          "Confirm — Snap1099 opens in its own window.",
        ],
        iosSafari: [
          "Tap the Share button (square with arrow) at the bottom of Safari.",
          'Scroll and tap "Add to Home Screen".',
          'Tap "Add" — open Snap1099 from your home screen.',
        ],
        macosSafari: [
          "Tap the Share button in Safari's toolbar.",
          'Choose "Add to Dock".',
          "Snap1099 appears in your Dock like a native app.",
        ],
      },
    },
    camera: {
      opening: "Opening camera…",
      openFailed: "Couldn't open camera. Try again.",
      captureFailed: "Capture failed. Try again.",
      retry: "Retry",
      chooseGallery: "Choose from gallery",
      errors: {
        notAllowed:
          "Camera access is required to snap receipts. Allow camera in your browser settings.",
        notFound: "No camera found",
        notReadable: "Camera is in use by another app",
        abort: "Couldn't open camera. Try again.",
        default: "Couldn't open camera. Try again.",
      },
    },
    offline: {
      label: "OFFLINE",
      title: "You're offline",
      body: "You can still snap receipts. They'll upload when you're back online.",
      backHome: "Back to home",
    },
    home: {
      taxHeader: {
        title: "Estimated Tax Saved",
        receiptSingular: "receipt",
        receiptPlural: "receipts",
        tracked: "tracked",
        installApp: "Install app",
        syncReceipts: "Sync receipts",
        settings: "Settings",
      },
      snapButton: {
        title: "Snap Receipt",
        resnapSubtitle: "Resnap this receipt",
        subtitle: "Take a photo of your receipt",
      },
      receiptList: {
        filters: {
          all: "ALL",
          done: "READY",
          processing: "PROCESSING",
          blurry: "BLURRY",
          stuckAria: "Stuck receipts",
        },
        title: "All Local Receipts",
        refresh: "Pull to refresh",
        emptyFirst: "Snap your first receipt to get started",
        emptyFilter: "No receipts in this filter",
        uploadPaused: "UPLOAD PAUSED",
        analysisPaused: "ANALYSIS PAUSED",
        uploading: "UPLOADING...",
        tapToRetry: "Tap to retry",
        processing: "Processing",
        receiptBlurry: "Receipt Blurry",
        needAction: "Need Action",
        resnap: "Resnap",
        unknownMerchant: "Unknown merchant",
        status: {
          analyzing: "ANALYZING",
          uploading: "UPLOADING",
          paused: "PAUSED",
        },
      },
    },
    legal: {
      compliance: {
        prefix: "By snapping, you agree to our ",
        terms: "Terms",
        middle: " & ",
        privacy: "Privacy Policy",
        suffix: ". Online processing stores data in the United States.",
      },
    },
    settings: {
      back: "< BACK",
      title: "Settings",
      account: {
        title: "Account",
        signedInPrefix: "Signed in",
        cloudBackupOn: "Cloud backup on",
        taxSeasonPaid: "Tax Season · Paid ✓",
        notSignedIn: "Not signed in · Data lost if you change phones",
        backupHint:
          "Sign in with Google to back up receipts before switching phones.",
        googleCta: "Continue with Google",
      },
      language: {
        title: "Language",
        english: "English",
        chinese: "简体中文",
      },
      industry: {
        title: "Your Industry",
        labels: {
          truck_driver: "Truck Driver",
          plumber: "Plumber",
          electrician: "Electrician",
          construction: "Construction",
          delivery: "Delivery",
          general: "General 1099",
        },
      },
      multiDevice: {
        title: "Multi-Device",
        button: "View on All Devices",
      },
      privacyData: {
        title: "Privacy & Data",
        privacy: "Privacy Policy",
        terms: "Terms of Service",
        dataStorage: "Data storage",
        dataStorageValue:
          "Processed and stored in the United States. See Privacy Policy for international transfers.",
        contactPrefix: "Contact",
        deleteAccount: "Delete Account",
        deleteFailed: "Delete failed. Please try again.",
        deleteTitle: "Delete Account",
        deleteSignedInWarning:
          "This is irreversible. All cloud receipts and account data will be permanently deleted.",
        deleteGhostWarning:
          "Clears all receipts on this device and cloud Ghost data. Cannot be undone.",
        deleting: "Deleting...",
        deletePermanently: "Delete permanently",
        cancel: "Cancel",
      },
      export: {
        title: "Tax Season Export",
        button: "Export IRS Tax Pack",
        buttonPaid: "Export Again",
        exporting: "Exporting…",
        shareText: "Your IRS-ready expense export",
        offline: "You're offline. Connect to export.",
        noReceipts:
          "No completed receipts to export. Snap some receipts first!",
        failed: "Export failed. Please try again.",
        failedAfterPayment: "Export failed after payment. Try Export Again.",
        paymentConfirmed: "Payment confirmed. Tap Export Again to download.",
      },
    },
  },
  "zh-CN": {
    app: {
      description: "拍小票，自动分类。专为 1099 承包者设计的简易记账工具。",
    },
    pwa: {
      title: "添加 Snap1099 到主屏幕",
      subtitle: "像原生 App 一样打开，在工地上单手拍小票",
      install: "安装",
      howToInstall: "如何添加",
      dismiss: "稍后再说",
      manualHint: "点 Chrome 的 ⋮，然后点安装应用",
      manualSheetTitle: "安装 Snap1099",
      manualSheetLead: "你的浏览器无法自动安装，请按以下步骤操作：",
      manualGotIt: "知道了",
      manualSteps: {
        chromiumAndroid: [
          "点击 Chrome 右上角的 ⋮ 菜单。",
          '点击“安装应用”或“添加到主屏幕”。',
          "确认后，Snap1099 会像原生 App 一样从主屏幕打开。",
        ],
        chromiumDesktop: [
          "点击 Chrome 或 Edge 右上角的 ⋮ 菜单。",
          '点击“应用”→“安装 Snap1099”（或“安装此网站”）。',
          "确认后，Snap1099 会在独立窗口中打开。",
        ],
        iosSafari: [
          "点击 Safari 底部的分享按钮。",
          '向下滚动并点击“添加到主屏幕”。',
          '点击“添加”，之后从主屏幕打开 Snap1099。',
        ],
        macosSafari: [
          "点击 Safari 工具栏里的分享按钮。",
          '选择“添加到程序坞”。',
          "Snap1099 会像原生 App 一样出现在程序坞。",
        ],
      },
    },
    camera: {
      opening: "正在打开相机…",
      openFailed: "无法打开相机，请重试。",
      captureFailed: "拍摄失败，请重试。",
      retry: "重试",
      chooseGallery: "从相册选择",
      errors: {
        notAllowed: "需要相机权限才能拍小票，请在浏览器设置中允许相机。",
        notFound: "未找到相机",
        notReadable: "相机正被其他应用占用",
        abort: "无法打开相机，请重试。",
        default: "无法打开相机，请重试。",
      },
    },
    offline: {
      label: "离线",
      title: "当前离线",
      body: "你仍然可以拍小票。恢复网络后会自动上传。",
      backHome: "返回首页",
    },
    home: {
      taxHeader: {
        title: "预估省税",
        receiptSingular: "张小票",
        receiptPlural: "张小票",
        tracked: "已记录",
        installApp: "安装应用",
        syncReceipts: "同步小票",
        settings: "设置",
      },
      snapButton: {
        title: "拍小票",
        resnapSubtitle: "重新拍这张小票",
        subtitle: "拍照后自动归类",
      },
      receiptList: {
        filters: {
          all: "全部",
          done: "已完成",
          processing: "处理中",
          blurry: "模糊",
          stuckAria: "卡住的小票",
        },
        title: "本地小票",
        refresh: "下拉刷新",
        emptyFirst: "拍第一张小票开始",
        emptyFilter: "此筛选下没有小票",
        uploadPaused: "上传已暂停",
        analysisPaused: "分析已暂停",
        uploading: "上传中...",
        tapToRetry: "点击重试",
        processing: "处理中",
        receiptBlurry: "小票模糊",
        needAction: "需要处理",
        resnap: "重拍",
        unknownMerchant: "未知商户",
        status: {
          analyzing: "分析中",
          uploading: "上传中",
          paused: "已暂停",
        },
      },
    },
    legal: {
      compliance: {
        prefix: "拍摄即表示你同意我们的",
        terms: "条款",
        middle: "和",
        privacy: "隐私政策",
        suffix: "。联网处理会将数据存储在美国。",
      },
    },
    settings: {
      back: "< 返回",
      title: "设置",
      account: {
        title: "账户",
        signedInPrefix: "已登录",
        cloudBackupOn: "云端备份已开启",
        taxSeasonPaid: "报税季 · 已付费 ✓",
        notSignedIn: "未登录 · 换手机数据会丢失",
        backupHint: "换手机前请用 Google 登录备份小票。",
        googleCta: "使用 Google 继续",
      },
      language: {
        title: "语言",
        english: "English",
        chinese: "简体中文",
      },
      industry: {
        title: "你的行业",
        labels: {
          truck_driver: "卡车司机",
          plumber: "水管工",
          electrician: "电工",
          construction: "建筑工",
          delivery: "外卖/配送",
          general: "通用 1099",
        },
      },
      multiDevice: {
        title: "多设备",
        button: "在所有设备查看",
      },
      privacyData: {
        title: "隐私与数据",
        privacy: "隐私政策",
        terms: "服务条款",
        dataStorage: "数据存储",
        dataStorageValue: "数据会在美国处理和存储。国际传输详情见隐私政策。",
        contactPrefix: "联系",
        deleteAccount: "删除账户",
        deleteFailed: "删除失败，请重试。",
        deleteTitle: "删除账户",
        deleteSignedInWarning: "此操作不可撤销。所有云端小票和账户数据会永久删除。",
        deleteGhostWarning:
          "会清除本设备所有小票和云端 Ghost 数据，无法撤销。",
        deleting: "正在删除...",
        deletePermanently: "永久删除",
        cancel: "取消",
      },
      export: {
        title: "报税季导出",
        button: "导出 IRS 报税包",
        buttonPaid: "再次导出",
        exporting: "正在导出…",
        shareText: "你的 IRS 报税开销导出文件",
        offline: "当前离线，请联网后再导出。",
        noReceipts: "没有可导出的已完成小票，请先拍几张小票！",
        failed: "导出失败，请重试。",
        failedAfterPayment: "付款后导出失败，请点再次导出。",
        paymentConfirmed: "付款已确认，请点击再次导出下载。",
      },
    },
  },
};

export function isSupportedLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

function localeFromLanguageTag(tag: string): Locale | null {
  const normalized = tag.trim().toLowerCase();
  if (!normalized) return null;

  const exact = SUPPORTED_LOCALES.find(
    (locale) => locale.toLowerCase() === normalized,
  );
  if (exact) return exact;

  const language = normalized.split("-")[0];
  if (language === "zh") return "zh-CN";
  if (language === "en") return "en-US";
  return null;
}

type LocaleCandidate = {
  tag: string;
  q: number;
  index: number;
};

export function pickLocale(
  input: string | readonly string[] | null | undefined,
): Locale {
  let candidates: LocaleCandidate[];

  if (typeof input === "string" || !input) {
    candidates = (input ?? "").split(",").map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { tag, q: Number.isFinite(q) ? q : 0, index };
    });
  } else {
    candidates = input.map((value, index) => ({ tag: value, q: 1, index }));
  }

  for (const candidate of candidates
    .filter((item) => item.tag && item.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)) {
    const locale = localeFromLanguageTag(candidate.tag);
    if (locale) return locale;
  }

  return DEFAULT_LOCALE;
}

export function getUserCopy(locale: Locale): UserCopy {
  return USER_COPY_BY_LOCALE[locale] ?? USER_COPY_BY_LOCALE[DEFAULT_LOCALE];
}

