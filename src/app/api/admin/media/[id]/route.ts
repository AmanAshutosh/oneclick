import { handler, ok, readJson, type RouteCtx } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidateSite } from "@/lib/revalidate";
import { deleteMedia } from "@/lib/services/media";
import { mediaUpdate } from "@/lib/validation";

type Ctx = RouteCtx<{ id: string }>;

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requireUser();
  const { id } = await params;
  const { alt } = mediaUpdate.parse(await readJson(req));
  const media = await db.media.update({ where: { id }, data: { alt } });
  revalidateSite();
  return ok({ media });
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireUser();
  const { id } = await params;
  await deleteMedia(id);
  revalidateSite();
  return ok({ ok: true });
});
