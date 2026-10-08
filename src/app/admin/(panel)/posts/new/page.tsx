import { PostEditor } from "@/components/admin/post-editor";
import { emptyPost } from "@/lib/post-form";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const metadata = { title: "New post" };

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([
    db.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.tag.findMany({ select: { name: true }, orderBy: { posts: { _count: "desc" } }, take: 500 }),
  ]);
  return <PostEditor initial={emptyPost} categories={categories} tagSuggestions={tags.map((t) => t.name)} siteUrl={env.siteUrl} />;
}
