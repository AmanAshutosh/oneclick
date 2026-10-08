import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Called after every content mutation in the admin. Invalidates the cached
 * public pages so changes appear on the website immediately.
 */
export function revalidateSite() {
  revalidatePath("/", "layout");
}
