import Link from "next/link";
import type { BlogPostMeta } from "@/lib/marketing/blog";

export function BlogPostCard({ post }: { post: BlogPostMeta }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-white/20">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
        {post.category}
      </p>
      <h2 className="mt-2 text-xl font-black text-white">
        <Link
          href={`/blog/${post.slug}`}
          className="hover:text-zinc-200"
        >
          {post.title}
        </Link>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        {post.description}
      </p>
      <div className="mt-4 flex items-center justify-between gap-4">
        <time className="text-xs text-zinc-500" dateTime={post.publishedAt}>
          {post.publishedAt}
        </time>
        <Link
          href={`/blog/${post.slug}`}
          className="text-sm font-bold text-zinc-300 underline-offset-4 hover:text-white hover:underline"
        >
          Read more
        </Link>
      </div>
    </article>
  );
}
