import { BlogPostCard } from "@/components/marketing/BlogPostCard";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";
import { listBlogPosts } from "@/lib/marketing/blog";

export const metadata = buildMarketingMetadata({
  title: "Blog — SnapTax",
  description: "Tax tips, expense tracking guides, and SnapTax product updates.",
  path: "/blog",
});

export default function BlogIndexPage() {
  const posts = listBlogPosts();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black text-white sm:text-4xl">Blog</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
        Practical guides for 1099 contractors — deductions, record keeping, and
        getting ready for tax season.
      </p>
      <div className="mt-10 grid gap-6">
        {posts.map((post) => (
          <BlogPostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
