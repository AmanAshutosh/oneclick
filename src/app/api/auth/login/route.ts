import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { ApiError, handler, ok, readJson } from "@/lib/api";
import { loginInput } from "@/lib/validation";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from "@/lib/jwt";

// Simple in-memory brute-force limiter (per instance). Use Redis for multi-instance deployments.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function checkRate(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count++;
  if (entry.count > MAX_ATTEMPTS) throw new ApiError(429, "Too many login attempts. Try again in a few minutes.");
}

// Used to keep response timing similar when the email doesn't exist.
let dummyHash: string | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync("timing-equaliser", 12));

export const POST = handler(async (req: Request) => {
  const { email, password } = loginInput.parse(await readJson(req));
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  checkRate(`${ip}:${email}`);

  const user = await db.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? getDummyHash());
  if (!user || !valid) throw new ApiError(401, "Invalid email or password");

  attempts.delete(`${ip}:${email}`);
  const token = await signSession({ sub: user.id, role: user.role, name: user.name, email: user.email });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return ok({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
