import { ApiError, handler, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getLinkPreview } from "@/lib/services/link-preview";

/** Used by the editor to show a preview card before inserting a link. */
export const GET = handler(async (req: Request) => {
  await requireUser();
  const sp = new URL(req.url).searchParams;
  const url = sp.get("url") ?? "";
  if (!/^https?:\/\/\S+$/i.test(url)) throw new ApiError(422, "Enter a valid http(s) URL");
  const preview = await getLinkPreview(url, { force: sp.get("refresh") === "1" });
  if (!preview) throw new ApiError(422, "Enter a valid http(s) URL");
  return ok({ preview });
});
