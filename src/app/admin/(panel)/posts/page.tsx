import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/admin-shell";
import { PostsTable } from "@/components/admin/posts-table";
import { db } from "@/lib/db";

export const metadata = { title: "Posts" };

export default async function PostsPage() {
  const categories = await db.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader
        title="Posts"
        description="Create, edit and publish your content."
        actions={
          <Link href="/admin/posts/new" className="btn btn-md btn-primary">
            + New post
          </Link>
        }
      />
      <Suspense>
        <PostsTable categories={categories} />
      </Suspense>
    </>
  );
}
