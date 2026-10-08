import type { Metadata } from "next";
import { EmptyNotice } from "@/components/site/empty-notice";
import { PostGrid } from "@/components/site/post-card";
import { Pagination } from "@/components/site/pagination";
import { listPublishedPosts } from "@/lib/services/posts";
import { clampInt } from "@/lib/utils";

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 200) ?? "";
  const page = clampInt(sp.page, 1, 1, 100_000);
  const data = q ? await listPublishedPosts({ q, page }) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <header className="surface mt-8 animate-rise px-6 py-10 sm:mt-10 sm:px-10 sm:py-14">
        <p className="eyebrow">Explore</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Search</h1>
        <form action="/search" method="get" role="search" className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
          <label htmlFor="search-q" className="sr-only">
            Search query
          </label>
          <div className="relative flex-1">
            <svg className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-ink/50" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input id="search-q" name="q" type="search" defaultValue={q} placeholder="Search posts…" className="field h-13 rounded-full pl-12 text-base" />
          </div>
          <button className="btn btn-primary h-13 px-8 text-base">Search</button>
        </form>
        {data && (
          <p className="mt-5 text-sm text-ink/65" role="status">
            <span className="font-semibold text-ink">{data.total}</span> {data.total === 1 ? "result" : "results"} for “{q}”
          </p>
        )}
      </header>
      {data && (
        <div className="pt-14">
          {data.items.length ? <PostGrid posts={data.items} /> : <EmptyNotice title="No posts match your search" description="Try different keywords or check the spelling." />}
          <Pagination page={page} totalPages={data.totalPages} basePath="/search" query={{ q }} />
        </div>
      )}
    </div>
  );
}
