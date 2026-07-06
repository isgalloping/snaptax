import Link from "next/link";
import type { BlogPost } from "@/lib/marketing/blog";

export function BlogPostBody({ post }: { post: BlogPost }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
        {post.category}
      </p>
      <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
        {post.title}
      </h1>
      <time className="mt-3 block text-sm text-zinc-500" dateTime={post.publishedAt}>
        {post.publishedAt}
      </time>
      <p className="mt-6 text-lg leading-relaxed text-zinc-300">
        {post.description}
      </p>
      {post.sections.map((section) => (
        <section key={section.title} className="mt-10">
          <h2 className="text-xl font-black text-white">{section.title}</h2>
          {section.body.map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className="mt-3 text-sm leading-relaxed text-zinc-400"
            >
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      <div className="mt-12 border-t border-white/10 pt-8">
        <Link
          href="/blog"
          className="text-sm font-bold text-zinc-300 underline-offset-4 hover:text-white hover:underline"
        >
          ← All articles
        </Link>
      </div>
    </article>
  );
}
