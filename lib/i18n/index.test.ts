import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  getUserCopy,
  htmlLangForLocale,
  isSupportedLocale,
  pickLocale,
} from "./index";

test("pickLocale matches supported languages from Accept-Language order", () => {
  assert.equal(pickLocale("fr-FR,fr;q=0.9,en-US;q=0.8"), "fr-FR");
  assert.equal(pickLocale("de-DE,de;q=0.9,en;q=0.8"), "de-DE");
  assert.equal(pickLocale("en-GB,en;q=0.9"), "en-US");
});

test("pickLocale falls back to default for unsupported or empty input", () => {
  assert.equal(pickLocale("zh-CN,zh;q=0.9"), DEFAULT_LOCALE);
  assert.equal(pickLocale(""), DEFAULT_LOCALE);
});

test("isSupportedLocale only accepts exact configured locale ids", () => {
  assert.deepEqual(SUPPORTED_LOCALES, ["en-US", "fr-FR", "de-DE"]);
  assert.equal(isSupportedLocale("en-US"), true);
  assert.equal(isSupportedLocale("fr-FR"), true);
  assert.equal(isSupportedLocale("de-DE"), true);
  assert.equal(isSupportedLocale("zh-CN"), false);
});

test("htmlLangForLocale maps to BCP 47 primary tags", () => {
  assert.equal(htmlLangForLocale("en-US"), "en");
  assert.equal(htmlLangForLocale("fr-FR"), "fr");
  assert.equal(htmlLangForLocale("de-DE"), "de");
});

test("getUserCopy returns localized core UI copy", () => {
  const french = getUserCopy("fr-FR");
  const german = getUserCopy("de-DE");
  assert.equal(french.home.snapButton.title, "Photographier un reçu");
  assert.equal(german.home.snapButton.title, "Beleg fotografieren");
  assert.equal(french.legal.compliance.terms, "Conditions");
  assert.equal(german.settings.account.title, "Konto");
});
