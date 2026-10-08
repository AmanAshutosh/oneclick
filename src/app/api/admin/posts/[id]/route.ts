import { handler, ok, readJson, type RouteCtx } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { revalidateSite } from "@/lib/revalidate";
import { deletePost, getPostById, updatePost } from "@/lib/services/posts";
import { postInput } from "@/lib/validation";

type Ctx = RouteCtx<{ id: string }>;

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requireUser();
  const { id } = await params;
  return ok({ post: await getPostById(id) });
});

export const PUT = handler(async (req: Request, { params }: Ctx) => {
  await requireUser();
  const { id } = await params;
  const input = postInput.parse(await readJson(req));
  const { post } = await updatePost(id, input);
  revalidateSite();
  return ok({ post });
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireUser();
  const { id } = await params;
  await deletePost(id);
  revalidateSite();
  return ok({ ok: true });
});
