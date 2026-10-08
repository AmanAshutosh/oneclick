import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { SESSION_COOKIE, verifySession } from "./jwt";
import { ApiError } from "./api";

/** Returns the signed-in user (fresh from the DB, so deleted users lose access) or null. */
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) return null;
  return db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true, role: true },
  });
});

/** For server components/pages under /admin. */
export async function requireUserPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** For API route handlers. Throws a 401/403 ApiError. */
export async function requireUser(opts: { role?: "ADMIN" } = {}) {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Not authenticated");
  if (opts.role && user.role !== opts.role) throw new ApiError(403, "Insufficient permissions");
  return user;
}
