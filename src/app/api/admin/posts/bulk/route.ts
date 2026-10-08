import { handler, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { revalidateSite } from "@/lib/revalidate";
import { bulkPostAction } from "@/lib/services/posts";
import { bulkPostAction as bulkSchema } from "@/lib/validation";

export const POST = handler(async (req: Request) => {
  await requireUser();
  const { ids, action } = bulkSchema.parse(await readJson(req));
  const result = await bulkPostAction(ids, action);
  revalidateSite();
  return ok({ count: result.count });
});
