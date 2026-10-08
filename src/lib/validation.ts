import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

const optionalId = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https?:\/\/\S+$/i.test(v), "Must be a valid http(s) URL");

export const slugSchema = z
  .string()
  .trim()
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

export const postStatus = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const postInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: slugSchema.optional().or(z.literal("")),
  content: z.string().max(2_000_000).default(""),
  excerpt: optionalText(500),
  status: postStatus.default("DRAFT"),
  publishedAt: z.coerce.date().optional().nullable(),
  categoryId: optionalId,
  tags: z.array(z.string().trim().min(1).max(50)).max(30, "At most 30 tags").default([]),
  featuredImageId: optionalId,
  metaTitle: optionalText(70),
  metaDescription: optionalText(170),
  canonicalUrl: optionalUrl,
  noIndex: z.boolean().default(false),
});
export type PostInput = z.infer<typeof postInput>;

export const postListQuery = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.preprocess((v) => (v === "" ? undefined : v), postStatus.optional()),
  categoryId: z.string().optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["updatedAt", "createdAt", "publishedAt", "title"]).default("updatedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type PostListQuery = z.infer<typeof postListQuery>;

export const bulkPostAction = z.object({
  ids: z.array(z.string()).min(1).max(500),
  action: z.enum(["publish", "draft", "archive", "delete"]),
});

export const categoryInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  slug: slugSchema.optional().or(z.literal("")),
  description: optionalText(500),
});

export const tagInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
  slug: slugSchema.optional().or(z.literal("")),
});

export const mediaUpdate = z.object({ alt: optionalText(300) });

export const loginInput = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required").max(200),
});
