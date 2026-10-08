import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="surface w-full max-w-xl animate-rise px-6 py-14 text-center sm:px-12">
        <div aria-hidden className="mx-auto flex h-28 w-28 items-center justify-center rounded-full nm-inset">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lime font-display text-xl font-extrabold text-ink nm-raised-sm">404</span>
        </div>
        <h1 className="mt-8 text-4xl font-extrabold tracking-tight">Page not found</h1>
        <p className="mt-3 text-ink/70">The page you’re looking for doesn’t exist or has been moved.</p>
        <Link href="/" className="btn btn-md btn-primary mt-9 px-6">
          Back to home
        </Link>
      </div>
    </main>
  );
}
