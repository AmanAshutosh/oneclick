import { PostStatus, type Prisma } from "@prisma/client";

/** A post is publicly visible when published and its publish date has passed. */
export function publicWhere(): Prisma.PostWhereInput {
  return { status: PostStatus.PUBLISHED, publishedAt: { lte: new Date() } };
}
