import { ApiError, handler, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { listMedia, saveUpload } from "@/lib/services/media";
import { clampInt } from "@/lib/utils";

export const GET = handler(async (req: Request) => {
  await requireUser();
  const sp = new URL(req.url).searchParams;
  return ok(
    await listMedia({
      page: clampInt(sp.get("page"), 1, 1, 100_000),
      pageSize: clampInt(sp.get("pageSize"), 24, 1, 100),
      q: sp.get("q")?.trim() || undefined,
    }),
  );
});

/** multipart/form-data with one or more `file` fields. */
export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, "Expected multipart/form-data");
  }
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (!files.length) throw new ApiError(422, "No file provided");
  if (files.length > 20) throw new ApiError(422, "Upload at most 20 files at once");

  const items = [];
  const errors: string[] = [];
  for (const file of files) {
    try {
      items.push(await saveUpload(file, user.id));
    } catch (err) {
      if (err instanceof ApiError) errors.push(err.message);
      else throw err;
    }
  }
  if (!items.length) throw new ApiError(422, errors.join("; "));
  return ok({ items, errors }, { status: 201 });
});
