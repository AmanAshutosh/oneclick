import { handler, ok } from "@/lib/api";
import { listPublishedPosts } from "@/lib/services/posts";
import { clampInt } from "@/lib/utils";

/** Read-only, published-only API for headless consumers (mobile apps, other frontends). */
export const GET = handler(async (req: Request) => {
  const sp = new URL(req.url).searchParams;
  const data = await listPublishedPosts({
    page: clampInt(sp.get("page"), 1, 1, 100_000),
    pageSize: clampInt(sp.get("pageSize"), 12, 1, 50),
    categorySlug: sp.get("category") || undefined,
    tagSlug: sp.get("tag") || undefined,
    q: sp.get("q")?.trim().slice(0, 200) || undefined,
  });
  return ok(data, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
});
