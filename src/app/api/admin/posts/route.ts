import { handler, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { revalidateSite } from "@/lib/revalidate";
import { createPost, listPostsAdmin } from "@/lib/services/posts";
import { postInput, postListQuery } from "@/lib/validation";

export const GET = handler(async (req: Request) => {
  await requireUser();
  const params = Object.fromEntries(new URL(req.url).searchParams);
  return ok(await listPostsAdmin(postListQuery.parse(params)));
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const input = postInput.parse(await readJson(req));
  const post = await createPost(input, user.id);
  revalidateSite();
  return ok({ post }, { status: 201 });
});
