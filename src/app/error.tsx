"use client";

import Link from "next/link";

/** App-wide error boundary: shown when a page throws while rendering. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="surface w-full max-w-xl animate-rise px-6 py-14 text-center sm:px-12" role="alert">
        <div aria-hidden className="mx-auto flex h-28 w-28 items-center justify-center rounded-full nm-inset">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-lime nm-raised-sm">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 7v6M12 16.5v.01" />
            </svg>
          </span>
        </div>
        <h1 className="mt-8 text-3xl font-extrabold tracking-tight sm:text-4xl">Something went wrong</h1>
        <p className="mt-3 text-ink/70">An unexpected error occurred while loading this page. Please try again.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <button onClick={reset} className="btn btn-md btn-primary px-6">
            Try again
          </button>
          <Link href="/" className="btn btn-md btn-secondary px-6">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
