import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  getUserCopy,
  isSupportedLocale,
  pickLocale,
} from "@/lib/i18n";

test("pickLocale matches supported languages from Accept-Language order", () => {
  assert.equal(pickLocale("zh-HK,zh;q=0.9,en-US;q=0.8"), "zh-CN");
  assert.equal(pickLocale("fr-CA,fr;q=0.9,en;q=0.8"), "en-US");
});

test("pickLocale falls back to default for unsupported or empty input", () => {
  assert.equal(DEFAULT_LOCALE, "en-US");
  assert.equal(pickLocale("de-DE,de;q=0.9"), DEFAULT_LOCALE);
  assert.equal(pickLocale(""), DEFAULT_LOCALE);
});

test("isSupportedLocale only accepts exact configured locale ids", () => {
  assert.deepEqual(SUPPORTED_LOCALES, ["en-US", "zh-CN"]);
  assert.equal(isSupportedLocale("en-US"), true);
  assert.equal(isSupportedLocale("zh-CN"), true);
  assert.equal(isSupportedLocale("zh"), false);
  assert.equal(isSupportedLocale("en"), false);
});

test("getUserCopy returns localized core UI copy", () => {
  const english = getUserCopy("en-US");
  const chinese = getUserCopy("zh-CN");

  assert.equal(english.home.snapButton.title, "Snap Receipt");
  assert.equal(chinese.home.snapButton.title, "拍小票");
  assert.equal(chinese.home.taxHeader.title, "预估省税");
  assert.equal(chinese.home.receiptList.filters.processing, "处理中");
  assert.equal(chinese.legal.compliance.terms, "条款");
  assert.equal(chinese.pwa.install, "安装");
  assert.equal(chinese.settings.account.title, "账户");
  assert.equal(chinese.settings.industry.labels.plumber, "水管工");
  assert.equal(chinese.settings.multiDevice.button, "在所有设备查看");
  assert.equal(chinese.settings.export.title, "报税季导出");
});

