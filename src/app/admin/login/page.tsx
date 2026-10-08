import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Only allow redirecting back into the admin (prevents open redirects).
  const target = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
  if (await getCurrentUser()) redirect(target);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md animate-rise">
        <div className="mb-10 text-center">
          <span aria-hidden className="mx-auto flex h-24 w-24 items-center justify-center rounded-full nm-inset">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lime font-display text-2xl font-extrabold text-ink nm-raised-sm">O</span>
          </span>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Sign in to OneClick</h1>
          <p className="mt-2 text-sm text-ink/65">Manage your posts, media and site content.</p>
        </div>
        <LoginForm next={target} />
      </div>
    </main>
  );
}
