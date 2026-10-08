import type { Metadata } from "next";
import Link from "next/link";
import { PostCard, PostGrid } from "@/components/site/post-card";
import { Pagination } from "@/components/site/pagination";
import { EmptyNotice } from "@/components/site/empty-notice";
import { env } from "@/lib/env";
import { listPublishedPosts } from "@/lib/services/posts";
import { clampInt } from "@/lib/utils";

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = clampInt((await searchParams).page, 1, 1, 100_000);
  return {
    title: page > 1 ? `Latest posts — page ${page}` : { absolute: env.siteName },
    alternates: { canonical: page > 1 ? `/?page=${page}` : "/" },
  };
}

export default async function HomePage({ searchParams }: Props) {
  const page = clampInt((await searchParams).page, 1, 1, 100_000);
  const { items, totalPages, total } = await listPublishedPosts({ page, pageSize: page === 1 ? 13 : 12 });
  const [lead, ...rest] = page === 1 ? items : [null, ...items];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {page === 1 && (
        <section className="surface relative mt-8 overflow-hidden px-6 py-14 sm:mt-10 sm:px-12 sm:py-20 lg:py-24">
          {/* Decorative neumorphic rings */}
          <div aria-hidden className="pointer-events-none absolute top-1/2 -right-24 hidden h-[26rem] w-[26rem] -translate-y-1/2 rounded-full nm-raised lg:block">
            <div className="absolute inset-10 rounded-full nm-inset" />
            <div className="absolute inset-24 rounded-full bg-lime nm-raised-sm" />
            <div className="absolute inset-[7.5rem] rounded-full bg-lime-bright/60" />
          </div>

          <div className="relative max-w-2xl animate-rise">
            <p className="eyebrow">Fresh stories &amp; guides</p>
            <h1 className="mt-5 text-5xl leading-[1.02] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              {env.siteName}
              <span className="text-lime-ink">.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-ink/70 sm:text-xl">{env.siteDescription}</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a href="#latest" className="btn btn-md btn-primary px-6">
                Start reading
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 5v14M6 13l6 6 6-6" />
                </svg>
              </a>
              <Link href="/search" className="btn btn-md btn-secondary px-6">
                Search posts
              </Link>
              {total > 0 && (
                <span className="text-sm font-medium text-ink/60">
                  {total} {total === 1 ? "post" : "posts"} published
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {items.length === 0 ? (
        <EmptyNotice className="mt-14" title="No posts published yet" description="Check back soon — new stories are on the way." />
      ) : (
        <div id="latest" className="scroll-mt-28">
          {lead && (
            <section aria-label="Featured post" className="mt-14 sm:mt-16">
              <PostCard post={lead} featured priority />
            </section>
          )}
          <section aria-labelledby="latest-heading" className={page > 1 ? "pt-14" : "pt-16 sm:pt-20"}>
            {page > 1 ? (
              <h1 id="latest-heading" className="mb-10 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Latest posts <span className="text-ink/45">· page {page}</span>
              </h1>
            ) : (
              rest.length > 0 && (
                <div className="mb-10 flex items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow">Latest</p>
                    <h2 id="latest-heading" className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                      Recent posts
                    </h2>
                  </div>
                </div>
              )
            )}
            <PostGrid posts={rest.filter((p) => p !== null)} />
          </section>
          <Pagination page={page} totalPages={totalPages} basePath="/" />
        </div>
      )}
    </div>
  );
}
