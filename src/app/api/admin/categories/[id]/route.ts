import { handler, ok, readJson, type RouteCtx } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { revalidateSite } from "@/lib/revalidate";
import { deleteCategory, updateCategory } from "@/lib/services/taxonomy";
import { categoryInput } from "@/lib/validation";

type Ctx = RouteCtx<{ id: string }>;

export const PUT = handler(async (req: Request, { params }: Ctx) => {
  await requireUser();
  const { id } = await params;
  const category = await updateCategory(id, categoryInput.parse(await readJson(req)));
  revalidateSite();
  return ok({ category });
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireUser();
  const { id } = await params;
  await deleteCategory(id);
  revalidateSite();
  return ok({ ok: true });
});
