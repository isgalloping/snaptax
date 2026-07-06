import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type BlogPostSection = {
  title: string;
  body: string[];
};

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
};

export type BlogPost = BlogPostMeta & {
  sections: BlogPostSection[];
};

const BLOG_DIR = join(process.cwd(), "content/blog");

function parseMetaLine(line: string, key: string): string | null {
  const prefix = `**${key}:**`;
  if (!line.trim().startsWith(prefix)) return null;
  return line.trim().slice(prefix.length).trim();
}

/** @internal exported for unit tests */
export function parseBlogMarkdown(slug: string, markdown: string): BlogPost {
  const lines = markdown.split("\n");
  let title = slug;
  let description = "";
  let category = "SnapTax Updates";
  let publishedAt = "";
  const sections: BlogPostSection[] = [];
  let current: BlogPostSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      title = trimmed.slice(2).trim();
      continue;
    }
    const desc = parseMetaLine(trimmed, "Description");
    if (desc) {
      description = desc;
      continue;
    }
    const cat = parseMetaLine(trimmed, "Category");
    if (cat) {
      category = cat;
      continue;
    }
    const published = parseMetaLine(trimmed, "Published");
    if (published) {
      publishedAt = published;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: trimmed.slice(3).trim(), body: [] };
      continue;
    }
    if (!trimmed || trimmed.startsWith("---")) continue;
    if (!current) continue;
    const text = trimmed.startsWith("- ")
      ? trimmed.slice(2)
      : trimmed.replace(/\*\*/g, "");
    current.body.push(text);
  }
  if (current) sections.push(current);

  return { slug, title, description, category, publishedAt, sections };
}

export function listBlogPosts(): BlogPostMeta[] {
  let files: string[];
  try {
    files = readdirSync(BLOG_DIR).filter((name) => name.endsWith(".md"));
  } catch {
    return [];
  }

  return files
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const post = parseBlogMarkdown(
        slug,
        readFileSync(join(BLOG_DIR, file), "utf8"),
      );
      return {
        slug: post.slug,
        title: post.title,
        description: post.description,
        category: post.category,
        publishedAt: post.publishedAt,
      };
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function loadBlogPost(slug: string): BlogPost | null {
  try {
    const markdown = readFileSync(join(BLOG_DIR, `${slug}.md`), "utf8");
    return parseBlogMarkdown(slug, markdown);
  } catch {
    return null;
  }
}

export function listBlogSlugs(): string[] {
  return listBlogPosts().map((post) => post.slug);
}
