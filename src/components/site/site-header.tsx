import Link from "next/link";
import { env } from "@/lib/env";
import { listPublicCategories } from "@/lib/services/taxonomy";

function SearchForm({ className = "" }: { className?: string }) {
  return (
    <form action="/search" method="get" role="search" className={`relative ${className}`}>
      <label htmlFor={`q-${className.length}`} className="sr-only">
        Search posts
      </label>
      <svg className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink/50" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input id={`q-${className.length}`} name="q" type="search" placeholder="Search…" className="field rounded-full py-2.5 pl-10" />
    </form>
  );
}

export function BrandMark({ className = "h-9 w-9 text-base" }: { className?: string }) {
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full bg-lime font-display font-extrabold text-ink nm-raised-xs ${className}`}>
      O
    </span>
  );
}

export async function SiteHeader() {
  const categories = (await listPublicCategories()).slice(0, 6);
  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-6 sm:pt-4">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 rounded-full bg-canvas pr-3 pl-3 nm-raised-sm sm:pl-4 lg:gap-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-full pr-2 font-display text-xl font-extrabold tracking-tight">
          <BrandMark />
          {env.siteName}
        </Link>

        <nav aria-label="Categories" className="hidden min-w-0 flex-1 md:block">
          <ul className="flex items-center gap-1 overflow-hidden text-sm font-semibold text-ink/70">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className="action px-3.5 py-2 text-sm">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <SearchForm className="ml-auto hidden w-56 md:block lg:w-64" />

        {/* Mobile menu: progressive enhancement via <details>, works without JS */}
        <details className="group relative ml-auto md:hidden">
          <summary className="btn btn-secondary h-11 w-11 list-none [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Open menu</span>
            <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="group-open:hidden">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="hidden group-open:block">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </summary>
          <div className="surface absolute top-14 right-0 w-[min(20rem,calc(100vw-1.5rem))] animate-rise p-4">
            <SearchForm className="mb-4" />
            <ul className="space-y-1 text-sm font-semibold">
              <li>
                <Link href="/" className="block rounded-2xl px-4 py-2.5 text-ink/80 transition hover:bg-cream hover:text-ink">
                  Latest
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/category/${c.slug}`} className="block rounded-2xl px-4 py-2.5 text-ink/80 transition hover:bg-cream hover:text-ink">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>
    </header>
  );
}
