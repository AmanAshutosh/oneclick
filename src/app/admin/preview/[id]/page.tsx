import Link from "next/link";
import { notFound } from "next/navigation";
import { PostArticle } from "@/components/site/post-article";
import { StatusBadge } from "@/components/ui/primitives";
import { requireUserPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { postFullSelect } from "@/lib/services/posts";

export const metadata = { title: "Preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Renders any post (draft, scheduled, archived) exactly as it will look on the website. Admin-only. */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUserPage();
  const { id } = await params;
  const post = await db.post.findUnique({ where: { id }, select: postFullSelect });
  if (!post) notFound();

  return (
    <>
      <div className="on-dark sticky top-0 z-40 flex flex-wrap items-center justify-center gap-3 bg-ink px-4 py-3 text-sm text-cream">
        <span className="font-medium">Preview mode</span>
        <StatusBadge status={post.status} publishedAt={post.publishedAt} />
        <span className="hidden text-cream/60 sm:inline">This is how the post will appear on the website.</span>
        <Link href={`/admin/posts/${post.id}`} className="rounded-full bg-lime px-4 py-1.5 font-semibold text-ink nm-dark-raised transition hover:bg-lime-bright active:nm-dark-inset">
          ← Back to editor
        </Link>
      </div>
      <main className="pb-24">
        <PostArticle post={post} />
      </main>
    </>
  );
}
