import { handler, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { revalidateSite } from "@/lib/revalidate";
import { createCategory, listCategories } from "@/lib/services/taxonomy";
import { categoryInput } from "@/lib/validation";

export const GET = handler(async () => {
  await requireUser();
  return ok({ items: await listCategories() });
});

export const POST = handler(async (req: Request) => {
  await requireUser();
  const category = await createCategory(categoryInput.parse(await readJson(req)));
  revalidateSite();
  return ok({ category }, { status: 201 });
});
