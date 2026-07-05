import { notFound } from "next/navigation";
import { BlogPostBody } from "@/components/marketing/BlogPostBody";
import { JsonLd } from "@/components/marketing/JsonLd";
import { buildMarketingMetadata } from "@/lib/marketing/metadata";
import { loadBlogPost, listBlogSlugs } from "@/lib/marketing/blog";
import { getPublicSiteUrl } from "@/lib/site/publicSiteUrl";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return listBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = loadBlogPost(slug);
  if (!post) return { title: "Blog — SnapTax" };

  return buildMarketingMetadata({
    title: `${post.title} — SnapTax Blog`,
    description: post.description,
    path: `/blog/${slug}`,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = loadBlogPost(slug);
  if (!post) notFound();

  const url = `${getPublicSiteUrl()}/blog/${slug}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          datePublished: post.publishedAt,
          author: { "@type": "Organization", name: "SnapTax" },
          publisher: { "@type": "Organization", name: "SnapTax" },
          mainEntityOfPage: url,
        }}
      />
      <BlogPostBody post={post} />
    </>
  );
}
