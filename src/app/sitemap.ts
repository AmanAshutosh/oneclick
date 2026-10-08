import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { allPublishedForSitemap } from "@/lib/services/posts";

export const dynamic = "force-dynamic"; // query at request time (no DB needed at build)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags] = await Promise.all([
    allPublishedForSitemap(),
    db.category.findMany({ select: { slug: true } }),
    db.tag.findMany({ select: { slug: true } }),
  ]);
  const base = env.siteUrl;
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    ...posts.map((p) => ({ url: `${base}/posts/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...categories.map((c) => ({ url: `${base}/category/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...tags.map((t) => ({ url: `${base}/tag/${t.slug}`, changeFrequency: "weekly" as const, priority: 0.3 })),
  ];
}
