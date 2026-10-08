import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/post-editor";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { postFullSelect } from "@/lib/services/posts";

export const metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, categories, tags] = await Promise.all([
    db.post.findUnique({ where: { id }, select: postFullSelect }),
    db.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.tag.findMany({ select: { name: true }, orderBy: { posts: { _count: "desc" } }, take: 500 }),
  ]);
  if (!post) notFound();

  return (
    <PostEditor
      key={post.id}
      categories={categories}
      tagSuggestions={tags.map((t) => t.name)}
      siteUrl={env.siteUrl}
      initial={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt ?? "",
        status: post.status,
        publishedAt: post.publishedAt?.toISOString() ?? "",
        categoryId: post.category?.id ?? "",
        tags: post.tags.map((t) => t.name),
        featuredImage: post.featuredImage ? { id: post.featuredImage.id, url: post.featuredImage.url, alt: post.featuredImage.alt } : null,
        metaTitle: post.metaTitle ?? "",
        metaDescription: post.metaDescription ?? "",
        canonicalUrl: post.canonicalUrl ?? "",
        noIndex: post.noIndex,
      }}
    />
  );
}
