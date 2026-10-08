import { handler, ok, readJson, type RouteCtx } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { revalidateSite } from "@/lib/revalidate";
import { deleteTag, updateTag } from "@/lib/services/taxonomy";
import { tagInput } from "@/lib/validation";

type Ctx = RouteCtx<{ id: string }>;

export const PUT = handler(async (req: Request, { params }: Ctx) => {
  await requireUser();
  const { id } = await params;
  const tag = await updateTag(id, tagInput.parse(await readJson(req)));
  revalidateSite();
  return ok({ tag });
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireUser();
  const { id } = await params;
  await deleteTag(id);
  revalidateSite();
  return ok({ ok: true });
});
