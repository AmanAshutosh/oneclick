import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { sanitizePostHtml } from "@/lib/sanitize";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { PostInput, PostListQuery } from "@/lib/validation";
import { resolveTags } from "./taxonomy";
import { publicWhere } from "./visibility";

export { publicWhere };
import { extractExternalLinks, warmLinkPreviews } from "./link-preview";

/* ----------------------------------------------------------------------------
 * Shared selects
 * ------------------------------------------------------------------------- */

const mediaSelect = { id: true, url: true, alt: true, width: true, height: true } as const;

export const postListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } },
  featuredImage: { select: mediaSelect },
} satisfies Prisma.PostSelect;

export const postFullSelect = {
  ...postListSelect,
  content: true,
  metaTitle: true,
  metaDescription: true,
  canonicalUrl: true,
  noIndex: true,
  author: { select: { id: true, name: true, bio: true } },
  category: { select: { id: true, name: true, slug: true, description: true } },
} satisfies Prisma.PostSelect;

export type PostListItem = Prisma.PostGetPayload<{ select: typeof postListSelect }>;
export type PostFull = Prisma.PostGetPayload<{ select: typeof postFullSelect }>;


/* ----------------------------------------------------------------------------
 * Admin
 * ------------------------------------------------------------------------- */

export async function listPostsAdmin(q: PostListQuery) {
  const where: Prisma.PostWhereInput = {};
  if (q.q) where.OR = [{ title: { contains: q.q, mode: "insensitive" } }, { excerpt: { contains: q.q, mode: "insensitive" } }, { slug: { contains: q.q, mode: "insensitive" } }];
  if (q.status) where.status = q.status;
  if (q.categoryId) where.categoryId = q.categoryId === "none" ? null : q.categoryId;
  if (q.tag) where.tags = { some: { slug: q.tag } };

  const [total, items] = await db.$transaction([
    db.post.count({ where }),
    db.post.findMany({
      where,
      select: postListSelect,
      orderBy: [{ [q.sort]: q.order }, { id: "desc" }],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
  ]);
  return { items, total, page: q.page, pageSize: q.pageSize, totalPages: Math.max(1, Math.ceil(total / q.pageSize)) };
}

export async function getPostById(id: string) {
  const post = await db.post.findUnique({ where: { id }, select: postFullSelect });
  if (!post) throw new ApiError(404, "Post not found");
  return post;
}

async function resolveSlug(input: PostInput, excludeId?: string) {
  const exists = async (slug: string) =>
    !!(await db.post.findFirst({ where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } }));

  if (input.slug) {
    if (await exists(input.slug)) {
      throw new ApiError(409, "Slug is already used by another post", { fieldErrors: { slug: ["Already in use"] } });
    }
    return input.slug;
  }
  return uniqueSlug(input.title, exists);
}

function resolvePublishedAt(input: PostInput, current?: Date | null) {
  if (input.publishedAt) return input.publishedAt;
  if (input.status === "PUBLISHED") return current ?? new Date();
  return current ?? null;
}

async function assertRefs(input: PostInput) {
  if (input.categoryId && !(await db.category.findUnique({ where: { id: input.categoryId }, select: { id: true } }))) {
    throw new ApiError(422, "Category does not exist", { fieldErrors: { categoryId: ["Unknown category"] } });
  }
  if (input.featuredImageId && !(await db.media.findUnique({ where: { id: input.featuredImageId }, select: { id: true } }))) {
    throw new ApiError(422, "Featured image does not exist", { fieldErrors: { featuredImageId: ["Unknown image"] } });
  }
}

export async function createPost(input: PostInput, authorId: string) {
  await assertRefs(input);
  const content = sanitizePostHtml(input.content);
  const tagIds = await resolveTags(input.tags);
  const post = await db.post.create({
    data: {
      title: input.title,
      slug: await resolveSlug(input),
      content,
      excerpt: input.excerpt,
      status: input.status,
      publishedAt: resolvePublishedAt(input),
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      canonicalUrl: input.canonicalUrl,
      noIndex: input.noIndex,
      author: { connect: { id: authorId } },
      category: input.categoryId ? { connect: { id: input.categoryId } } : undefined,
      featuredImage: input.featuredImageId ? { connect: { id: input.featuredImageId } } : undefined,
      tags: { connect: tagIds.map((id) => ({ id })) },
    },
    select: postFullSelect,
  });
  warmLinkPreviews(extractExternalLinks(content));
  return post;
}

export async function updatePost(id: string, input: PostInput) {
  const existing = await db.post.findUnique({ where: { id }, select: { id: true, publishedAt: true, slug: true } });
  if (!existing) throw new ApiError(404, "Post not found");
  await assertRefs(input);
  const content = sanitizePostHtml(input.content);
  const tagIds = await resolveTags(input.tags);
  const post = await db.post.update({
    where: { id },
    data: {
      title: input.title,
      slug: await resolveSlug(input, id),
      content,
      excerpt: input.excerpt,
      status: input.status,
      publishedAt: resolvePublishedAt(input, existing.publishedAt),
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      canonicalUrl: input.canonicalUrl,
      noIndex: input.noIndex,
      category: input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true },
      featuredImage: input.featuredImageId ? { connect: { id: input.featuredImageId } } : { disconnect: true },
      tags: { set: tagIds.map((tid) => ({ id: tid })) },
    },
    select: postFullSelect,
  });
  warmLinkPreviews(extractExternalLinks(content));
  return { post, previousSlug: existing.slug };
}

export async function deletePost(id: string) {
  return db.post.delete({ where: { id }, select: { id: true, slug: true } });
}

export async function bulkPostAction(ids: string[], action: "publish" | "draft" | "archive" | "delete") {
  if (action === "delete") return db.post.deleteMany({ where: { id: { in: ids } } });
  if (action === "publish") {
    // Keep existing publish dates; stamp "now" on posts that never had one.
    await db.post.updateMany({ where: { id: { in: ids }, publishedAt: null }, data: { publishedAt: new Date() } });
    return db.post.updateMany({ where: { id: { in: ids } }, data: { status: "PUBLISHED" } });
  }
  return db.post.updateMany({ where: { id: { in: ids } }, data: { status: action === "draft" ? "DRAFT" : "ARCHIVED" } });
}

export async function dashboardStats() {
  const now = new Date();
  const [published, scheduled, drafts, archived, media, categories, tags, recent] = await db.$transaction([
    db.post.count({ where: { status: "PUBLISHED", publishedAt: { lte: now } } }),
    db.post.count({ where: { status: "PUBLISHED", publishedAt: { gt: now } } }),
    db.post.count({ where: { status: "DRAFT" } }),
    db.post.count({ where: { status: "ARCHIVED" } }),
    db.media.count(),
    db.category.count(),
    db.tag.count(),
    db.post.findMany({ select: postListSelect, orderBy: { updatedAt: "desc" }, take: 6 }),
  ]);
  return { published, scheduled, drafts, archived, media, categories, tags, recent };
}

/* ----------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------- */

export async function listPublishedPosts(opts: {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  tagSlug?: string;
  q?: string;
}) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 12;
  const where: Prisma.PostWhereInput = { ...publicWhere() };
  if (opts.categorySlug) where.category = { slug: opts.categorySlug };
  if (opts.tagSlug) where.tags = { some: { slug: opts.tagSlug } };
  if (opts.q) {
    where.OR = [{ title: { contains: opts.q, mode: "insensitive" } }, { excerpt: { contains: opts.q, mode: "insensitive" } }, { content: { contains: opts.q, mode: "insensitive" } }];
  }
  const [total, items] = await db.$transaction([
    db.post.count({ where }),
    db.post.findMany({
      where,
      select: postListSelect,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getPublishedPostBySlug(slug: string) {
  return db.post.findFirst({ where: { slug, ...publicWhere() }, select: postFullSelect });
}

export async function getRelatedPosts(post: { id: string; category: { id: string } | null; tags: { id: string }[] }, take = 3) {
  const or: Prisma.PostWhereInput[] = [];
  if (post.category) or.push({ categoryId: post.category.id });
  if (post.tags.length) or.push({ tags: { some: { id: { in: post.tags.map((t) => t.id) } } } });
  return db.post.findMany({
    where: { ...publicWhere(), id: { not: post.id }, ...(or.length ? { OR: or } : {}) },
    select: postListSelect,
    orderBy: { publishedAt: "desc" },
    take,
  });
}

export async function allPublishedForSitemap() {
  return db.post.findMany({
    where: { ...publicWhere(), noIndex: false },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
    take: 50_000,
  });
}

export { slugify };
