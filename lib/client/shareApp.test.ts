import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAppSharePayload,
  buildFacebookShareUrl,
  buildWhatsAppShareUrl,
  getAppShareUrl,
} from "./shareApp.ts";

describe("shareApp", () => {
  it("getAppShareUrl prefers explicit origin", () => {
    assert.equal(getAppShareUrl("https://preview.example.com/"), "https://preview.example.com");
  });

  it("getAppShareUrl falls back to production host", () => {
    assert.equal(getAppShareUrl(), "https://app.snap1099.com");
  });

  it("buildAppSharePayload combines message and url", () => {
    const payload = buildAppSharePayload({
      message: "Try Snap1099",
      title: "Snap1099",
      url: "https://app.snap1099.com",
    });
    assert.equal(payload.combinedText, "Try Snap1099 https://app.snap1099.com");
  });

  it("buildWhatsAppShareUrl encodes text", () => {
    const url = buildWhatsAppShareUrl("Hello https://app.snap1099.com");
    assert.equal(url, "https://wa.me/?text=Hello%20https%3A%2F%2Fapp.snap1099.com");
  });

  it("buildFacebookShareUrl encodes url and quote", () => {
    const url = buildFacebookShareUrl(
      "https://app.snap1099.com",
      "Try Snap1099",
    );
    assert.match(url, /^https:\/\/www\.facebook\.com\/sharer\/sharer\.php\?/);
    assert.match(url, /u=https%3A%2F%2Fapp\.snap1099\.com/);
    assert.match(url, /quote=Try\+Snap1099/);
  });
});
