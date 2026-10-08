import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PostArticle } from "@/components/site/post-article";
import { PostGrid } from "@/components/site/post-card";
import { env } from "@/lib/env";
import { getPublishedPostBySlug, getRelatedPosts } from "@/lib/services/posts";
import { stripHtml, truncate } from "@/lib/utils";

// Incremental static regeneration: pages are cached and re-built on demand
// whenever the admin saves (revalidatePath), with a short safety TTL for scheduled posts.
export const revalidate = 60;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

const getPost = cache(async (slug: string) => getPublishedPostBySlug(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return { title: "Not found" };
  const description = post.metaDescription || post.excerpt || truncate(stripHtml(post.content), 160);
  const title = post.metaTitle || post.title;
  const image = post.featuredImage ? [{ url: post.featuredImage.url, width: post.featuredImage.width ?? undefined, height: post.featuredImage.height ?? undefined, alt: post.featuredImage.alt ?? "" }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: post.canonicalUrl || `/posts/${post.slug}` },
    robots: post.noIndex ? { index: false, follow: true } : undefined,
    authors: [{ name: post.author.name }],
    openGraph: {
      type: "article",
      title,
      description,
      url: `/posts/${post.slug}`,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author.name],
      section: post.category?.name,
      tags: post.tags.map((t) => t.name),
      images: image,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const related = await getRelatedPosts(post);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription || post.excerpt || undefined,
    image: post.featuredImage ? `${env.siteUrl}${post.featuredImage.url}` : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.author.name },
    publisher: { "@type": "Organization", name: env.siteName },
    mainEntityOfPage: `${env.siteUrl}/posts/${post.slug}`,
    keywords: post.tags.map((t) => t.name).join(", ") || undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PostArticle post={post} />
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
          <p className="eyebrow">More from {env.siteName}</p>
          <h2 id="related-heading" className="mt-3 mb-10 text-3xl font-extrabold tracking-tight">
            Keep reading
          </h2>
          <PostGrid posts={related} />
        </section>
      )}
    </>
  );
}
