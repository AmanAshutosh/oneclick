import { EmptyNotice } from "./empty-notice";
import { PostGrid } from "./post-card";
import { Pagination } from "./pagination";
import type { PostListItem } from "@/lib/services/posts";

export function ArchivePage({
  eyebrow,
  title,
  description,
  posts,
  page,
  totalPages,
  total,
  basePath,
  query,
}: {
  eyebrow: string;
  title: string;
  description?: string | null;
  posts: PostListItem[];
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  query?: Record<string, string | undefined>;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <header className="surface mt-8 flex animate-rise flex-col gap-6 px-6 py-10 sm:mt-10 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:py-14">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
          {description && <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink/70">{description}</p>}
        </div>
        <p className="well shrink-0 self-start rounded-full px-5 py-2.5 text-sm font-semibold text-ink/75 sm:self-auto">
          <span className="text-ink tabular-nums">{total}</span> {total === 1 ? "post" : "posts"}
        </p>
      </header>
      <div className="pt-14">
        {posts.length ? <PostGrid posts={posts} /> : <EmptyNotice title="Nothing here yet" description="No posts have been published in this section." />}
        <Pagination page={page} totalPages={totalPages} basePath={basePath} query={query} />
      </div>
    </div>
  );
}
