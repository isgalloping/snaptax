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
    dismiss: string;
    manualHint: string;
    manualSheetTitle: string;
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
    language: {
      title: string;
      english: string;
      chinese: string;
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
      dismiss: "Not now",
      manualHint: "Tap ⋮ in Chrome, then Install app",
      manualSheetTitle: "Install Snap1099",
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
      language: {
        title: "Language",
        english: "English",
        chinese: "简体中文",
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
      dismiss: "稍后再说",
      manualHint: "点 Chrome 的 ⋮，然后点安装应用",
      manualSheetTitle: "安装 Snap1099",
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
      language: {
        title: "语言",
        english: "English",
        chinese: "简体中文",
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

