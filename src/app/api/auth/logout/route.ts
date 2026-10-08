import { cookies } from "next/headers";
import { handler, ok } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/jwt";

export const POST = handler(async () => {
  (await cookies()).delete(SESSION_COOKIE);
  return ok({ ok: true });
});
