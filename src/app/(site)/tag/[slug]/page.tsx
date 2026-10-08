import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArchivePage } from "@/components/site/archive-page";
import { listPublishedPosts } from "@/lib/services/posts";
import { getTagBySlug } from "@/lib/services/taxonomy";
import { clampInt } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = await getTagBySlug((await params).slug);
  if (!tag) return { title: "Not found" };
  return { title: `#${tag.name}`, description: `Posts tagged ${tag.name}`, alternates: { canonical: `/tag/${tag.slug}` } };
}

export default async function TagPage({ params, searchParams }: Props) {
  const tag = await getTagBySlug((await params).slug);
  if (!tag) notFound();
  const page = clampInt((await searchParams).page, 1, 1, 100_000);
  const data = await listPublishedPosts({ page, tagSlug: tag.slug });
  return (
    <ArchivePage
      eyebrow="Tag"
      title={`#${tag.name}`}
      posts={data.items}
      page={page}
      totalPages={data.totalPages}
      total={data.total}
      basePath={`/tag/${tag.slug}`}
    />
  );
}
