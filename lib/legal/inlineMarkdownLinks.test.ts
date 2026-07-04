import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseLegalInlineMarkdown } from "./inlineMarkdownLinks";

describe("parseLegalInlineMarkdown", () => {
  it("parses markdown links to internal paths", () => {
    const parts = parseLegalInlineMarkdown(
      "See [Privacy Policy](/privacy) for details.",
    );
    assert.equal(parts.length, 3);
    assert.deepEqual(parts[0], { kind: "text", value: "See " });
    assert.deepEqual(parts[1], {
      kind: "link",
      label: "Privacy Policy",
      href: "/privacy",
    });
    assert.deepEqual(parts[2], { kind: "text", value: " for details." });
  });
});
