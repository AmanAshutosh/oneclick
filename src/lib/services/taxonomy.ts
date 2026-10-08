import "server-only";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { slugify, uniqueSlug } from "@/lib/slug";
import { publicWhere } from "./visibility";

/* Categories ------------------------------------------------------------- */

export async function listCategories() {
  return db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, description: true, _count: { select: { posts: true } } },
  });
}

/** Categories that have at least one public post, for site navigation. */
export async function listPublicCategories() {
  const cats = await db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, _count: { select: { posts: { where: publicWhere() } } } },
  });
  return cats.filter((c) => c._count.posts > 0);
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

async function categorySlug(name: string, slug: string | undefined, excludeId?: string) {
  const exists = async (s: string) =>
    !!(await db.category.findFirst({ where: { slug: s, ...(excludeId ? { NOT: { id: excludeId } } : {}) } }));
  if (slug) {
    if (await exists(slug)) throw new ApiError(409, "Slug already in use", { fieldErrors: { slug: ["Already in use"] } });
    return slug;
  }
  return uniqueSlug(name, exists);
}

export async function createCategory(input: { name: string; slug?: string; description: string | null }) {
  return db.category.create({
    data: { name: input.name, slug: await categorySlug(input.name, input.slug || undefined), description: input.description },
  });
}

export async function updateCategory(id: string, input: { name: string; slug?: string; description: string | null }) {
  return db.category.update({
    where: { id },
    data: { name: input.name, slug: await categorySlug(input.name, input.slug || undefined, id), description: input.description },
  });
}

export async function deleteCategory(id: string) {
  // Posts keep existing; their category is set to null (onDelete: SetNull).
  return db.category.delete({ where: { id } });
}

/* Tags ------------------------------------------------------------------- */

export async function listTags() {
  return db.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, _count: { select: { posts: true } } },
  });
}

export async function getTagBySlug(slug: string) {
  return db.tag.findUnique({ where: { slug } });
}

async function tagSlug(name: string, slug: string | undefined, excludeId?: string) {
  const exists = async (s: string) =>
    !!(await db.tag.findFirst({ where: { slug: s, ...(excludeId ? { NOT: { id: excludeId } } : {}) } }));
  if (slug) {
    if (await exists(slug)) throw new ApiError(409, "Slug already in use", { fieldErrors: { slug: ["Already in use"] } });
    return slug;
  }
  return uniqueSlug(name, exists);
}

export async function createTag(input: { name: string; slug?: string }) {
  return db.tag.create({ data: { name: input.name, slug: await tagSlug(input.name, input.slug || undefined) } });
}

export async function updateTag(id: string, input: { name: string; slug?: string }) {
  return db.tag.update({ where: { id }, data: { name: input.name, slug: await tagSlug(input.name, input.slug || undefined, id) } });
}

export async function deleteTag(id: string) {
  return db.tag.delete({ where: { id } });
}

/** Maps free-text tag names to tag ids, creating missing tags. */
export async function resolveTags(names: string[]) {
  const unique = [...new Map(names.map((n) => [n.trim().toLowerCase(), n.trim()])).values()].filter(Boolean);
  const ids: string[] = [];
  for (const name of unique) {
    const slug = slugify(name);
    const existing = await db.tag.findFirst({ where: { OR: [{ name }, { slug }] }, select: { id: true } });
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const created = await db.tag.create({ data: { name, slug: await tagSlug(name, undefined) }, select: { id: true } });
    ids.push(created.id);
  }
  return [...new Set(ids)];
}
