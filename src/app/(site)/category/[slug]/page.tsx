import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArchivePage } from "@/components/site/archive-page";
import { listPublishedPosts } from "@/lib/services/posts";
import { getCategoryBySlug } from "@/lib/services/taxonomy";
import { clampInt } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).slug);
  if (!category) return { title: "Not found" };
  return {
    title: category.name,
    description: category.description ?? `Posts in ${category.name}`,
    alternates: { canonical: `/category/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await getCategoryBySlug((await params).slug);
  if (!category) notFound();
  const page = clampInt((await searchParams).page, 1, 1, 100_000);
  const data = await listPublishedPosts({ page, categorySlug: category.slug });
  return (
    <ArchivePage
      eyebrow="Category"
      title={category.name}
      description={category.description}
      posts={data.items}
      page={page}
      totalPages={data.totalPages}
      total={data.total}
      basePath={`/category/${category.slug}`}
    />
  );
}
