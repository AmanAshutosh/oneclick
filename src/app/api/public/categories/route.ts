import { handler, ok } from "@/lib/api";
import { listPublicCategories } from "@/lib/services/taxonomy";

export const GET = handler(async () =>
  ok({ items: await listPublicCategories() }, { headers: { "Cache-Control": "public, s-maxage=300" } }),
);
