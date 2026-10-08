import { handler, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { revalidateSite } from "@/lib/revalidate";
import { createTag, listTags } from "@/lib/services/taxonomy";
import { tagInput } from "@/lib/validation";

export const GET = handler(async () => {
  await requireUser();
  return ok({ items: await listTags() });
});

export const POST = handler(async (req: Request) => {
  await requireUser();
  const tag = await createTag(tagInput.parse(await readJson(req)));
  revalidateSite();
  return ok({ tag }, { status: 201 });
});
