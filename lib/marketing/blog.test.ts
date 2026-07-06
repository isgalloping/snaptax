import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  listBlogPosts,
  loadBlogPost,
  parseBlogMarkdown,
} from "@/lib/marketing/blog";

describe("blog", () => {
  it("lists launch posts in reverse chronological order", () => {
    const posts = listBlogPosts();
    assert.ok(posts.length >= 3);
    assert.equal(posts[0]?.slug, "how-to-organize-receipts");
    assert.match(posts[0]?.description ?? "", /audit trail/i);
  });

  it("loads a post by slug", () => {
    const post = loadBlogPost("1099-contractor-tax-guide");
    assert.ok(post);
    assert.equal(post.title, "1099 Contractor Tax Guide");
    assert.ok(post.sections.length >= 3);
  });

  it("parses category and published metadata", () => {
    const post = parseBlogMarkdown(
      "sample",
      `# Title\n**Category:** Tax Tips\n**Published:** 2026-01-01\n**Description:** Excerpt.\n\n## Intro\nHello.`,
    );
    assert.equal(post.category, "Tax Tips");
    assert.equal(post.publishedAt, "2026-01-01");
    assert.equal(post.description, "Excerpt.");
  });
});
