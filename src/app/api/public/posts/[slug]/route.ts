import { ApiError, handler, ok, type RouteCtx } from "@/lib/api";
import { getPublishedPostBySlug } from "@/lib/services/posts";

export const GET = handler(async (_req: Request, { params }: RouteCtx<{ slug: string }>) => {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) throw new ApiError(404, "Post not found");
  return ok({ post }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
});
